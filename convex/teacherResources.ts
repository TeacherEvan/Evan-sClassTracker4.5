import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all active resources (ordered by display order)
export const list = query({
    args: {},
    handler: async (ctx) => {
        const resources = await ctx.db
            .query("teacherResources")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        // Sort by order field
        return resources.sort((a, b) => a.order - b.order);
    },
});

// Query to get all resources (including inactive) - admin only
export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const resources = await ctx.db
            .query("teacherResources")
            .withIndex("by_created_at", (q) => q)
            .collect();

        // Sort by order field
        return resources.sort((a, b) => a.order - b.order);
    },
});

// Query to get a single resource by ID
export const getById = query({
    args: { id: v.id("teacherResources") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

// Mutation to create a new resource - admin only
export const create = mutation({
    args: {
        title: v.string(),
        titleTh: v.string(),
        description: v.string(),
        descriptionTh: v.string(),
        url: v.string(),
        category: v.string(),
        categoryTh: v.string(),
        order: v.number(),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Validate URL format
        try {
            new URL(args.url);
        } catch {
            throw new Error("Invalid URL format");
        }

        const now = Date.now();
        const resourceId = await ctx.db.insert("teacherResources", {
            title: args.title,
            titleTh: args.titleTh,
            description: args.description,
            descriptionTh: args.descriptionTh,
            url: args.url,
            category: args.category,
            categoryTh: args.categoryTh,
            order: args.order,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: args.createdBy,
        });

        return resourceId;
    },
});

// Mutation to update an existing resource - admin only
export const update = mutation({
    args: {
        id: v.id("teacherResources"),
        title: v.string(),
        titleTh: v.string(),
        description: v.string(),
        descriptionTh: v.string(),
        url: v.string(),
        category: v.string(),
        categoryTh: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;

        // Validate URL format
        try {
            new URL(updates.url);
        } catch {
            throw new Error("Invalid URL format");
        }

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });

        return id;
    },
});

// Mutation to toggle active/inactive status
export const toggleActive = mutation({
    args: {
        id: v.id("teacherResources"),
    },
    handler: async (ctx, { id }) => {
        const resource = await ctx.db.get(id);
        if (!resource) {
            throw new Error("Resource not found");
        }

        await ctx.db.patch(id, {
            isActive: !resource.isActive,
            updatedAt: Date.now(),
        });

        return id;
    },
});

// Mutation to delete a resource - admin only
export const remove = mutation({
    args: {
        id: v.id("teacherResources"),
    },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
        return id;
    },
});

// Mutation to reorder resources (update order values)
export const reorder = mutation({
    args: {
        resourceIds: v.array(v.id("teacherResources")),
    },
    handler: async (ctx, { resourceIds }) => {
        // Update each resource with its new order
        for (let i = 0; i < resourceIds.length; i++) {
            const resourceId = resourceIds[i];
            await ctx.db.patch(resourceId, {
                order: i + 1, // 1-based ordering
                updatedAt: Date.now(),
            });
        }

        return resourceIds;
    },
});

// Helper function to initialize default resources (run once)
export const initializeDefaults = mutation({
    args: {
        adminId: v.id("users"),
    },
    handler: async (ctx, { adminId }) => {
        // Check if resources already exist
        const existing = await ctx.db
            .query("teacherResources")
            .collect();

        if (existing.length > 0) {
            return { message: "Resources already initialized", count: existing.length };
        }

        const now = Date.now();
        const defaultResources = [
            {
                title: "Teachers Pay Teachers",
                titleTh: "ตลาดทรัพยากรการสอน",
                description: "World's largest marketplace for teacher-created resources including lesson plans, worksheets, and activities.",
                descriptionTh: "ตลาดขายทรัพยากรการสอนที่ใหญ่ที่สุดในโลก มีแผนการสอน แบบฝึกหัด และกิจกรรมที่ครูสร้างขึ้น",
                url: "https://www.teacherspayteachers.com/",
                category: "Marketplace",
                categoryTh: "ตลาดทรัพยากร",
                order: 1,
            },
            {
                title: "Education.com",
                titleTh: "Education.com",
                description: "28,000+ worksheets, games, and lesson plans for PreK-8th grade. Features interactive worksheets and guided lessons.",
                descriptionTh: "แบบฝึกหัด เกม และแผนการสอนมากกว่า 28,000 รายการสำหรับอนุบาล-ป.2 มีแบบฝึกหัดแบบโต้ตอบและบทเรียนแนะนำ",
                url: "https://www.education.com/worksheets/",
                category: "Worksheets & Games",
                categoryTh: "แบบฝึกหัดและเกม",
                order: 2,
            },
            {
                title: "ReadWorks",
                titleTh: "ReadWorks",
                description: "FREE reading comprehension resources with 6,000+ articles aligned to the science of reading for K-12 students.",
                descriptionTh: "ทรัพยากรความเข้าใจในการอ่านฟรี มีบทความกว่า 6,000 บทความสำหรับนักเรียนอนุบาล-ม.6",
                url: "https://www.readworks.org/",
                category: "Reading Comprehension",
                categoryTh: "ความเข้าใจในการอ่าน",
                order: 3,
            },
            {
                title: "CommonLit",
                titleTh: "CommonLit",
                description: "FREE ELA curriculum for grades 6-12 with full-length texts, lesson materials, and benchmark assessments.",
                descriptionTh: "หลักสูตร ELA ฟรีสำหรับชั้น ม.1-ม.6 พร้อมข้อความเต็ม เอกสารบทเรียน และการประเมินมาตรฐาน",
                url: "https://www.commonlit.org/",
                category: "ELA Curriculum",
                categoryTh: "หลักสูตรภาษาอังกฤษ",
                order: 4,
            },
            {
                title: "Khan Academy",
                titleTh: "Khan Academy",
                description: "FREE comprehensive learning platform covering math, science, arts, and humanities with personalized learning dashboard.",
                descriptionTh: "แพลตฟอร์มการเรียนรู้ฟรีที่ครอบคลุมคณิตศาสตร์ วิทยาศาสตร์ ศิลปะ และมนุษยศาสตร์ พร้อมแดชบอร์ดการเรียนรู้ส่วนบุคคล",
                url: "https://www.khanacademy.org/",
                category: "General Learning",
                categoryTh: "การเรียนรู้ทั่วไป",
                order: 5,
            },
        ];

        const resourceIds = [];
        for (const resource of defaultResources) {
            const id = await ctx.db.insert("teacherResources", {
                ...resource,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                createdBy: adminId,
            });
            resourceIds.push(id);
        }

        return {
            message: "Default resources initialized successfully",
            count: resourceIds.length,
            ids: resourceIds
        };
    },
});
