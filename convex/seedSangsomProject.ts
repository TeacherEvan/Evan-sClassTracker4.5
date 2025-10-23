import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Seed script for Sangsom Project schedule (November 2025)
 * Based on the paper schedule provided by Teacher พงศกร หน่อไฟ
 * 
 * This script creates:
 * - Sangsom School
 * - Teacher user
 * - Student records for each class code
 * - Location (Sangsom Classroom)
 * - Class bookings with lesson topics and activities
 */

// Helper function for password hashing (consistent with users.ts)
function hashPassword(password: string): string {
  return btoa(password);
}

// Schedule data from the image - November 2025
const SCHEDULE_DATA = [
  // Week 1: November 3-9, 2025
  {
    date: "2025-11-03", // Monday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/1",
    topic: "โครงงานเรื่อง ข้าว",
    topicEn: "Project: Rice",
    activity: "Roll your hands",
    activityTh: "ชุดกิจกรรมสอง Roll your hands",
  },
  {
    date: "2025-11-03", // Monday
    time: "10:30",
    duration: 90,
    grade: "อ.2",
    classNumber: "/1",
    topic: "โครงงานเรื่อง ที่กินบัว",
    topicEn: "Project: Lotus eating place",
    activity: "เปิดเพลงมา",
    activityTh: "ชุดกิจกรรมสอง เปิดเพลงมา",
  },
  {
    date: "2025-11-04", // Tuesday
    time: "09:00",
    duration: 90,
    grade: "อ.1",
    classNumber: "/2",
    topic: "โครงงานเรื่อง กล้วย",
    topicEn: "Project: Banana",
    activity: "OK มะคอะ",
    activityTh: "ชุดกิจกรรมสอง OK มะคอะ",
  },
  {
    date: "2025-11-04", // Tuesday
    time: "10:30",
    duration: 90,
    grade: "อ.2",
    classNumber: "/2",
    topic: "โครงงานเรื่อง ผลไม้ต่างๆ",
    topicEn: "Project: Various Fruits",
    activity: "จับกับผลปีต",
    activityTh: "ชุดกิจกรรมสอง จับกับผลปีต",
  },
  {
    date: "2025-11-06", // Wednesday
    time: "09:00",
    duration: 90,
    grade: "อ.1",
    classNumber: "/3",
    topic: "โครงงานเรื่อง ผลไม้",
    topicEn: "Project: Fruits",
    activity: "เปิดเพลงมา",
    activityTh: "ชุดกิจกรรมสอง เปิดเพลงมา",
  },
  {
    date: "2025-11-06", // Wednesday
    time: "10:30",
    duration: 90,
    grade: "อ.2",
    classNumber: "/3",
    topic: "โครงงานเรื่อง อาหารที่ต่างๆ",
    topicEn: "Project: Various Foods",
    activity: "ยึดกันผลปีตโชน",
    activityTh: "ชุดกิจกรรมสอง ยึดกันผลปีตโชน",
  },
  {
    date: "2025-11-07", // Friday
    time: "09:00",
    duration: 90,
    grade: "อ.1",
    classNumber: "/4",
    topic: "โครงงานเรื่อง พักทอง",
    topicEn: "Project: Pumpkin",
    activity: "Too much so much very much",
    activityTh: "ชุดกิจกรรมสอง Too much so much very much",
  },
  {
    date: "2025-11-07", // Friday
    time: "10:30",
    duration: 90,
    grade: "อ.2",
    classNumber: "/4",
    topic: "โครงงานเรื่อง อักต่างๆ",
    topicEn: "Project: Various Things",
    activity: "พักชินชัน",
    activityTh: "ชุดกิจกรรมสอง พักชินชัน",
  },
  // Week 2: November 10-14, 2025
  {
    date: "2025-11-10", // Monday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/5",
    topic: "โครงงานเรื่อง ข้าวโพด",
    topicEn: "Project: Corn",
    activity: "Action song",
    activityTh: "ชุดกิจกรรมสอง Action song",
  },
  {
    date: "2025-11-10", // Monday
    time: "10:30",
    duration: 90,
    grade: "K.2",
    classNumber: "/5",
    topic: "โครงงานเรื่อง แมลง",
    topicEn: "Project: Insects",
    activity: "The cha cha slide dance",
    activityTh: "ชุดกิจกรรมสอง The cha cha slide dance",
  },
  {
    date: "2025-11-11", // Tuesday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/6",
    topic: "โครงงานเรื่อง แตงโม",
    topicEn: "Project: Watermelon",
    activity: "Five little ducks",
    activityTh: "ชุดกิจกรรมสอง Five little ducks",
  },
  {
    date: "2025-11-11", // Tuesday
    time: "10:30",
    duration: 90,
    grade: "K.2",
    classNumber: "/6",
    topic: "โครงงานเรื่อง ผีเสื้อ",
    topicEn: "Project: Butterfly",
    activity: "Learn the butterfly dance",
    activityTh: "ชุดกิจกรรมสอง Learn the butterfly dance",
  },
  {
    date: "2025-11-12", // Wednesday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/7",
    topic: "โครงงานเรื่อง ดอกไม้",
    topicEn: "Project: Flowers",
    activity: "If you are happy",
    activityTh: "ชุดกิจกรรมสอง If you are happy",
  },
  {
    date: "2025-11-12", // Wednesday
    time: "10:30",
    duration: 90,
    grade: "K.2",
    classNumber: "/7",
    topic: "โครงงานเรื่อง ไม้ไม้",
    topicEn: "Project: Wood/Trees",
    activity: "Zumba dance for kids",
    activityTh: "ชุดกิจกรรมสอง Zumba dance for kids",
  },
  {
    date: "2025-11-13", // Thursday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/8",
    topic: "โครงงานเรื่อง สัตว์เลี้ยง",
    topicEn: "Project: Pets",
    activity: "Hokey Pokey",
    activityTh: "ชุดกิจกรรมสอง Hokey Pokey",
  },
  {
    date: "2025-11-13", // Thursday
    time: "10:30",
    duration: 90,
    grade: "K.2",
    classNumber: "/8",
    topic: "โครงงานเรื่อง ข้าว",
    topicEn: "Project: Rice",
    activity: "N-one cowboy",
    activityTh: "ชุดกิจกรรมสอง N-one cowboy",
  },
  {
    date: "2025-11-14", // Friday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/9",
    topic: "โครงงานเรื่อง แมลง",
    topicEn: "Project: Insects",
    activity: "Wheels on the bus",
    activityTh: "ชุดกิจกรรมสอง Wheels on the bus",
  },
  {
    date: "2025-11-14", // Friday
    time: "10:30",
    duration: 90,
    grade: "K.2",
    classNumber: "/9",
    topic: "โครงงานเรื่อง ต้นไม้",
    topicEn: "Project: Trees",
    activity: "Planting a tree",
    activityTh: "ชุดกิจกรรมสอง Planting a tree",
  },
  // Week 3: November 17-21, 2025
  {
    date: "2025-11-17", // Monday
    time: "09:00",
    duration: 90,
    grade: "K.1",
    classNumber: "/10",
    topic: "โครงงานเรื่อง ส้ม",
    topicEn: "Project: Orange",
    activity: "Old Macdonald had a farm",
    activityTh: "ชุดกิจกรรมสอง Old Macdonald had a farm",
  },
  {
    date: "2025-11-17", // Monday
    time: "10:30",
    duration: 90,
    grade: "K.2",
    classNumber: "/10",
    topic: "โครงงานเรื่อง มะพร้าว",
    topicEn: "Project: Coconut",
    activity: "Do re mi, the sound of music",
    activityTh: "ชุดกิจกรรมสอง Do re mi, the sound of music",
  },
  {
    date: "2025-11-18", // Tuesday
    time: "09:00",
    duration: 90,
    grade: "อ.3",
    classNumber: "/1",
    topic: "โครงงานเรื่อง สัตว์เลี้ยง",
    topicEn: "Project: Pets",
    activity: "มะลิชักกีกี้อยู่",
    activityTh: "ชุดกิจกรรมสอง มะลิชักกีกี้อยู่",
  },
  {
    date: "2025-11-18", // Tuesday
    time: "10:30",
    duration: 90,
    grade: "อ.3",
    classNumber: "/2",
    topic: "โครงงานเรื่อง ยานพาหนะทางบก",
    topicEn: "Project: Land Transportation",
    activity: "เอองหมูมอบอื้น จันหมูมอบเอง",
    activityTh: "ชุดกิจกรรมสอง เอองหมูมอบอื้น จันหมูมอบเอง",
  },
  {
    date: "2025-11-19", // Wednesday
    time: "09:00",
    duration: 90,
    grade: "อ.3",
    classNumber: "/3",
    topic: "โครงงานเรื่อง ดอกไม้กินได้",
    topicEn: "Project: Edible Flowers",
    activity: "แม่มด",
    activityTh: "ชุดกิจกรรมสอง แม่มด",
  },
  {
    date: "2025-11-19", // Wednesday
    time: "10:30",
    duration: 90,
    grade: "อ.3",
    classNumber: "/4",
    topic: "โครงงานเรื่อง น้ำ",
    topicEn: "Project: Water",
    activity: "ลูล่ามอมริบคุย",
    activityTh: "ชุดกิจกรรมสอง ลูล่ามอมริบคุย",
  },
  {
    date: "2025-11-20", // Thursday
    time: "09:00",
    duration: 90,
    grade: "อ.3",
    classNumber: "/5",
    topic: "โครงงานเรื่อง กบ",
    topicEn: "Project: Frog",
    activity: "เข้าข้าเอยั",
    activityTh: "ชุดกิจกรรมสอง เข้าข้าเอยั",
  },
  {
    date: "2025-11-20", // Thursday
    time: "10:30",
    duration: 90,
    grade: "K.3",
    classNumber: "/6",
    topic: "โครงงานเรื่อง ปลาลองงาม",
    topicEn: "Project: Beautiful Fish",
    activity: "Banana Chacha",
    activityTh: "ชุดกิจกรรมสอง Banana Chacha",
  },
  {
    date: "2025-11-21", // Friday
    time: "09:00",
    duration: 90,
    grade: "K.3",
    classNumber: "/7",
    topic: "โครงงานเรื่อง ชูเด",
    topicEn: "Project: Jude",
    activity: "Baby",
    activityTh: "ชุดกิจกรรมสอง Baby",
  },
  {
    date: "2025-11-21", // Friday
    time: "10:30",
    duration: 90,
    grade: "K.3",
    classNumber: "/8",
    topic: "โครงงานเรื่อง สัตว์เลี้ยงลูกด้วยแม",
    topicEn: "Project: Mammals",
    activity: "Dynamite",
    activityTh: "ชุดกิจกรรมสอง Dynamite",
  },
  {
    date: "2025-11-24", // Monday
    time: "09:00",
    duration: 90,
    grade: "K.3",
    classNumber: "/9",
    topic: "โครงงานเรื่อง ดอกไม้",
    topicEn: "Project: Flowers",
    activity: "AH YAY!",
    activityTh: "ชุดกิจกรรมสอง AH YAY!",
  },
  {
    date: "2025-11-24", // Monday
    time: "10:30",
    duration: 90,
    grade: "K.3",
    classNumber: "/10",
    topic: "โครงงานเรื่อง สัตว์ไซเล",
    topicEn: "Project: Wild Animals",
    activity: "Shake It off",
    activityTh: "ชุดกิจกรรมสอง Shake It off",
  },
];

