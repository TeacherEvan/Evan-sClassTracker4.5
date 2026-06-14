"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Calendar, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TeacherCycleEditorProps {
  teacherId: Id<"users">;
  teacherName: string;
  moderatorId: Id<"users">;
  onComplete: () => void;
}

export function TeacherCycleEditor({
  teacherId,
  teacherName,
  moderatorId,
  onComplete,
}: TeacherCycleEditorProps) {
  const { t, language } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [notesTh, setNotesTh] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [warningState, setWarningState] = useState<{
    existingCycle: {
      startDate: number;
      endDate: number;
      notes?: string;
      notesTh?: string;
    };
    message: string;
  } | null>(null);

  const setTeacherCycle = useMutation(api.teacherClassCount.setTeacherCycle);

  // Focus management - auto-focus first input on mount
  const startDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startDateRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent, confirmed = false) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.warning(
        "Please select start and end dates",
        "กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด",
      );
      return;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate + "T23:59:59").getTime();

    if (start >= end) {
      toast.error(
        "Start date must be before end date",
        "วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด",
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await setTeacherCycle({
        teacherId,
        cycleStartDate: start,
        cycleEndDate: end,
        notes: notes.trim() || undefined,
        notesTh: notesTh.trim() || undefined,
        moderatorId,
        confirmed, // Pass confirmation flag
      });

      // Check if confirmation is required
      if (
        result &&
        "requiresConfirmation" in result &&
        result.requiresConfirmation
      ) {
        setWarningState({
          existingCycle: result.existingCycle,
          message: result.message,
        });
        setIsSaving(false);
        return;
      }

      toast.success(
        `ClassCount cycle updated for ${teacherName}`,
        `อัปเดตรอบการนับชั้นเรียนสำหรับ ${teacherName} แล้ว`,
      );

      onComplete();
    } catch (error) {
      console.error("Failed to set cycle:", error);
      toast.error("Failed to update cycle", "อัปเดตรอบล้มเหลว");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setWarningState(null); // Clear warning
    handleSubmit(e, true); // Submit with confirmed = true
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      role="form"
      aria-label={t("Edit cycle form", "แบบฟอร์มแก้ไขรอบ")}
    >
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t(
            `Set ClassCount Cycle for ${teacherName}`,
            `ตั้งรอบการนับชั้นเรียนสำหรับ ${teacherName}`,
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            "Define the date range for tracking this teacher's ClassCount",
            "กำหนดช่วงวันที่สำหรับติดตาม ClassCount ของครูคนนี้",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cycle-start-date"
            className="block text-sm font-medium mb-2"
          >
            <Calendar className="inline w-4 h-4 mr-1" />
            {t("Start Date", "วันที่เริ่มต้น")}
          </label>
          <input
            id="cycle-start-date"
            ref={startDateRef}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label
            htmlFor="cycle-end-date"
            className="block text-sm font-medium mb-2"
          >
            <Calendar className="inline w-4 h-4 mr-1" />
            {t("End Date", "วันที่สิ้นสุด")}
          </label>
          <input
            id="cycle-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="cycle-notes-en"
          className="block text-sm font-medium mb-2"
        >
          {t("Notes (English)", "หมายเหตุ (ภาษาอังกฤษ)")}
        </label>
        <textarea
          id="cycle-notes-en"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t(
            "Optional notes about this cycle",
            "หมายเหตุเกี่ยวกับรอบนี้ (ไม่บังคับ)",
          )}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          aria-label={t("Notes in English", "หมายเหตุภาษาอังกฤษ")}
        />
      </div>

      <div>
        <label
          htmlFor="cycle-notes-th"
          className="block text-sm font-medium mb-2"
        >
          {t("Notes (Thai)", "หมายเหตุ (ภาษาไทย)")}
        </label>
        <textarea
          id="cycle-notes-th"
          value={notesTh}
          onChange={(e) => setNotesTh(e.target.value)}
          placeholder={t(
            "Optional notes about this cycle",
            "หมายเหตุเกี่ยวกับรอบนี้ (ไม่บังคับ)",
          )}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          aria-label={t("Notes in Thai", "หมายเหตุภาษาไทย")}
        />
      </div>

      {/* Confirmation Warning */}
      {warningState && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                {t("Active Cycle Will Be Replaced", "รอบที่ใช้งานจะถูกแทนที่")}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t(
                  "An active cycle already exists for this teacher. Saving will deactivate it.",
                  "มีรอบที่ใช้งานอยู่แล้วสำหรับครูคนนี้ การบันทึกจะปิดการใช้งานรอบเดิม",
                )}
              </p>
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {t("Current Cycle:", "รอบปัจจุบัน:")}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(
                    warningState.existingCycle.startDate,
                  ).toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" → "}
                  {new Date(
                    warningState.existingCycle.endDate,
                  ).toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {(warningState.existingCycle.notes ||
                  warningState.existingCycle.notesTh) && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 italic">
                    {language === "en"
                      ? warningState.existingCycle.notes
                      : warningState.existingCycle.notesTh ||
                        warningState.existingCycle.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setWarningState(null)}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  {t("Cancel", "ยกเลิก")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverride}
                  className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {t("Confirm & Replace", "ยืนยันและแทนที่")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
        aria-busy={isSaving}
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            {t("Saving...", "กำลังบันทึก...")}
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {t("Save Cycle", "บันทึกรอบ")}
          </>
        )}
      </button>
    </form>
  );
}
