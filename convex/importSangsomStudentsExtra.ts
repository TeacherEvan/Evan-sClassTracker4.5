import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Bulk import Sangsom School K2/8 students
 */
export const importK28Students = mutation({
    args: {
        schoolId: v.id("schools"),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) throw new Error("School not found");

        const user = await ctx.db.get(args.createdBy);
        if (!user) throw new Error("User not found");

        const students = [
            { nickname: "LAYN", thaiName: "เลย์น" },
            { nickname: "DEAN", thaiName: "ดีน" },
            { nickname: "ARBRO", thaiName: "อาร์โบร" },
            { nickname: "TYME", thaiName: "ไทม์" },
            { nickname: "PAULINE", thaiName: "พอลลีน" },
            { nickname: "REI", thaiName: "เร" },
            { nickname: "NANO", thaiName: "นาโน" },
            { nickname: "MOMENT", thaiName: "โมเมนต์" },
            { nickname: "CHUN", thaiName: "ชุน" },
            { nickname: "KARTOON", thaiName: "การ์ตูน" },
            { nickname: "PLAWAN", thaiName: "พลวัน" },
            { nickname: "Bia", thaiName: "เบีย" },
            { nickname: "MOEY", thaiName: "เมย์" },
            { nickname: "GRACE", thaiName: "เกรซ" },
            { nickname: "PEACHI", thaiName: "พีชชี่" },
            { nickname: "PUNN", thaiName: "ปันน์" },
            { nickname: "PAPANG", thaiName: "ปาปาง" },
            { nickname: "BLUEPIN", thaiName: "บลูพิน" },
            { nickname: "ONGSA", thaiName: "องซา" },
            { nickname: "HELEN", thaiName: "เฮเลน" },
            { nickname: "UNIQUE", thaiName: "ยูนิค" },
            { nickname: "MIDA", thaiName: "มิด้า" },
            { nickname: "KIRIN", thaiName: "คิริน" },
            { nickname: "BEYOND", thaiName: "บียอนด์" },
            { nickname: "MATEE", thaiName: "มาตี" },
            { nickname: "AILINA", thaiName: "ไอลีนา" },
        ];

        const results = [];
        const errors = [];

        for (const student of students) {
            try {
                const existing = await ctx.db
                    .query("students")
                    .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                    .collect();

                const duplicate = existing.find(
                    (s) =>
                        s.firstName.toLowerCase() === student.nickname.toLowerCase() &&
                        s.grade === "K2" &&
                        s.class === "/8"
                );

                if (duplicate) {
                    errors.push({
                        nickname: student.nickname,
                        error: "Already exists",
                        studentId: duplicate.studentId,
                    });
                    continue;
                }

                const timestamp = Date.now().toString(36);
                const nameHash = student.nickname.substring(0, 4).toUpperCase();
                const schoolHash = args.schoolId.substring(0, 4).toUpperCase();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                const studentId = `${schoolHash}-${nameHash}-${timestamp}-${random}`;

                const id = await ctx.db.insert("students", {
                    firstName: student.nickname,
                    lastName: "",
                    studentId,
                    schoolId: args.schoolId,
                    grade: "K2",
                    class: "/8",
                    nickname: student.nickname,
                    notes: `Thai name: ${student.thaiName}`,
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
 * Bulk import Sangsom School K1/6 students
 */
export const importK16Students = mutation({
    args: {
        schoolId: v.id("schools"),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) throw new Error("School not found");

        const user = await ctx.db.get(args.createdBy);
        if (!user) throw new Error("User not found");

        const students = [
            { nickname: "ING-ING", thaiName: "อิงอิง" },
            { nickname: "JEDI", thaiName: "เจได" },
            { nickname: "Tiger", thaiName: "ไทเกอร์" },
            { nickname: "WINNIE", thaiName: "วินนี่" },
            { nickname: "AYA", thaiName: "อายะ" },
            { nickname: "JAMIE", thaiName: "เจมี่" },
            { nickname: "GOMU GOMU", thaiName: "โกมุโกมุ" },
            { nickname: "MUNGKORN", thaiName: "มังกร" },
            { nickname: "MINI", thaiName: "มินิ" },
            { nickname: "WINTER", thaiName: "วินเทอร์" },
            { nickname: "Leica", thaiName: "ไลก้า" },
            { nickname: "Marsh", thaiName: "มาร์ช" },
            { nickname: "TAIGA", thaiName: "ไทก้า" },
            { nickname: "PREME", thaiName: "พรีม" },
            { nickname: "MICKEY", thaiName: "มิกกี้" },
            { nickname: "PUMA", thaiName: "ปูม่า" },
            { nickname: "Bryan", thaiName: "ไบรอัน" },
            { nickname: "LALYN", thaiName: "ลาลีน" },
            { nickname: "PHUGAN", thaiName: "พูกัน" },
            { nickname: "LALYN", thaiName: "ลาลีน" },
            { nickname: "AKIM", thaiName: "อาคิม" },
            { nickname: "MINNIE", thaiName: "มินนี่" },
            { nickname: "DARIN", thaiName: "ดารีน" },
            { nickname: "EUPEACH", thaiName: "ยูพีช" },
            { nickname: "Piglet", thaiName: "พิกเล็ท" },
            { nickname: "Thee", thaiName: "ธี" },
            { nickname: "IRENE", thaiName: "ไอรีน" },
            { nickname: "NITAN", thaiName: "นิตัน" },
        ];

        const results = [];
        const errors = [];

        for (const student of students) {
            try {
                const existing = await ctx.db
                    .query("students")
                    .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                    .collect();

                const duplicate = existing.find(
                    (s) =>
                        s.firstName.toLowerCase() === student.nickname.toLowerCase() &&
                        s.grade === "K1" &&
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

                const timestamp = Date.now().toString(36);
                const nameHash = student.nickname.substring(0, 4).toUpperCase();
                const schoolHash = args.schoolId.substring(0, 4).toUpperCase();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                const studentId = `${schoolHash}-${nameHash}-${timestamp}-${random}`;

                const id = await ctx.db.insert("students", {
                    firstName: student.nickname,
                    lastName: "",
                    studentId,
                    schoolId: args.schoolId,
                    grade: "K1",
                    class: "/6",
                    nickname: student.nickname,
                    notes: `Thai name: ${student.thaiName}`,
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
 * Bulk import Sangsom School K1/5 students
 */
export const importK15Students = mutation({
    args: {
        schoolId: v.id("schools"),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) throw new Error("School not found");

        const user = await ctx.db.get(args.createdBy);
        if (!user) throw new Error("User not found");

        const students = [
            { nickname: "AHLINN", thaiName: "อาห์ลินน์" },
            { nickname: "NATEE", thaiName: "นาที" },
            { nickname: "PUNN", thaiName: "ปันน์" },
            { nickname: "BEYOND", thaiName: "บียอนด์" },
            { nickname: "KIRIN", thaiName: "คิริน" },
            { nickname: "NADA", thaiName: "นาดา" },
            { nickname: "UNIQUE", thaiName: "ยูนิค" },
            { nickname: "HELEN", thaiName: "เฮเลน" },
            { nickname: "ONGSA", thaiName: "องซา" },
            { nickname: "BLUEFIN", thaiName: "บลูฟิน" },
            { nickname: "PAPANG", thaiName: "ปาปาง" },
            { nickname: "PUNN", thaiName: "ปันน์" },
            { nickname: "PEACHII", thaiName: "พีชชี่" },
            { nickname: "GRACE", thaiName: "เกรซ" },
            { nickname: "MOEY", thaiName: "เมย์" },
            { nickname: "Bua", thaiName: "บัว" },
            { nickname: "PLAWAN", thaiName: "พลวัน" },
            { nickname: "KARTOON", thaiName: "การ์ตูน" },
            { nickname: "CHUN", thaiName: "ชุน" },
            { nickname: "MOMENT", thaiName: "โมเมนต์" },
            { nickname: "NANO", thaiName: "นาโน" },
            { nickname: "Pete", thaiName: "พีท" },
            { nickname: "PAULINE", thaiName: "พอลลีน" },
            { nickname: "TYME", thaiName: "ไทม์" },
            { nickname: "ARPRO", thaiName: "อาร์โปร" },
            { nickname: "DENIM", thaiName: "เดนิม" },
            { nickname: "Lalyn", thaiName: "ลาลีน" },
        ];

        const results = [];
        const errors = [];

        for (const student of students) {
            try {
                const existing = await ctx.db
                    .query("students")
                    .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                    .collect();

                const duplicate = existing.find(
                    (s) =>
                        s.firstName.toLowerCase() === student.nickname.toLowerCase() &&
                        s.grade === "K1" &&
                        s.class === "/5"
                );

                if (duplicate) {
                    errors.push({
                        nickname: student.nickname,
                        error: "Already exists",
                        studentId: duplicate.studentId,
                    });
                    continue;
                }

                const timestamp = Date.now().toString(36);
                const nameHash = student.nickname.substring(0, 4).toUpperCase();
                const schoolHash = args.schoolId.substring(0, 4).toUpperCase();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                const studentId = `${schoolHash}-${nameHash}-${timestamp}-${random}`;

                const id = await ctx.db.insert("students", {
                    firstName: student.nickname,
                    lastName: "",
                    studentId,
                    schoolId: args.schoolId,
                    grade: "K1",
                    class: "/5",
                    nickname: student.nickname,
                    notes: `Thai name: ${student.thaiName}`,
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
 * Bulk import Sangsom School K1/1 students
 */
export const importK11Students = mutation({
    args: {
        schoolId: v.id("schools"),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) throw new Error("School not found");

        const user = await ctx.db.get(args.createdBy);
        if (!user) throw new Error("User not found");

        const students = [
            { nickname: "MAPRAW", thaiName: "มะพร้าว" },
            { nickname: "PHAENG", thaiName: "แพง" },
            { nickname: "MASTER", thaiName: "มาสเตอร์" },
            { nickname: "RHONA", thaiName: "โรนา" },
            { nickname: "NARA", thaiName: "นารา" },
            { nickname: "MEWNA", thaiName: "เมวนา" },
            { nickname: "LEO", thaiName: "ลีโอ" },
            { nickname: "MIU", thaiName: "มิว" },
            { nickname: "KAEMSAI", thaiName: "แก้มใส" },
            { nickname: "PANTHER", thaiName: "แพนเธอร์" },
            { nickname: "GINA", thaiName: "จีน่า" },
            { nickname: "SUEA", thaiName: "เสือ" },
            { nickname: "SETIN", thaiName: "เซติน" },
            { nickname: "HANA", thaiName: "ฮานะ" },
            { nickname: "GINO", thaiName: "จีโน่" },
            { nickname: "PUN", thaiName: "ปุณ" },
            { nickname: "NICHA", thaiName: "นิชา" },
            { nickname: "WINTER", thaiName: "วินเทอร์" },
            { nickname: "PHUKHAO", thaiName: "ภูข่าว" },
            { nickname: "ANYA", thaiName: "อานย่า" },
            { nickname: "TEN TEN", thaiName: "เทน เทน" },
            { nickname: "TANKHUN", thaiName: "แทนคุณ" },
            { nickname: "Ob Oon", thaiName: "อบอุ่น" },
            { nickname: "ALICE", thaiName: "อลิส" },
            { nickname: "MANOW", thaiName: "มะนาว" },
            { nickname: "THYME", thaiName: "ธาม" },
            { nickname: "RAYNE", thaiName: "เรน" },
            { nickname: "ALPHA", thaiName: "อัลฟ่า" },
        ];

        const results = [];
        const errors = [];

        for (const student of students) {
            try {
                const existing = await ctx.db
                    .query("students")
                    .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                    .collect();

                const duplicate = existing.find(
                    (s) =>
                        s.firstName.toLowerCase() === student.nickname.toLowerCase() &&
                        s.grade === "K1" &&
                        s.class === "/1"
                );

                if (duplicate) {
                    errors.push({
                        nickname: student.nickname,
                        error: "Already exists",
                        studentId: duplicate.studentId,
                    });
                    continue;
                }

                const timestamp = Date.now().toString(36);
                const nameHash = student.nickname.substring(0, 4).toUpperCase();
                const schoolHash = args.schoolId.substring(0, 4).toUpperCase();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                const studentId = `${schoolHash}-${nameHash}-${timestamp}-${random}`;

                const id = await ctx.db.insert("students", {
                    firstName: student.nickname,
                    lastName: "",
                    studentId,
                    schoolId: args.schoolId,
                    grade: "K1",
                    class: "/1",
                    nickname: student.nickname,
                    notes: `Thai name: ${student.thaiName}`,
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
