import { mutation, query } from "./_generated/server";
import { hashPassword } from "./users";

// Mutation to initialize the database with sample data
export const initializeDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "admin"))
      .first();

    if (existingAdmin) {
      return { message: "Database already initialized" };
    }

    // Create admin user
    const adminPassword = await hashPassword("TeacherAdmin");
    const adminId = await ctx.db.insert("users", {
      username: "admin",
      passwordHash: adminPassword,
      role: "admin",
      requirePasswordChange: true,
      createdAt: Date.now(),
    });

    // Create sample schools
    const school1Id = await ctx.db.insert("schools", {
      name: "Bangkok International School",
      nameTh: "โรงเรียนนานาชาติกรุงเทพ",
      createdAt: Date.now(),
    });

    const school2Id = await ctx.db.insert("schools", {
      name: "Chiang Mai Academy",
      nameTh: "โรงเรียนเชียงใหม่อคาเดมี",
      createdAt: Date.now(),
    });

    // Create special "Guardian" school for guardian-linked students
    const guardianSchoolId = await ctx.db.insert("schools", {
      name: "Guardian",
      nameTh: "ผู้ปกครอง",
      createdAt: Date.now(),
    });

    // Create sample moderator for school 1
    const moderatorPassword = await hashPassword("TeacherModerator1");
    const moderator1Id = await ctx.db.insert("users", {
      username: "moderator1",
      passwordHash: moderatorPassword,
      role: "moderator",
      schoolId: school1Id,
      requirePasswordChange: true,
      createdAt: Date.now(),
    });

    // Update school 1 with moderator
    await ctx.db.patch(school1Id, {
      moderatorId: moderator1Id,
    });

    // Create sample teacher
    const teacherPassword = await hashPassword("TeacherEvan");
    await ctx.db.insert("users", {
      username: "Evan",
      passwordHash: teacherPassword,
      role: "teacher",
      schoolId: school1Id,
      requirePasswordChange: true,
      createdAt: Date.now(),
    });

    // Create a welcome notification for admin
    await ctx.db.insert("notifications", {
      title: "Welcome to Class Tracker!",
      titleTh: "ยินดีต้อนรับสู่ Class Tracker!",
      message:
        "Your system has been initialized. Default admin password is 'TeacherAdmin'. Please change it immediately.",
      messageTh:
        "ระบบของคุณได้รับการเริ่มต้นแล้ว รหัสผ่านผู้ดูแลเริ่มต้นคือ 'TeacherAdmin' กรุณาเปลี่ยนทันที",
      type: "warning",
      userId: adminId,
      read: false,
      createdAt: Date.now(),
    });

    return {
      message: "Database initialized successfully",
      credentials: {
        admin: { username: "admin", password: "TeacherAdmin" },
        moderator: { username: "moderator1", password: "TeacherModerator1" },
        teacher: { username: "Evan", password: "TeacherEvan" },
      },
      schools: [
        { id: school1Id, name: "Bangkok International School" },
        { id: school2Id, name: "Chiang Mai Academy" },
        { id: guardianSchoolId, name: "Guardian (Special)" },
      ],
    };
  },
});

// Query to check if database is initialized
export const isInitialized = query({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "admin"))
      .first();

    return !!admin;
  },
});
