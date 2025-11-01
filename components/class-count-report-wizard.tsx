"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import { BarChart3, ChevronLeft, ChevronRight, Printer, X } from "lucide-react";
import { useState } from "react";

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
    userRole,
    userSchoolId,
    onComplete,
    onClose,
}: ClassCountReportWizardProps) {
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState<WizardStep>("teacher");
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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
        } else if (currentStep === "date" && startDate && endDate) {
            setCurrentStep("action");
        }
    };

    const handleBack = () => {
        if (currentStep === "date") setCurrentStep("teacher");
        else if (currentStep === "action") setCurrentStep("date");
    };

    const handleAction = (action: "view" | "print") => {
        onComplete({
            teacherId: selectedTeacherId as Id<"users">,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            action,
        });
    };

    const canProceed = () => {
        if (currentStep === "teacher") return !!selectedTeacherId;
        if (currentStep === "date") return !!startDate && !!endDate;
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
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Choose the teacher for the class count report", "เลือกครูสำหรับรายงาน ClassCount")}
                        </p>
                        <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users">)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">{t("-- Select Teacher --", "-- เลือกครู --")}</option>
                            {teachers?.map(teacher => (
                                <option key={teacher._id} value={teacher._id}>
                                    {teacher.username}
                                </option>
                            ))}
                        </select>
                    </div>
                );

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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>
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
                <div className="overflow-y-auto flex-grow p-4 md:p-6">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === "teacher"}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
