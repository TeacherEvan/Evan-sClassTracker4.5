import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * Seed Private Classes for T. Che, T. Cale, T. Lee, and T. Evan
 * Duration: 12 weeks (Nov 4, 2025 - Jan 24, 2026)
 * Auto-approved provider-linked bookings
 */

// Type definition for schedule day
type ScheduleDay = {
  day: number;
  location: string;
  students: string[];
  oneTimeStudents?: string[];
  dateRangeStudents?: Array<{
    code: string;
    startDate: number;
    endDate: number;
  }>;
};

// T. Che Private Classes Schedule
// ALL classes at OLD MUSIC TOILET location
const CHE_SCHEDULE: ScheduleDay[] = [
  {
    day: 1, // Monday
    location: "OLD MUSIC TOILET",
    students: ["2804", "2818", "2814"], // BEYOND, KARTOON, GRACE
  },
  {
    day: 2, // Tuesday
    location: "OLD MUSIC TOILET",
    students: ["2812", "2824"], // NANI, WINTER
  },
  {
    day: 3, // Wednesday
    location: "OLD MUSIC TOILET",
    students: ["2204", "2706", "2814"], // PING, PANGPRAW, GRACE
  },
  {
    day: 4, // Thursday
    location: "OLD MUSIC TOILET",
    students: ["2810", "2805", "2824"], // BLUEFIN, KIRIN, T,me
  },
  {
    day: 5, // Friday
    location: "OLD MUSIC TOILET",
    students: ["2827", "2816"], // Layn, Bua
  },
];

// T. Cale Private Classes Schedule
const CALE_SCHEDULE: ScheduleDay[] = [
  {
    day: 1, // Monday
    location: "Big kitchen",
    students: ["2419", "2706", "2705"], // Davin, LALYNN, PANGPRAW
  },
  {
    day: 2, // Tuesday
    location: "Big kitchen",
    students: ["1717", "1724", "1704"], // Link, THAM, IU
  },
  {
    day: 3, // Wednesday
    location: "OLD TEG",
    students: ["2712", "2419"], // THAMESN'E, Davin (BRAVE is one-time only)
    oneTimeStudents: ["1816"], // BRAVE - first Wednesday only
  },
  {
    day: 4, // Thursday
    location: "Big kitchen",
    students: ["1717", "1704", "1720"], // Link, ARSENE, RUNRUN
  },
  {
    day: 5, // Friday
    location: "Big kitchen",
    students: ["2712", "1712"], // THAMESN'E, Ampere (MILIN has date range)
    dateRangeStudents: [
      {
        code: "1718", // MILIN
        startDate: new Date("2025-11-07").getTime(), // Nov 7, 2025
        endDate: new Date("2026-01-30").getTime(),   // Jan 30, 2026
      },
    ],
  },
];

// T. Lee Private Classes Schedule
// ALL classes at PLAY ROOM B.5 location
const LEE_SCHEDULE: ScheduleDay[] = [
  {
    day: 2, // Tuesday
    location: "PLAY ROOM B.5",
    students: ["1105", "1125"], // NARA, MANOW
  },
  {
    day: 3, // Wednesday
    location: "PLAY ROOM B.5",
    students: ["1103", "1105"], // MASTER, NARA
  },
  {
    day: 4, // Thursday
    location: "PLAY ROOM B.5",
    students: ["1105", "1108"], // NARA, MIU
  },
  {
    day: 5, // Friday
    location: "PLAY ROOM B.5",
    students: [], // MARINE and Thang Thang are trial students (one-time)
    oneTimeStudents: ["2015", "2021"], // MARINE try 1, Thang Thang try 1
  },
];

// T. Evan Private Classes Schedule
// ALL classes at PLAY ROOM B.5 location
const EVAN_SCHEDULE: ScheduleDay[] = [
  {
    day: 1, // Monday
    location: "PLAY ROOM B.5",
    students: ["1601", "1607"], // Ing-Ing, GOMU GOMU
  },
  {
    day: 2, // Tuesday
    location: "PLAY ROOM B.5",
    students: ["1625"], // Piglet
  },
  {
    day: 3, // Wednesday
    location: "PLAY ROOM B.5",
    students: ["1620", "1602"], // LALYNN, JEDI
  },
  {
    day: 4, // Thursday
    location: "PLAY ROOM B.5",
    students: ["1607", "1623", "1403"], // GOMU GOMU, DARIN, MAYU
  },
  {
    day: 5, // Friday
    location: "PLAY ROOM B.5",
    students: ["1618"], // MICKEY
  },
];

