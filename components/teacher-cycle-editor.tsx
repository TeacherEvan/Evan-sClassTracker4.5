"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Calendar, Save } from "lucide-react";
import { useState } from "react";

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
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [notesTh, setNotesTh] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const setTeacherCycle = useMutation(api.teacherClassCount.setTeacherCycle);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate) {
            toast.warning("Please select start and end dates", "กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
            return;
        }

        const start = new Date(startDate).getTime();
        const end = new Date(endDate + "T23:59:59").getTime();

        if (start >= end) {
            toast.error("Start date must be before end date", "วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด");
            return;
        }

        setIsSaving(true);

        try {
            await setTeacherCycle({
                teacherId,
                cycleStartDate: start,
                cycleEndDate: end,
                notes: notes.trim() || undefined,
                notesTh: notesTh.trim() || undefined,
                moderatorId,
            });

            toast.success(
                `ClassCount cycle updated for ${teacherName}`,
                `อัปเดตรอบการนับชั้นเรียนสำหรับ ${teacherName} แล้ว`
            );

            onComplete();
        } catch (error) {
            console.error("Failed to set cycle:", error);
            toast.error("Failed to update cycle", "อัปเดตรอบล้มเหลว");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">
                    {t(`Set ClassCount Cycle for ${teacherName}`, `ตั้งรอบการนับชั้นเรียนสำหรับ ${teacherName}`)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(
                        "Define the date range for tracking this teacher's ClassCount",
                        "กำหนดช่วงวันที่สำหรับติดตาม ClassCount ของครูคนนี้"
                    )}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        {t("Start Date", "วันที่เริ่มต้น")}
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        {t("End Date", "วันที่สิ้นสุด")}
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    {t("Notes (English)", "หมายเหตุ (ภาษาอังกฤษ)")}
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("Optional notes about this cycle", "หมายเหตุเกี่ยวกับรอบนี้ (ไม่บังคับ)")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    {t("Notes (Thai)", "หมายเหตุ (ภาษาไทย)")}
                </label>
                <textarea
                    value={notesTh}
                    onChange={(e) => setNotesTh(e.target.value)}
                    placeholder={t("Optional notes about this cycle", "หมายเหตุเกี่ยวกับรอบนี้ (ไม่บังคับ)")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                />
            </div>

            <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors active:scale-95 touch-manipulation"
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
