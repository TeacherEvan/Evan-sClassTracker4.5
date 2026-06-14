"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { AlertTriangle, Search, Trash2 } from "lucide-react";
import { useState } from "react";

// Type definitions for mutation results
type CheckDataResult = {
  exists: boolean;
  schoolName: string;
  schoolId: Id<"schools">;
  counts: {
    events: number;
    students: number;
    classes: number;
    users: number;
    locations: number;
  };
  details: {
    teacher: string | null;
    moderator: string | null;
  };
};

type DeleteDataResult = {
  success: boolean;
  message: string;
  eventsDeleted: number;
  studentsDeleted: number;
  classesDeleted: number;
  usersDeleted: number;
  locationsDeleted: number;
  schoolDeleted: boolean;
};

interface SangsomDeleteButtonProps {
  userId: Id<"users">;
}

export function SangsomDeleteButton({ userId }: SangsomDeleteButtonProps) {
  const { t } = useLanguage();
  // Use string-based mutation calls that work with dynamic API
  const checkData = useMutation(
    "deleteSangsomData:checkSangsomDataToDelete" as never,
  ) as unknown as (args: Record<string, unknown>) => Promise<CheckDataResult>;
  const deleteData = useMutation(
    "deleteSangsomData:deleteSangsomData" as never,
  ) as unknown as (args: {
    adminId: Id<"users">;
    deleteSchool: boolean;
  }) => Promise<DeleteDataResult>;
  const [loading, setLoading] = useState(false);
  const [dataInfo, setDataInfo] = useState<CheckDataResult | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSchoolOption, setDeleteSchoolOption] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);

  const handleCheckData = async () => {
    setLoading(true);
    try {
      const result = await checkData({});

      if (!result.exists) {
        toast.success(
          "✅ No Sangsom test data found - database is clean!",
          "✅ ไม่พบข้อมูลทดสอบสังสม - ฐานข้อมูลสะอาด!",
        );
        setDataInfo(null);
      } else {
        setDataInfo(result);
        const message =
          `Found Sangsom test data:\n\n` +
          `📅 Events: ${result.counts.events}\n` +
          `👥 Students: ${result.counts.students}\n` +
          `📚 Classes: ${result.counts.classes}\n` +
          `👨‍🏫 Users: ${result.counts.users}\n` +
          `📍 Locations: ${result.counts.locations}\n\n` +
          `Teacher: ${result.details.teacher || "None"}\n` +
          `Moderator: ${result.details.moderator || "None"}`;

        toast.success(
          message,
          `พบข้อมูลทดสอบสังสม:\n\n` +
            `📅 กิจกรรม: ${result.counts.events}\n` +
            `👥 นักเรียน: ${result.counts.students}\n` +
            `📚 คลาส: ${result.counts.classes}\n` +
            `👨‍🏫 ผู้ใช้: ${result.counts.users}\n` +
            `📍 สถานที่: ${result.counts.locations}`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to check data",
        err instanceof Error ? err.message : "ตรวจสอบข้อมูลไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (deleteSchool: boolean) => {
    setDeleteSchoolOption(deleteSchool);
    setConfirmStep(1);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    setLoading(true);
    setShowDeleteConfirm(false);
    try {
      const result = await deleteData({
        adminId: userId,
        deleteSchool: deleteSchoolOption,
      });

      if (result.success) {
        const message =
          `✅ ${result.message}\n\n` +
          `Events deleted: ${result.eventsDeleted}\n` +
          `Students deleted: ${result.studentsDeleted}\n` +
          `Classes deleted: ${result.classesDeleted}\n` +
          `Users deleted: ${result.usersDeleted}\n` +
          `Locations deleted: ${result.locationsDeleted}\n` +
          `School deleted: ${result.schoolDeleted ? "Yes" : "No"}`;

        toast.success(
          message,
          `✅ ${result.message}\n\n` +
            `ลบกิจกรรม: ${result.eventsDeleted}\n` +
            `ลบนักเรียน: ${result.studentsDeleted}\n` +
            `ลบคลาส: ${result.classesDeleted}\n` +
            `ลบผู้ใช้: ${result.usersDeleted}\n` +
            `ลบสถานที่: ${result.locationsDeleted}\n` +
            `ลบโรงเรียน: ${result.schoolDeleted ? "ใช่" : "ไม่"}`,
        );
        setDataInfo(null);
      } else {
        toast.error(result.message, result.message);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Deletion failed",
        err instanceof Error ? err.message : "การลบล้มเหลว",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
        {t("Sangsom Test Data Cleanup", "ลบข้อมูลทดสอบสังสม")}
      </h3>
      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
        {t(
          "Remove all Sangsom test events, students, users, and optionally the school itself.",
          "ลบกิจกรรมทดสอบ นักเรียน ผู้ใช้ และโรงเรียนสังสมทั้งหมด (ถ้าต้องการ)",
        )}
      </p>

      {dataInfo && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 rounded text-sm">
          <div className="font-semibold mb-2">
            {t("Found test data:", "พบข้อมูลทดสอบ:")}
          </div>
          <ul className="space-y-1 text-red-800 dark:text-red-200">
            <li>
              📅 {t("Events", "กิจกรรม")}: {dataInfo.counts.events}
            </li>
            <li>
              👥 {t("Students", "นักเรียน")}: {dataInfo.counts.students}
            </li>
            <li>
              📚 {t("Classes", "คลาส")}: {dataInfo.counts.classes}
            </li>
            <li>
              👨‍🏫 {t("Users", "ผู้ใช้")}: {dataInfo.counts.users}
            </li>
            <li>
              📍 {t("Locations", "สถานที่")}: {dataInfo.counts.locations}
            </li>
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCheckData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-4 h-4" />
          {loading && !dataInfo
            ? t("Checking...", "กำลังตรวจสอบ...")
            : t("Check Existing Data", "ตรวจสอบข้อมูล")}
        </button>

        <button
          onClick={() => handleDelete(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {loading
            ? t("Processing...", "กำลังดำเนินการ...")
            : t("Delete Data (Keep School)", "ลบข้อมูล (เก็บโรงเรียน)")}
        </button>

        <button
          onClick={() => handleDelete(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {loading
            ? t("Processing...", "กำลังดำเนินการ...")
            : t("Delete Everything", "ลบทั้งหมด")}
        </button>
      </div>

      <div className="mt-4 text-xs text-red-600 dark:text-red-400">
        ⚠️{" "}
        {t(
          "Warning: These deletions are permanent and cannot be undone!",
          "คำเตือน: การลบเหล่านี้เป็นการถาวรและไม่สามารถยกเลิกได้!",
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              {confirmStep === 1
                ? t("Confirm Deletion", "ยืนยันการลบ")
                : t("Final Confirmation", "ยืนยันขั้นสุดท้าย")}
            </h4>

            <div className="text-sm text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap">
              {confirmStep === 1
                ? deleteSchoolOption
                  ? t(
                      "⚠️ DELETE EVERYTHING including the Sangsom School?\n\nThis will remove:\n- All events\n- All students\n- All classes\n- Teacher & Moderator users\n- All locations\n- THE SCHOOL ITSELF\n\nThis CANNOT be undone!",
                      "⚠️ ลบทุกอย่างรวมทั้งโรงเรียนสังสม?\n\nจะลบ:\n- กิจกรรมทั้งหมด\n- นักเรียนทั้งหมด\n- คลาสทั้งหมด\n- ผู้ใช้ครูและผู้ดูแล\n- สถานที่ทั้งหมด\n- โรงเรียนเอง\n\nไม่สามารถยกเลิกได้!",
                    )
                  : t(
                      "⚠️ DELETE Sangsom test data?\n\nThis will remove:\n- All events\n- All students\n- All classes\n- Teacher & Moderator users\n- All locations\n\nBut KEEP the school.\n\nThis CANNOT be undone!",
                      "⚠️ ลบข้อมูลทดสอบสังสม?\n\nจะลบ:\n- กิจกรรมทั้งหมด\n- นักเรียนทั้งหมด\n- คลาสทั้งหมด\n- ผู้ใช้ครูและผู้ดูแล\n- สถานที่ทั้งหมด\n\nแต่เก็บโรงเรียนไว้\n\nไม่สามารถยกเลิกได้!",
                    )
                : t(
                    "Are you ABSOLUTELY SURE?\n\nThe entire Sangsom School will be PERMANENTLY deleted!",
                    "คุณแน่ใจหรือไม่?\n\nโรงเรียนสังสมทั้งหมดจะถูกลบอย่างถาวร!",
                  )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={() => {
                  if (deleteSchoolOption && confirmStep === 1) {
                    setConfirmStep(2);
                  } else {
                    executeDelete();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {confirmStep === 1 && deleteSchoolOption
                  ? t("Next", "ถัดไป")
                  : t("Delete Permanently", "ลบอย่างถาวร")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