export const seedPrivateClasses = mutation({
  args: {
    teacherUsername: v.union(v.literal("Che"), v.literal("Cale"), v.literal("Lee"), v.literal("Evan")),
    weeksCount: v.optional(v.number()), // Default 12 weeks
    testMode: v.optional(v.boolean()), // If true, only creates Week 1
  },
  handler: async (ctx, args) => {
    try {
      const weeksCount = args.testMode ? 1 : (args.weeksCount || 12);
      const schedule =
        args.teacherUsername === "Che" ? CHE_SCHEDULE :
          args.teacherUsername === "Cale" ? CALE_SCHEDULE :
            args.teacherUsername === "Lee" ? LEE_SCHEDULE :
              EVAN_SCHEDULE;

      // 1. Get teacher by username
      const teacher = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.teacherUsername))
        .first();

      if (!teacher) {
        throw new Error(`Teacher "${args.teacherUsername}" not found. Please ensure teacher account exists with username: ${args.teacherUsername}`);
      }

      // Get teacher's school (or use first available school for private classes)
      let teacherSchoolId = teacher.schoolId;
      if (!teacherSchoolId) {
        const firstSchool = await ctx.db.query("schools").first();
        if (!firstSchool) {
          throw new Error("No schools found in the system");
        }
        teacherSchoolId = firstSchool._id;
      }

      // 2. ✅ BATCH FETCH STUDENTS EFFICIENTLY (using new index)
      console.log("📚 Batch fetching required students using indexes...");

      // Get all unique student codes from all schedules
      const allStudentCodes = [
        ...CHE_SCHEDULE,
        ...CALE_SCHEDULE,
        ...LEE_SCHEDULE,
        ...EVAN_SCHEDULE,
      ].flatMap(s => [
        ...s.students,
        ...(s.oneTimeStudents || []),
        ...(s.dateRangeStudents?.map(dr => dr.code) || [])
      ]);
      const uniqueStudentCodes = [...new Set(allStudentCodes)];

      // Get unique grade/class combinations from codes
      const uniqueGradeClasses = [...new Set(uniqueStudentCodes.map(code => {
        const gradeDigit = code[0];
        const classDigit = code[1];
        const gradeStr = gradeDigit === "1" ? "K1" : "K2";
        const classStr = `${gradeStr}/${classDigit}`;
        return classStr;
      }))];

      // Fetch students for only the required grade/class combinations
      const studentsByGradeClass = new Map<string, Doc<"students">[]>();
      for (const gradeClass of uniqueGradeClasses) {
        const [grade] = gradeClass.split('/');
        const students = await ctx.db
          .query("students")
          .withIndex("by_grade_and_class", (q) =>
            q.eq("grade", grade).eq("class", gradeClass)
          )
          .collect();
        studentsByGradeClass.set(gradeClass, students);
      }
      console.log(`✅ Fetched students for ${uniqueGradeClasses.length} grade/class groups`);


      // Name mapping for student codes (code → English name)
      const STUDENT_NAME_MAP: { [code: string]: string } = {
        // T. Che's Students
        "2804": "BEYOND",
        "2818": "KARTOON",
        "2814": "GRACE",
        "2812": "NANI",
        "2824": "WINTER",
        "2204": "PING",
        "2706": "PANGPRAW",
        "2810": "BLUEFIN",
        "2805": "KIRIN",
        "2827": "LAYN",
        "2816": "BUA",
        // T. Cale's Students
        "2419": "DAVIN",
        "2705": "LALYNN",
        "1717": "LINK",
        "1724": "THAM",
        "1704": "IU",
        "2712": "THAMESN'E",
        "1816": "BRAVE",
        "1720": "RUNRUN",
        "1712": "AMPERE",
        "1718": "MILIN",
        // T. Lee's Students
        "1105": "NARA",
        "1125": "MANOW",
        "1103": "MASTER",
        "1108": "MIU",
        "2015": "MARINE",
        "2021": "THANG THANG",
        // T. Evan's Students
        "1601": "ING-ING",
        "1607": "GOMU GOMU",
        "1625": "PIGLET",
        "1620": "LALYNN",
        "1602": "JEDI",
        "1623": "DARIN",
        "1403": "MAYU",
        "1618": "MICKEY",
      };      // Helper function for student lookup or creation
      const findOrCreateStudent = async (studentCode: string): Promise<Doc<"students"> | null> => {
        const gradeDigit = studentCode[0];
        const classDigit = studentCode[1];
        const gradeStr = gradeDigit === "1" ? "K1" : "K2";
        const classStr = `${gradeStr}/${classDigit}`;

        // Get expected name from map
        const studentName = STUDENT_NAME_MAP[studentCode];

        if (!studentName) {
          console.error(`❌ No name mapping for code ${studentCode}`);
          return null;
        }

        const students = studentsByGradeClass.get(classStr) || [];

        // Find by name match (case-insensitive) in specific grade/class
        let student = students.find(s =>
          s.firstName.toUpperCase() === studentName.toUpperCase()
        );

        if (!student) {
          // STUDENT DOESN'T EXIST - CREATE IT!
          console.log(`➕ Creating new student: ${studentName} in ${classStr}`);

          // Generate unique studentId
          const timestamp = Date.now().toString(36);
          const nameHash = `${studentName.substring(0, 2)}`.toUpperCase();
          const schoolHash = teacherSchoolId.substring(0, 4).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          const generatedStudentId = `${schoolHash}-${nameHash}-${timestamp}-${random}`;

          const newStudentId = await ctx.db.insert("students", {
            firstName: studentName,
            lastName: "", // Private students don't need last name
            studentId: generatedStudentId,
            grade: gradeStr,
            class: classStr,
            schoolId: teacherSchoolId,
            // Note: providerId should be set for provider-linked students
            area: "Private Tutoring",
            dateOfBirth: Date.now(), // Placeholder
            createdAt: Date.now(),
          });

          // Fetch the newly created student
          const newStudent = await ctx.db.get(newStudentId);

          if (newStudent) {
            // Add to cache for subsequent lookups
            if (!studentsByGradeClass.has(classStr)) {
              studentsByGradeClass.set(classStr, []);
            }
            studentsByGradeClass.get(classStr)!.push(newStudent);
            student = newStudent;
          }
        }

        return student || null;
      };

      // 3. ✅ FETCH LOCATIONS EFFICIENTLY (using new index)
      console.log("📍 Fetching required locations using indexes...");
      const locationNames = [...new Set(schedule.map(s => s.location))];
      const locations = new Map<string, Id<"locations">>();

      for (const locationName of locationNames) {
        const location = await ctx.db
          .query("locations")
          .withIndex("by_name_and_active", (q) =>
            q.eq("name", locationName).eq("isActive", true)
          )
          .first();

        if (!location) {
          // Create location if it doesn't exist
          console.log(`➕ Creating new location: ${locationName}`);
          const locationId = await ctx.db.insert("locations", {
            name: locationName,
            nameTh: locationName, // Use same for Thai (can update later)
            schoolId: teacherSchoolId, // Use teacher's school or default
            type: "guardian", // Private tutoring locations
            isActive: true,
            createdAt: Date.now(),
            createdBy: teacher._id,
          });
          locations.set(locationName, locationId);
        } else {
          locations.set(locationName, location._id);
        }
      }
      console.log(`✅ Fetched or created ${locations.size} locations`);


      // 4. Fetch existing classes for this teacher to avoid duplicates
      console.log("📅 Checking existing classes...");
      const existingClasses = await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
        .filter((q) => q.eq(q.field("isGuardianLinked"), true))
        .collect();

      // Create a Set of existing class keys (date-student combination)
      const existingClassKeys = new Set(
        existingClasses.map(c => `${c.scheduledDate}-${c.studentId}`)
      );
      console.log(`✅ Found ${existingClasses.length} existing private classes`);

      // 5. Loop through weeks and create bookings (skip duplicates)
      const createdBookings = [];
      const skippedDuplicates = [];
      const errors = [];
      const startDate = new Date("2025-11-04"); // Monday, Nov 4, 2025

      for (let week = 0; week < weeksCount; week++) {
        for (const daySchedule of schedule) {
          const classDate = new Date(startDate);
          classDate.setDate(startDate.getDate() + (week * 7) + (daySchedule.day - 1));
          classDate.setHours(15, 0, 0, 0); // 15:00 (3:00 PM)

          const locationId = locations.get(daySchedule.location);
          if (!locationId) {
            errors.push({
              error: `Location "${daySchedule.location}" not found`,
              week: week + 1,
              day: daySchedule.day,
            });
            continue;
          }

          // Regular students (all weeks) - ✅ Map lookup or CREATE if missing
          for (const studentCode of daySchedule.students) {
            const student = await findOrCreateStudent(studentCode);

            if (!student) {
              const studentName = STUDENT_NAME_MAP[studentCode] || studentCode;
              errors.push({
                error: `Student ${studentName} (${studentCode}) could not be created`,
                week: week + 1,
                day: daySchedule.day,
                studentCode,
              });
              continue;
            }

            // Check if class already exists (same date + same student)
            const classKey = `${classDate.getTime()}-${student._id}`;
            if (existingClassKeys.has(classKey)) {
              skippedDuplicates.push({
                date: classDate.toISOString().split("T")[0],
                student: `${student.firstName} ${student.lastName}`,
                reason: "Already exists",
              });
              continue; // Skip duplicate
            }

            try {
              const classId = await ctx.db.insert("classes", {
                teacherId: teacher._id,
                studentId: student._id,
                locationId: locationId,
                scheduledDate: classDate.getTime(),
                status: "approved", // Auto-approved
                createdAt: Date.now(),
              });

              createdBookings.push({
                classId,
                date: classDate.toISOString().split("T")[0],
                teacher: args.teacherUsername,
                student: `${student.firstName} ${student.lastName}`,
                location: daySchedule.location,
              });
            } catch (err) {
              errors.push({
                error: `Failed to create class: ${err instanceof Error ? err.message : "Unknown error"}`,
                studentCode,
                week: week + 1,
                day: daySchedule.day,
              });
            }
          }

          // One-time students (first occurrence only) - ✅ Map lookup or CREATE
          if (week === 0 && daySchedule.oneTimeStudents) {
            for (const studentCode of daySchedule.oneTimeStudents) {
              const student = await findOrCreateStudent(studentCode);

              if (!student) {
                const studentName = STUDENT_NAME_MAP[studentCode] || studentCode;
                errors.push({
                  error: `One-time student ${studentName} (${studentCode}) could not be created`,
                  week: week + 1,
                  day: daySchedule.day,
                  studentCode,
                });
                continue;
              }

              // Check for duplicate
              const classKey = `${classDate.getTime()}-${student._id}`;
              if (existingClassKeys.has(classKey)) {
                skippedDuplicates.push({
                  date: classDate.toISOString().split("T")[0],
                  student: `${student.firstName} ${student.lastName} (ONE-TIME)`,
                  reason: "Already exists",
                });
                continue;
              }

              try {
                const classId = await ctx.db.insert("classes", {
                  teacherId: teacher._id,
                  studentId: student._id,
                  locationId: locationId,
                  scheduledDate: classDate.getTime(),
                  status: "approved",
                  createdAt: Date.now(),
                });

                createdBookings.push({
                  classId,
                  date: classDate.toISOString().split("T")[0],
                  teacher: args.teacherUsername,
                  student: `${student.firstName} ${student.lastName} (ONE-TIME)`,
                  location: daySchedule.location,
                });
              } catch (err) {
                errors.push({
                  error: `Failed to create one-time class: ${err instanceof Error ? err.message : "Unknown error"}`,
                  studentCode,
                  week: week + 1,
                  day: daySchedule.day,
                });
              }
            }
          }

          // Date-range students (within specific dates) - ✅ Map lookup or CREATE
          if (daySchedule.dateRangeStudents) {
            for (const rangeStudent of daySchedule.dateRangeStudents) {
              const classTimestamp = classDate.getTime();

              // Only create if within date range
              if (classTimestamp >= rangeStudent.startDate && classTimestamp <= rangeStudent.endDate) {
                const student = await findOrCreateStudent(rangeStudent.code);

                if (!student) {
                  const studentName = STUDENT_NAME_MAP[rangeStudent.code] || rangeStudent.code;
                  errors.push({
                    error: `Date-range student ${studentName} (${rangeStudent.code}) could not be created`,
                    week: week + 1,
                    day: daySchedule.day,
                    studentCode: rangeStudent.code,
                  });
                  continue;
                }

                // Check for duplicate
                const classKey = `${classDate.getTime()}-${student._id}`;
                if (existingClassKeys.has(classKey)) {
                  skippedDuplicates.push({
                    date: classDate.toISOString().split("T")[0],
                    student: `${student.firstName} ${student.lastName} (DATE RANGE)`,
                    reason: "Already exists",
                  });
                  continue;
                }

                try {
                  const classId = await ctx.db.insert("classes", {
                    teacherId: teacher._id,
                    studentId: student._id,
                    locationId: locationId,
                    scheduledDate: classDate.getTime(),
                    status: "approved",
                    createdAt: Date.now(),
                  });

                  createdBookings.push({
                    classId,
                    date: classDate.toISOString().split("T")[0],
                    teacher: args.teacherUsername,
                    student: `${student.firstName} ${student.lastName} (DATE RANGE)`,
                    location: daySchedule.location,
                  });
                } catch (err) {
                  errors.push({
                    error: `Failed to create date-range class: ${err instanceof Error ? err.message : "Unknown error"}`,
                    studentCode: rangeStudent.code,
                    week: week + 1,
                    day: daySchedule.day,
                  });
                }
              }
            }
          }
        }
      }

      // 5. Generate summary with detailed error reporting
      const scheduleDetails = `${args.teacherUsername}: ${schedule.length} days/week, ${schedule.reduce((sum, d) => sum + d.students.length, 0)} regular students`;
      const errorSummary = errors.length > 0
        ? `\n⚠️  ${errors.length} errors occurred:\n${errors.map(e => `  - Week ${e.week}, Day ${e.day}: ${e.error}`).join('\n')}`
        : '';
      const duplicateSummary = skippedDuplicates.length > 0
        ? `\n⏭️  Skipped ${skippedDuplicates.length} duplicates (already exist)`
        : '';

      return {
        success: errors.length === 0,
        message: `✅ Created ${createdBookings.length} private classes for ${args.teacherUsername} (${weeksCount} weeks)${duplicateSummary}${errorSummary}`,
        teacher: args.teacherUsername,
        weeksCreated: weeksCount,
        bookingsCreated: createdBookings.length,
        skippedDuplicates: skippedDuplicates.length,
        expectedBookings: schedule.reduce((sum, d) => sum + d.students.length, 0) * weeksCount,
        scheduleDetails,
        bookings: args.testMode ? createdBookings.slice(0, 10) : undefined, // Only show sample in test mode
        duplicates: args.testMode && skippedDuplicates.length > 0 ? skippedDuplicates.slice(0, 10) : undefined,
        errors: errors.length > 0 ? errors : undefined,
        errorCount: errors.length,
      };
    } catch (error) {
      console.error("❌ Error in seedPrivateClasses:", error);
      throw new Error(`Failed to seed private classes: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Query to check existing private classes
export const checkPrivateClasses = mutation({
  args: {
    teacherUsername: v.union(v.literal("Che"), v.literal("Cale"), v.literal("Lee"), v.literal("Evan")),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.teacherUsername))
      .first();

    if (!teacher) {
      return { exists: false, message: `Teacher "${args.teacherUsername}" not found` };
    }

    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
      .filter((q) => q.eq(q.field("isGuardianLinked"), true))
      .collect();

    return {
      exists: true,
      teacherId: teacher._id,
      teacherUsername: teacher.username,
      privateClassCount: classes.length,
    };
  },
});
