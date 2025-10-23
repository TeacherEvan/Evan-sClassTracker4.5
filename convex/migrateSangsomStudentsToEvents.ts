import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * ONE-TIME MIGRATION: Convert Sangsom School students to events
 * 
 * This mutation:
 * 1. Finds all students from Sangsom School
 * 2. Converts each student into an event
 * 3. Deletes the student records
 * 
 * Run this ONCE via the Convex dashboard or manually
 */
export const migrateSangsomStudentsToEvents = mutation({
    args: {
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify admin authorization
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Only admins can run migrations");
        }

        // Find Sangsom School
        const schools = await ctx.db
            .query("schools")
            .filter((q) => q.eq(q.field("name"), "Sangsom School"))
            .collect();

        if (schools.length === 0) {
            return {
                success: false,
                message: "Sangsom School not found",
                studentsConverted: 0,
                studentsDeleted: 0,
            };
        }

        const sangsomSchool = schools[0];

        // Find all students from Sangsom School
        const students = await ctx.db
            .query("students")
            .withIndex("by_school", (q) => q.eq("schoolId", sangsomSchool._id))
            .collect();

        if (students.length === 0) {
            return {
                success: true,
                message: "No students found to convert",
                studentsConverted: 0,
                studentsDeleted: 0,
            };
        }

        const eventsCreated: string[] = [];
        const studentsDeleted: string[] = [];

        // Convert each student to an event
        for (const student of students) {
            try {
                // Create event from student data
                const eventTitle = `Student: ${student.firstName} ${student.lastName}`;
                const eventTitleTh = `นักเรียน: ${student.firstName} ${student.lastName}`;

                // Use student's grade/level info if available
                const description = student.notes || `Former student from Sangsom School`;
                const descriptionTh = student.notes || `นักเรียนเดิมจากโรงเรียนสังสม`;

                // Create the event
                const eventId = await ctx.db.insert("events", {
                    title: eventTitle,
                    titleTh: eventTitleTh,
                    description: description,
                    descriptionTh: descriptionTh,
                    eventDate: Date.now(), // Current time as placeholder
                    endDate: Date.now() + 3600000, // 1 hour later
                    allDay: false,
                    eventType: "reminder", // Former student records are just reminders
                    visibility: "school", // School-wide visibility
                    createdBy: args.adminId,
                    createdAt: Date.now(),
                    schoolId: sangsomSchool._id,
                    location: student.grade || undefined,
                    reminderMinutes: 0,
                    isActive: true,
                });

                eventsCreated.push(`${student.firstName} ${student.lastName} -> Event ${eventId}`);

                // Delete the student record
                await ctx.db.delete(student._id);
                studentsDeleted.push(`${student.firstName} ${student.lastName} (${student.studentId})`);
            } catch (error) {
                console.error(`Failed to convert student ${student.studentId}:`, error);
            }
        }

        return {
            success: true,
            message: `Converted ${eventsCreated.length} students to events and deleted ${studentsDeleted.length} student records`,
            studentsConverted: eventsCreated.length,
            studentsDeletedCount: studentsDeleted.length,
            eventsCreated,
            deletedStudents: studentsDeleted,
        };
    },
});

/**
 * ALTERNATIVE: Just delete all Sangsom students without converting
 * Use this if you don't want to keep any record of the students
 */
export const deleteSangsomStudents = mutation({
    args: {
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify admin authorization
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Only admins can delete students");
        }

        // Find Sangsom School
        const schools = await ctx.db
            .query("schools")
            .filter((q) => q.eq(q.field("name"), "Sangsom School"))
            .collect();

        if (schools.length === 0) {
            return {
                success: false,
                message: "Sangsom School not found",
                studentsDeleted: 0,
            };
        }

        const sangsomSchool = schools[0];

        // Find all students from Sangsom School
        const students = await ctx.db
            .query("students")
            .withIndex("by_school", (q) => q.eq("schoolId", sangsomSchool._id))
            .collect();

        const studentsDeleted: string[] = [];

        // Delete each student
        for (const student of students) {
            try {
                await ctx.db.delete(student._id);
                studentsDeleted.push(`${student.firstName} ${student.lastName} (${student.studentId})`);
            } catch (error) {
                console.error(`Failed to delete student ${student.studentId}:`, error);
            }
        }

        return {
            success: true,
            message: `Deleted ${studentsDeleted.length} students from Sangsom School`,
            studentsDeleted: studentsDeleted.length,
            deletedStudents: studentsDeleted,
        };
    },
});
