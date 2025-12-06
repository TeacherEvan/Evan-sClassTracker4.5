"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, CheckCircle, X, XCircle } from "lucide-react";
import { useState } from "react";

interface DuplicateDetectionModalProps {
    studentId: Id<"students">;
    currentUserId: Id<"users">;
    onClose: () => void;
    onIgnore: () => void; // Proceed with creation/booking despite duplicates
    onMerge?: (targetId: Id<"students">) => void; // Optional: trigger merge flow
}

export function DuplicateDetectionModal({
    studentId,
    currentUserId,
    onClose,
    onIgnore,
    onMerge,
}: DuplicateDetectionModalProps) {
    const { t } = useLanguage();
    const potentialDuplicates = useQuery(api.studentWatchlist.findPotentialDuplicates, { studentId });
    const flagStudent = useMutation(api.studentWatchlist.flagStudent);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAction, setSelectedAction] = useState<"ignore" | "flag" | null>(null);

    if (!potentialDuplicates) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">
                            {t("Checking for duplicates...", "กำลังตรวจสอบข้อมูลซ้ำซ้อน...")}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // No duplicates found
    if (potentialDuplicates.length === 0) {
        return null;
    }

    const handleFlagForReview = async () => {
        setIsSubmitting(true);
        try {
            const duplicateIds = potentialDuplicates.map(d => d.student._id);
            const matchedFields = potentialDuplicates[0]?.matchedFields || [];

            await flagStudent({
                studentId,
                potentialDuplicateIds: duplicateIds,
                matchedFields,
                reason: "Duplicate detected during creation/booking",
                reasonTh: "ตรวจพบข้อมูลซ้ำซ้อนระหว่างการสร้าง/จอง",
                flaggedBy: currentUserId,
                notes: `${potentialDuplicates.length} potential duplicate(s) found`,
                notesTh: `พบข้อมูลที่อาจซ้ำซ้อน ${potentialDuplicates.length} รายการ`,
            });

            toast.success(
                "Student flagged for admin review",
                "ระบุนักเรียนสำหรับตรวจสอบโดยผู้ดูแลระบบ"
            );
            onIgnore(); // Proceed with creation after flagging
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to flag student",
                "ไม่สามารถระบุนักเรียนได้"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl my-8">
                {/* Header */}
                <div className="bg-yellow-500 dark:bg-yellow-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <h2 className="text-xl font-bold">
                            {t("Potential Duplicate Detected", "ตรวจพบข้อมูลที่อาจซ้ำซ้อน")}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                            {t(
                                `Found ${potentialDuplicates.length} potential duplicate student(s) with 4+ matching fields`,
                                `พบนักเรียนที่อาจซ้ำซ้อน ${potentialDuplicates.length} คน โดยมีข้อมูลตรงกัน 4 ฟิลด์ขึ้นไป`
                            )}
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                            {t(
                                "Please review the matches below and choose an action",
                                "กรุณาตรวจสอบข้อมูลด้านล่างและเลือกการดำเนินการ"
                            )}
                        </p>
                    </div>

                    {/* Duplicate List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {potentialDuplicates.map((duplicate) => (
                            <div
                                key={duplicate.student._id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {duplicate.student.firstName} {duplicate.student.lastName}
                                            </span>
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                {duplicate.student.grade}{duplicate.student.class || ""}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                ID: {duplicate.student.studentId}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {duplicate.matchedFields.map((field) => (
                                                <span
                                                    key={field}
                                                    className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                                                >
                                                    ✓ {field}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            {duplicate.student.guardianPhone && (
                                                <div>
                                                    <span className="font-medium">{t("Phone:", "เบอร์:")}</span>{" "}
                                                    {duplicate.student.guardianPhone}
                                                </div>
                                            )}
                                            {duplicate.student.dateOfBirth && (
                                                <div>
                                                    <span className="font-medium">{t("DOB:", "วันเกิด:")}</span>{" "}
                                                    {new Date(duplicate.student.dateOfBirth).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                            {duplicate.matchCount} {t("matches", "ตรงกัน")}
                                        </div>
                                        {onMerge && (
                                            <button
                                                onClick={() => onMerge(duplicate.student._id)}
                                                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                                            >
                                                {t("Merge", "รวม")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={async () => {
                            setSelectedAction("flag");
                            await handleFlagForReview();
                        }}
                        disabled={isSubmitting}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        {isSubmitting && selectedAction === "flag" ? (
                            <span>{t("Flagging...", "กำลังระบุ...")}</span>
                        ) : (
                            <span>
                                {t("Flag for Admin Review & Proceed", "ระบุสำหรับตรวจสอบและดำเนินการต่อ")}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setSelectedAction("ignore");
                            onIgnore();
                        }}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        {t("Ignore & Proceed Anyway", "ละเว้นและดำเนินการต่อ")}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-initial bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-5 h-5" />
                        {t("Cancel", "ยกเลิก")}
                    </button>
                </div>
            </div>
        </div>
    );
}
