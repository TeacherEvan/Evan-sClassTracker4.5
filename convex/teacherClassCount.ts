import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Calculate teacher's total weighted class count
 * 
 * UPDATED: Only counts classes that have post-class notes recorded
 * (even if skipped). This ensures the counter only increments when
 * the post-class feedback window is shown, regardless of whether
 * the teacher answered it or not.
 * 
 * Formula: For each approved class WITH post-class notes:
 *   studentCount × (duration / 60) = class count
 * 
 * Examples:
 *   - 1 student + 60min = 1 class
 *   - 6 students + 90min = 6 × 1.5 = 9 classes
 *   - 2 students + 120min = 2 × 2 = 4 classes
 * 
 * Updates reactively when post-class notes are submitted
 */
export const getTeacherClassCount = query({
    args: {
        teacherId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Get all post-class notes for this teacher
        const postClassNotes = await ctx.db
            .query("postClassNotes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .collect();

        // Get unique class IDs that have notes
        const classIdsWithNotes = new Set(postClassNotes.map((note) => note.classId));

        // Use indexed query for performance
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .filter((q) => q.eq(q.field("status"), "approved")) // Only count approved classes
            .collect();

        // Filter classes to only those with post-class notes
        const classesWithNotes = classes.filter((cls) => classIdsWithNotes.has(cls._id));

        // Calculate weighted class count
        let totalClassCount = 0;

        for (const classItem of classesWithNotes) {
            // Student count: primary student + additional students
            const studentCount = 1 + (classItem.additionalStudentIds?.length || 0);

            // Duration in minutes (default 60 if not specified)
            const durationMinutes = classItem.duration || 60;

            // Weighted calculation: students × (duration / 60)
            const classCount = studentCount * (durationMinutes / 60);

            totalClassCount += classCount;
        }

        // Round to 1 decimal place for display
        const roundedTotal = Math.round(totalClassCount * 10) / 10;

        return {
            total: roundedTotal,
            rawTotal: totalClassCount,
            approvedClassesCount: classes.length,
            countedClassesCount: classesWithNotes.length, // Classes that were actually counted
        };
    },
});

/**
 * Get teacher's class count with date range filter (Moderator-only)
 * Includes detailed breakdown by student
 */
export const getTeacherClassCountDetailed = query({
    args: {
        teacherId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
        moderatorId: v.id("users"), // For authorization
    },
    handler: async (ctx, args) => {
        // Verify moderator authorization
        const moderator = await ctx.db.get(args.moderatorId);
        if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
            throw new Error("Unauthorized: Only moderators and admins can view detailed class counts");
        }

        // Get teacher details
        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // For moderators, verify they're viewing their school's teacher
        if (moderator.role === "moderator") {
            const teacherClasses = await ctx.db
                .query("classes")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
                .first();

            if (teacherClasses && teacherClasses.schoolId !== moderator.schoolId) {
                throw new Error("Unauthorized: Moderators can only view teachers from their assigned school");
            }
        }

        // Get classes in date range
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_teacher_and_date", (q) =>
                q.eq("teacherId", args.teacherId)
                    .gte("scheduledDate", args.startDate)
                    .lte("scheduledDate", args.endDate)
            )
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        // Only include classes that have a post-class notes record (including skipped)
        const allNotesForTeacher = await ctx.db
            .query("postClassNotes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .collect();

        const classIdsWithNotes = new Set(allNotesForTeacher.map(n => n.classId));

        // Filter classes to those with notes
        const classesFiltered = classes.filter(c => classIdsWithNotes.has(c._id));

        // Check for active cycle for this teacher
        const activeCycle = await ctx.db
            .query("teacherClassCountCycles")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .first();

        // Batch fetch all students to avoid N+1 (only for classes that were counted)
        const studentIds = new Set<string>();
        classesFiltered.forEach(cls => {
            studentIds.add(cls.studentId);
            cls.additionalStudentIds?.forEach(id => studentIds.add(id));
        });

        const students = await Promise.all(
            Array.from(studentIds).map(id => ctx.db.get(id as Id<"students">))
        );
        const studentMap = new Map(
            students.filter(s => s !== null).map(s => [s!._id, s])
        );

        // Group classes by student and calculate counts
        const studentBreakdown: Record<Id<"students">, {
            studentId: Id<"students">;
            studentName: string;
            studentNameTh: string;
            classCount: number;
            numberOfClasses: number;
            classes: Array<{
                classId: Id<"classes">;
                scheduledDate: number;
                duration: number;
                studentCount: number;
                contributedCount: number;
                location?: string;
                locationTh?: string;
            }>;
        }> = {};

        for (const classItem of classesFiltered) {
            const studentCount = 1 + (classItem.additionalStudentIds?.length || 0);
            const durationMinutes = classItem.duration || 60;

            // Process primary student
            const processStudent = (studentId: Id<"students">) => {
                const student = studentMap.get(studentId);
                if (!student) return;

                if (!studentBreakdown[studentId]) {
                    studentBreakdown[studentId] = {
                        studentId,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentNameTh: `${student.firstName} ${student.lastName}`, // Schema doesn't have Thai name fields
                        classCount: 0,
                        numberOfClasses: 0,
                        classes: [],
                    };
                }

                const perStudentCount = (durationMinutes / 60);
                studentBreakdown[studentId].classCount += perStudentCount;
                studentBreakdown[studentId].numberOfClasses++;
                studentBreakdown[studentId].classes.push({
                    classId: classItem._id,
                    scheduledDate: classItem.scheduledDate,
                    duration: durationMinutes,
                    studentCount,
                    contributedCount: perStudentCount,
                    location: classItem.pendingLocationName,
                    locationTh: classItem.pendingLocationNameTh,
                });
            };

            processStudent(classItem.studentId);
            classItem.additionalStudentIds?.forEach(id => processStudent(id));
        }

        // Convert to sorted array
        const breakdown = Object.values(studentBreakdown)
            .sort((a, b) => b.classCount - a.classCount)
            .map(item => ({
                ...item,
                classCount: Math.round(item.classCount * 10) / 10,
            }));

        const totalClassCount = breakdown.reduce((sum, item) => sum + item.classCount, 0);

        return {
            teacher: {
                id: teacher._id,
                username: teacher.username,
                role: teacher.role,
            },
            dateRange: {
                start: args.startDate,
                end: args.endDate,
            },
            cycleInfo: {
                startDate: args.startDate,
                endDate: args.endDate,
                isCustomCycle: !!activeCycle,
                notes: activeCycle?.notes,
                notesTh: activeCycle?.notesTh,
            },
            summary: {
                totalClassCount: Math.round(totalClassCount * 10) / 10,
                totalApprovedClasses: classesFiltered.length,
                totalStudents: breakdown.length,
            },
            studentBreakdown: breakdown,
        };
    },
});

