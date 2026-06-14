/**
 * Seed script to create initial app update announcement
 * Run with: npx convex run seedAppUpdate:seedLatestUpdate --adminUserId "YOUR_ADMIN_USER_ID"
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const seedLatestUpdate = internalMutation({
  args: {
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin user exists
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("User must be an admin");
    }

    // Deactivate any existing active updates
    const existingUpdates = await ctx.db
      .query("appUpdates")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const update of existingUpdates) {
      await ctx.db.patch(update._id, { isActive: false });
    }

    // Create new update announcement
    const updateId = await ctx.db.insert("appUpdates", {
      version: "4.5.1",
      releaseDate: Date.now(),
      title: "Faster, Simpler Class Booking",
      titleTh: "จองคลาสง่ายและเร็วขึ้น",
      description:
        "We've streamlined the booking process to save you time and reduce confusion. Everything is now clearer and more organized.",
      descriptionTh:
        "เราได้ปรับปรุงระบบการจองให้ง่ายขึ้น ประหยัดเวลา และลดความสับสน ทุกอย่างชัดเจนและเป็นระเบียบมากขึ้น",
      features: [
        {
          icon: "CheckCircle2",
          title: "Improved Student Name Entry",
          titleTh: "ป้อนชื่อนักเรียนง่ายขึ้น",
          description:
            "Now you only need to enter the student's nickname - no more long forms to fill out",
          descriptionTh:
            "ตอนนี้คุณต้องกรอกแค่ชื่อเล่นของนักเรียน - ไม่ต้องกรอกฟอร์มยาวๆ อีกต่อไป",
        },
        {
          icon: "Edit3",
          title: "Clearer Grade & Class Selection",
          titleTh: "เลือกเกรดและห้องเรียนชัดเจนขึ้น",
          description:
            "Reorganized dropdowns make it faster to select student grade (K1-K3) and class (/1-/10)",
          descriptionTh:
            "เมนูดร็อปดาวน์ใหม่ช่วยให้เลือกเกรด (อนุบาล 1-3) และห้อง (/1-/10) ได้เร็วขึ้น",
        },
        {
          icon: "FileText",
          title: "Teacher Activity Logs in Analytics",
          titleTh: "บันทึกกิจกรรมครูในแท็บวิเคราะห์",
          description:
            "Access all your teaching logs and exports right from the Analytics tab",
          descriptionTh:
            "เข้าถึงบันทึกการสอนและส่งออกข้อมูลได้จากแท็บวิเคราะห์",
        },
        {
          icon: "Sparkles",
          title: "Better Confirmation Dialogs",
          titleTh: "หน้าต่างยืนยันที่ดีขึ้น",
          description:
            "Important actions now show clear, easy-to-read confirmation windows instead of browser popups",
          descriptionTh:
            "การดำเนินการสำคัญแสดงหน้าต่างยืนยันที่อ่านง่ายแทนป๊อปอัปของเบราว์เซอร์",
        },
      ],
      isActive: true,
      createdAt: Date.now(),
    });

    return {
      success: true,
      updateId,
      message: "App update announcement created successfully",
    };
  },
});
