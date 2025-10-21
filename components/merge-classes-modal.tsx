"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Check, X } from "lucide-react";
import { useState } from "react";

interface MergeClassesModalProps {
    userId: Id<"users">;
    classes: Array<{
        _id: Id<"classes">;
        studentId: Id<"students">;
        additionalStudentIds?: Id<"students">[];
        locationId?: Id<"locations">;
        scheduledDate: number;
        status: string;
        student: Doc<"students"> | null;
        additionalStudents?: (Doc<"students"> | null)[];
        location: Doc<"locations"> | null;
        teacherId: Id<"users">;
        schoolId: Id<"schools">;
    }>;
    onClose: () => void;
    onSuccess: () => void;
}

export function MergeClassesModal({
    userId,
    classes,
    onClose,
    onSuccess,
}: MergeClassesModalProps) {
    const { t } = useLanguage();
    const mergeClasses = useMutation(api.classes.mergeClasses);

    const [targetClassId, setTargetClassId] = useState<Id<"classes"> | "">("");
    const [selectedSourceIds, setSelectedSourceIds] = useState<Id<"classes">[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Filter classes to only show those that can be merged
    // Group by teacher, school, location, and scheduled date
    const groupedClasses = new Map<string, typeof classes>();

    for (const cls of classes) {
        const key = `${cls.teacherId}_${cls.schoolId}_${cls.locationId}_${cls.scheduledDate}`;
        if (!groupedClasses.has(key)) {
            groupedClasses.set(key, []);
        }
        groupedClasses.get(key)!.push(cls);
    }

    // Only show groups with 2+ classes
    const mergeableGroups = Array.from(groupedClasses.entries())
        .filter(([, group]) => group.length > 1)
        .map(([key, group]) => ({ key, classes: group }));

    const handleToggleSource = (classId: Id<"classes">) => {
        if (selectedSourceIds.includes(classId)) {
            setSelectedSourceIds(selectedSourceIds.filter(id => id !== classId));
        } else {
            setSelectedSourceIds([...selectedSourceIds, classId]);
        }
    };

    const handleMerge = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!targetClassId) {
            setError(t("Please select a target class", "กรุณาเลือกคลาสหลัก"));
            return;
        }

        if (selectedSourceIds.length === 0) {
            setError(t("Please select at least one class to merge", "กรุณาเลือกอย่างน้อยหนึ่งคลาสที่จะรวม"));
            return;
        }

        setLoading(true);
        try {
            await mergeClasses({
                userId,
                targetClassId: targetClassId as Id<"classes">,
                sourceClassIds: selectedSourceIds,
            });
            toast.success("Classes merged successfully!", "รวมคลาสสำเร็จ!");
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to merge classes");
        } finally {
            setLoading(false);
        }
    };

    if (mergeableGroups.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">
                            {t("Merge Classes", "รวมคลาส")}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t(
                                "No classes available to merge. Classes can only be merged if they have the same teacher, school, location, and scheduled date/time.",
                                "ไม่มีคลาสที่สามารถรวมได้ คลาสสามารถรวมได้เฉพาะเมื่อมีครูเดียวกัน โรงเรียนเดียวกัน สถานที่เดียวกัน และวันเวลาเดียวกัน"
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {t("Merge Classes", "รวมคลาส")}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleMerge} className="p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            {t(
                                "Merge multiple classes scheduled at the same time and location into one class with multiple students. The target class will be kept, and source classes will be deleted.",
                                "รวมหลายคลาสที่กำหนดไว้ในเวลาและสถานที่เดียวกันเป็นหนึ่งคลาสที่มีหลายนักเรียน คลาสหลักจะถูกเก็บไว้ และคลาสที่รวมจะถูกลบ"
                            )}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
                        </div>
                    )}

                    {mergeableGroups.map((group, groupIndex) => {
                        const firstClass = group.classes[0];
                        const location = firstClass.location;
                        const dateStr = new Date(firstClass.scheduledDate).toLocaleString();

                        return (
                            <div key={group.key} className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">
                                        {t("Group", "กลุ่ม")} {groupIndex + 1}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>{t("Location:", "สถานที่:")}</strong> {location?.name || t("Unknown", "ไม่ทราบ")}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>{t("Date/Time:", "วัน/เวลา:")}</strong> {dateStr}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>{t("Total Classes:", "จำนวนคลาส:")}</strong> {group.classes.length}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("1. Select Target Class (Keep this one):", "1. เลือกคลาสหลัก (เก็บคลาสนี้):")}
                                    </label>
                                    <div className="space-y-2">
                                        {group.classes.map((cls) => {
                                            const studentCount = 1 + (cls.additionalStudents?.length || 0);
                                            const allStudents = [
                                                cls.student,
                                                ...(cls.additionalStudents || [])
                                            ].filter(Boolean);

                                            return (
                                                <label
                                                    key={cls._id}
                                                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${targetClassId === cls._id
                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="targetClass"
                                                        value={cls._id}
                                                        checked={targetClassId === cls._id}
                                                        onChange={(e) => setTargetClassId(e.target.value as Id<"classes">)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {allStudents.map((s, i) => (
                                                                <span key={s?._id}>
                                                                    {s?.firstName} {s?.lastName}
                                                                    {i < allStudents.length - 1 ? ", " : ""}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {studentCount} {t("student(s)", "นักเรียน")}
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {targetClassId && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t("2. Select Classes to Merge (Delete these):", "2. เลือกคลาสที่จะรวม (ลบคลาสเหล่านี้):")}
                                        </label>
                                        <div className="space-y-2">
                                            {group.classes
                                                .filter(cls => cls._id !== targetClassId)
                                                .map((cls) => {
                                                    const studentCount = 1 + (cls.additionalStudents?.length || 0);
                                                    const allStudents = [
                                                        cls.student,
                                                        ...(cls.additionalStudents || [])
                                                    ].filter(Boolean);

                                                    return (
                                                        <label
                                                            key={cls._id}
                                                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedSourceIds.includes(cls._id)
                                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSourceIds.includes(cls._id)}
                                                                onChange={() => handleToggleSource(cls._id)}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="font-medium">
                                                                    {allStudents.map((s, i) => (
                                                                        <span key={s?._id}>
                                                                            {s?.firstName} {s?.lastName}
                                                                            {i < allStudents.length - 1 ? ", " : ""}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {studentCount} {t("student(s)", "นักเรียน")}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading || !targetClassId || selectedSourceIds.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Check className="w-5 h-5" />
                            {loading ? t("Merging...", "กำลังรวม...") : t("Merge Classes", "รวมคลาส")}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                            {t("Cancel", "ยกเลิก")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
