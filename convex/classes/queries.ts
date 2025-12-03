import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

// Query to list classes
export const list = query({
  args: {
    teacherId: v.optional(v.id("users")),
    schoolId: v.optional(v.id("schools")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("acknowledged"),
      v.literal("approved"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    if (args.teacherId) {
      return await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .order("desc")
        .collect();
    } else if (args.schoolId) {
      return await ctx.db
        .query("classes")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      return await ctx.db
        .query("classes")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("classes")
      .order("desc")
      .collect();
  },
});

// Query to get class by ID
export const getById = query({
  args: {
    id: v.id("classes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get classes by date range (for calendar view)
// Optimized to use compound indexes for better performance
export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    schoolId: v.optional(v.id("schools")),
    teacherId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Use compound indexes for efficient range queries
    if (args.schoolId) {
      const classes = await ctx.db
        .query("classes")
        .withIndex("by_school_and_date", (q) =>
          q.eq("schoolId", args.schoolId!)
            .gte("scheduledDate", args.startDate)
            .lte("scheduledDate", args.endDate)
        )
        .collect();
      return classes;
    }

    if (args.teacherId) {
      const classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher_and_date", (q) =>
          q.eq("teacherId", args.teacherId!)
            .gte("scheduledDate", args.startDate)
            .lte("scheduledDate", args.endDate)
        )
        .collect();
      return classes;
    }

    // For all classes, use the scheduled_date index
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_scheduled_date", (q) =>
        q.gte("scheduledDate", args.startDate)
          .lte("scheduledDate", args.endDate)
      )
      .collect();
    return classes;
  },
});

// Query to list classes with joined student and location data
// Eliminates N+1 query problem in components
export const listWithDetails = query({
  args: {
    teacherId: v.optional(v.id("users")),
    schoolId: v.optional(v.id("schools")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("acknowledged"),
      v.literal("approved"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    // First, get all classes based on filter
    let classes;

    if (args.teacherId) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .order("desc")
        .collect();
    } else if (args.schoolId) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      classes = await ctx.db
        .query("classes")
        .order("desc")
        .collect();
    }

    // Batch fetch all related entities
    const studentIds = [...new Set(classes.map(c => c.studentId))];
    // Also collect additional student IDs
    const additionalStudentIds = new Set<Id<"students">>();
    for (const cls of classes) {
      if (cls.additionalStudentIds) {
        for (const id of cls.additionalStudentIds) {
          additionalStudentIds.add(id);
        }
      }
    }
    const allStudentIds = [...new Set([...studentIds, ...additionalStudentIds])];

    const locationIds = [...new Set(classes.map(c => c.locationId).filter(Boolean))];

    const students = await Promise.all(allStudentIds.map(id => ctx.db.get(id)));
    const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));

    // Create lookup maps
    const studentMap = new Map(
      students.filter((s): s is NonNullable<typeof s> => s !== null).map(s => [s._id, s])
    );
    const locationMap = new Map(
      locations.filter((l): l is NonNullable<typeof l> => l !== null).map(l => [l._id, l])
    );

    // Return enriched data with additional students
    return classes.map(c => ({
      ...c,
      student: studentMap.get(c.studentId) || null,
      additionalStudents: c.additionalStudentIds?.map(id => studentMap.get(id) || null).filter(Boolean) || [],
      location: c.locationId ? locationMap.get(c.locationId) || null : null,
    }));
  },
});

// Query to check for time conflicts when booking a class
export const checkTimeConflicts = query({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    scheduledDate: v.number(),
    locationId: v.optional(v.id("locations")),
    excludeClassId: v.optional(v.id("classes")), // Exclude a specific class (for edits)
  },
  handler: async (ctx, args) => {
    // Time tolerance: classes within ±5 minutes are considered conflicting
    const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes in milliseconds
    const startRange = args.scheduledDate - TIME_TOLERANCE;
    const endRange = args.scheduledDate + TIME_TOLERANCE;

    // Query classes for the same teacher, school, and time range
    const potentialConflicts = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", args.teacherId)
          .gte("scheduledDate", startRange)
          .lte("scheduledDate", endRange)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("schoolId"), args.schoolId),
          // Only consider approved or pending classes (not rejected)
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "acknowledged")
          )
        )
      )
      .collect();

    // Filter by location if provided and exclude specific class if needed
    const conflicts = potentialConflicts.filter((cls) => {
      // Exclude the class being edited
      if (args.excludeClassId && cls._id === args.excludeClassId) {
        return false;
      }
      // If location is specified, only flag conflicts at the same location
      if (args.locationId && cls.locationId !== args.locationId) {
        return false;
      }
      return true;
    });

    // Batch fetch student and location data for conflicts
    const studentIds = [...new Set(conflicts.map(c => c.studentId))];
    const locationIds = [...new Set(conflicts.map(c => c.locationId).filter(Boolean))];

    const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
    const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));

    const studentMap = new Map(
      students.filter((s): s is NonNullable<typeof s> => s !== null).map(s => [s._id, s])
    );
    const locationMap = new Map(
      locations.filter((l): l is NonNullable<typeof l> => l !== null).map(l => [l._id, l])
    );

    // Return enriched conflict data
    return conflicts.map(c => ({
      ...c,
      student: studentMap.get(c.studentId) || null,
      location: c.locationId ? locationMap.get(c.locationId) || null : null,
    }));
  },
});