export const seedSangsomProject = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if Sangsom school already exists
    const existingSchool = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("name"), "Sangsom School"))
      .first();

    let schoolId: Id<"schools">;
    let teacherId: Id<"users">;
    let moderatorId: Id<"users">;
    let locationId: Id<"locations">;

    if (existingSchool) {
      console.log("Sangsom School already exists, using existing school");
      schoolId = existingSchool._id;
      
      // Get existing teacher and moderator
      const existingTeacher = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", "sangsom_teacher"))
        .first();
      
      const existingModerator = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", "sangsom_moderator"))
        .first();
      
      const existingLocation = await ctx.db
        .query("locations")
        .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
        .filter((q) => q.eq(q.field("name"), "Sangsom Classroom"))
        .first();
      
      if (!existingTeacher || !existingModerator || !existingLocation) {
        throw new Error("Sangsom school exists but missing teacher, moderator, or location");
      }
      
      teacherId = existingTeacher._id;
      moderatorId = existingModerator._id;
      locationId = existingLocation._id;
    } else {
      // Create Sangsom School
      schoolId = await ctx.db.insert("schools", {
        name: "Sangsom School",
        nameTh: "โรงเรียนสังสม",
        createdAt: Date.now(),
      });

      // Create moderator for the school
      const moderatorPassword = hashPassword("TeacherSangsomModerator");
      moderatorId = await ctx.db.insert("users", {
        username: "sangsom_moderator",
        passwordHash: moderatorPassword,
        role: "moderator",
        schoolId: schoolId,
        requirePasswordChange: true,
        createdAt: Date.now(),
      });

      // Update school with moderator
      await ctx.db.patch(schoolId, {
        moderatorId: moderatorId,
      });

      // Create teacher (พงศกร หน่อไฟ)
      const teacherPassword = hashPassword("TeacherPongsak");
      teacherId = await ctx.db.insert("users", {
        username: "sangsom_teacher",
        passwordHash: teacherPassword,
        role: "teacher",
        schoolId: schoolId,
        requirePasswordChange: true,
        createdAt: Date.now(),
      });

      // Create location (Sangsom Classroom)
      locationId = await ctx.db.insert("locations", {
        name: "Sangsom Classroom",
        nameTh: "ห้องเรียนสังสม",
        schoolId: schoolId,
        type: "school",
        isActive: true,
        createdAt: Date.now(),
        createdBy: moderatorId,
      });
    }

    // Get or create students for each unique class code
    const uniqueClasses = [...new Set(
      SCHEDULE_DATA.map(item => `${item.grade}${item.classNumber}`)
    )];

    const studentMap = new Map<string, Id<"students">>();
    
    for (const classCode of uniqueClasses) {
      const grade = classCode.split("/")[0];
      const classNumber = "/" + classCode.split("/")[1];
      
      // Check if student already exists
      const existingStudent = await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
        .filter((q) => 
          q.and(
            q.eq(q.field("grade"), grade),
            q.eq(q.field("class"), classNumber)
          )
        )
        .first();
      
      if (existingStudent) {
        studentMap.set(classCode, existingStudent._id);
        continue;
      }
      
      // Generate unique student ID
      const timestamp = Date.now().toString(36);
      const gradeHash = grade.replace(".", "").substring(0, 2).toUpperCase();
      const schoolHash = "SANG";
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const studentId = `${schoolHash}-${gradeHash}-${timestamp}-${random}`;
      
      // Create student
      const newStudentId = await ctx.db.insert("students", {
        firstName: `Student ${classCode}`,
        lastName: "Sangsom",
        studentId: studentId,
        schoolId: schoolId,
        grade: grade,
        class: classNumber,
        nickname: classCode,
        createdBy: teacherId,
        createdAt: Date.now(),
      });
      
      studentMap.set(classCode, newStudentId);
    }

    // Create classes for each scheduled item
    const createdClasses = [];
    
    for (const item of SCHEDULE_DATA) {
      const classCode = `${item.grade}${item.classNumber}`;
      const studentId = studentMap.get(classCode);
      
      if (!studentId) {
        console.error(`Student not found for class code: ${classCode}`);
        continue;
      }
      
      // Parse date and time
      const [year, month, day] = item.date.split("-").map(Number);
      const [hour, minute] = item.time.split(":").map(Number);
      const scheduledDate = new Date(year, month - 1, day, hour, minute).getTime();
      
      // Check if class already exists
      const existingClass = await ctx.db
        .query("classes")
        .withIndex("by_teacher_and_date", (q) =>
          q.eq("teacherId", teacherId)
            .eq("scheduledDate", scheduledDate)
        )
        .filter((q) => q.eq(q.field("studentId"), studentId))
        .first();
      
      if (existingClass) {
        console.log(`Class already exists for ${classCode} on ${item.date} at ${item.time}`);
        continue;
      }
      
      // Create class
      const classId = await ctx.db.insert("classes", {
        teacherId: teacherId,
        schoolId: schoolId,
        studentId: studentId,
        locationId: locationId,
        status: "approved", // Auto-approve for seeded data
        scheduledDate: scheduledDate,
        duration: item.duration,
        subject: "Sangsom Project",
        subjectTh: "โครงสังสม",
        lessonTopic: item.topicEn,
        lessonTopicTh: item.topic,
        materials: item.activity,
        materialsTh: item.activityTh,
        classType: "regular",
        createdAt: Date.now(),
      });
      
      createdClasses.push({
        classId,
        date: item.date,
        time: item.time,
        classCode,
        topic: item.topic,
      });
    }

    return {
      success: true,
      message: "Sangsom Project schedule seeded successfully",
      schoolId,
      teacherId,
      moderatorId,
      locationId,
      studentsCreated: studentMap.size,
      classesCreated: createdClasses.length,
      classes: createdClasses,
      credentials: {
        teacher: { username: "sangsom_teacher", password: "TeacherPongsak" },
        moderator: { username: "sangsom_moderator", password: "TeacherSangsomModerator" },
      },
    };
  },
});

// Query to check if Sangsom Project data exists
export const checkSangsomData = mutation({
  args: {},
  handler: async (ctx) => {
    const school = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("name"), "Sangsom School"))
      .first();

    if (!school) {
      return { exists: false };
    }

    const classes = await ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .collect();

    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .collect();

    return {
      exists: true,
      schoolId: school._id,
      classCount: classes.length,
      studentCount: students.length,
    };
  },
});
