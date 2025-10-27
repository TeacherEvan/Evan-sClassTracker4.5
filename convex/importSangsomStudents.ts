import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Bulk import Sangsom School K1/9 students
 * Run this ONCE via Convex dashboard after verifying school exists
 */
export const importK19Students = mutation({
    args: {
        schoolId: v.id("schools"),
        createdBy: v.id("users"), // Admin or teacher creating these students
    },
    handler: async (ctx, args) => {
        // Verify school exists
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error("School not found");
        }

        // Verify user exists
        const user = await ctx.db.get(args.createdBy);
        if (!user) {
            throw new Error("User not found");
        }

        // Student data from class roster image
        const students = [
            { nickname: "TAWAN", thaiName: "ทะวาน" },
            { nickname: "MARISSA", thaiName: "มารีสสา" },
            { nickname: "KHUN", thaiName: "คณชิตม์" },
            { nickname: "LUKA", thaiName: "ลีกาดีพลากชุมโล" },
            { nickname: "JANJAO", thaiName: "ทีชาติ" },
            { nickname: "Leo", thaiName: "เฟลิมสเกาะบอน" },
            { nickname: "Xiao yi", thaiName: "หางว" },
            { nickname: "NADA", thaiName: "เขียวรพี" },
            { nickname: "JAYLERR", thaiName: "เทพประสา" },
            { nickname: "PROD", thaiName: "พุลลวัติล" },
            { nickname: "ALYN", thaiName: "ทีตาพธ" },
            { nickname: "RYKER", thaiName: "ประทุมมิอง" },
            { nickname: "SKILL", thaiName: "ฝูกุนโญแอฮ" },
            { nickname: "GRACE", thaiName: "สมจิตวี" },
            { nickname: "FU", thaiName: "สบเจงคิก" },
            { nickname: "FEI", thaiName: "สบเจงคิก" }, // Note: Different from FU but same Thai name in image
            { nickname: "PUNNA", thaiName: "สุพรรณ์ดีซอดกม์" },
            { nickname: "ORANGE", thaiName: "โนราตทกสณ" },
            { nickname: "SHINA", thaiName: "บุนะชาติ" },
            { nickname: "Anchan", thaiName: "พลสาบญชู" },
            { nickname: "DIN", thaiName: "ศรีธรทกสณ" },
            { nickname: "PEPPER", thaiName: "สาดาทีชม" },
            { nickname: "MIFYNN", thaiName: "ผลงาอย" },
            { nickname: "PORJAI", thaiName: "กิวางษ" },
            { nickname: "LUNA", thaiName: "ปิงรีมนก" },
            { nickname: "PUNN", thaiName: "ปุตสาโกบไล" },
            { nickname: "Phupha", thaiName: "คอตมทรพลร์" },
        ];

        const results = [];
        const errors = [];

        for (const student of students) {
            try {
                // Check for duplicates first
                const existing = await ctx.db
                    .query("students")
                    .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                    .collect();

                const duplicate = existing.find(
                    (s) =>
                        s.firstName.toLowerCase() === student.nickname.toLowerCase() &&
                        s.grade === "K1" &&
                        s.class === "/9"
                );

                if (duplicate) {
                    errors.push({
                        nickname: student.nickname,
                        error: "Already exists",
                        studentId: duplicate.studentId,
                    });
                    continue;
                }

                // Generate unique student ID
                const timestamp = Date.now().toString(36);
                const nameHash = student.nickname.substring(0, 4).toUpperCase();
                const schoolHash = args.schoolId.substring(0, 4).toUpperCase();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                const studentId = `${schoolHash}-${nameHash}-${timestamp}-${random}`;

                // Insert student
                const id = await ctx.db.insert("students", {
                    firstName: student.nickname,
                    lastName: "", // Empty for Thai single-name students
                    studentId,
                    schoolId: args.schoolId,
                    grade: "K1",
                    class: "/9",
                    nickname: student.nickname,
                    notes: `Thai name: ${student.thaiName}`, // Store Thai name in notes
                    createdBy: args.createdBy,
                    createdAt: Date.now(),
                });

                results.push({
                    id,
                    nickname: student.nickname,
                    studentId,
                    thaiName: student.thaiName,
                });
            } catch (error) {
                errors.push({
                    nickname: student.nickname,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return {
            success: true,
            imported: results.length,
            failed: errors.length,
            results,
            errors,
            message: `Successfully imported ${results.length} students. ${errors.length} failed.`,
        };
    },
});

/**
 * Helper query to check if Sangsom School exists and get its ID
 */
export const findSangsomSchool = mutation({
    args: {},
    handler: async (ctx) => {
        const school = await ctx.db
            .query("schools")
            .filter((q) => q.eq(q.field("name"), "Sangsom School"))
            .first();

        if (!school) {
            return {
                found: false,
                message: "Sangsom School not found. Please create it first.",
            };
        }

        return {
            found: true,
            schoolId: school._id,
            schoolName: school.name,
            schoolNameTh: school.nameTh,
        };
    },
});