// Query to get edit analytics for mods/admins
export const getEditAnalytics = query({
  args: {
    userId: v.id("users"),
    schoolId: v.id("schools"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user is mod/admin
    const user = await ctx.db.get(args.userId);
    if (!user || !["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized: Only admins and moderators can view edit analytics");
    }

    // If moderator, verify they manage this school
    if (user.role === "moderator") {
      const school = await ctx.db.get(args.schoolId);
      if (school?.moderatorId !== args.userId) {
        throw new Error("Unauthorized: You can only view analytics for your school");
      }
    }

    // Query edited classes
    const query = ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("isEdited"), true));

    const editedClasses = await query.collect();

    // Filter by date range if provided
    let filteredClasses = editedClasses;
    if (args.startDate && args.endDate) {
      filteredClasses = editedClasses.filter(
        (cls) =>
          cls.lastEditedAt &&
          cls.lastEditedAt >= args.startDate! &&
          cls.lastEditedAt <= args.endDate!
      );
    }

    // Batch fetch related entities
    const studentIds = [...new Set(filteredClasses.map((c) => c.studentId))];
    const teacherIds = [...new Set(filteredClasses.map((c) => c.teacherId))];

    const students = await Promise.all(studentIds.map((id) => ctx.db.get(id)));
    const teachers = await Promise.all(teacherIds.map((id) => ctx.db.get(id)));

    const studentMap = new Map(students.map((s) => [s?._id, s]));
    const teacherMap = new Map(teachers.map((t) => [t?._id, t]));

    // Build analytics data
    const analytics = filteredClasses.map((cls) => ({
      classId: cls._id,
      student: studentMap.get(cls.studentId),
      teacher: teacherMap.get(cls.teacherId),
      scheduledDate: cls.scheduledDate,
      lastEditedAt: cls.lastEditedAt,
      lastEditedBy: cls.lastEditedBy,
      editCount: cls.editHistory?.length || 0,
      editHistory: cls.editHistory || [],
    }));

    return analytics;
  },
});

// Query to get upcoming classes for notification window
export const getUpcomingForNotification = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Get approved classes for this teacher in the next 7 days
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", args.userId).gte("scheduledDate", now)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "approved"),
          q.lte(q.field("scheduledDate"), sevenDaysFromNow)
        )
      )
      .order("asc")
      .take(5);

    // Enrich with student and location data
    const enrichedClasses = await Promise.all(
      classes.map(async (cls) => {
        const student = await ctx.db.get(cls.studentId);
        let locationName = "";

        if (cls.locationId) {
          const location = await ctx.db.get(cls.locationId);
          locationName = location
            ? user.role === "admin" || user.role === "moderator"
              ? `${location.name} / ${location.nameTh}`
              : location.name
            : "";
        } else if (cls.pendingLocationName) {
          locationName = cls.pendingLocationName;
        }

        return {
          _id: cls._id,
          scheduledDate: cls.scheduledDate,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : "Unknown Student",
          locationName: locationName || "No location",
        };
      })
    );

    return enrichedClasses;
  },
});

/**
 * Find Recurring Series Query
 * Auto-detects if a class is part of a weekly recurring pattern
 */
export const findRecurringSeries = query({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get seed class
    const seedClass = await ctx.db.get(args.classId);
    if (!seedClass) {
      throw new Error("Class not found");
    }

    // Verify authorization
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isTeacherOwner = seedClass.teacherId === args.userId;
    const isModeratorOrAdmin = user.role === "moderator" || user.role === "admin";

    if (!isTeacherOwner && !isModeratorOrAdmin) {
      throw new Error("Unauthorized: You can only view recurring series for your own classes");
    }

    // Find all classes matching pattern
    const seedDayOfWeek = new Date(seedClass.scheduledDate).getDay();
    const allClasses = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", seedClass.teacherId)
      )
      .filter((q) => q.eq(q.field("studentId"), seedClass.studentId))
      .collect();

    // Filter to weekly pattern (same location, day of week, ~7 days apart)
    const series = allClasses.filter((cls) => {
      const locationMatch = cls.locationId === seedClass.locationId;
      const dayMatch = new Date(cls.scheduledDate).getDay() === seedDayOfWeek;
      const daysDiff = Math.abs(
        (cls.scheduledDate - seedClass.scheduledDate) / 86400000
      );
      const weeklyPattern = daysDiff % 7 <= 1;
      return locationMatch && dayMatch && weeklyPattern;
    });

    return series.sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

/**
 * Find and Clean Up Unpopulated Classes
 * Finds classes that have missing/invalid student references or are orphaned
 * Admin-only operation with dry-run support
 */
export const findUnpopulatedClasses = query({
  args: {
    userId: v.id("users"),
    includeOrphaned: v.optional(v.boolean()), // Include classes with deleted student references
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Get all classes
    const allClasses = await ctx.db.query("classes").collect();

    const unpopulatedClasses: Array<{
      _id: Id<"classes">;
      reason: string;
      scheduledDate: number;
      teacherId: Id<"users">;
      schoolId?: Id<"schools">;
      status: string;
    }> = [];

    // Check each class for issues
    for (const classItem of allClasses) {
      // Check if student exists
      if (args.includeOrphaned) {
        const student = await ctx.db.get(classItem.studentId);
        if (!student) {
          unpopulatedClasses.push({
            _id: classItem._id,
            reason: "Student reference not found (deleted or invalid)",
            scheduledDate: classItem.scheduledDate,
            teacherId: classItem.teacherId,
            schoolId: classItem.schoolId,
            status: classItem.status,
          });
        }
      }
    }

    return {
      count: unpopulatedClasses.length,
      classes: unpopulatedClasses,
    };
  },
});
