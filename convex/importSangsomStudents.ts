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

        // Student data from class roster image - K1/9 (28 students)
        const students = [
            { nickname: "NAPHAT", thaiName: "ณภัทร" },
            { nickname: "PRI", thaiName: "พรี" },
            { nickname: "Harbin", thaiName: "ฮาร์บิน" },
            { nickname: "CAPTAIN", thaiName: "กัปตัน" },
            { nickname: "THAMES", thaiName: "เทมส์" },
            { nickname: "PROUD", thaiName: "พราว" },
            { nickname: "EYE", thaiName: "อาย" },
            { nickname: "SHANE", thaiName: "เชน" },
            { nickname: "BUBU", thaiName: "บูบู้" },
            { nickname: "MILYN", thaiName: "มิลิน" },
            { nickname: "ERIN", thaiName: "เอริน" },
            { nickname: "TARYN", thaiName: "ทารีน" },
            { nickname: "PUNN", thaiName: "ปันน์" },
            { nickname: "PROM", thaiName: "พรม" },
            { nickname: "LEO", thaiName: "ลีโอ" },
            { nickname: "GRACE", thaiName: "เกรซ" },
            { nickname: "TAITAI", thaiName: "ไต้ไต้" },
            { nickname: "PANTHER", thaiName: "แพนเธอร์" },
            { nickname: "VANA", thaiName: "วานา" },
            { nickname: "LALYNN", thaiName: "ลาลินน์" },
            { nickname: "FOND", thaiName: "ฟอนด์" },
            { nickname: "JENNINE", thaiName: "เจนนีน" },
            { nickname: "SUEA", thaiName: "เสือ" },
            { nickname: "Ai", thaiName: "ไอ" },
            { nickname: "Pangping", thaiName: "ปางปิง" },
            { nickname: "CELINE", thaiName: "เซลีน" },
            { nickname: "CHILYN", thaiName: "ชิลินน์" },
            { nickname: "MALI", thaiName: "มะลิ" },
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
 * Helper query to check if Sangsom Kindergarten exists and get its ID
 */
export const findSangsomSchool = mutation({
    args: {},
    handler: async (ctx) => {
        const school = await ctx.db
            .query("schools")
            .filter((q) => q.eq(q.field("name"), "Sangsom Kindergarten"))
            .first();

        if (!school) {
            return {
                found: false,
                message: "Sangsom Kindergarten not found. Please create it first.",
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

/**
 * Bulk import Sangsom School K2/6 students
 * Run this ONCE via UI after verifying school exists
 */
export const importK26Students = mutation({
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

        // Student data from K2/6 class roster
        const students = [
            { nickname: "LUKE", thaiName: "ลูก" },
            { nickname: "KEEN", thaiName: "คีน" },
            { nickname: "PITCH", thaiName: "พิช" },
            { nickname: "BEYA", thaiName: "เบย่า" },
            { nickname: "CELINE", thaiName: "เซลีน" },
            { nickname: "GOOD", thaiName: "กู๊ด" },
            { nickname: "MUSIC", thaiName: "มิวสิค" },
            { nickname: "HANA", thaiName: "ฮานา" },
            { nickname: "ASHI", thaiName: "อาชิ" },
            { nickname: "PROUD", thaiName: "พราว" },
            { nickname: "TURBINE", thaiName: "เทอร์ไบน์" },
            { nickname: "KHUN", thaiName: "คุณ" },
            { nickname: "MERRY", thaiName: "เมอร์รี่" },
            { nickname: "GRACE", thaiName: "เกรซ" },
            { nickname: "TINTIN", thaiName: "ติณติน" },
            { nickname: "LULLALIN", thaiName: "ลัลลาลิน" },
            { nickname: "GYPSY", thaiName: "ยิปซี" },
            { nickname: "SANSAN", thaiName: "ซานซาน" },
            { nickname: "LAYTON", thaiName: "เลย์ตัน" },
            { nickname: "MILIN", thaiName: "มิลิน" },
            { nickname: "LALIN", thaiName: "ลลิน" },
            { nickname: "DAIWA", thaiName: "ไดวา" },
            { nickname: "NAMI", thaiName: "นามิ" },
            { nickname: "SERENE", thaiName: "เซอรีน" },
            { nickname: "PUNN", thaiName: "ปันน์" },
            { nickname: "DJENT", thaiName: "เจนท์" },
            { nickname: "KACCHAN", thaiName: "คัจจัง" },
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
                        s.grade === "K2" &&
                        s.class === "/6"
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
                    grade: "K2",
                    class: "/6",
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
