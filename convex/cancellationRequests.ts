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

// Mutation to create a cancellation or postponement request
export const create = mutation({
    args: {
        classId: v.id("classes"),
        teacherId: v.id("users"),
        requestType: v.union(v.literal("cancel"), v.literal("postpone")),
        reason: v.string(),
        reasonTh: v.string(),
        newScheduledDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Check if class exists
        const classData = await ctx.db.get(args.classId);
        if (!classData) {
            throw new Error("Class not found");
        }

        // Validate postponement requires new date
        if (args.requestType === "postpone") {
            if (!args.newScheduledDate) {
                throw new Error("New scheduled date is required for postponement");
            }
            if (args.newScheduledDate < Date.now()) {
                throw new Error("New scheduled date must be in the future");
            }
            if (args.newScheduledDate === classData.scheduledDate) {
                throw new Error("New date must be different from current date");
            }
        }

        // Check if there's already a pending request for this class
        const existingRequest = await ctx.db
            .query("cancellationRequests")
            .withIndex("by_class_and_status", (q) => 
                q.eq("classId", args.classId).eq("status", "pending")
            )
            .first();

        if (existingRequest) {
            const requestTypeText = existingRequest.requestType === "cancel" 
                ? "cancellation" 
                : "postponement";
            throw new Error(`A ${requestTypeText} request for this class is already pending`);
        }

        // Only allow cancellation/postponement of approved classes
        if (classData.status !== "approved") {
            throw new Error("Only approved classes can be cancelled or postponed");
        }

        // Prevent action on past classes
        if (classData.scheduledDate < Date.now()) {
            throw new Error("Cannot cancel or postpone classes that have already passed");
        }

        // Create the cancellation/postponement request
        const requestId = await ctx.db.insert("cancellationRequests", {
            classId: args.classId,
            teacherId: args.teacherId,
            schoolId: classData.schoolId,
            requestType: args.requestType,
            reason: args.reason,
            reasonTh: args.reasonTh,
            newScheduledDate: args.newScheduledDate,
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
            
            const isPostpone = args.requestType === "postpone";
            const newDateText = args.newScheduledDate 
                ? new Date(args.newScheduledDate).toLocaleDateString("en-US")
                : "";
            const newDateTextTh = args.newScheduledDate 
                ? new Date(args.newScheduledDate).toLocaleDateString("th-TH")
                : "";

            await ctx.db.insert("notifications", {
                title: isPostpone ? `Class Postponement Request` : `Class Cancellation Request`,
                titleTh: isPostpone ? `คำขอเลื่อนชั้นเรียน` : `คำขอยกเลิกชั้นเรียน`,
                message: isPostpone 
                    ? `Teacher ${teacher?.username || "Unknown"} has requested to postpone the class for ${student.firstName} ${student.lastName} at ${locationText} to ${newDateText}. Reason: ${args.reason}`
                    : `Teacher ${teacher?.username || "Unknown"} has requested to cancel the class for ${student.firstName} ${student.lastName} at ${locationText}. Reason: ${args.reason}`,
                messageTh: isPostpone
                    ? `ครู ${teacher?.username || "ไม่ทราบ"} ได้ขอเลื่อนชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ไปวันที่ ${newDateTextTh} เหตุผล: ${args.reasonTh}`
                    : `ครู ${teacher?.username || "ไม่ทราบ"} ได้ขอยกเลิกชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} เหตุผล: ${args.reasonTh}`,
                type: "warning",
                userId: school.moderatorId,
                read: false,
                createdAt: Date.now(),
            });
        }

        // Log the action
        const isPostpone = args.requestType === "postpone";
        const newDateForLog = args.newScheduledDate 
            ? new Date(args.newScheduledDate).toLocaleDateString("en-US")
            : "";
        const newDateForLogTh = args.newScheduledDate 
            ? new Date(args.newScheduledDate).toLocaleDateString("th-TH")
            : "";

        await ctx.db.insert("teacherLogs", {
            teacherId: args.teacherId,
            schoolId: classData.schoolId,
            action: isPostpone ? "postponement_requested" : "cancellation_requested",
            actionTh: isPostpone ? "ขอเลื่อนชั้นเรียน" : "ขอยกเลิกชั้นเรียน",
            details: isPostpone
                ? `Requested postponement for class with ${student?.firstName} ${student?.lastName} at ${location?.name} to ${newDateForLog}. Reason: ${args.reason}`
                : `Requested cancellation for class with ${student?.firstName} ${student?.lastName} at ${location?.name}. Reason: ${args.reason}`,
            detailsTh: isPostpone
                ? `ขอเลื่อนชั้นเรียนกับ ${student?.firstName} ${student?.lastName} ที่ ${location?.nameTh} ไปวันที่ ${newDateForLogTh} เหตุผล: ${args.reasonTh}`
                : `ขอยกเลิกชั้นเรียนกับ ${student?.firstName} ${student?.lastName} ที่ ${location?.nameTh} เหตุผล: ${args.reasonTh}`,
            relatedClassId: args.classId,
            relatedStudentId: classData.studentId,
            createdAt: Date.now(),
        });

        return requestId;
    },
});

// Mutation to approve a cancellation or postponement request
export const approve = mutation({
    args: {
        requestId: v.id("cancellationRequests"),
        moderatorId: v.id("users"),
        reviewNotes: v.optional(v.string()),
        reviewNotesTh: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Request not found");
        }

        if (request.status !== "pending") {
            throw new Error("This request has already been resolved");
        }

        // Update the request
        await ctx.db.patch(args.requestId, {
            status: "approved",
            resolvedAt: Date.now(),
            resolvedBy: args.moderatorId,
            reviewNotes: args.reviewNotes,
            reviewNotesTh: args.reviewNotesTh,
        });

        // Handle based on request type
        if (request.requestType === "cancel") {
            // Update the class status to cancelled (rejected)
            await ctx.db.patch(request.classId, {
                status: "rejected",
            });
        } else if (request.requestType === "postpone" && request.newScheduledDate) {
            // Update the class scheduled date
            await ctx.db.patch(request.classId, {
                scheduledDate: request.newScheduledDate,
            });
        }

        // Get class details for notification
        const classData = await ctx.db.get(request.classId);
        const student = classData ? await ctx.db.get(classData.studentId) : null;
        const location = classData?.locationId ? await ctx.db.get(classData.locationId) : null;

        // Notify the teacher
        if (student) {
            const locationText = location?.name || classData?.pendingLocationName || "Unknown location";
            const locationTextTh = location?.nameTh || classData?.pendingLocationNameTh || "ไม่ทราบสถานที่";
            const isPostpone = request.requestType === "postpone";
            const newDateText = request.newScheduledDate 
                ? new Date(request.newScheduledDate).toLocaleDateString("en-US")
                : "";
            const newDateTextTh = request.newScheduledDate 
                ? new Date(request.newScheduledDate).toLocaleDateString("th-TH")
                : "";

            const reviewNotesText = args.reviewNotes ? ` Notes: ${args.reviewNotes}` : "";
            const reviewNotesTextTh = args.reviewNotesTh ? ` หมายเหตุ: ${args.reviewNotesTh}` : "";

            await ctx.db.insert("notifications", {
                title: isPostpone ? `Postponement Approved` : `Cancellation Approved`,
                titleTh: isPostpone ? `อนุมัติการเลื่อน` : `อนุมัติการยกเลิก`,
                message: isPostpone
                    ? `Your postponement request for the class with ${student.firstName} ${student.lastName} at ${locationText} has been approved. New date: ${newDateText}.${reviewNotesText}`
                    : `Your cancellation request for the class with ${student.firstName} ${student.lastName} at ${locationText} has been approved.${reviewNotesText}`,
                messageTh: isPostpone
                    ? `คำขอเลื่อนชั้นเรียนของคุณกับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ได้รับการอนุมัติแล้ว วันที่ใหม่: ${newDateTextTh}${reviewNotesTextTh}`
                    : `คำขอยกเลิกชั้นเรียนของคุณกับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ได้รับการอนุมัติแล้ว${reviewNotesTextTh}`,
                type: "success",
                userId: request.teacherId,
                read: false,
                createdAt: Date.now(),
            });
        }

        // Log the action
        if (classData) {
            const isPostpone = request.requestType === "postpone";
            const newDateForLog = request.newScheduledDate 
                ? new Date(request.newScheduledDate).toLocaleDateString("en-US")
                : "";
            const newDateForLogTh = request.newScheduledDate 
                ? new Date(request.newScheduledDate).toLocaleDateString("th-TH")
                : "";

            await ctx.db.insert("teacherLogs", {
                teacherId: request.teacherId,
                schoolId: request.schoolId,
                action: isPostpone ? "class_postponed" : "class_cancelled",
                actionTh: isPostpone ? "เลื่อนชั้นเรียน" : "ยกเลิกชั้นเรียน",
                details: isPostpone
                    ? `Class postponement approved for ${student?.firstName} ${student?.lastName} at ${location?.name} to ${newDateForLog}`
                    : `Class cancellation approved for ${student?.firstName} ${student?.lastName} at ${location?.name}`,
                detailsTh: isPostpone
                    ? `อนุมัติการเลื่อนชั้นเรียนกับ ${student?.firstName} ${student?.lastName} ที่ ${location?.nameTh} ไปวันที่ ${newDateForLogTh}`
                    : `อนุมัติการยกเลิกชั้นเรียนกับ ${student?.firstName} ${student?.lastName} ที่ ${location?.nameTh}`,
                relatedClassId: request.classId,
                relatedStudentId: classData.studentId,
                createdAt: Date.now(),
            });
        }

        return { success: true };
    },
});

