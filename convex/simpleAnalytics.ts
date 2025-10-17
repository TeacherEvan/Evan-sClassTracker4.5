import { v } from "convex/values";
import { query } from "./_generated/server";

// Simple query to count classes for a school
export const getSchoolClassCount = query({
    args: {
        schoolId: v.id("schools"),
    },
    handler: async (ctx, args) => {
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .collect();

        return {
            total: classes.length,
            approved: classes.filter((c) => c.status === "approved").length,
            pending: classes.filter((c) => c.status === "pending").length,
            rejected: classes.filter((c) => c.status === "rejected").length,
        };
    },
});
