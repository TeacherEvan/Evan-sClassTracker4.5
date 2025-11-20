import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hashPassword } from "./users";

export const seedDatabase = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Optional: Clear existing data
    if (args.clearExisting) {
      const tables = ["schools", "users", "students", "classes", "notifications", "messages"];
      for (const table of tables) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = await ctx.db.query(table as any).collect();
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
        }
      }
    }

    // 2. Create School
    const schoolId = await ctx.db.insert("schools", {
      name: "Sangsom School",
      nameTh: "โรงเรียนแสงโสม",
      createdAt: Date.now(),
    });

    // 3. Create Users
    // Admin
    const adminPassword = await hashPassword("TeacherAdmin");
    await ctx.db.insert("users", {
      username: "admin",
      passwordHash: adminPassword,
      role: "admin",
      requirePasswordChange: false,
      createdAt: Date.now(),
    });

    // Moderator
    const modPassword = await hashPassword("TeacherModerator1");
    const modId = await ctx.db.insert("users", {
      username: "moderator1",
      passwordHash: modPassword,
      role: "moderator",
      schoolId: schoolId,
      requirePasswordChange: false,
      createdAt: Date.now(),
    });

    // Update school with moderator
    await ctx.db.patch(schoolId, { moderatorId: modId });

    // Teacher
    const teacherPassword = await hashPassword("TeacherEvan");
    const teacherId = await ctx.db.insert("users", {
      username: "Evan",
      passwordHash: teacherPassword,
      role: "teacher",
      schoolId: schoolId,
      requirePasswordChange: false,
      createdAt: Date.now(),
    });

    // 4. Create Students
    const studentNames = [
      { first: "Somchai", last: "Dee" },
      { first: "Somsri", last: "Jai" },
      { first: "John", last: "Doe" },
    ];

    const studentIds = [];
    for (const name of studentNames) {
      const studentId = await ctx.db.insert("students", {
        firstName: name.first,
        lastName: name.last,
        nickname: name.first,
        dateOfBirth: new Date("2015-01-01").getTime(),
        grade: "K1",
        class: "/1",
        schoolId: schoolId,
        studentId: `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: Date.now(),
      });
      studentIds.push(studentId);
    }

    // 5. Create Classes
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 5; i++) {
      // Set time to 9:00 AM
      const date = new Date(now + (i * day));
      date.setHours(9, 0, 0, 0);

      await ctx.db.insert("classes", {
        teacherId: teacherId,
        studentId: studentIds[i % studentIds.length],
        schoolId: schoolId,
        scheduledDate: date.getTime(),
        duration: 60,
        status: "pending",
        subject: "English",
        createdAt: now,
        bookedByUserId: teacherId,
      });
    }

    return "Database seeded successfully!";
  },
});
