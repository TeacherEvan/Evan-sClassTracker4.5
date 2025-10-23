import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimit";

/**
 * Events and Reminders System
 * - Moderators/Admin can create universal viewable events
 * - Teachers can only create personal reminders
 * - Events appear on calendar alongside classes
 */

// Authorization helper
async function canCreateUniversalEvent(role: string): Promise<boolean> {
    return role === "moderator" || role === "admin";
}

// Validation helper
function validateEventDates(eventDate: number, endDate?: number) {
    if (eventDate < Date.now() - 86400000) { // Allow past 24h for flexibility
        throw new Error("Event date cannot be in the distant past");
    }
    if (endDate && endDate < eventDate) {
        throw new Error("End date must be after start date");
    }
}

/**
 * Create a new event or reminder
 * Teachers: can only create personal reminders
 * Mods/Admin: can create universal events with various visibility levels
 */
export const create = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        titleTh: v.string(),
        description: v.optional(v.string()),
        descriptionTh: v.optional(v.string()),
        eventDate: v.number(),
        endDate: v.optional(v.number()),
        allDay: v.boolean(),
        eventType: v.union(
            v.literal("reminder"),
            v.literal("event"),
            v.literal("holiday"),
            v.literal("meeting"),
            v.literal("deadline")
        ),
        visibility: v.union(
            v.literal("personal"),
            v.literal("school"),
            v.literal("all_teachers"),
            v.literal("all_moderators"),
            v.literal("everyone")
        ),
        schoolId: v.optional(v.id("schools")),
        reminderMinutes: v.optional(v.number()),
        location: v.optional(v.string()),
        locationTh: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Rate limiting
        await checkRateLimit(ctx, {
            key: `create-event-${args.userId}`,
            limit: 20,
            windowMs: 60000, // 20 events per minute
        });

        // Get user and validate
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const role = user.role;
        const isUniversalEvent = args.visibility !== "personal";

        // Authorization check
        if (isUniversalEvent && !await canCreateUniversalEvent(role)) {
            throw new Error("Only moderators and admins can create universal events");
        }

        // Teachers can only create personal reminders
        if (role === "teacher" && args.visibility !== "personal") {
            throw new Error("Teachers can only create personal reminders");
        }

        // Validate dates
        validateEventDates(args.eventDate, args.endDate);

        // Validate visibility-schoolId relationship
        if (args.visibility === "school" && !args.schoolId) {
            throw new Error("School-scoped events require a schoolId");
        }

        // Admins creating "everyone" events don't need schoolId
        if (args.visibility === "everyone" && role !== "admin") {
            throw new Error("Only admins can create events visible to everyone");
        }

        // For personal reminders, ensure it's the user's school
        if (args.visibility === "personal" && args.schoolId && user.schoolId !== args.schoolId) {
            throw new Error("Cannot create events for other schools");
        }

        // Set schoolId for school-scoped events
        const finalSchoolId = args.visibility === "school" || args.visibility === "personal"
            ? (args.schoolId || user.schoolId)
            : undefined;

        // Create event
        const eventId = await ctx.db.insert("events", {
            title: args.title.trim(),
            titleTh: args.titleTh.trim(),
            description: args.description?.trim(),
            descriptionTh: args.descriptionTh?.trim(),
            eventDate: args.eventDate,
            endDate: args.endDate,
            allDay: args.allDay,
            eventType: args.eventType,
            visibility: args.visibility,
            schoolId: finalSchoolId,
            createdBy: args.userId,
            createdAt: Date.now(),
            isActive: true,
            reminderMinutes: args.reminderMinutes,
            location: args.location?.trim(),
            locationTh: args.locationTh?.trim(),
        });

        return { success: true, eventId };
    },
});

/**
 * Update an existing event
 * Only creator can update (or admins for universal events)
 */
