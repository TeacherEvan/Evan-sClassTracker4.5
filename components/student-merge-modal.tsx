"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { STUDENT_MERGE_CONSTANTS } from "@/lib/student-merge-constants";
import { useMutation, useQuery } from "convex/react";
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    FileText,
    GitMerge,
    GraduationCap,
    Info,
    Loader2,
    User,
    X
} from "lucide-react";
import { useState } from "react";

interface StudentMergeModalProps {
    userId: Id<"users">;
    sourceStudent: {
        _id: Id<"students">;
        firstName: string;
        lastName: string;
        studentId: string;
        grade: string;
        class?: string;
        schoolId?: Id<"schools">;
        providerId?: Id<"providers">;
    };
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * Student Merge Modal
 * 
 * Git-repository-like merge interface:
 * - Merge source student into target student
 * - All references (classes, notes, logs) redirected to target
 * - Source student soft-deleted with audit trail
 * - Cannot merge across schools/providers
 * - No forking or renaming allowed
 */
export function StudentMergeModal({
    userId,
    sourceStudent,
    onClose,
    onSuccess,
}: StudentMergeModalProps) {
    const { t, language } = useLanguage();
    const [selectedTargetId, setSelectedTargetId] = useState<Id<"students"> | null>(null);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Get merge suggestions
    const suggestions = useQuery(api.students_merge.getMergeSuggestions, {
        userId,
        studentId: sourceStudent._id,
    });

    // Merge mutation
    const mergeStudents = useMutation(api.students_merge.mergeStudents);

    // Find the selected target student details
    const selectedTarget = suggestions?.find((s) => s._id === selectedTargetId);

    // Handle merge submission
    const handleMerge = async () => {
        if (!selectedTargetId) {
            setError(t("Please select a target student", "กรุณาเลือกนักเรียนเป้าหมาย"));
            return;
        }

        if (reason.trim().length < STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH) {
            setError(
                t(
                    `Please provide a reason (minimum ${STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH} characters)`,
                    `กรุณาระบุเหตุผล (อย่างน้อย ${STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH} ตัวอักษร)`
                )
            );
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const result = await mergeStudents({
                userId,
                sourceStudentId: sourceStudent._id,
                targetStudentId: selectedTargetId,
                reason: reason.trim(),
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: language,
                sessionId: `merge-${Date.now()}`,
            });

            if (result.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to merge students");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GitMerge className="w-7 h-7 text-white" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {t("🔀 Merge Students", "🔀 รวมนักเรียน")}
                                </h2>
                                <p className="text-sm text-white/90">
                                    {t(
                                        "Merge duplicate student records (Git-repository style)",
                                        "รวมข้อมูลนักเรียนที่ซ้ำซ้อน (แบบ Git repository)"
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Source Student Info */}
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-100 dark:bg-red-800 rounded-lg p-2">
                                <User className="w-6 h-6 text-red-600 dark:text-red-300" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                                        {t("Source Student (will be deleted)", "นักเรียนต้นทาง (จะถูกลบ)")}
                                    </h3>
                                    <span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                                        {t("Merge From", "รวมจาก")}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-red-700 dark:text-red-300 font-medium">
                                            {t("Name:", "ชื่อ:")}
                                        </span>{" "}
                                        <span className="text-red-900 dark:text-red-100">
                                            {sourceStudent.firstName} {sourceStudent.lastName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-red-700 dark:text-red-300 font-medium">
                                            {t("ID:", "รหัส:")}
                                        </span>{" "}
                                        <span className="text-red-900 dark:text-red-100 font-mono text-xs">
                                            {sourceStudent.studentId}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-red-700 dark:text-red-300 font-medium">
                                            {t("Grade:", "ระดับชั้น:")}
                                        </span>{" "}
                                        <span className="text-red-900 dark:text-red-100">
                                            {sourceStudent.grade}
                                            {sourceStudent.class ? `/${sourceStudent.class}` : ""}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3">
                            <ArrowRight className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>

                    {/* Target Student Selection */}
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {t("Select Target Student (will receive all data)", "เลือกนักเรียนเป้าหมาย (จะได้รับข้อมูลทั้งหมด)")}
                            </h3>
                        </div>

                        {!suggestions && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {t("Finding merge suggestions...", "กำลังหาตัวเลือกสำหรับการรวม...")}
                                </span>
                            </div>
                        )}

                        {suggestions && suggestions.length === 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                                            {t("No merge suggestions found", "ไม่พบตัวเลือกสำหรับการรวม")}
                                        </p>
                                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                            {t(
                                                "No similar students found in the same school/provider. Students must have the same grade and similar names to be merged.",
                                                "ไม่พบนักเรียนที่คล้ายกันในโรงเรียน/ผู้ให้บริการเดียวกัน นักเรียนต้องอยู่ในระดับชั้นเดียวกันและมีชื่อคล้ายกันจึงจะสามารถรวมได้"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {suggestions && suggestions.length > 0 && (
                            <div className="space-y-3">
                                {suggestions.map((student) => (
                                    <button
                                        key={student._id}
                                        onClick={() => setSelectedTargetId(student._id)}
                                        className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                                            selectedTargetId === student._id
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                : "border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <GraduationCap className="w-5 h-5 text-green-600" />
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {student.firstName} {student.lastName}
                                                    </span>
                                                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                                                        {student.grade}
                                                        {student.class ? `/${student.class}` : ""}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Info className="w-4 h-4" />
                                                        <span className="font-mono text-xs">{student.studentId}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <BookOpen className="w-4 h-4" />
                                                        <span>
                                                            {student.affectedClasses}{" "}
                                                            {t("classes", "คลาส")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        <span>
                                                            {student.affectedNotes}{" "}
                                                            {t("notes", "บันทึก")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedTargetId === student._id && (
                                                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Merge Preview (if target selected) */}
                    {selectedTarget && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-blue-900 dark:text-blue-100 font-medium mb-2">
                                        {t("Merge Preview", "ตัวอย่างการรวม")}
                                    </p>
                                    <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                                        <li>
                                            ✅{" "}
                                            {t(
                                                `${selectedTarget.affectedClasses} classes will be transferred`,
                                                `จะถ่ายโอน ${selectedTarget.affectedClasses} คลาส`
                                            )}
                                        </li>
                                        <li>
                                            ✅{" "}
                                            {t(
                                                `${selectedTarget.affectedNotes} notes will be transferred`,
                                                `จะถ่ายโอน ${selectedTarget.affectedNotes} บันทึก`
                                            )}
                                        </li>
                                        <li>
                                            ✅{" "}
                                            {t(
                                                "All teacher logs will be updated",
                                                "จะอัปเดตบันทึกครูทั้งหมด"
                                            )}
                                        </li>
                                        <li>
                                            ⚠️{" "}
                                            {t(
                                                "Source student will be soft-deleted (can be restored by admin)",
                                                "นักเรียนต้นทางจะถูกลบแบบ soft-delete (ผู้ดูแลระบบสามารถกู้คืนได้)"
                                            )}
                                        </li>
                                        <li>
                                            📝{" "}
                                            {t(
                                                "Complete audit trail will be maintained",
                                                "จะเก็บประวัติการตรวจสอบไว้ครบถ้วน"
                                            )}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t(
                                `Reason for merge (required, minimum ${STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH} characters)`,
                                `เหตุผลในการรวม (จำเป็น, อย่างน้อย ${STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH} ตัวอักษร)`
                            )}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t(
                                "e.g., Duplicate student record with same name and grade",
                                "เช่น ข้อมูลนักเรียนซ้ำซ้อนที่มีชื่อและระดับชั้นเดียวกัน"
                            )}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {reason.length}/{STUDENT_MERGE_CONSTANTS.MAX_REASON_LENGTH} {t("characters", "ตัวอักษร")}
                            {reason.length < STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH && reason.length > 0 && (
                                <span className="text-red-500 ml-2">
                                    {t(
                                        `(minimum ${STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH} characters)`,
                                        `(อย่างน้อย ${STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH} ตัวอักษร)`
                                    )}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-red-900 dark:text-red-100 font-medium">
                                        {t("Error", "ข้อผิดพลาด")}
                                    </p>
                                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            {t("Cancel", "ยกเลิก")}
                        </button>
                        <button
                            onClick={handleMerge}
                            disabled={!selectedTargetId || reason.trim().length < STUDENT_MERGE_CONSTANTS.MIN_REASON_LENGTH || isSubmitting}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t("Merging...", "กำลังรวม...")}
                                </>
                            ) : (
                                <>
                                    <GitMerge className="w-4 h-4" />
                                    {t("Merge Students", "รวมนักเรียน")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
