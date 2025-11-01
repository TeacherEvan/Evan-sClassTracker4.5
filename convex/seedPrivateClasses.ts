import type { GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * Seed Private Classes for T. Che, T. Cale, and T. Lee
 * Duration: 12 weeks (Nov 4, 2025 - Jan 24, 2026)
 * Auto-approved guardian-linked bookings
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

// Helper to find student by code (XXYY format)
// Improved with multiple fallback strategies for robustness
async function findStudentByCode(ctx: GenericMutationCtx<DataModel>, studentCode: string) {
    // Parse code: 2419 -> K2/4, student #19
    const gradeDigit = studentCode[0]; // 1 or 2
    const classDigit = studentCode[1];
    const numberDigits = studentCode.slice(2); // "19"

    const gradeStr = gradeDigit === "1" ? "K1" : "K2";
    const classStr = `${gradeStr}/${classDigit}`;
    const studentNumber = parseInt(numberDigits);

    // Strategy 1: Filter by both grade AND class for precision
    const allStudents = await ctx.db
        .query("students")
        .filter((q) =>
            q.and(
                q.eq(q.field("grade"), classStr),
                q.eq(q.field("class"), `/${classDigit}`)
            )
        )
        .collect();

    if (allStudents.length === 0) {
        console.error(`❌ No students found for ${classStr}/${classDigit}`);
        return null;
    }

    // Strategy 2: Sort by _creationTime to maintain original creation order
    // This assumes students were imported in roster order
    allStudents.sort((a, b) => a._creationTime - b._creationTime);

    console.log(`🔍 Looking for student #${studentNumber} in ${classStr}/${classDigit}, found ${allStudents.length} total students`);

    // Strategy 3: Find by position in class array (studentNumber is 1-indexed, array is 0-indexed)
    const student = allStudents[studentNumber - 1];

    if (!student) {
        console.error(`❌ Student #${studentNumber} not found in ${classStr}/${classDigit} (only ${allStudents.length} students exist)`);
        console.error(`Available students:`, allStudents.map((s, idx) =>
            `#${idx + 1}: ${s.firstName} ${s.lastName} (${s.studentId})`
        ));
        return null;
    }

    console.log(`✅ Found: #${studentNumber} ${student.firstName} ${student.lastName} (${student.studentId})`);
    return student;
}

export const seedPrivateClasses = mutation({
    args: {
        teacherUsername: v.union(v.literal("Che"), v.literal("Cale"), v.literal("Lee")),
        weeksCount: v.optional(v.number()), // Default 12 weeks
        testMode: v.optional(v.boolean()), // If true, only creates Week 1
    },
    handler: async (ctx, args) => {
        try {
            const weeksCount = args.testMode ? 1 : (args.weeksCount || 12);
            const schedule =
                args.teacherUsername === "Che" ? CHE_SCHEDULE :
                    args.teacherUsername === "Cale" ? CALE_SCHEDULE :
                        LEE_SCHEDULE;

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

            // 2. Get or create locations
            const locationNames = [...new Set(schedule.map(s => s.location))];
            const locations = new Map<string, Id<"locations">>();

            for (const locationName of locationNames) {
                const location = await ctx.db
                    .query("locations")
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("name"), locationName),
                            q.eq(q.field("isActive"), true)
                        )
                    )
                    .first();

                if (!location) {
                    // Create location if it doesn't exist
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

            // 3. Loop through weeks and create bookings
            const createdBookings = [];
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

                    // Regular students (all weeks)
                    for (const studentCode of daySchedule.students) {
                        const student = await findStudentByCode(ctx, studentCode);

                        if (!student) {
                            errors.push({
                                error: `Student ${studentCode} not found`,
                                week: week + 1,
                                day: daySchedule.day,
                            });
                            continue;
                        }

                        try {
                            const classId = await ctx.db.insert("classes", {
                                teacherId: teacher._id,
                                studentId: student._id,
                                locationId: locationId,
                                scheduledDate: classDate.getTime(),
                                status: "approved", // Auto-approved
                                isGuardianLinked: true, // Private tutoring
                                guardianTitle: "Private Student",
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

                    // One-time students (first occurrence only)
                    if (week === 0 && daySchedule.oneTimeStudents) {
                        for (const studentCode of daySchedule.oneTimeStudents) {
                            const student = await findStudentByCode(ctx, studentCode);

                            if (!student) {
                                errors.push({
                                    error: `One-time student ${studentCode} not found`,
                                    week: week + 1,
                                    day: daySchedule.day,
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
                                    isGuardianLinked: true,
                                    guardianTitle: "Private Student (One-Time)",
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

                    // Date-range students (within specific dates)
                    if (daySchedule.dateRangeStudents) {
                        for (const rangeStudent of daySchedule.dateRangeStudents) {
                            const classTimestamp = classDate.getTime();

                            // Only create if within date range
                            if (classTimestamp >= rangeStudent.startDate && classTimestamp <= rangeStudent.endDate) {
                                const student = await findStudentByCode(ctx, rangeStudent.code);

                                if (!student) {
                                    errors.push({
                                        error: `Date-range student ${rangeStudent.code} not found`,
                                        week: week + 1,
                                        day: daySchedule.day,
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
                                        isGuardianLinked: true,
                                        guardianTitle: "Private Student (Date Range)",
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

            // 4. Generate summary with detailed error reporting
            const scheduleDetails = `${args.teacherUsername}: ${schedule.length} days/week, ${schedule.reduce((sum, d) => sum + d.students.length, 0)} regular students`;
            const errorSummary = errors.length > 0
                ? `\n⚠️  ${errors.length} errors occurred:\n${errors.map(e => `  - Week ${e.week}, Day ${e.day}: ${e.error}`).join('\n')}`
                : '';

            return {
                success: errors.length === 0,
                message: `✅ Created ${createdBookings.length} private classes for ${args.teacherUsername} (${weeksCount} weeks)${errorSummary}`,
                teacher: args.teacherUsername,
                weeksCreated: weeksCount,
                bookingsCreated: createdBookings.length,
                expectedBookings: schedule.reduce((sum, d) => sum + d.students.length, 0) * weeksCount,
                scheduleDetails,
                bookings: args.testMode ? createdBookings.slice(0, 10) : undefined, // Only show sample in test mode
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
        teacherUsername: v.union(v.literal("Che"), v.literal("Cale"), v.literal("Lee")),
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