// Mutation to reject a cancellation or postponement request
export const reject = mutation({
    args: {
        requestId: v.id("cancellationRequests"),
        moderatorId: v.id("users"),
        reviewNotes: v.optional(v.string()),
        reviewNotesTh: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Request not found");
        }

        if (request.status !== "pending") {
            throw new Error("This request has already been resolved");
        }

        // Update the request
        await ctx.db.patch(args.requestId, {
            status: "rejected",
            resolvedAt: Date.now(),
            resolvedBy: args.moderatorId,
            reviewNotes: args.reviewNotes,
            reviewNotesTh: args.reviewNotesTh,
        });

        // Get class details for notification
        const classData = await ctx.db.get(request.classId);
        const student = classData ? await ctx.db.get(classData.studentId) : null;
        const location = classData?.locationId ? await ctx.db.get(classData.locationId) : null;

        // Notify the teacher
        if (student) {
            const locationText = location?.name || classData?.pendingLocationName || "Unknown location";
            const locationTextTh = location?.nameTh || classData?.pendingLocationNameTh || "ไม่ทราบสถานที่";
            const isPostpone = request.requestType === "postpone";

            const reviewNotesText = args.reviewNotes ? ` Reason: ${args.reviewNotes}` : "";
            const reviewNotesTextTh = args.reviewNotesTh ? ` เหตุผล: ${args.reviewNotesTh}` : "";

            await ctx.db.insert("notifications", {
                title: isPostpone ? `Postponement Rejected` : `Cancellation Rejected`,
                titleTh: isPostpone ? `ปฏิเสธการเลื่อน` : `ปฏิเสธการยกเลิก`,
                message: isPostpone
                    ? `Your postponement request for the class with ${student.firstName} ${student.lastName} at ${locationText} has been rejected. The class will proceed at the original date.${reviewNotesText}`
                    : `Your cancellation request for the class with ${student.firstName} ${student.lastName} at ${locationText} has been rejected. The class will proceed as scheduled.${reviewNotesText}`,
                messageTh: isPostpone
                    ? `คำขอเลื่อนชั้นเรียนของคุณกับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ถูกปฏิเสธ ชั้นเรียนจะดำเนินการตามวันที่เดิม${reviewNotesTextTh}`
                    : `คำขอยกเลิกชั้นเรียนของคุณกับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ถูกปฏิเสธ ชั้นเรียนจะดำเนินการตามกำหนด${reviewNotesTextTh}`,
                type: "error",
                userId: request.teacherId,
                read: false,
                createdAt: Date.now(),
            });
        }

        return { success: true };
    },
});
