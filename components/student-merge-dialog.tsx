"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Check, RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface StudentMergeDialogProps {
    sourceStudentId: Id<"students">; // Student to merge (will be deleted)
    targetStudentId?: Id<"students">; // Student to keep (optional - can select in UI)
    currentUserId: Id<"users">;
    onClose: () => void;
    onSuccess: () => void;
}

export function StudentMergeDialog({
    sourceStudentId,
    targetStudentId: initialTargetId,
    currentUserId,
    onClose,
    onSuccess,
}: StudentMergeDialogProps) {
    const { t } = useLanguage();
    const sourceStudent = useQuery(api.students.getById, { id: sourceStudentId });
    const mergeStudents = useMutation(api.students.mergeStudents);
    
    const [targetStudentId, setTargetStudentId] = useState<Id<"students"> | "">(initialTargetId || "");
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Get potential duplicates to offer as merge targets
    const potentialDuplicates = useQuery(
        api.studentWatchlist.findPotentialDuplicates,
        sourceStudent ? { studentId: sourceStudentId } : "skip"
    );

    const targetStudent = useQuery(
        api.students.getById,
        targetStudentId ? { id: targetStudentId as Id<"students"> } : "skip"
    );

    if (!sourceStudent) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    const toggleField = (field: string) => {
        const newSet = new Set(selectedFields);
        if (newSet.has(field)) {
            newSet.delete(field);
        } else {
            newSet.add(field);
        }
        setSelectedFields(newSet);
    };

    const handleMerge = async () => {
        setError("");

        if (!targetStudentId) {
            setError(t("Please select a target student", "กรุณาเลือกนักเรียนเป้าหมาย"));
            return;
        }

        if (targetStudentId === sourceStudentId) {
            setError(t("Cannot merge student with itself", "ไม่สามารถรวมนักเรียนกับตัวเองได้"));
            return;
        }

        setIsSubmitting(true);

        try {
            const fieldsToKeep: Record<string, boolean> = {};
            selectedFields.forEach((field) => {
                fieldsToKeep[field] = true;
            });

            const result = await mergeStudents({
                targetStudentId: targetStudentId as Id<"students">,
                sourceStudentId,
                mergedBy: currentUserId,
                fieldsToKeep,
            });

            toast.success(
                `Successfully merged students. ${result.classesUpdated} classes updated.`,
                `รวมนักเรียนสำเร็จ อัปเดต ${result.classesUpdated} คลาส`
            );

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to merge students");
            toast.error(
                err instanceof Error ? err.message : "Failed to merge students",
                "ไม่สามารถรวมนักเรียนได้"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFieldComparison = (
        label: string,
        labelTh: string,
        field: keyof Doc<"students">,
        sourceValue: string | number | undefined,
        targetValue: string | number | undefined
    ) => {
        const sourceStr = sourceValue?.toString() || "";
        const targetStr = targetValue?.toString() || "";
        const isDifferent = sourceStr !== targetStr;
        const hasSourceValue = !!sourceValue;

        if (!isDifferent && !hasSourceValue) return null; // Don't show if both empty

        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t(label, labelTh)}
                    </span>
                    {isDifferent && hasSourceValue && (
                        <button
                            onClick={() => toggleField(field as string)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                selectedFields.has(field as string)
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                        >
                            {selectedFields.has(field as string) ? (
                                <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" /> {t("Use Source", "ใช้ต้นทาง")}
                                </span>
                            ) : (
                                t("Use Target", "ใช้เป้าหมาย")
                            )}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`p-2 rounded ${isDifferent ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-900/50"}`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t("Source (will be deleted)", "ต้นทาง (จะถูกลบ)")}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {sourceStr || <span className="text-gray-400 italic">{t("Empty", "ว่างเปล่า")}</span>}
                        </div>
                    </div>
                    <div className={`p-2 rounded ${isDifferent ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-900/50"}`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t("Target (will be kept)", "เป้าหมาย (จะถูกเก็บ)")}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {targetStr || <span className="text-gray-400 italic">{t("Empty", "ว่างเปล่า")}</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6" />
                        <h2 className="text-xl font-bold">
                            {t("Merge Students", "รวมข้อมูลนักเรียน")}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Target Selection */}
                    {!initialTargetId && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("Select Target Student (to keep)", "เลือกนักเรียนเป้าหมาย (เพื่อเก็บไว้)")}
                            </label>
                            <select
                                value={targetStudentId}
                                onChange={(e) => setTargetStudentId(e.target.value as Id<"students">)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">
                                    {t("-- Select a student --", "-- เลือกนักเรียน --")}
                                </option>
                                {potentialDuplicates?.map((dup) => (
                                    <option key={dup.student._id} value={dup.student._id}>
                                        {dup.student.firstName} {dup.student.lastName} ({dup.student.grade}
                                        {dup.student.class}) - {dup.matchCount} {t("matches", "ตรงกัน")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Student Info Display */}
                    {targetStudent && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                                <div className="text-red-600 dark:text-red-400">
                                    {sourceStudent.firstName} {sourceStudent.lastName}
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                                <div className="text-green-600 dark:text-green-400">
                                    {targetStudent.firstName} {targetStudent.lastName}
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                                {t(
                                    "Source student will be merged into target and deleted",
                                    "นักเรียนต้นทางจะถูกรวมเข้ากับเป้าหมายและลบ"
                                )}
                            </p>
                        </div>
                    )}

                    {/* Field Comparison */}
                    {targetStudent && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                {t("Field Comparison (select source fields to keep)", "เปรียบเทียบฟิลด์ (เลือกฟิลด์จากต้นทางที่ต้องการเก็บ)")}
                            </h3>
                            
                            {renderFieldComparison("Nickname", "ชื่อเล่น", "nickname", sourceStudent.nickname, targetStudent.nickname)}
                            {renderFieldComparison("Guardian Name", "ชื่อผู้ปกครอง", "guardianName", sourceStudent.guardianName, targetStudent.guardianName)}
                            {renderFieldComparison("Guardian Phone", "เบอร์ผู้ปกครอง", "guardianPhone", sourceStudent.guardianPhone, targetStudent.guardianPhone)}
                            {renderFieldComparison("Guardian Email", "อีเมลผู้ปกครอง", "guardianEmail", sourceStudent.guardianEmail, targetStudent.guardianEmail)}
                            {renderFieldComparison("Date of Birth", "วันเกิด", "dateOfBirth", sourceStudent.dateOfBirth ? new Date(sourceStudent.dateOfBirth).toLocaleDateString() : undefined, targetStudent.dateOfBirth ? new Date(targetStudent.dateOfBirth).toLocaleDateString() : undefined)}
                            {renderFieldComparison("Area", "พื้นที่", "area", sourceStudent.area, targetStudent.area)}
                            {renderFieldComparison("Parent Name", "ชื่อพ่อแม่", "parentName", sourceStudent.parentName, targetStudent.parentName)}
                            {renderFieldComparison("Parent Phone", "เบอร์พ่อแม่", "parentPhone", sourceStudent.parentPhone, targetStudent.parentPhone)}
                            {renderFieldComparison("Parent Email", "อีเมลพ่อแม่", "parentEmail", sourceStudent.parentEmail, targetStudent.parentEmail)}
                            {renderFieldComparison("Secondary Parent Name", "ชื่อพ่อแม่คนที่สอง", "secondaryParentName", sourceStudent.secondaryParentName, targetStudent.secondaryParentName)}
                            {renderFieldComparison("Secondary Parent Phone", "เบอร์พ่อแม่คนที่สอง", "secondaryParentPhone", sourceStudent.secondaryParentPhone, targetStudent.secondaryParentPhone)}
                            {renderFieldComparison("Allergies", "อาการแพ้", "allergies", sourceStudent.allergies, targetStudent.allergies)}
                            {renderFieldComparison("Special Needs", "ความต้องการพิเศษ", "specialNeeds", sourceStudent.specialNeeds, targetStudent.specialNeeds)}
                            {renderFieldComparison("Medical Notes", "บันทึกทางการแพทย์", "medicalNotes", sourceStudent.medicalNotes, targetStudent.medicalNotes)}
                            {renderFieldComparison("Notes", "หมายเหตุ", "notes", sourceStudent.notes, targetStudent.notes)}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={handleMerge}
                        disabled={isSubmitting || !targetStudentId}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSubmitting ? "animate-spin" : ""}`} />
                        {isSubmitting ? t("Merging...", "กำลังรวม...") : t("Merge Students", "รวมนักเรียน")}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                        {t("Cancel", "ยกเลิก")}
                    </button>
                </div>
            </div>
        </div>
    );
}