/**
 * Get teacher's ClassCount for CURRENT cycle with full details
 * Teachers can view their own data - shows which classes were counted
 */
export const getMyClassCountDetails = query({
    args: {
        teacherId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Get teacher
        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // Get active cycle for this teacher
        const activeCycle = await ctx.db
            .query("teacherClassCountCycles")
            .withIndex("by_teacher_and_active", (q) =>
                q.eq("teacherId", args.teacherId).eq("isActive", true)
            )
            .first();

        // If no active cycle, use current month as default
        const now = Date.now();
        const currentMonth = new Date(now);
        const defaultStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
        const defaultEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

        const startDate = activeCycle?.cycleStartDate || defaultStart;
        const endDate = activeCycle?.cycleEndDate || defaultEnd;

        // Get classes in date range
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_teacher_and_date", (q) =>
                q.eq("teacherId", args.teacherId)
                    .gte("scheduledDate", startDate)
                    .lte("scheduledDate", endDate)
            )
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        // Only count classes where a post-class note record exists (including skipped)
        const allNotesForTeacher = await ctx.db
            .query("postClassNotes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .collect();

        const classIdsWithNotes = new Set(allNotesForTeacher.map(n => n.classId));
        const classesFiltered = classes.filter(c => classIdsWithNotes.has(c._id));

        // Batch fetch students, schools, providers, and locations
        const studentIds = new Set<Id<"students">>();
        const schoolIds = new Set<Id<"schools">>();
        const providerIds = new Set<Id<"providers">>(); // NEW: Provider IDs
        const locationIds = new Set<Id<"locations">>();

        classesFiltered.forEach(cls => {
            studentIds.add(cls.studentId);
            if (cls.schoolId) schoolIds.add(cls.schoolId); // Only add if exists
            if (cls.providerId) providerIds.add(cls.providerId); // NEW: Collect provider IDs
            if (cls.locationId) locationIds.add(cls.locationId);
            cls.additionalStudentIds?.forEach(id => studentIds.add(id));
        });

        const [students, schools, providers, locations] = await Promise.all([
            Promise.all(Array.from(studentIds).map(id => ctx.db.get(id))),
            Promise.all(Array.from(schoolIds).map(id => ctx.db.get(id))),
            Promise.all(Array.from(providerIds).map(id => ctx.db.get(id))), // NEW: Fetch providers
            Promise.all(Array.from(locationIds).map(id => ctx.db.get(id))),
        ]);

        const studentMap = new Map(students.filter(s => s !== null).map(s => [s!._id, s]));
        const schoolMap = new Map(schools.filter(s => s !== null).map(s => [s!._id, s]));
        const providerMap = new Map(providers.filter(p => p !== null).map(p => [p!._id, p])); // NEW: Provider map
        const locationMap = new Map(locations.filter(l => l !== null).map(l => [l!._id, l]));

        // Calculate total and build class details (only for classes that were counted)
        let totalClassCount = 0;
        const classDetails = classesFiltered.map(cls => {
            const studentCount = 1 + (cls.additionalStudentIds?.length || 0);
            const durationMinutes = cls.duration || 60;
            const classCount = studentCount * (durationMinutes / 60);
            totalClassCount += classCount;

            const primaryStudent = studentMap.get(cls.studentId);
            const school = cls.schoolId ? schoolMap.get(cls.schoolId) : null; // NEW: Conditional school lookup
            const provider = cls.providerId ? providerMap.get(cls.providerId) : null; // NEW: Provider lookup
            const location = cls.locationId ? locationMap.get(cls.locationId) : null;

            return {
                classId: cls._id,
                scheduledDate: cls.scheduledDate,
                duration: durationMinutes,
                studentCount,
                classCount: Math.round(classCount * 10) / 10,
                primaryStudentName: primaryStudent
                    ? `${primaryStudent.firstName} ${primaryStudent.lastName}`
                    : "Unknown",
                schoolName: school?.name || (provider?.name) || "Unknown", // NEW: Fallback to provider
                schoolNameTh: school?.nameTh || (provider?.nameTh) || "ไม่ทราบ", // NEW: Fallback to provider
                providerName: provider?.name, // NEW: Provider name
                providerNameTh: provider?.nameTh, // NEW: Provider name (Thai)
                providerId: cls.providerId, // NEW: Provider ID for filtering
                locationName: location?.name || cls.pendingLocationName || "Not specified",
                locationNameTh: location?.nameTh || cls.pendingLocationNameTh || "ไม่ระบุ",
                acknowledgedBy: cls.status === "approved" ? "Moderator" : "System",
                acknowledgedAt: cls.createdAt,
            };
        });

        return {
            cycleInfo: {
                startDate,
                endDate,
                isCustomCycle: !!activeCycle,
                notes: activeCycle?.notes,
                notesTh: activeCycle?.notesTh,
            },
            summary: {
                totalClassCount: Math.round(totalClassCount * 10) / 10,
                totalClasses: classesFiltered.length,
            },
            classes: classDetails,
        };
    },
});

