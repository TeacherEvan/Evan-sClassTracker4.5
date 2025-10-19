import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list cancellation requests
export const list = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        status: v.optional(
            v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
        ),
    },
    handler: async (ctx, args) => {
        const query = ctx.db.query("cancellationRequests");

        if (args.teacherId) {
            return await query
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .order("desc")
                .collect();
        }

        if (args.schoolId) {
            const requests = await query
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .collect();

            if (args.status) {
                return requests.filter((req) => req.status === args.status);
            }
            return requests;
        }

        if (args.status) {
            return await query
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .collect();
        }

        return await query.order("desc").collect();
    },
});

// Query to get cancellation request by ID
export const getById = query({
    args: {
        id: v.id("cancellationRequests"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Query to check if a class has a pending cancellation request
export const hasPendingRequest = query({
    args: {
        classId: v.id("classes"),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db
            .query("cancellationRequests")
            .withIndex("by_class", (q) => q.eq("classId", args.classId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        return request !== null;
    },
});

// Mutation to create a cancellation request
export const create = mutation({
    args: {
        classId: v.id("classes"),
        teacherId: v.id("users"),
        reason: v.string(),
        reasonTh: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if class exists
        const classData = await ctx.db.get(args.classId);
        if (!classData) {
            throw new Error("Class not found");
        }

        // Check if there's already a pending cancellation request for this class
        const existingRequest = await ctx.db
            .query("cancellationRequests")
            .withIndex("by_class", (q) => q.eq("classId", args.classId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (existingRequest) {
            throw new Error("A cancellation request for this class is already pending");
        }

        // Only allow cancellation of approved classes
        if (classData.status !== "approved") {
            throw new Error("Only approved classes can be cancelled");
        }

        // Create the cancellation request
        const requestId = await ctx.db.insert("cancellationRequests", {
            classId: args.classId,
            teacherId: args.teacherId,
            schoolId: classData.schoolId,
            reason: args.reason,
            reasonTh: args.reasonTh,
            status: "pending",
            createdAt: Date.now(),
        });

        // Get school to find moderator
        const school = await ctx.db.get(classData.schoolId);

        // Get student and location for notification
        const student = await ctx.db.get(classData.studentId);
        const location = classData.locationId ? await ctx.db.get(classData.locationId) : null;
        const teacher = await ctx.db.get(args.teacherId);

        // Create notification for moderator
        if (school && school.moderatorId && student) {
            const locationText = location?.name || classData.pendingLocationName || "Unknown location";
            const locationTextTh = location?.nameTh || classData.pendingLocationNameTh || "ไม่ทราบสถานที่";

            await ctx.db.insert("notifications", {
                title: `Class Cancellation Request`,
                titleTh: `คำขอยกเลิกชั้นเรียน`,
                message: `Teacher ${teacher?.username || "Unknown"} has requested to cancel the class for ${student.firstName} ${student.lastName} at ${locationText}. Reason: ${args.reason}`,
                messageTh: `ครู ${teacher?.username || "ไม่ทราบ"} ได้ขอยกเลิกชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} เหตุผล: ${args.reasonTh}`,
                type: "warning",
                userId: school.moderatorId,
                read: false,
                createdAt: Date.now(),
            });
        }

        // Log the action
        await ctx.db.insert("teacherLogs", {
            teacherId: args.teacherId,
            schoolId: classData.schoolId,
            action: "cancellation_requested",
            actionTh: "ขอยกเลิกชั้นเรียน",
            details: `Requested cancellation for class with ${student?.firstName} ${student?.lastName} at ${location?.name}. Reason: ${args.reason}`,
            detailsTh: `ขอยกเลิกชั้นเรียนกับ ${student?.firstName} ${student?.lastName} ที่ ${location?.nameTh} เหตุผล: ${args.reasonTh}`,
            relatedClassId: args.classId,
            relatedStudentId: classData.studentId,
            createdAt: Date.now(),
        });

        return requestId;
    },
});

// Mutation to approve a cancellation request
export const approve = mutation({
    args: {
        requestId: v.id("cancellationRequests"),
        moderatorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Cancellation request not found");
        }

        if (request.status !== "pending") {
            throw new Error("This request has already been resolved");
        }

        // Update the cancellation request
        await ctx.db.patch(args.requestId, {
            status: "approved",
            resolvedAt: Date.now(),
            resolvedBy: args.moderatorId,
        });

        // Update the class status to cancelled (rejected)
        await ctx.db.patch(request.classId, {
            status: "rejected",
        });

        // Get class details for notification
        const classData = await ctx.db.get(request.classId);
        const student = classData ? await ctx.db.get(classData.studentId) : null;
        const location = classData?.locationId ? await ctx.db.get(classData.locationId) : null;

        // Notify the teacher
        if (student) {
            const locationText = location?.name || classData?.pendingLocationName || "Unknown location";
            const locationTextTh = location?.nameTh || classData?.pendingLocationNameTh || "ไม่ทราบสถานที่";

            await ctx.db.insert("notifications", {
                title: `Cancellation Approved`,
                titleTh: `อนุมัติการยกเลิก`,
                message: `Your cancellation request for the class with ${student.firstName} ${student.lastName} at ${locationText} has been approved.`,
                messageTh: `คำขอยกเลิกชั้นเรียนของคุณกับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ได้รับการอนุมัติแล้ว`,
                type: "success",
                userId: request.teacherId,
                read: false,
                createdAt: Date.now(),
            });
        }

        // Log the action
        if (classData) {
            await ctx.db.insert("teacherLogs", {
                teacherId: request.teacherId,
                schoolId: request.schoolId,
                action: "class_cancelled",
                actionTh: "ยกเลิกชั้นเรียน",
                details: `Class cancellation approved for ${student?.firstName} ${student?.lastName} at ${location?.name}`,
                detailsTh: `อนุมัติการยกเลิกชั้นเรียนกับ ${student?.firstName} ${student?.lastName} ที่ ${location?.nameTh}`,
                relatedClassId: request.classId,
                relatedStudentId: classData.studentId,
                createdAt: Date.now(),
            });
        }

        return { success: true };
    },
});

// Mutation to reject a cancellation request
export const reject = mutation({
    args: {
        requestId: v.id("cancellationRequests"),
        moderatorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Cancellation request not found");
        }

        if (request.status !== "pending") {
            throw new Error("This request has already been resolved");
        }

        // Update the cancellation request
        await ctx.db.patch(args.requestId, {
            status: "rejected",
            resolvedAt: Date.now(),
            resolvedBy: args.moderatorId,
        });

        // Get class details for notification
        const classData = await ctx.db.get(request.classId);
        const student = classData ? await ctx.db.get(classData.studentId) : null;
        const location = classData?.locationId ? await ctx.db.get(classData.locationId) : null;

        // Notify the teacher
        if (student) {
            const locationText = location?.name || classData?.pendingLocationName || "Unknown location";
            const locationTextTh = location?.nameTh || classData?.pendingLocationNameTh || "ไม่ทราบสถานที่";

            await ctx.db.insert("notifications", {
                title: `Cancellation Rejected`,
                titleTh: `ปฏิเสธการยกเลิก`,
                message: `Your cancellation request for the class with ${student.firstName} ${student.lastName} at ${locationText} has been rejected. The class will proceed as scheduled.`,
                messageTh: `คำขอยกเลิกชั้นเรียนของคุณกับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ถูกปฏิเสธ ชั้นเรียนจะดำเนินการตามกำหนด`,
                type: "error",
                userId: request.teacherId,
                read: false,
                createdAt: Date.now(),
            });
        }

        return { success: true };
    },
});
