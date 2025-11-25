"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MultiDateCalendar } from "./multi-date-calendar";

interface BookingWizardProps {
    userId: Id<"users">;
    userRole: "teacher" | "moderator";
    userSchoolId?: Id<"schools">;
    onComplete: (data: BookingWizardData) => void;
    onClose: () => void;
}

export interface BookingWizardData {
    teacherId: Id<"users">;
    grade: string;
    class: string;
    studentId: Id<"students">; // NEW: Added studentId
    bookingType: "once-off" | "recurring";
    // Once-off data
    selectedDate?: number;
    // Recurring data
    weeksCount?: number;
    selectedDays?: Array<{ day: string; time: string }>;
}

type WizardStep = "teacher" | "grade" | "class" | "student" | "booking-type" | "once-off-calendar" | "recurring-config"; // NEW: Added "student"

export function BookingWizard({
    userId,
    userRole,
    userSchoolId,
    onComplete,
    onClose,
}: BookingWizardProps) {
    const { t } = useLanguage();

    // ✅ NEW: Get user's wizard preferences for personalization
    const wizardPreferences = useQuery(api.users.getWizardPreferences, { userId });
    const updateWizardPrefs = useMutation(api.users.updateWizardPreferences);

    // ✅ NEW: For teachers, skip teacher selection step
    const isTeacher = userRole === "teacher";
    const initialStep: WizardStep = isTeacher ? "grade" : "teacher";

    const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">(isTeacher ? userId : "");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<Id<"students"> | "">("")
    const [bookingType, setBookingType] = useState<"once-off" | "recurring" | "">("");

    // Once-off state
    const [selectedDates, setSelectedDates] = useState<number[]>([]);

    // Recurring state
    const [weeksCount, setWeeksCount] = useState(1);
    const [selectedDays, setSelectedDays] = useState<Array<{ day: string; time: string }>>([]);

    // ✅ NEW: Calculate progress for progress bar
    const steps: WizardStep[] = isTeacher
        ? ["grade", "class", "student", "booking-type"]
        : ["teacher", "grade", "class", "student", "booking-type"];
    const currentStepIndex = steps.indexOf(currentStep);
    const totalSteps = steps.length + 1; // +1 for calendar/recurring step
    const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

    // ✅ NEW: Save preferences on wizard completion
    const savePreferences = useCallback(async () => {
        if (!selectedTeacherId) return;
        try {
            await updateWizardPrefs({
                userId,
                preferences: {
                    recentTeacherIds: [selectedTeacherId],
                    recentStudentIds: selectedStudentId ? [selectedStudentId] : [],
                    recentGrades: selectedGrade ? [selectedGrade] : [],
                },
            });
        } catch (error) {
            console.warn("Failed to save wizard preferences:", error);
        }
    }, [userId, selectedTeacherId, selectedStudentId, selectedGrade, updateWizardPrefs]);

    // ✅ NEW: Restore recent grade if available and no selection made
    useEffect(() => {
        if (wizardPreferences?.recentGrades?.length && !selectedGrade && currentStep === "grade") {
            // Don't auto-select, but we'll highlight it in the UI
        }
    }, [wizardPreferences, selectedGrade, currentStep]);

    // Get teachers for moderator's school or all teachers for admin
    const allUsers = useQuery(api.users.list, { role: "teacher" });

    // ✅ OPTIMIZED: Memoize teacher filtering to prevent recalculation on every render
    const teachers = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(u => {
            if (u.role !== "teacher") return false;
            if (userRole === "moderator" && userSchoolId) {
                return u.schoolId === userSchoolId;
            }
            return true;
        });
    }, [allUsers, userRole, userSchoolId]);

    // Get students for selected teacher's school (or moderator's school)
    // ✅ OPTIMIZED: Memoize schoolId to prevent query re-execution
    const schoolId = useMemo(() => {
        if (userRole === "moderator") return userSchoolId;
        return teachers.find(t => t._id === selectedTeacherId)?.schoolId;
    }, [userRole, userSchoolId, teachers, selectedTeacherId]);

    const students = useQuery(
        api.students.list,
        schoolId ? { schoolId } : "skip"
    );

    // Get unique grades from students
    // ✅ OPTIMIZED: Memoize grades extraction
    const availableGrades = useMemo(() => {
        if (!students) return [];
        return Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort();
    }, [students]);

    // Get unique classes for selected grade
    // ✅ OPTIMIZED: Memoize classes extraction
    const availableClasses = useMemo(() => {
        if (!students || !selectedGrade) return [];
        return Array.from(
            new Set(
                students
                    .filter(s => s.grade === selectedGrade)
                    .map(s => s.class)
                    .filter(Boolean)
            )
        ).sort();
    }, [students, selectedGrade]);

    // ✅ OPTIMIZED: Memoize sorted teachers (recent first) - hoisted from renderStepContent
    const recentTeacherIds = useMemo(() =>
        wizardPreferences?.recentTeacherIds || [],
        [wizardPreferences?.recentTeacherIds]
    );

    const sortedTeachers = useMemo(() => {
        return [...teachers].sort((a, b) => {
            const aRecent = recentTeacherIds.includes(a._id);
            const bRecent = recentTeacherIds.includes(b._id);
            if (aRecent && !bRecent) return -1;
            if (!aRecent && bRecent) return 1;
            return a.username.localeCompare(b.username);
        });
    }, [teachers, recentTeacherIds]);

    // ✅ OPTIMIZED: Memoize sorted grades (recent first) - hoisted from renderStepContent
    const recentGrades = useMemo(() =>
        wizardPreferences?.recentGrades || [],
        [wizardPreferences?.recentGrades]
    );

    const sortedGrades = useMemo(() => {
        return [...availableGrades].sort((a, b) => {
            const aRecent = recentGrades.includes(a);
            const bRecent = recentGrades.includes(b);
            if (aRecent && !bRecent) return -1;
            if (!aRecent && bRecent) return 1;
            return a.localeCompare(b);
        });
    }, [availableGrades, recentGrades]);

    // ✅ OPTIMIZED: Memoize filtered students by grade/class - hoisted from renderStepContent
    const filteredStudents = useMemo(() => {
        if (!students || !selectedGrade || !selectedClass) return [];
        return students.filter(s =>
            s.grade === selectedGrade && s.class === selectedClass
        );
    }, [students, selectedGrade, selectedClass]);

    const handleNext = async () => {
        if (currentStep === "teacher" && selectedTeacherId) {
            setCurrentStep("grade");
        } else if (currentStep === "grade" && selectedGrade) {
            setCurrentStep("class");
        } else if (currentStep === "class" && selectedClass) {
            setCurrentStep("student"); // NEW: Navigate to student selection
        } else if (currentStep === "student" && selectedStudentId) {  // NEW: Student step
            setCurrentStep("booking-type");
        } else if (currentStep === "booking-type" && bookingType) {
            if (bookingType === "once-off") {
                setCurrentStep("once-off-calendar");
            } else {
                setCurrentStep("recurring-config");
            }
        } else if (currentStep === "once-off-calendar" && selectedDates.length > 0) {
            // ✅ Save preferences before completing
            await savePreferences();
            // Complete wizard with once-off data (use first date from array)
            onComplete({
                teacherId: selectedTeacherId as Id<"users">,
                grade: selectedGrade,
                class: selectedClass,
                studentId: selectedStudentId as Id<"students">,
                bookingType: "once-off",
                selectedDate: selectedDates[0],
            });
        } else if (currentStep === "recurring-config" && weeksCount > 0 && selectedDays.length > 0) {
            // ✅ Save preferences before completing
            await savePreferences();
            // Complete wizard with recurring data
            onComplete({
                teacherId: selectedTeacherId as Id<"users">,
                grade: selectedGrade,
                class: selectedClass,
                studentId: selectedStudentId as Id<"students">,
                bookingType: "recurring",
                weeksCount,
                selectedDays,
            });
        }
    };

    const handleBack = () => {
        if (currentStep === "grade") setCurrentStep("teacher");
        else if (currentStep === "class") setCurrentStep("grade");
        else if (currentStep === "student") setCurrentStep("class"); // NEW: Student back navigation
        else if (currentStep === "booking-type") setCurrentStep("student"); // NEW: Booking type goes back to student
        else if (currentStep === "once-off-calendar") setCurrentStep("booking-type");
        else if (currentStep === "recurring-config") setCurrentStep("booking-type");
    };

    const canProceed = () => {
        if (currentStep === "teacher") return !!selectedTeacherId;
        if (currentStep === "grade") return !!selectedGrade;
        if (currentStep === "class") return !!selectedClass;
        if (currentStep === "student") return !!selectedStudentId; // NEW: Student validation
        if (currentStep === "booking-type") return !!bookingType;
        if (currentStep === "once-off-calendar") return selectedDates.length > 0; // Changed: Check array length
        if (currentStep === "recurring-config") return weeksCount > 0 && selectedDays.length > 0;
        return false;
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case "teacher": return t("Select Teacher", "เลือกครู");
            case "grade": return t("Select Grade", "เลือกระดับชั้น");
            case "class": return t("Select Class", "เลือกห้องเรียน");
            case "student": return t("Select Student", "เลือกนักเรียน"); // NEW: Student title
            case "booking-type": return t("Booking Type", "ประเภทการจอง");
            case "once-off-calendar": return t("Select Date", "เลือกวันที่");
            case "recurring-config": return t("Configure Recurring", "ตั้งค่าการจองซ้ำ");
            default: return "";
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case "teacher":
                // ✅ OPTIMIZED: Using memoized sortedTeachers and recentTeacherIds
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Choose the teacher for this class booking", "เลือกครูสำหรับการจองคลาสนี้")}
                        </p>
                        <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users">)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
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

            case "grade":
                // ✅ OPTIMIZED: Using memoized sortedGrades and recentGrades
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Select the grade level", "เลือกระดับชั้น")}
                        </p>
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            aria-label={t("Select Grade", "เลือกระดับชั้น")}
                        >
                            <option value="">{t("-- Select Grade --", "-- เลือกระดับชั้น --")}</option>
                            {sortedGrades.map(grade => (
                                <option key={grade} value={grade}>
                                    {recentGrades.includes(grade) ? "⭐ " : ""}
                                    {grade}
                                </option>
                            ))}
                        </select>
                        {recentGrades.length > 0 && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {t("Recently selected grades", "ระดับชั้นที่เลือกล่าสุด")}
                            </p>
                        )}
                    </div>
                );

            case "class":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Select the class section", "เลือกห้องเรียน")}
                        </p>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">{t("-- Select Class --", "-- เลือกห้อง --")}</option>
                            {availableClasses.map(cls => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </select>
                    </div>
                );

            case "student":  // Student selection step
                // ✅ OPTIMIZED: Using memoized filteredStudents
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t(
                                `Select a student from ${selectedGrade}/${selectedClass}`,
                                `เลือกนักเรียนจาก ${selectedGrade}/${selectedClass}`
                            )}
                        </p>
                        {filteredStudents.length === 0 ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                                    {t(
                                        "No students found for this grade/class combination",
                                        "ไม่พบนักเรียนในระดับชั้น/ห้องนี้"
                                    )}
                                </p>
                            </div>
                        ) : (
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value as Id<"students">)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            >
                                <option value="">{t("-- Select Student --", "-- เลือกนักเรียน --")}</option>
                                {filteredStudents.map(student => (
                                    <option key={student._id} value={student._id}>
                                        {student.firstName} {student.lastName} ({student.studentId})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                );

            case "booking-type":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Is this a one-time class or recurring weekly?", "คลาสครั้งเดียวหรือจองซ้ำรายสัปดาห์?")}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setBookingType("once-off")}
                                className={`p-6 rounded-lg border-2 transition-all ${bookingType === "once-off"
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                                    }`}
                            >
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                <h3 className="font-semibold text-lg">{t("Once-Off Class", "คลาสครั้งเดียว")}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {t("Book a single class", "จองคลาสครั้งเดียว")}
                                </p>
                            </button>
                            <button
                                onClick={() => setBookingType("recurring")}
                                className={`p-6 rounded-lg border-2 transition-all ${bookingType === "recurring"
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-300 dark:border-gray-600 hover:border-green-300"
                                    }`}
                            >
                                <Clock className="w-12 h-12 mx-auto mb-3 text-green-600" />
                                <h3 className="font-semibold text-lg">{t("Recurring Classes", "คลาสซ้ำรายสัปดาห์")}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {t("Book weekly classes", "จองคลาสรายสัปดาห์")}
                                </p>
                            </button>
                        </div>
                    </div>
                );

            case "once-off-calendar":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Select a date for your class", "เลือกวันที่สำหรับคลาสของคุณ")}
                        </p>
                        <MultiDateCalendar
                            selectedDates={selectedDates}
                            onDatesChange={setSelectedDates}
                            maxSelections={1}
                        />
                    </div>
                );

            case "recurring-config":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("How many weeks?", "กี่สัปดาห์?")}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="52"
                                value={weeksCount}
                                onChange={(e) => setWeeksCount(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>
                        <RecurringDaySelector
                            selectedDays={selectedDays}
                            onSelectDays={setSelectedDays}
                        />
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
            <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t(`Step ${currentStepIndex + 1} of ${totalSteps}`, `ขั้นตอนที่ ${currentStepIndex + 1} จาก ${totalSteps}`)}
                />
            </div>

            {/* Header */}
            <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    <div>
                        <h2 className="text-xl font-bold">{t("Book a Class", "จองคลาส")}</h2>
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
                <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {currentStep === "once-off-calendar" || currentStep === "recurring-config"
                        ? t("Complete", "เสร็จสิ้น")
                        : t("Next", "ถัดไป")}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
);
}

// Recurring day selector component
function RecurringDaySelector({
    selectedDays,
    onSelectDays,
}: {
    selectedDays: Array<{ day: string; time: string }>;
    onSelectDays: (days: Array<{ day: string; time: string }>) => void;
}) {
    const { t } = useLanguage();
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const toggleDay = (day: string) => {
        const exists = selectedDays.find(d => d.day === day);
        if (exists) {
            onSelectDays(selectedDays.filter(d => d.day !== day));
        } else {
            onSelectDays([...selectedDays, { day, time: "09:00" }]);
        }
    };

    const updateTime = (day: string, time: string) => {
        onSelectDays(selectedDays.map(d => d.day === day ? { ...d, time } : d));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium">
                {t("Select days and times", "เลือกวันและเวลา")}
            </label>
            {daysOfWeek.map(day => {
                const selectedDay = selectedDays.find(d => d.day === day);
                return (
                    <div key={day} className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={!!selectedDay}
                            onChange={() => toggleDay(day)}
                            className="w-5 h-5"
                        />
                        <span className="flex-1 font-medium">{day}</span>
                        {selectedDay && (
                            <input
                                type="time"
                                value={selectedDay.time}
                                onChange={(e) => updateTime(day, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