/**
 * Check for existing active cycles before setting a new one
 * Returns info about existing cycle for confirmation
 */
export const checkExistingCycle = query({
    args: {
        teacherId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existingCycle = await ctx.db
            .query("teacherClassCountCycles")
            .withIndex("by_teacher_and_active", (q) =>
                q.eq("teacherId", args.teacherId).eq("isActive", true)
            )
            .first();

        if (!existingCycle) {
            return null;
        }

        return {
            _id: existingCycle._id,
            startDate: existingCycle.cycleStartDate,
            endDate: existingCycle.cycleEndDate,
            notes: existingCycle.notes,
            notesTh: existingCycle.notesTh,
            createdAt: existingCycle.createdAt,
        };
    },
});

/**
 * Moderator sets custom cycle dates for a teacher
 * Deactivates previous cycles and creates new active cycle
 */
export const setTeacherCycle = mutation({
    args: {
        teacherId: v.id("users"),
        cycleStartDate: v.number(),
        cycleEndDate: v.number(),
        notes: v.optional(v.string()),
        notesTh: v.optional(v.string()),
        moderatorId: v.id("users"),
        confirmed: v.optional(v.boolean()), // For confirming override of existing cycle
    },
    handler: async (ctx, args) => {
        // Verify moderator authorization
        const moderator = await ctx.db.get(args.moderatorId);
        if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
            throw new Error("Unauthorized: Only moderators can set cycle dates");
        }

        // Get teacher
        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // Verify moderator school access (moderators can only manage their school)
        if (moderator.role === "moderator" && teacher.schoolId !== moderator.schoolId) {
            throw new Error("Unauthorized: Moderators can only manage teachers from their school");
        }

        // Validate dates
        if (args.cycleStartDate >= args.cycleEndDate) {
            throw new Error("Cycle start date must be before end date");
        }

        // Check for existing active cycles
        const existingCycles = await ctx.db
            .query("teacherClassCountCycles")
            .withIndex("by_teacher_and_active", (q) =>
                q.eq("teacherId", args.teacherId).eq("isActive", true)
            )
            .collect();

        // If there's an existing cycle and not confirmed, return warning
        if (existingCycles.length > 0 && !args.confirmed) {
            const existingCycle = existingCycles[0];
            return {
                requiresConfirmation: true,
                existingCycle: {
                    startDate: existingCycle.cycleStartDate,
                    endDate: existingCycle.cycleEndDate,
                    notes: existingCycle.notes,
                    notesTh: existingCycle.notesTh,
                },
                message: "An active cycle already exists. Proceeding will replace it.",
            };
        }

        // Deactivate existing active cycles
        for (const cycle of existingCycles) {
            await ctx.db.patch(cycle._id, { isActive: false });
        }

        // Create new active cycle
        const cycleId = await ctx.db.insert("teacherClassCountCycles", {
            teacherId: args.teacherId,
            schoolId: teacher.schoolId!,
            cycleStartDate: args.cycleStartDate,
            cycleEndDate: args.cycleEndDate,
            notes: args.notes,
            notesTh: args.notesTh,
            createdBy: args.moderatorId,
            createdAt: Date.now(),
            isActive: true,
        });

        // Send notification to teacher
        const startDateStr = new Date(args.cycleStartDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDateStr = new Date(args.cycleEndDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const startDateStrTh = new Date(args.cycleStartDate).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDateStrTh = new Date(args.cycleEndDate).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        await ctx.db.insert("notifications", {
            title: "ClassCount Cycle Updated",
            titleTh: "อัปเดตรอบการนับชั้นเรียน",
            message: `Your ClassCount tracking period has been updated by ${moderator.username}. New period: ${startDateStr} - ${endDateStr}`,
            messageTh: `รอบการนับชั้นเรียนของคุณถูกอัปเดตโดย ${moderator.username} รอบใหม่: ${startDateStrTh} - ${endDateStrTh}`,
            type: "info",
            userId: args.teacherId,
            read: false,
            createdAt: Date.now(),
        });

        return { success: true, cycleId };
    },
});

/**
 * Log when a moderator views/exports a teacher's class count
 * Creates transparency notification for the teacher
 */
export const logClassCountView = mutation({
    args: {
        teacherId: v.id("users"),
        moderatorId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
        action: v.union(v.literal("viewed"), v.literal("exported")),
    },
    handler: async (ctx, args) => {
        // Verify moderator authorization
        const moderator = await ctx.db.get(args.moderatorId);
        if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
            throw new Error("Unauthorized: Only moderators and admins can log class count views");
        }

        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // Create notification for teacher (transparency)
        const startDateStr = new Date(args.startDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDateStr = new Date(args.endDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const startDateStrTh = new Date(args.startDate).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDateStrTh = new Date(args.endDate).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const actionText = args.action === "viewed" ? "viewed" : "exported";
        const actionTextTh = args.action === "viewed" ? "ดู" : "ส่งออก";

        await ctx.db.insert("notifications", {
            userId: args.teacherId,
            title: `Class Count ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            titleTh: `การ${actionTextTh}จำนวนชั้นเรียน`,
            message: `${moderator.username} ${actionText} your class count for ${startDateStr} - ${endDateStr}`,
            messageTh: `${moderator.username} ${actionTextTh}จำนวนชั้นเรียนของคุณสำหรับ ${startDateStrTh} - ${endDateStrTh}`,
            type: "info",
            read: false,
            createdAt: Date.now(),
        });

        // Log the action
        await ctx.db.insert("classCountAuditLogs", {
            teacherId: args.teacherId,
            moderatorId: args.moderatorId,
            moderatorUsername: moderator.username,
            startDate: args.startDate,
            endDate: args.endDate,
            action: args.action,
            timestamp: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Get detailed class count data for printing
 * Returns formatted data optimized for print view
 * 
 * NEW FEATURE (Oct 30, 2025): Print-friendly class count report
 * UPDATED (Oct 30, 2025): Accepts optional custom date range
 */
export const getClassCountForPrint = query({
    args: {
        teacherId: v.id("users"),
        customStartDate: v.optional(v.number()), // Optional custom date range for printing
        customEndDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get teacher details
        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // Determine date range:
        // 1. Use custom dates if provided (user's filter selection)
        // 2. Otherwise use active cycle
        // 3. Otherwise use current month as default
        let cycleStartDate: number;
        let cycleEndDate: number;
        let cycleNotes: string | undefined;
        let cycleNotesTh: string | undefined;

        if (args.customStartDate && args.customEndDate) {
            // User provided custom date range
            cycleStartDate = args.customStartDate;
            cycleEndDate = args.customEndDate;
            // No notes for custom date ranges
            cycleNotes = undefined;
            cycleNotesTh = undefined;
        } else {
            // Get active cycle (or use current month as default)
            const activeCycle = await ctx.db
                .query("teacherClassCountCycles")
                .withIndex("by_teacher_and_active", (q) =>
                    q.eq("teacherId", args.teacherId).eq("isActive", true)
                )
                .first();

            // If no active cycle, use current month as default
            const now = Date.now();
            const currentMonth = new Date(now);
            const defaultStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
            const defaultEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

            cycleStartDate = activeCycle?.cycleStartDate || defaultStart;
            cycleEndDate = activeCycle?.cycleEndDate || defaultEnd;
            cycleNotes = activeCycle?.notes;
            cycleNotesTh = activeCycle?.notesTh;
        }

        // Get classes in the cycle period
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_teacher_and_date", (q) =>
                q.eq("teacherId", args.teacherId)
                    .gte("scheduledDate", cycleStartDate)
                    .lte("scheduledDate", cycleEndDate)
            )
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        // Get post-class notes to determine which classes are counted
        const allNotesForTeacher = await ctx.db
            .query("postClassNotes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .collect();

        const classIdsWithNotes = new Set(allNotesForTeacher.map(n => n.classId));

        // Filter to counted classes only
        const countedClasses = classes.filter(c => classIdsWithNotes.has(c._id));

        // Batch fetch related data (including providers)
        const studentIds = new Set<string>();
        const schoolIds = new Set<string>();
        const providerIds = new Set<string>(); // NEW: Provider IDs
        const locationIds = new Set<string>();

        countedClasses.forEach(cls => {
            studentIds.add(cls.studentId);
            cls.additionalStudentIds?.forEach(id => studentIds.add(id));
            if (cls.schoolId) schoolIds.add(cls.schoolId); // Only add if exists
            if (cls.providerId) providerIds.add(cls.providerId); // NEW: Collect provider IDs
            if (cls.locationId) locationIds.add(cls.locationId);
        });

        const [students, schools, providers, locations] = await Promise.all([
            Promise.all(Array.from(studentIds).map(id => ctx.db.get(id as Id<"students">))),
            Promise.all(Array.from(schoolIds).map(id => ctx.db.get(id as Id<"schools">))),
            Promise.all(Array.from(providerIds).map(id => ctx.db.get(id as Id<"providers">))), // NEW: Fetch providers
            Promise.all(Array.from(locationIds).map(id => ctx.db.get(id as Id<"locations">))),
        ]);

        const studentMap = new Map(students.filter(s => s).map(s => [s!._id, s!]));
        const schoolMap = new Map(schools.filter(s => s).map(s => [s!._id, s!]));
        const providerMap = new Map(providers.filter(p => p).map(p => [p!._id, p!])); // NEW: Provider map
        const locationMap = new Map(locations.filter(l => l).map(l => [l!._id, l!]));

        // Calculate class count details
        let totalClassCount = 0;
        const classDetails = countedClasses.map(cls => {
            const studentCount = 1 + (cls.additionalStudentIds?.length || 0);
            const durationMinutes = cls.duration || 60;
            const classCount = studentCount * (durationMinutes / 60);
            totalClassCount += classCount;

            const primaryStudent = studentMap.get(cls.studentId);
            const additionalStudents = (cls.additionalStudentIds || [])
                .map(id => studentMap.get(id))
                .filter((s): s is NonNullable<typeof s> => s !== undefined);
            const school = cls.schoolId ? schoolMap.get(cls.schoolId) : null; // NEW: Conditional lookup
            const provider = cls.providerId ? providerMap.get(cls.providerId) : null; // NEW: Provider lookup
            const location = cls.locationId ? locationMap.get(cls.locationId) : null;

            return {
                classId: cls._id,
                scheduledDate: cls.scheduledDate,
                duration: durationMinutes,
                studentCount,
                classCount: Math.round(classCount * 10) / 10,
                primaryStudentName: primaryStudent ?
                    `${primaryStudent.firstName} ${primaryStudent.lastName}`.trim() : "Unknown",
                additionalStudentNames: additionalStudents.map(s =>
                    `${s.firstName} ${s.lastName}`.trim()
                ),
                schoolName: school?.name || provider?.name || "Unknown", // NEW: Fallback to provider
                schoolNameTh: school?.nameTh || provider?.nameTh || "ไม่ทราบ", // NEW: Fallback to provider
                providerName: provider?.name, // NEW: Provider name
                providerNameTh: provider?.nameTh, // NEW: Provider name (Thai)
                locationName: location?.name || "N/A",
                locationNameTh: location?.nameTh || "ไม่ระบุ",
            };
        });

        return {
            teacher: {
                username: teacher.username,
                displayName: teacher.username, // Use username as display name
            },
            cycle: {
                startDate: cycleStartDate,
                endDate: cycleEndDate,
                notes: cycleNotes,
                notesTh: cycleNotesTh,
            },
            summary: {
                totalClassCount: Math.round(totalClassCount * 10) / 10,
                totalClasses: countedClasses.length,
                totalApprovedClasses: classes.length,
            },
            classes: classDetails,
            generatedAt: Date.now(),
        };
    },
});
