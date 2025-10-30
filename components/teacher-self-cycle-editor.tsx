"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Calendar, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TeacherSelfCycleEditorProps {
    teacherId: Id<"users">;
    currentCycle?: {
        startDate: number;
        endDate: number;
        notes?: string;
        notesTh?: string;
    };
    onComplete: () => void;
}

/**
 * Allows teachers to edit their own ClassCount cycle
 * Moderators are notified when teachers update their cycles
 * 
 * NEW FEATURE (Oct 30, 2025)
 */
export function TeacherSelfCycleEditor({
    teacherId,
    currentCycle,
    onComplete,
}: TeacherSelfCycleEditorProps) {
    const { t } = useLanguage();

    // Pre-fill with current cycle if exists
    const [startDate, setStartDate] = useState(
        currentCycle ? new Date(currentCycle.startDate).toISOString().split('T')[0] : ""
    );
    const [endDate, setEndDate] = useState(
        currentCycle ? new Date(currentCycle.endDate).toISOString().split('T')[0] : ""
    );
    const [notes, setNotes] = useState(currentCycle?.notes || "");
    const [notesTh, setNotesTh] = useState(currentCycle?.notesTh || "");
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

    const updateOwnCycle = useMutation(api.teacherClassCount.updateOwnCycle);

    // Focus management
    const startDateRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        startDateRef.current?.focus();
    }, []);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onComplete();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onComplete]);

    const handleSubmit = async (e: React.FormEvent, confirmed = false) => {
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
            const result = await updateOwnCycle({
                teacherId,
                cycleStartDate: start,
                cycleEndDate: end,
                notes: notes.trim() || undefined,
                notesTh: notesTh.trim() || undefined,
                confirmed,
            });

            // Check if confirmation is required
            if (result && 'requiresConfirmation' in result && result.requiresConfirmation) {
                setWarningState({
                    existingCycle: result.existingCycle,
                    message: result.message,
                });
                setIsSaving(false);
                return;
            }

            toast.success(
                "Your ClassCount cycle has been updated",
                "อัปเดตรอบการนับชั้นเรียนของคุณแล้ว"
            );

            onComplete();
        } catch (error) {
            console.error("Failed to update cycle:", error);
            toast.error("Failed to update cycle", "อัปเดตรอบล้มเหลว");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmOverride = (e: React.FormEvent) => {
        e.preventDefault();
        setWarningState(null);
        handleSubmit(e, true);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">
                            {t("Edit Your ClassCount Cycle", "แก้ไขรอบการนับชั้นเรียนของคุณ")}
                        </h2>
                        <button
                            onClick={onComplete}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            type="button"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-grow p-4 md:p-6">
                    {warningState ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                                    {t("Replace Existing Cycle?", "แทนที่รอบที่มีอยู่หรือไม่?")}
                                </h3>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                                    {warningState.message}
                                </p>
                                <div className="text-sm text-yellow-900 dark:text-yellow-100">
                                    <p className="font-medium">{t("Current Cycle:", "รอบปัจจุบัน:")}</p>
                                    <p>
                                        {new Date(warningState.existingCycle.startDate).toLocaleDateString()} -{" "}
                                        {new Date(warningState.existingCycle.endDate).toLocaleDateString()}
                                    </p>
                                    {warningState.existingCycle.notes && (
                                        <p className="mt-2 italic">{warningState.existingCycle.notes}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setWarningState(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    type="button"
                                >
                                    {t("Cancel", "ยกเลิก")}
                                </button>
                                <button
                                    onClick={handleConfirmOverride}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                                    type="button"
                                >
                                    {t("Confirm Replace", "ยืนยันแทนที่")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    {t(
                                        "Define the date range for tracking your ClassCount. Your moderator will be notified of this change.",
                                        "กำหนดช่วงวันที่สำหรับติดตาม ClassCount ของคุณ ผู้ดูแลของคุณจะได้รับการแจ้งเตือนเกี่ยวกับการเปลี่ยนแปลงนี้"
                                    )}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cycle-start-date" className="block text-sm font-medium mb-2">
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
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cycle-end-date" className="block text-sm font-medium mb-2">
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
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cycle-notes" className="block text-sm font-medium mb-2">
                                        {t("Notes (English)", "หมายเหตุ (อังกฤษ)")}
                                    </label>
                                    <textarea
                                        id="cycle-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder={t("Optional notes about this cycle", "หมายเหตุเพิ่มเติมเกี่ยวกับรอบนี้")}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cycle-notes-th" className="block text-sm font-medium mb-2">
                                        {t("Notes (Thai)", "หมายเหตุ (ไทย)")}
                                    </label>
                                    <textarea
                                        id="cycle-notes-th"
                                        value={notesTh}
                                        onChange={(e) => setNotesTh(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder={t("Optional notes about this cycle", "หมายเหตุเพิ่มเติมเกี่ยวกับรอบนี้")}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={onComplete}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t("Cancel", "ยกเลิก")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? t("Saving...", "กำลังบันทึก...") : t("Save Cycle", "บันทึกรอบ")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
