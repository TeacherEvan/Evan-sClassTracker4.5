"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { Check, CheckSquare, Clock, User, X } from "lucide-react";
import { useMemo, useState } from "react";

interface ModeratorApprovalWizardProps {
    userId: Id<"users">;
    schoolId: Id<"schools">;
    onComplete: () => void;
    onClose: () => void;
}

type WizardStep = "queue" | "review" | "summary";

interface PendingClass {
    _id: Id<"classes">;
    teacherId: Id<"users">;
    teacherName: string;
    studentName: string;
    schoolName: string;
    scheduledDate: number;
    createdAt: number;
    duration: number;
}

export function ModeratorApprovalWizard({
    userId,
    schoolId,
    onComplete,
    onClose,
}: ModeratorApprovalWizardProps) {
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState<WizardStep>("queue");
    const [selectedClassIds, setSelectedClassIds] = useState<Set<Id<"classes">>>(new Set());
    const [rejectionNotes, setRejectionNotes] = useState<Map<Id<"classes">, string>>(new Map());
    const [filterTeacherId, setFilterTeacherId] = useState<Id<"users"> | "">("");
    const [processingBulk, setProcessingBulk] = useState(false);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);

    // Query pending classes for the moderator's school
    const pendingClasses = useQuery(api.classes.list, {
        schoolId,
        status: "pending",
    });

    // Get all students, teachers, and schools for display
    const allStudents = useQuery(api.students.list, { schoolId });
    const allTeachers = useQuery(api.users.list, { role: "teacher" });
    const allSchools = useQuery(api.schools.list, {});

    // Mutations
    const approveClass = useMutation(api.classes.approve);
    const rejectClass = useMutation(api.classes.reject);

    // ✅ OPTIMIZED: Memoize pending class details
    const pendingClassDetails = useMemo(() => {
        if (!pendingClasses || !allStudents || !allTeachers || !allSchools) return [];

        return pendingClasses
            .map((cls) => {
                const student = allStudents.find(s => s._id === cls.studentId);
                const teacher = allTeachers.find(t => t._id === cls.teacherId);
                const school = allSchools.find(s => s._id === cls.schoolId);

                if (!student || !teacher || !school) return null;

                return {
                    _id: cls._id,
                    teacherName: teacher.username,
                    teacherId: cls.teacherId,
                    studentName: student.nickname || `${student.firstName} ${student.lastName}`,
                    schoolName: school.name,
                    scheduledDate: cls.scheduledDate,
                    createdAt: cls.createdAt,
                    duration: cls.duration || 60,
                };
            })
            .filter((cls): cls is PendingClass => cls !== null)
            .sort((a, b) => a.scheduledDate - b.scheduledDate); // Sort by upcoming first
    }, [pendingClasses, allStudents, allTeachers, allSchools]);

    // ✅ OPTIMIZED: Memoize filtered classes
    const filteredClasses = useMemo(() => {
        if (!filterTeacherId) return pendingClassDetails;
        return pendingClassDetails.filter(cls => cls.teacherId === filterTeacherId);
    }, [pendingClassDetails, filterTeacherId]);

    // ✅ OPTIMIZED: Memoize unique teachers for filter
    const uniqueTeachers = useMemo(() => {
        const teacherIds = new Set(pendingClassDetails.map(cls => cls.teacherId));
        return allTeachers?.filter(t => teacherIds.has(t._id)) || [];
    }, [pendingClassDetails, allTeachers]);

    const toggleClassSelection = (classId: Id<"classes">) => {
        const newSelection = new Set(selectedClassIds);
        if (newSelection.has(classId)) {
            newSelection.delete(classId);
        } else {
            newSelection.add(classId);
        }
        setSelectedClassIds(newSelection);
    };

    const selectAll = () => {
        setSelectedClassIds(new Set(filteredClasses.map(cls => cls._id)));
    };

    const deselectAll = () => {
        setSelectedClassIds(new Set());
    };

    const handleBulkApprove = async () => {
        if (selectedClassIds.size === 0) return;

        setProcessingBulk(true);
        let approved = 0;

        try {
            const approvalPromises = Array.from(selectedClassIds).map(async (classId) => {
                try {
                    await approveClass({ classId, userId });
                    approved++;
                } catch (error) {
                    console.error(`Failed to approve class ${classId}:`, error);
                }
            });

            await Promise.all(approvalPromises);

            setApprovedCount(approved);
            setSelectedClassIds(new Set());
            setCurrentStep("summary");

            toast.success(
                `${approved} class(es) approved!`,
                `อนุมัติ ${approved} คลาสแล้ว!`
            );
        } catch (error) {
            console.error("Error in bulk approval:", error);
            toast.error("Failed to approve some classes", "การอนุมัติบางคลาสไม่สำเร็จ");
        } finally {
            setProcessingBulk(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedClassIds.size === 0) return;

        setProcessingBulk(true);
        let rejected = 0;

        try {
            const rejectionPromises = Array.from(selectedClassIds).map(async (classId) => {
                try {
                    const notes = rejectionNotes.get(classId) || "Rejected by moderator";
                    await rejectClass({ classId, userId, reason: notes });
                    rejected++;
                } catch (error) {
                    console.error(`Failed to reject class ${classId}:`, error);
                }
            });

            await Promise.all(rejectionPromises);

            setRejectedCount(rejected);
            setSelectedClassIds(new Set());
            setRejectionNotes(new Map());
            setCurrentStep("summary");

            toast.success(
                `${rejected} class(es) rejected`,
                `ปฏิเสธ ${rejected} คลาสแล้ว`
            );
        } catch (error) {
            console.error("Error in bulk rejection:", error);
            toast.error("Failed to reject some classes", "การปฏิเสธบางคลาสไม่สำเร็จ");
        } finally {
            setProcessingBulk(false);
        }
    };

    const handleSingleApprove = async (classId: Id<"classes">) => {
        try {
            await approveClass({ classId, userId });
            toast.success("Class approved", "อนุมัติคลาสแล้ว");
        } catch (error) {
            console.error("Error approving class:", error);
            toast.error("Failed to approve class", "การอนุมัติคลาสไม่สำเร็จ");
        }
    };

    const handleSingleReject = async (classId: Id<"classes">) => {
        const notes = rejectionNotes.get(classId) || "";
        if (!notes.trim()) {
            toast.warning("Please add a reason for rejection", "กรุณาระบุเหตุผลในการปฏิเสธ");
            return;
        }

        try {
            await rejectClass({ classId, userId, reason: notes });
            toast.success("Class rejected", "ปฏิเสธคลาสแล้ว");
            setRejectionNotes(prev => {
                const newMap = new Map(prev);
                newMap.delete(classId);
                return newMap;
            });
        } catch (error) {
            console.error("Error rejecting class:", error);
            toast.error("Failed to reject class", "การปฏิเสธคลาสไม่สำเร็จ");
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case "queue":
                return (
                    <div className="space-y-4">
                        {/* Header with stats */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                        {t("Pending Approvals", "การอนุมัติที่รอดำเนินการ")}
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        {filteredClasses.length} {t("classes waiting for approval", "คลาสรอการอนุมัติ")}
                                    </p>
                                </div>
                                <CheckSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        {/* Teacher filter */}
                        {uniqueTeachers.length > 1 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t("Filter by Teacher", "กรองตามครู")}
                                </label>
                                <select
                                    value={filterTeacherId}
                                    onChange={(e) => setFilterTeacherId(e.target.value as Id<"users"> | "")}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">{t("All Teachers", "ครูทั้งหมด")}</option>
                                    {uniqueTeachers.map(teacher => (
                                        <option key={teacher._id} value={teacher._id}>
                                            {teacher.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Bulk actions */}
                        {filteredClasses.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAll}
                                    className="flex-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    {t("Select All", "เลือกทั้งหมด")}
                                </button>
                                <button
                                    onClick={deselectAll}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t("Deselect All", "ยกเลิกทั้งหมด")}
                                </button>
                            </div>
                        )}

                        {/* Class list */}
                        {filteredClasses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{t("No pending approvals", "ไม่มีการอนุมัติที่รอดำเนินการ")}</p>
                                <p className="text-sm mt-2">
                                    {t("All caught up! Great job! 🎉", "ทำงานเสร็จหมดแล้ว! เยี่ยมมาก! 🎉")}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredClasses.map((cls) => (
                                    <div
                                        key={cls._id}
                                        className={`border rounded-lg p-4 transition-all ${
                                            selectedClassIds.has(cls._id)
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedClassIds.has(cls._id)}
                                                onChange={() => toggleClassSelection(cls._id)}
                                                className="mt-1 w-5 h-5 rounded border-gray-300"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {cls.studentName}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3" />
                                                        {t("Teacher:", "ครู:")} {cls.teacherName}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(cls.scheduledDate).toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {t("Requested:", "ขอเมื่อ:")} {new Date(cls.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSingleApprove(cls._id)}
                                                    className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                    title={t("Approve", "อนุมัติ")}
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleSingleReject(cls._id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title={t("Reject", "ปฏิเสธ")}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rejection note input (shown when hovering/selecting) */}
                                        {selectedClassIds.has(cls._id) && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <input
                                                    type="text"
                                                    value={rejectionNotes.get(cls._id) || ""}
                                                    onChange={(e) => {
                                                        const newMap = new Map(rejectionNotes);
                                                        newMap.set(cls._id, e.target.value);
                                                        setRejectionNotes(newMap);
                                                    }}
                                                    placeholder={t("Add reason if rejecting (optional)", "เพิ่มเหตุผลหากปฏิเสธ (ไม่บังคับ)")}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bulk action buttons */}
                        {selectedClassIds.size > 0 && (
                            <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6 -mb-6 pb-6">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleBulkApprove}
                                        disabled={processingBulk}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Check className="w-5 h-5" />
                                        {t(`Approve ${selectedClassIds.size}`, `อนุมัติ ${selectedClassIds.size}`)}
                                    </button>
                                    <button
                                        onClick={handleBulkReject}
                                        disabled={processingBulk}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                        {t(`Reject ${selectedClassIds.size}`, `ปฏิเสธ ${selectedClassIds.size}`)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "summary":
                return (
                    <div className="space-y-4">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t("Processing Complete!", "ดำเนินการเสร็จสิ้น!")}
                            </h3>
                            <div className="text-gray-600 dark:text-gray-400 space-y-2">
                                {approvedCount > 0 && (
                                    <p className="text-green-600 dark:text-green-400">
                                        ✓ {approvedCount} {t("class(es) approved", "คลาสได้รับการอนุมัติ")}
                                    </p>
                                )}
                                {rejectedCount > 0 && (
                                    <p className="text-red-600 dark:text-red-400">
                                        ✗ {rejectedCount} {t("class(es) rejected", "คลาสถูกปฏิเสธ")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onComplete();
                                onClose();
                            }}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {t("Done", "เสร็จสิ้น")}
                        </button>

                        <button
                            onClick={() => {
                                setCurrentStep("queue");
                                setApprovedCount(0);
                                setRejectedCount(0);
                            }}
                            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {t("Review More", "ตรวจสอบเพิ่มเติม")}
                        </button>
                    </div>
                );
        }
    };

    const progress = currentStep === "queue" ? 50 : 100;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t("Quick Approvals", "อนุมัติด่วน")}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Review and approve pending bookings", "ตรวจสอบและอนุมัติการจองที่รอดำเนินการ")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
}