export const update = mutation({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
        title: v.optional(v.string()),
        titleTh: v.optional(v.string()),
        description: v.optional(v.string()),
        descriptionTh: v.optional(v.string()),
        eventDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        allDay: v.optional(v.boolean()),
        eventType: v.optional(v.union(
            v.literal("reminder"),
            v.literal("event"),
            v.literal("holiday"),
            v.literal("meeting"),
            v.literal("deadline")
        )),
        reminderMinutes: v.optional(v.number()),
        location: v.optional(v.string()),
        locationTh: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Rate limiting
        await checkRateLimit(ctx, {
            key: `update-event-${args.userId}`,
            limit: 30,
            windowMs: 60000,
        });

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        // Authorization: only creator or admin can update
        if (event.createdBy !== args.userId && user.role !== "admin") {
            throw new Error("You can only update your own events");
        }

        // Validate dates if provided
        if (args.eventDate) {
            validateEventDates(args.eventDate, args.endDate || event.endDate);
        }

        // Build update object
        const updates: Partial<{
            title: string;
            titleTh: string;
            description: string;
            descriptionTh: string;
            eventDate: number;
            endDate: number;
            allDay: boolean;
            eventType: "reminder" | "event" | "holiday" | "meeting" | "deadline";
            reminderMinutes: number;
            location: string;
            locationTh: string;
        }> = {};
        if (args.title !== undefined) updates.title = args.title.trim();
        if (args.titleTh !== undefined) updates.titleTh = args.titleTh.trim();
        if (args.description !== undefined) updates.description = args.description.trim();
        if (args.descriptionTh !== undefined) updates.descriptionTh = args.descriptionTh.trim();
        if (args.eventDate !== undefined) updates.eventDate = args.eventDate;
        if (args.endDate !== undefined) updates.endDate = args.endDate;
        if (args.allDay !== undefined) updates.allDay = args.allDay;
        if (args.eventType !== undefined) updates.eventType = args.eventType;
        if (args.reminderMinutes !== undefined) updates.reminderMinutes = args.reminderMinutes;
        if (args.location !== undefined) updates.location = args.location.trim();
        if (args.locationTh !== undefined) updates.locationTh = args.locationTh.trim();

        await ctx.db.patch(args.eventId, updates);

        return { success: true };
    },
});

/**
 * Delete (soft delete) an event
 * Only creator or admin can delete
 */
export const remove = mutation({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        // Authorization: only creator or admin can delete
        if (event.createdBy !== args.userId && user.role !== "admin") {
            throw new Error("You can only delete your own events");
        }

        await ctx.db.patch(args.eventId, { isActive: false });

        return { success: true };
    },
});

/**
 * Get events for a specific date range
 * Filters based on user permissions and visibility
 */
export const listByDateRange = query({
    args: {
        userId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Get all active events in date range
        const allEvents = await ctx.db
            .query("events")
            .withIndex("by_date", (q) =>
                q.gte("eventDate", args.startDate).lte("eventDate", args.endDate)
            )
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Filter based on visibility and user permissions
        const visibleEvents = allEvents.filter((event) => {
            // Personal events: only visible to creator
            if (event.visibility === "personal") {
                return event.createdBy === args.userId;
            }

            // School events: visible to users in the same school
            if (event.visibility === "school") {
                return event.schoolId === user.schoolId;
            }

            // Role-specific visibility
            if (event.visibility === "all_teachers") {
                return user.role === "teacher" || user.role === "moderator" || user.role === "admin";
            }

            if (event.visibility === "all_moderators") {
                return user.role === "moderator" || user.role === "admin";
            }

            // Everyone events: visible to all
            if (event.visibility === "everyone") {
                return true;
            }

            return false;
        });

        // Enrich with creator info
        const enrichedEvents = await Promise.all(
            visibleEvents.map(async (event) => {
                const creator = await ctx.db.get(event.createdBy);
                return {
                    ...event,
                    creatorName: creator?.username || "Unknown",
                };
            })
        );

        return enrichedEvents;
    },
});

/**
 * Get all events created by a specific user
 */
export const listByUser = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        return events;
    },
});

/**
 * Get events for a specific school
 * Admin/moderator only
 */
export const listBySchool = query({
    args: {
        userId: v.id("users"),
        schoolId: v.id("schools"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Only admin/moderators can list all school events
        if (user.role !== "admin" && user.role !== "moderator") {
            throw new Error("Unauthorized");
        }

        const events = await ctx.db
            .query("events")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Enrich with creator info
        const enrichedEvents = await Promise.all(
            events.map(async (event) => {
                const creator = await ctx.db.get(event.createdBy);
                return {
                    ...event,
                    creatorName: creator?.username || "Unknown",
                };
            })
        );

        return enrichedEvents;
    },
});

/**
 * Get a single event by ID
 * Checks visibility permissions
 */
export const getById = query({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event || !event.isActive) {
            throw new Error("Event not found");
        }

        // Check visibility permissions
        let hasAccess = false;

        if (event.visibility === "personal") {
            hasAccess = event.createdBy === args.userId;
        } else if (event.visibility === "school") {
            hasAccess = event.schoolId === user.schoolId;
        } else if (event.visibility === "all_teachers") {
            hasAccess = ["teacher", "moderator", "admin"].includes(user.role);
        } else if (event.visibility === "all_moderators") {
            hasAccess = ["moderator", "admin"].includes(user.role);
        } else if (event.visibility === "everyone") {
            hasAccess = true;
        }

        if (!hasAccess && user.role !== "admin") {
            throw new Error("You don't have permission to view this event");
        }

        const creator = await ctx.db.get(event.createdBy);

        return {
            ...event,
            creatorName: creator?.username || "Unknown",
        };
    },
});
