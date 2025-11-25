"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { BarChart3, ChevronLeft, ChevronRight, Printer, Star, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface ClassCountReportWizardProps {
    userId: Id<"users">;
    userRole: "teacher" | "moderator";
    userSchoolId?: Id<"schools">;
    onComplete: (data: ClassCountReportData) => void;
    onClose: () => void;
}

export interface ClassCountReportData {
    teacherId: Id<"users">;
    startDate: number;
    endDate: number;
    action: "view" | "print";
}

type WizardStep = "teacher" | "date" | "action";

export function ClassCountReportWizard({
    userId,
    userRole,
    userSchoolId,
    onComplete,
    onClose,
}: ClassCountReportWizardProps) {
    const { t } = useLanguage();

    // ✅ NEW: Get user's wizard preferences for personalization
    const wizardPreferences = useQuery(api.users.getWizardPreferences, { userId });
    const updateWizardPrefs = useMutation(api.users.updateWizardPreferences);

    // ✅ NEW: For teachers, skip teacher selection step
    const isTeacher = userRole === "teacher";
    const initialStep: WizardStep = isTeacher ? "date" : "teacher";

    const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">(isTeacher ? userId : "");

    // ✅ NEW: Initialize dates with last report date range if available
    const getDefaultDates = () => {
        if (wizardPreferences?.lastReportDateRange) {
            return {
                start: new Date(wizardPreferences.lastReportDateRange.startDate).toISOString().split('T')[0],
                end: new Date(wizardPreferences.lastReportDateRange.endDate).toISOString().split('T')[0]
            };
        }
        // Default to last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const defaultDates = useMemo(getDefaultDates, [wizardPreferences]);
    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);

    // ✅ NEW: Date validation - end date must be >= start date
    const dateError = useMemo(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) {
                return t("End date must be after start date", "วันที่สิ้นสุดต้องหลังจากวันที่เริ่มต้น");
            }
        }
        return null;
    }, [startDate, endDate, t]);

    // ✅ NEW: Calculate progress
    const steps: WizardStep[] = isTeacher ? ["date", "action"] : ["teacher", "date", "action"];
    const currentStepIndex = steps.indexOf(currentStep);
    const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);

    // ✅ NEW: Save preferences callback
    const savePreferences = useCallback(async () => {
        try {
            await updateWizardPrefs({
                userId,
                preferences: {
                    recentTeacherIds: selectedTeacherId ? [selectedTeacherId] : [],
                    lastReportDateRange: {
                        startDate: new Date(startDate).getTime(),
                        endDate: new Date(endDate).getTime(),
                    },
                },
            });
        } catch (error) {
            console.warn("Failed to save wizard preferences:", error);
        }
    }, [userId, selectedTeacherId, startDate, endDate, updateWizardPrefs]);

    // Get teachers for moderator's school or all teachers for admin
    const allUsers = useQuery(api.users.list, { role: "teacher" });
    const teachers = allUsers?.filter(u => {
        if (u.role !== "teacher") return false;
        if (userRole === "moderator" && userSchoolId) {
            return u.schoolId === userSchoolId;
        }
        return true;
    });

    const handleNext = () => {
        if (currentStep === "teacher" && selectedTeacherId) {
            setCurrentStep("date");
        } else if (currentStep === "date" && startDate && endDate && !dateError) {
            setCurrentStep("action");
        }
    };

    const handleBack = () => {
        if (currentStep === "date" && !isTeacher) setCurrentStep("teacher");
        else if (currentStep === "action") setCurrentStep("date");
    };

    const handleAction = async (action: "view" | "print") => {
        // ✅ Save preferences before completing
        await savePreferences();
        onComplete({
            teacherId: selectedTeacherId as Id<"users">,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            action,
        });
    };

    const canProceed = () => {
        if (currentStep === "teacher") return !!selectedTeacherId;
        if (currentStep === "date") return !!startDate && !!endDate && !dateError;
        return false;
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case "teacher": return t("Select Teacher", "เลือกครู");
            case "date": return t("Select Date Range", "เลือกช่วงวันที่");
            case "action": return t("View or Print", "ดูหรือพิมพ์");
            default: return "";
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case "teacher":
                {
                    // ✅ Sort teachers to show recent ones first
                    const recentTeacherIds = wizardPreferences?.recentTeacherIds || [];
                    const sortedTeachers = [...(teachers || [])].sort((a, b) => {
                        const aRecent = recentTeacherIds.includes(a._id);
                        const bRecent = recentTeacherIds.includes(b._id);
                        if (aRecent && !bRecent) return -1;
                        if (!aRecent && bRecent) return 1;
                        return a.username.localeCompare(b.username);
                    });

                    return (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                {t("Choose the teacher for the class count report", "เลือกครูสำหรับรายงาน ClassCount")}
                            </p>
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users">)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                                aria-label={t("Select Teacher", "เลือกครู")}
                            >
                                <option value="">{t("-- Select Teacher --", "-- เลือกครู --")}</option>
                                {sortedTeachers.map(teacher => (
                                    <option key={teacher._id} value={teacher._id}>
                                        {recentTeacherIds.includes(teacher._id) ? "⭐ " : ""}
                                        {teacher.username}
                                    </option>
                                ))}
                            </select>
                            {recentTeacherIds.length > 0 && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    {t("Recently selected teachers", "ครูที่เลือกล่าสุด")}
                                </p>
                            )}
                        </div>
                    );
                }

            case "date":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Select the date range for the report", "เลือกช่วงวันที่สำหรับรายงาน")}
                        </p>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("Start Date", "วันที่เริ่มต้น")}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                                aria-label={t("Start Date", "วันที่เริ่มต้น")}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("End Date", "วันที่สิ้นสุด")}
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 ${dateError ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                aria-label={t("End Date", "วันที่สิ้นสุด")}
                            />
                        </div>
                        {dateError && (
                            <p className="text-sm text-red-500" role="alert">
                                {dateError}
                            </p>
                        )}
                        {wizardPreferences?.lastReportDateRange && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {t("Using your last report date range", "ใช้ช่วงวันที่รายงานล่าสุดของคุณ")}
                            </p>
                        )}
                    </div>
                );

            case "action":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Choose how to proceed with the report", "เลือกวิธีการดำเนินการกับรายงาน")}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleAction("view")}
                                className="p-6 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                            >
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                <h3 className="font-semibold text-lg">{t("View Report", "ดูรายงาน")}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {t("View the report on screen", "ดูรายงานบนหน้าจอ")}
                                </p>
                            </button>
                            <button
                                onClick={() => handleAction("print")}
                                className="p-6 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
                            >
                                <Printer className="w-12 h-12 mx-auto mb-3 text-green-600" />
                                <h3 className="font-semibold text-lg">{t("Print Report", "พิมพ์รายงาน")}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {t("Print the report to PDF", "พิมพ์รายงานเป็น PDF")}
                                </p>
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                    <div
                        className="h-full bg-purple-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t(`Step ${currentStepIndex + 1} of ${steps.length}`, `ขั้นตอนที่ ${currentStepIndex + 1} จาก ${steps.length}`)}
                    />
                </div>

                {/* Header */}
                <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                        <div>
                            <h2 className="text-xl font-bold">{t("Class Count Report", "รายงาน ClassCount")}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{getStepTitle()}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto grow p-4 md:p-6">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === initialStep}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t("Go back", "ย้อนกลับ")}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {t("Back", "ย้อนกลับ")}
                    </button>
                    {currentStep !== "action" && (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("Next", "ถัดไป")}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
