import { v } from "convex/values";
import { query } from "./_generated/server";

// Search students with bilingual support
export const searchStudents = query({
    args: {
        searchTerm: v.string(),
        schoolId: v.optional(v.id("schools")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const searchLower = args.searchTerm.toLowerCase();

        let students = await ctx.db.query("students").collect();

        // Filter by school if provided
        if (args.schoolId) {
            students = students.filter((s) => s.schoolId === args.schoolId);
        }

        // Search across multiple fields
        const filtered = students.filter((student) => {
            const firstName = student.firstName.toLowerCase();
            const lastName = student.lastName.toLowerCase();
            const studentId = student.studentId.toLowerCase();
            const grade = student.grade.toLowerCase();
            const guardianName = student.guardianName?.toLowerCase() || "";

            return (
                firstName.includes(searchLower) ||
                lastName.includes(searchLower) ||
                studentId.includes(searchLower) ||
                grade.includes(searchLower) ||
                guardianName.includes(searchLower)
            );
        });

        return filtered.slice(0, limit);
    },
});

// Search users with bilingual support
export const searchUsers = query({
    args: {
        searchTerm: v.string(),
        role: v.optional(
            v.union(v.literal("teacher"), v.literal("moderator"), v.literal("admin"))
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const searchLower = args.searchTerm.toLowerCase();

        const users = args.role
            ? await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", args.role!))
                .collect()
            : await ctx.db.query("users").collect();

        // Search by username
        const filtered = users.filter((user) => {
            const username = user.username.toLowerCase();
            return username.includes(searchLower);
        });

        // Don't return password hashes
        return filtered.slice(0, limit).map(({ passwordHash: _passwordHash, ...user }) => user);
    },
});

// Search schools with bilingual support
export const searchSchools = query({
    args: {
        searchTerm: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const searchLower = args.searchTerm.toLowerCase();

        const schools = await ctx.db.query("schools").collect();

        // Search in both English and Thai names
        const filtered = schools.filter((school) => {
            const name = school.name.toLowerCase();
            const nameTh = school.nameTh.toLowerCase();

            return name.includes(searchLower) || nameTh.includes(searchLower);
        });

        return filtered.slice(0, limit);
    },
});

// Search classes with filters
export const searchClasses = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        studentId: v.optional(v.id("students")),
        status: v.optional(
            v.union(
                v.literal("pending"),
                v.literal("acknowledged"),
                v.literal("approved"),
                v.literal("rejected")
            )
        ),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;

        let classes = await ctx.db.query("classes").order("desc").collect();

        // Apply filters
        if (args.teacherId) {
            classes = classes.filter((c) => c.teacherId === args.teacherId);
        }
        if (args.schoolId) {
            classes = classes.filter((c) => c.schoolId === args.schoolId);
        }
        if (args.studentId) {
            classes = classes.filter((c) => c.studentId === args.studentId);
        }
        if (args.status) {
            classes = classes.filter((c) => c.status === args.status);
        }
        if (args.startDate) {
            classes = classes.filter((c) => c.scheduledDate >= args.startDate!);
        }
        if (args.endDate) {
            classes = classes.filter((c) => c.scheduledDate <= args.endDate!);
        }

        return classes.slice(0, limit);
    },
});
