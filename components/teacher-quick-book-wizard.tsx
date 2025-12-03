"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, Clock, Repeat, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { MultiDateCalendar } from "./multi-date-calendar";

interface TeacherQuickBookWizardProps {
    userId: Id<"users">;
    onComplete: () => void;
    onClose: () => void;
}

type WizardStep = "templates" | "calendar" | "confirm";

interface BookingTemplate {
    studentId: Id<"students">;
    studentName: string;
    schoolId: Id<"schools">;
    schoolName: string;
    time: string;
    dayOfWeek: string;
    lastBooked: number;
}

export function TeacherQuickBookWizard({
    userId,
    onComplete,
    onClose,
}: TeacherQuickBookWizardProps) {
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState<WizardStep>("templates");
    const [selectedTemplate, setSelectedTemplate] = useState<BookingTemplate | null>(null);
    const [selectedDates, setSelectedDates] = useState<number[]>([]);

    // Query teacher's recent bookings (last 30 days) to generate templates
    const recentClasses = useQuery(api.classes.list, {
        teacherId: userId,
    });

    // Get students and schools for template display
    const allStudents = useQuery(api.students.list, {});
    const allSchools = useQuery(api.schools.list, {});

    // Mutation for booking
    const bookClass = useMutation(api.classes.book);

    // ✅ OPTIMIZED: Memoize template generation
    const bookingTemplates = useMemo(() => {
        if (!recentClasses || !allStudents || !allSchools) return [];

        // Get classes from last 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentApprovedClasses = recentClasses.filter(
            (cls) => cls.status === "approved" && cls.scheduledDate >= thirtyDaysAgo
        );

        // Group by student + time pattern
        const templateMap = new Map<string, BookingTemplate>();

        for (const cls of recentApprovedClasses) {
            const student = allStudents.find(s => s._id === cls.studentId);
            // Skip classes without schoolId (provider-based classes)
            if (!cls.schoolId) continue;
            const school = allSchools.find(s => s._id === cls.schoolId);

            if (!student || !school) continue;

            const date = new Date(cls.scheduledDate);
            const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

            const key = `${cls.studentId}-${time}`;

            // Keep only the most recent booking for each student-time combination
            if (!templateMap.has(key) || cls.scheduledDate > templateMap.get(key)!.lastBooked) {
                templateMap.set(key, {
                    studentId: cls.studentId,
                    studentName: student.nickname || `${student.firstName} ${student.lastName}`,
                    schoolId: cls.schoolId,
                    schoolName: school.name,
                    time,
                    dayOfWeek,
                    lastBooked: cls.scheduledDate,
                });
            }
        }

        // Sort by most recent first
        return Array.from(templateMap.values()).sort((a, b) => b.lastBooked - a.lastBooked).slice(0, 10);
    }, [recentClasses, allStudents, allSchools]);

    const handleTemplateSelect = (template: BookingTemplate) => {
        setSelectedTemplate(template);
        setCurrentStep("calendar");
    };

    const handleDateSelect = (dates: number[]) => {
        setSelectedDates(dates);
    };

    const handleCheckConflicts = async () => {
        if (!selectedTemplate || selectedDates.length === 0) return;
        // Skip conflict checking for now - just proceed to confirm
        setCurrentStep("confirm");
    };

    const handleConfirmBooking = async () => {
        if (!selectedTemplate || selectedDates.length === 0) return;

        try {
            // Book each date
            const bookingPromises = selectedDates.map((date) =>
                bookClass({
                    teacherId: userId,
                    schoolId: selectedTemplate.schoolId,
                    studentId: selectedTemplate.studentId,
                    scheduledDate: date,
                    bookedByUserId: userId,
                    duration: 60, // Default 1 hour
                    classType: "regular",
                })
            );

            await Promise.all(bookingPromises);

            toast.success(
                `${selectedDates.length} class(es) booked successfully!`,
                `จอง ${selectedDates.length} คลาสสำเร็จ!`
            );

            onComplete();
            onClose();
        } catch (error) {
            console.error("Error booking classes:", error);
            toast.error("Failed to book classes", "จองคลาสไม่สำเร็จ");
        }
    };

    const handleBack = () => {
        if (currentStep === "calendar") {
            setCurrentStep("templates");
            setSelectedTemplate(null);
            setSelectedDates([]);
        } else if (currentStep === "confirm") {
            setCurrentStep("calendar");
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case "templates":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-semibold">
                                {t("Quick Rebook Recent Classes", "จองคลาสล่าสุดอีกครั้ง")}
                            </h3>
                        </div>

                        {bookingTemplates.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>{t("No recent bookings found", "ไม่พบการจองล่าสุด")}</p>
                                <p className="text-sm mt-2">
                                    {t("Book some classes first to use quick rebook", "จองคลาสก่อนเพื่อใช้การจองด่วน")}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {bookingTemplates.map((template) => (
                                    <button
                                        key={`${template.studentId}-${template.time}`}
                                        onClick={() => handleTemplateSelect(template)}
                                        className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {template.studentName}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {template.dayOfWeek} {template.time}
                                                    </span>
                                                    <span className="mx-2">•</span>
                                                    {template.schoolName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {t("Last booked:", "จองล่าสุด:")} {new Date(template.lastBooked).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Repeat className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "calendar":
                return (
                    <div className="space-y-4">
                        {selectedTemplate && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    <div className="font-medium">{selectedTemplate.studentName}</div>
                                    <div className="text-xs mt-1">
                                        {selectedTemplate.schoolName} • {selectedTemplate.time}
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t("Select dates for this booking pattern", "เลือกวันที่สำหรับรูปแบบการจองนี้")}
                        </p>

                        <MultiDateCalendar
                            selectedDates={selectedDates}
                            onDatesChange={handleDateSelect}
                            minDate={new Date()}
                        />

                        {selectedDates.length > 0 && (
                            <div className="mt-4">
                                <button
                                    onClick={handleCheckConflicts}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {t(`Continue (${selectedDates.length} dates)`, `ดำเนินการต่อ (${selectedDates.length} วัน)`)}
                                </button>
                            </div>
                        )}
                    </div>
                );

            case "confirm":
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                {t("Booking Summary", "สรุปการจอง")}
                            </h3>
                            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                                <div><strong>{t("Student:", "นักเรียน:")}</strong> {selectedTemplate?.studentName}</div>
                                <div><strong>{t("School:", "โรงเรียน:")}</strong> {selectedTemplate?.schoolName}</div>
                                <div><strong>{t("Time:", "เวลา:")}</strong> {selectedTemplate?.time}</div>
                                <div><strong>{t("Dates:", "วันที่:")}</strong> {selectedDates.length} date(s)</div>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmBooking}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {t("Confirm Booking", "ยืนยันการจอง")}
                        </button>
                    </div>
                );
        }
    };

    const progress = currentStep === "templates" ? 33 : currentStep === "calendar" ? 66 : 100;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t("Quick Book", "จองด่วน")}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Rebook recent classes instantly", "จองคลาสล่าสุดทันที")}
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
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === "templates"}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {t("Back", "ย้อนกลับ")}
                    </button>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {t("Cancel", "ยกเลิก")}
                    </button>
                </div>
            </div>
        </div>
    );
}
