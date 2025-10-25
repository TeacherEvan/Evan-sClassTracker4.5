import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Test mutation to create "Piglet" student in Sangsom School
 * Grade: 1 (อ.1 or K.1)
 * Class: /6
 * 
 * This is a one-time test mutation to fulfill the requirement:
 * "Create Piglet as a student in 1/6 Sangsom"
 */

export const createPigletStudent = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find Sangsom School
    const sangsomSchool = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("name"), "Sangsom School"))
      .first();

    if (!sangsomSchool) {
      throw new Error("Sangsom School not found. Please run seedSangsomProject first.");
    }

    // 2. Find a teacher or moderator from Sangsom School to be the creator
    const creator = await ctx.db
      .query("users")
      .withIndex("by_school", (q) => q.eq("schoolId", sangsomSchool._id))
      .filter((q) => 
        q.or(
          q.eq(q.field("role"), "teacher"),
          q.eq(q.field("role"), "moderator")
        )
      )
      .first();

    if (!creator) {
      throw new Error("No teacher or moderator found for Sangsom School");
    }

    // 3. Check if Piglet already exists
    const existingPiglet = await ctx.db
      .query("students")
      .filter((q) => 
        q.and(
          q.eq(q.field("firstName"), "Piglet"),
          q.eq(q.field("schoolId"), sangsomSchool._id)
        )
      )
      .first();

    if (existingPiglet) {
      return {
        success: true,
        message: "Piglet student already exists",
        studentId: existingPiglet.studentId,
        studentDbId: existingPiglet._id,
        grade: existingPiglet.grade,
        class: existingPiglet.class,
        school: sangsomSchool.name,
        schoolTh: sangsomSchool.nameTh,
      };
    }

    // 4. Generate unique student ID for Piglet
    const generateStudentId = (firstName: string, lastName: string, schoolId: string): string => {
      const timestamp = Date.now().toString(36);
      const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
      const schoolHash = schoolId.substring(0, 4).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
    };

    const studentId = generateStudentId("Piglet", "Pooh", sangsomSchool._id);

    // 5. Create Piglet student
    const pigletId = await ctx.db.insert("students", {
      firstName: "Piglet",
      lastName: "Pooh", // Give Piglet a last name
      studentId: studentId,
      schoolId: sangsomSchool._id,
      grade: "1", // Grade 1 (can be "อ.1" or "1" or "K.1")
      class: "/6", // Class 6
      createdBy: creator._id,
      createdAt: Date.now(),
      nickname: "Piglet",
      notes: "Test student created for comprehensive testing (1/6 Sangsom)",
    });

    // 6. Create a notification for the creator
    await ctx.db.insert("notifications", {
      title: "Piglet Student Created",
      titleTh: "สร้างนักเรียน Piglet แล้ว",
      message: `Student Piglet Pooh has been successfully created in Grade 1, Class /6 at Sangsom School.`,
      messageTh: `นักเรียน Piglet Pooh ถูกสร้างสำเร็จในชั้น 1 ห้อง /6 ที่โรงเรียนสังสม`,
      type: "success",
      userId: creator._id,
      read: false,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Piglet student created successfully",
      studentId: studentId,
      studentDbId: pigletId,
      grade: "1",
      class: "/6",
      school: sangsomSchool.name,
      schoolTh: sangsomSchool.nameTh,
      creator: {
        username: creator.username,
        role: creator.role,
      },
    };
  },
});

/**
 * Query to verify Piglet student exists
 */
export const verifyPigletStudent = query({
  args: {},
  handler: async (ctx) => {
    // Find Sangsom School
    const sangsomSchool = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("name"), "Sangsom School"))
      .first();

    if (!sangsomSchool) {
      return {
        exists: false,
        message: "Sangsom School not found",
      };
    }

    // Find Piglet
    const piglet = await ctx.db
      .query("students")
      .filter((q) => 
        q.and(
          q.eq(q.field("firstName"), "Piglet"),
          q.eq(q.field("schoolId"), sangsomSchool._id)
        )
      )
      .first();

    if (!piglet) {
      return {
        exists: false,
        message: "Piglet student not found",
        school: sangsomSchool.name,
      };
    }

    return {
      exists: true,
      message: "Piglet student found",
      student: {
        id: piglet._id,
        studentId: piglet.studentId,
        firstName: piglet.firstName,
        lastName: piglet.lastName,
        grade: piglet.grade,
        class: piglet.class,
        nickname: piglet.nickname,
        notes: piglet.notes,
      },
      school: {
        id: sangsomSchool._id,
        name: sangsomSchool.name,
        nameTh: sangsomSchool.nameTh,
      },
    };
  },
});

/**
 * Get all students from Sangsom School for testing
 */
export const listSangsomStudents = query({
  args: {},
  handler: async (ctx) => {
    // Find Sangsom School
    const sangsomSchool = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("name"), "Sangsom School"))
      .first();

    if (!sangsomSchool) {
      return {
        success: false,
        message: "Sangsom School not found",
        students: [],
      };
    }

    // Get all students from Sangsom School
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", sangsomSchool._id))
      .collect();

    return {
      success: true,
      message: `Found ${students.length} student(s) in Sangsom School`,
      school: {
        id: sangsomSchool._id,
        name: sangsomSchool.name,
        nameTh: sangsomSchool.nameTh,
      },
      students: students.map((s) => ({
        id: s._id,
        studentId: s.studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        grade: s.grade,
        class: s.class,
        nickname: s.nickname,
      })),
    };
  },
});
