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
        schoolId?: Id<"schools">; // Optional for provider classes
    }>;
    onClose: () => void;
    onSuccess: () => void;
}

// Per-group merge selection state
interface GroupMergeSelection {
    enabled: boolean;
    targetClassId: Id<"classes"> | "";
    sourceClassIds: Id<"classes">[];
    status?: "pending" | "merging" | "success" | "error";
    error?: string;
}

export function MergeClassesModal({
    userId,
    classes,
    onClose,
    onSuccess,
}: MergeClassesModalProps) {
    const { t } = useLanguage();
    const mergeClasses = useMutation(api.classes.mergeClasses);

    // Per-group selection state: Map<groupKey, GroupMergeSelection>
    const [groupSelections, setGroupSelections] = useState<Map<string, GroupMergeSelection>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Filter classes to only show those that can be merged
    // Group by teacher, school, location, and scheduled date WITH TIME TOLERANCE
    // CRITICAL FIX: Use 5-minute time window (same as conflict detection) instead of exact timestamp
    const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes in milliseconds
    const groupedClasses = new Map<string, typeof classes>();

    for (const cls of classes) {
        // Round scheduledDate to nearest 5-minute interval for grouping
        // This allows classes at 3:00:00 PM and 3:00:30 PM to be grouped together
        const roundedTime = Math.floor(cls.scheduledDate / TIME_TOLERANCE) * TIME_TOLERANCE;
        const key = `${cls.teacherId}_${cls.schoolId}_${cls.locationId}_${roundedTime}`;
        if (!groupedClasses.has(key)) {
            groupedClasses.set(key, []);
        }
        groupedClasses.get(key)!.push(cls);
    }

    // Only show groups with 2+ classes
    const mergeableGroups = Array.from(groupedClasses.entries())
        .filter(([, group]) => group.length > 1)
        .map(([key, group]) => ({ key, classes: group }));

    // Toggle group enabled/disabled
    const handleToggleGroup = (groupKey: string) => {
        setGroupSelections(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(groupKey);
            if (current?.enabled) {
                // Disable group
                newMap.set(groupKey, {
                    enabled: false,
                    targetClassId: "",
                    sourceClassIds: [],
                });
            } else {
                // Enable group
                newMap.set(groupKey, {
                    enabled: true,
                    targetClassId: "",
                    sourceClassIds: [],
                });
            }
            return newMap;
        });
    };

    const handleSetTarget = (groupKey: string, targetId: Id<"classes">) => {
        setGroupSelections(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(groupKey) || { enabled: true, targetClassId: "", sourceClassIds: [] };
            newMap.set(groupKey, {
                ...current,
                targetClassId: targetId,
                sourceClassIds: [], // Clear sources when target changes
            });
            return newMap;
        });
    };

    const handleToggleSource = (groupKey: string, classId: Id<"classes">) => {
        setGroupSelections(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(groupKey) || { enabled: true, targetClassId: "", sourceClassIds: [] };
            const sourceIds = current.sourceClassIds.includes(classId)
                ? current.sourceClassIds.filter(id => id !== classId)
                : [...current.sourceClassIds, classId];
            newMap.set(groupKey, {
                ...current,
                sourceClassIds: sourceIds,
            });
            return newMap;
        });
    };

    const handleMerge = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Get all enabled groups with valid selections
        const groupsToMerge = mergeableGroups.filter(group => {
            const selection = groupSelections.get(group.key);
            return selection?.enabled && 
                   selection.targetClassId && 
                   selection.sourceClassIds.length > 0;
        });

        if (groupsToMerge.length === 0) {
            setError(t(
                "Please enable at least one group and select target and source classes",
                "กรุณาเปิดใช้งานอย่างน้อยหนึ่งกลุ่มและเลือกคลาสหลักและคลาสที่จะรวม"
            ));
            return;
        }

        setLoading(true);

        // Merge groups sequentially
        let successCount = 0;
        let failCount = 0;

        for (const group of groupsToMerge) {
            const selection = groupSelections.get(group.key);
            
            // Defensive check: skip if selection is undefined
            if (!selection) {
                console.error(`Selection missing for group ${group.key}`);
                continue;
            }
            
            // Update status to merging
            setGroupSelections(prev => {
                const newMap = new Map(prev);
                newMap.set(group.key, { ...selection, status: "merging" });
                return newMap;
            });

            try {
                await mergeClasses({
                    userId,
                    targetClassId: selection.targetClassId as Id<"classes">,
                    sourceClassIds: selection.sourceClassIds,
                });
                
                // Update status to success
                setGroupSelections(prev => {
                    const newMap = new Map(prev);
                    newMap.set(group.key, { ...selection, status: "success" });
                    return newMap;
                });
                successCount++;
            } catch (err) {
                console.error(`Merge failed for group ${group.key}:`, err);
                const errorMessage = err instanceof Error ? err.message : "Failed to merge classes";
                
                // Update status to error
                setGroupSelections(prev => {
                    const newMap = new Map(prev);
                    newMap.set(group.key, { ...selection, status: "error", error: errorMessage });
                    return newMap;
                });
                failCount++;
            }
        }

        setLoading(false);

        const AUTO_CLOSE_DELAY_MS = 1000;

        // Show summary toast
        if (successCount > 0 && failCount === 0) {
            toast.success(
                `Successfully merged ${successCount} group(s)!`,
                `รวมคลาสสำเร็จ ${successCount} กลุ่ม!`
            );
            onSuccess();
            // Auto-close after delay
            setTimeout(() => onClose(), AUTO_CLOSE_DELAY_MS);
        } else if (successCount > 0 && failCount > 0) {
            toast.warning(
                `Merged ${successCount} group(s), ${failCount} failed`,
                `รวมคลาสสำเร็จ ${successCount} กลุ่ม, ล้มเหลว ${failCount} กลุ่ม`
            );
            onSuccess(); // Still call success to refresh the list
        } else {
            toast.error(
                "All merges failed. Check error messages below.",
                "การรวมคลาสล้มเหลวทั้งหมด ตรวจสอบข้อความข้อผิดพลาดด้านล่าง"
            );
        }
    };

    if (mergeableGroups.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                    {/* Header - Sticky */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                    {/* Content - Scrollable */}
                    <div className="overflow-y-auto flex-grow p-4 md:p-6">
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
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh]">
                {/* Header - Sticky */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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

                <form onSubmit={handleMerge} className="flex flex-col flex-grow overflow-hidden">
                    {/* Content - Scrollable (SINGLE scroll area) */}
                    <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-4 md:space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                {t(
                                    "Select one or more groups to merge. For each group, choose a target class (which will be kept) and source classes (which will be deleted). All students will be combined into the target class.",
                                    "เลือกหนึ่งหรือหลายกลุ่มที่จะรวม สำหรับแต่ละกลุ่ม เลือกคลาสหลัก (ที่จะเก็บไว้) และคลาสที่จะรวม (ที่จะถูกลบ) นักเรียนทั้งหมดจะถูกรวมเข้ากับคลาสหลัก"
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
                            const selection = groupSelections.get(group.key) || { 
                                enabled: false, 
                                targetClassId: "", 
                                sourceClassIds: [] 
                            };
                            const isGroupEnabled = selection.enabled;
                            const targetClassId = selection.targetClassId;
                            const selectedSourceIds = selection.sourceClassIds;

                            return (
                                <div 
                                    key={group.key} 
                                    className={`space-y-4 border-2 rounded-xl p-4 transition-all ${
                                        isGroupEnabled 
                                            ? "border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10" 
                                            : "border-gray-200 dark:border-gray-700"
                                    }`}
                                >
                                    {/* Group Header with Enable Checkbox */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isGroupEnabled}
                                                onChange={() => handleToggleGroup(group.key)}
                                                className="mt-1.5 w-5 h-5 cursor-pointer"
                                                disabled={loading}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                                    {t("Group", "กลุ่ม")} {groupIndex + 1}
                                                    {selection.status === "merging" && (
                                                        <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full">
                                                            {t("Merging...", "กำลังรวม...")}
                                                        </span>
                                                    )}
                                                    {selection.status === "success" && (
                                                        <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                                                            {t("✓ Merged", "✓ รวมแล้ว")}
                                                        </span>
                                                    )}
                                                    {selection.status === "error" && (
                                                        <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full">
                                                            {t("✗ Failed", "✗ ล้มเหลว")}
                                                        </span>
                                                    )}
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
                                                {selection.status === "error" && selection.error && (
                                                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                                        <strong>{t("Error:", "ข้อผิดพลาด:")}</strong> {selection.error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Only show selection UI if group is enabled */}
                                    {isGroupEnabled && (
                                        <>
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
                                                                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                                    targetClassId === cls._id
                                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`targetClass_${group.key}`}
                                                                    value={cls._id}
                                                                    checked={targetClassId === cls._id}
                                                                    onChange={(e) => handleSetTarget(group.key, e.target.value as Id<"classes">)}
                                                                    className="mt-1"
                                                                    disabled={loading}
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
                                                                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                                            selectedSourceIds.includes(cls._id)
                                                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedSourceIds.includes(cls._id)}
                                                                            onChange={() => handleToggleSource(group.key, cls._id)}
                                                                            className="mt-1"
                                                                            disabled={loading}
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
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Footer - Sticky */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading || mergeableGroups.every(g => {
                                    const sel = groupSelections.get(g.key);
                                    return !sel?.enabled || !sel?.targetClassId || sel?.sourceClassIds.length === 0;
                                })}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                <Check className="w-5 h-5" />
                                {loading ? t("Merging...", "กำลังรวม...") : t("Merge Selected Groups", "รวมกลุ่มที่เลือก")}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
