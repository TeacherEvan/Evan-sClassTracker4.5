import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Complete cleanup for Sangsom test data
 * Deletes:
 * - All Sangsom events (30 events)
 * - Sangsom teacher user (sangsom_teacher)
 * - Sangsom moderator user (sangsom_moderator)
 * - Sangsom location
 * - Sangsom School
 * 
 * Optional: Can preserve school if you want to keep it
 */
export const deleteSangsomData = mutation({
    args: {
        adminId: v.id("users"),
        deleteSchool: v.boolean(), // If true, delete the entire school; if false, keep school but remove events/users
    },
    handler: async (ctx, args) => {
        // Verify admin authorization
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Only admins can delete Sangsom data");
        }

        // Find Sangsom School
        const school = await ctx.db
            .query("schools")
            .filter((q) => q.eq(q.field("name"), "Sangsom School"))
            .first();

        if (!school) {
            return {
                success: false,
                message: "Sangsom School not found - nothing to delete",
                eventsDeleted: 0,
                usersDeleted: 0,
                locationsDeleted: 0,
                schoolDeleted: false,
            };
        }

        const schoolId = school._id;
        let eventsDeleted = 0;
        let usersDeleted = 0;
        let locationsDeleted = 0;
        let studentsDeleted = 0;

        // 1. Delete all events from Sangsom School
        const events = await ctx.db
            .query("events")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        for (const event of events) {
            await ctx.db.delete(event._id);
            eventsDeleted++;
        }

        // 2. Delete all students from Sangsom School (if any exist)
        const students = await ctx.db
            .query("students")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        for (const student of students) {
            await ctx.db.delete(student._id);
            studentsDeleted++;
        }

        // 3. Delete all classes from Sangsom School (if any exist)
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        let classesDeleted = 0;
        for (const classItem of classes) {
            await ctx.db.delete(classItem._id);
            classesDeleted++;
        }

        // 4. Delete Sangsom teacher and moderator users
        const teacher = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "sangsom_teacher"))
            .first();

        if (teacher) {
            await ctx.db.delete(teacher._id);
            usersDeleted++;
        }

        const moderator = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "sangsom_moderator"))
            .first();

        if (moderator) {
            await ctx.db.delete(moderator._id);
            usersDeleted++;
        }

        // 5. Delete Sangsom location
        const locations = await ctx.db
            .query("locations")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        for (const location of locations) {
            await ctx.db.delete(location._id);
            locationsDeleted++;
        }

        // 6. Delete school itself (if requested)
        let schoolDeleted = false;
        if (args.deleteSchool) {
            await ctx.db.delete(schoolId);
            schoolDeleted = true;
        }

        return {
            success: true,
            message: schoolDeleted
                ? "Sangsom School and all associated data deleted completely"
                : "Sangsom events, users, and locations deleted (school preserved)",
            eventsDeleted,
            studentsDeleted,
            classesDeleted,
            usersDeleted,
            locationsDeleted,
            schoolDeleted,
        };
    },
});

/**
 * Check what Sangsom data exists before deleting
 */
export const checkSangsomDataToDelete = mutation({
    args: {},
    handler: async (ctx) => {
        const school = await ctx.db
            .query("schools")
            .filter((q) => q.eq(q.field("name"), "Sangsom School"))
            .first();

        if (!school) {
            return {
                exists: false,
                message: "Sangsom School not found",
            };
        }

        const schoolId = school._id;

        // Count all related data
        const events = await ctx.db
            .query("events")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        const students = await ctx.db
            .query("students")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        const teacher = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "sangsom_teacher"))
            .first();

        const moderator = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "sangsom_moderator"))
            .first();

        const locations = await ctx.db
            .query("locations")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        return {
            exists: true,
            schoolName: school.name,
            schoolId: school._id,
            counts: {
                events: events.length,
                students: students.length,
                classes: classes.length,
                users: (teacher ? 1 : 0) + (moderator ? 1 : 0),
                locations: locations.length,
            },
            details: {
                teacher: teacher ? teacher.username : null,
                moderator: moderator ? moderator.username : null,
                locationNames: locations.map(l => l.name),
            },
        };
    },
});
