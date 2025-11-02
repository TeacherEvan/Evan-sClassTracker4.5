import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { hashPassword } from "./users";

/**
 * Seed script for Sangsom Project schedule (November 2025)
 * Based on the paper schedule provided by Teacher พงศกร หน่อไฟ
 *
 * This script creates:
 * - Sangsom School
 * - Teacher user (พงศกร หน่อไฟ)
 * - EVENTS for each scheduled class session
 *
 * NOTE: Creates EVENTS, not classes with students!
 */

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
      const moderatorPassword = await hashPassword("TeacherSangsomModerator");
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
      const teacherPassword = await hashPassword("TeacherPongsak");
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

    // Create EVENTS for each scheduled item
    const createdEvents = [];

    for (const item of SCHEDULE_DATA) {
      const classCode = `${item.grade}${item.classNumber}`;

      // Parse date and time
      const [year, month, day] = item.date.split("-").map(Number);
      const [hour, minute] = item.time.split(":").map(Number);
      const eventDate = new Date(year, month - 1, day, hour, minute).getTime();

      // Check if event already exists
      const existingEvent = await ctx.db
        .query("events")
        .withIndex("by_creator_and_date", (q) =>
          q.eq("createdBy", teacherId)
            .eq("eventDate", eventDate)
        )
        .filter((q) => q.eq(q.field("title"), `${classCode} - ${item.topicEn}`))
        .first();

      if (existingEvent) {
        console.log(`Event already exists for ${classCode} on ${item.date} at ${item.time}`);
        continue;
      }

      // Create event
      const eventId = await ctx.db.insert("events", {
        title: `${classCode} - ${item.topicEn}`,
        titleTh: `${classCode} - ${item.topic}`,
        description: `Activity: ${item.activity}\nDuration: ${item.duration} minutes`,
        descriptionTh: `กิจกรรม: ${item.activityTh}\nระยะเวลา: ${item.duration} นาที`,
        eventDate: eventDate,
        allDay: false,
        eventType: "event",
        visibility: "school",
        schoolId: schoolId,
        createdBy: teacherId,
        createdAt: Date.now(),
        isActive: true,
        location: "Sangsom Classroom",
        locationTh: "ห้องเรียนสังสม",
      });

      createdEvents.push({
        eventId,
        date: item.date,
        time: item.time,
        classCode,
        topic: item.topic,
      });
    }

    return {
      success: true,
      message: "Sangsom Project events seeded successfully",
      schoolId,
      teacherId,
      moderatorId,
      locationId,
      eventsCreated: createdEvents.length,
      events: createdEvents,
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

    const events = await ctx.db
      .query("events")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .collect();

    return {
      exists: true,
      schoolId: school._id,
      eventCount: events.length,
    };
  },
});
