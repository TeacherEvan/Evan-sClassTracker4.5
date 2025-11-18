"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { getClassStatusColor } from "@/lib/constants";
import { getMonthEnd, getMonthGridDays, getMonthStart, isInMonth, isToday } from "@/lib/date-utils";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { useSwipeGesture } from "@/lib/use-swipe-gesture";
import { logger } from "@/lib/logger";
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "@/lib/use-keyboard-shortcuts";
import { getStatusAriaLabel, getStatusBadgeClasses, MIN_TOUCH_TARGET } from "@/lib/accessibility-utils";
import { useMutation, useQuery } from "convex/react";
import { Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Globe, Plus, Users, X, Check, AlertCircle } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { ClassDetailModal } from "./class-detail-modal";
import { ClassQuickActions } from "./class-quick-actions";
import { EditClassModal } from "./edit-class-modal";
import { HierarchicalStudentSelector } from "./hierarchical-student-selector";
import { PostClassNotesModal } from "./post-class-notes-modal";

type MonthlyCalendarProps = {
    currentUser: User;
};

export function MonthlyCalendar({ currentUser }: MonthlyCalendarProps) {
    const { t, language } = useLanguage();
    const schools = useQuery(api.schools.list, {});
    // Only load teachers since we only display teacher names in calendar
    const users = useQuery(api.users.list, { role: "teacher" });
    const bookClass = useMutation(api.classes.book);
    const deleteClass = useMutation(api.classes.deleteClass);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">("");

    // Class detail modal state - using enriched class type from listWithDetails
    type ClassWithDetails = {
        _id: Id<"classes">;
        studentId: Id<"students">;
        teacherId: Id<"users">;
        schoolId?: Id<"schools">; // Optional - null for provider-linked classes
        providerId?: Id<"providers">; // Optional - alternative to schoolId
        locationId?: Id<"locations">;
        scheduledDate: number;
        status: "pending" | "acknowledged" | "approved" | "rejected";
        student: Doc<"students"> | null;
        additionalStudents?: (Doc<"students"> | null)[];
        location: Doc<"locations"> | null;
        additionalStudentIds?: Id<"students">[];
        pendingLocationName?: string;
        pendingLocationNameTh?: string;
        guardianTitle?: string;
        duration?: number;
        subject?: string;
        subjectTh?: string;
        lessonTopic?: string;
        lessonTopicTh?: string;
        materials?: string;
        materialsTh?: string;
        preparationNotes?: string;
        preparationNotesTh?: string;
        classType?: "regular" | "makeup" | "trial" | "assessment" | "special";
        isEdited?: boolean;
        editHistory?: Array<{
            editedAt: number;
            editedBy: Id<"users">;
            editedByName: string;
            editedByRole: string;
        }>;
    };
    const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
    const [editingClass, setEditingClass] = useState<Doc<"classes"> | null>(null);

    // Post-class notes modal state
    const [showPostClassNotes, setShowPostClassNotes] = useState(false);
    const [selectedClassForNotes, setSelectedClassForNotes] = useState<Doc<"classes"> | null>(null);

    // Form fields - moderators auto-select their school
    const [schoolId, setSchoolId] = useState<Id<"schools"> | "">(
        currentUser.role === "moderator" && currentUser.schoolId ? currentUser.schoolId : ""
    );
    const [studentId, setStudentId] = useState<Id<"students"> | "">("");
    const [locationId, setLocationId] = useState<Id<"locations"> | "">("");
    const [teacherId, setTeacherId] = useState<Id<"users"> | "">(
        currentUser.role === "teacher" ? currentUser._id : ""
    );
    const [selectedTime, setSelectedTime] = useState("09:00");
    const [error, setError] = useState("");

    // Inline student creation
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [newStudentNickname, setNewStudentNickname] = useState("");
    const [newStudentGrade, setNewStudentGrade] = useState("");
    const [newStudentClass, setNewStudentClass] = useState("");
    const createStudent = useMutation(api.students.create);

    // Keyboard shortcuts
    const goToPreviousMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    }, [currentDate]);

    const goToNextMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    }, [currentDate]);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    useKeyboardShortcuts([
        {
            ...COMMON_SHORTCUTS.NEW,
            callback: () => !showAddDialog && handleAddClass(new Date()),
            disabled: showAddDialog,
        },
        {
            ...COMMON_SHORTCUTS.CLOSE,
            callback: () => showAddDialog && setShowAddDialog(false),
            disabled: !showAddDialog,
        },
        {
            key: "ArrowLeft",
            callback: goToPreviousMonth,
            description: "Previous month / เดือนก่อนหน้า",
        },
        {
            key: "ArrowRight",
            callback: goToNextMonth,
            description: "Next month / เดือนถัดไป",
        },
        {
            key: "t",
            callback: goToToday,
            description: "Go to today / ไปวันนี้",
        },
    ]);

    // Get students and locations filtered by school (server-side)
    // For the Add Class form, use the form's selected schoolId
    const formStudents = useQuery(
        api.students.list,
        schoolId ? { schoolId } : "skip"
    );
    const formLocations = useQuery(
        api.locations.list,
        schoolId ? { schoolId, activeOnly: true } : "skip"
    );

    // Memoize month range calculations
    const monthStart = useMemo(() => getMonthStart(currentDate), [currentDate]);
    const monthEnd = useMemo(() => getMonthEnd(currentDate), [currentDate]);

    // Memoize month grid days array (35 or 42 days)
    const monthGridDays = useMemo(() => getMonthGridDays(currentDate), [currentDate]);

    // Create lookup maps for better performance (O(1) instead of O(n))
    const usersMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u._id, u]));
    }, [users]);

    const schoolsMap = useMemo(() => {
        if (!schools) return new Map();
        return new Map(schools.map(s => [s._id, s]));
    }, [schools]);

    // Get classes for current week with full details
    const classes = useQuery(
        api.classes.listWithDetails,
        currentUser.role === "teacher"
            ? { teacherId: currentUser._id }
            : (currentUser.role === "moderator" && currentUser.schoolId)
                ? { schoolId: currentUser.schoolId }
                : selectedSchoolId
                    ? { schoolId: selectedSchoolId }
                    : {}
    );

    // Get events for current month
    const events = useQuery(
        api.events.listByDateRange,
        {
            userId: currentUser._id,
            startDate: monthStart.getTime(),
            endDate: monthEnd.getTime()
        }
    );

    // Filter classes by month date range on client side (since we're using listWithDetails)
    const monthClasses = useMemo(() => {
        if (!classes) return [];
        return classes.filter(c =>
            c.scheduledDate >= monthStart.getTime() &&
            c.scheduledDate <= monthEnd.getTime()
        );
    }, [classes, monthStart, monthEnd]);

    // Swipe gestures for month navigation
    useSwipeGesture({
        onSwipeLeft: goToNextMonth,
        onSwipeRight: goToPreviousMonth,
    });

    const handleAddClass = (date: Date) => {
        setSelectedDate(date);
        setShowAddDialog(true);
        setError("");

        // Pre-fill school if moderator (admins can select any school)
        if (currentUser?.role === "moderator" && currentUser.schoolId) {
            setSchoolId(currentUser.schoolId);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!schoolId) {
            setError(t("Please select a school", "กรุณาเลือกโรงเรียน"));
            return;
        }

        if (!studentId) {
            setError(t("Please select a student", "กรุณาเลือกนักเรียน"));
            return;
        }

        if (!locationId) {
            setError(t("Please select a location", "กรุณาเลือกสถานที่"));
            return;
        }

        if (!teacherId) {
            setError(t("Please select a teacher", "กรุณาเลือกครูผู้สอน"));
            return;
        }

        if (!selectedDate) {
            return;
        }

        try {
            // Combine selected date with selected time
            const dateWithTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(":");
            dateWithTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));

            await bookClass({
                teacherId: teacherId as Id<"users">,
                schoolId: schoolId as Id<"schools">,
                studentId: studentId as Id<"students">,
                locationId: locationId as Id<"locations">,
                scheduledDate: dateWithTime.getTime(),
                bookedByUserId: currentUser._id,
            });

            // Reset form
            setSchoolId("");
            setStudentId("");
            setLocationId("");
            setTeacherId(currentUser.role === "teacher" ? currentUser._id : "");
            setSelectedTime("09:00");
            setShowAddDialog(false);
            setSelectedDate(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create class");
        }
    };

    const getClassesForDay = (day: Date) => {
        if (!monthClasses) return [];
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return monthClasses.filter(
            (c) => c.scheduledDate >= dayStart.getTime() && c.scheduledDate <= dayEnd.getTime()
        );
    };

    const getEventsForDay = (day: Date) => {
        if (!events) return [];
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return events.filter(
            (e) => e.eventDate >= dayStart.getTime() && e.eventDate <= dayEnd.getTime()
        );
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case "reminder": return <Bell className="w-3 h-3" />;
            case "event": return <CalendarIcon className="w-3 h-3" />;
            case "holiday": return <Globe className="w-3 h-3" />;
            case "meeting": return <Users className="w-3 h-3" />;
            case "deadline": return <Clock className="w-3 h-3" />;
            default: return <CalendarIcon className="w-3 h-3" />;
        }
    };

    const handleClassClick = (classItem: ClassWithDetails) => {
        setSelectedClass(classItem);
    };

    const handleAddNotes = (classItem: Doc<"classes">) => {
        setSelectedClassForNotes(classItem);
        setShowPostClassNotes(true);
    };

    const handleDeleteClass = (classItem: Doc<"classes">) => {
        if (confirm(t(
            "Are you sure you want to delete this class?",
            "คุณแน่ใจหรือไม่ว่าต้องการลบคลาสนี้?"
        ))) {
            deleteClass({
                userId: currentUser._id,
                classId: classItem._id
            }).then(() => {
                toast.success("Class deleted", "ลบคลาสสำเร็จ");
            }).catch((err: unknown) => {
                toast.error(
                    err instanceof Error ? err.message : "Failed to delete",
                    err instanceof Error ? err.message : "ลบไม่สำเร็จ"
                );
            });
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-3 py-4 md:p-4">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-4 gap-3">
                    <h2 id="calendar-heading" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {t("Monthly Calendar", "ปฏิทินรายเดือน")}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-xl md:rounded-lg hover:bg-blue-700 active:scale-95 transition-all touch-manipulation shadow-lg shadow-blue-600/20 text-sm md:text-base font-medium w-full md:w-auto"
                    >
                        {t("Today", "วันนี้")}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2 justify-between md:justify-start">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all touch-manipulation"
                            aria-label={t("Previous month", "เดือนก่อนหน้า")}
                        >
                            <ChevronLeft className="w-6 h-6 md:w-5 md:h-5" />
                        </button>
                        <span className="text-base md:text-lg font-medium flex-1 md:min-w-[200px] text-center">
                            {currentDate.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                        <button
                            onClick={goToNextMonth}
                            className="p-2.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all touch-manipulation"
                            aria-label={t("Next month", "เดือนถัดไป")}
                        >
                            <ChevronRight className="w-6 h-6 md:w-5 md:h-5" />
                        </button>
                    </div>

                    {/* School filter for teachers and admins */}
                    {currentUser.role !== "moderator" && (
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value as Id<"schools"> | "")}
                            className="px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 touch-manipulation transition-shadow"
                        >
                            <option value="">{t("All Schools", "ทุกโรงเรียน")}</option>
                            {schools?.map((school) => (
                                <option key={school._id} value={school._id}>
                                    {language === "en" ? school.name : school.nameTh}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-lg shadow-lg overflow-hidden"
                role="grid"
                aria-labelledby="calendar-heading"
            >
                {/* Day headers - abbreviated on mobile */}
                <div role="rowgroup" className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                    {[
                        { full: t("Monday", "จันทร์"), short: t("Mon", "จ.") },
                        { full: t("Tuesday", "อังคาร"), short: t("Tue", "อ.") },
                        { full: t("Wednesday", "พุธ"), short: t("Wed", "พ.") },
                        { full: t("Thursday", "พฤหัสบดี"), short: t("Thu", "พฤ.") },
                        { full: t("Friday", "ศุกร์"), short: t("Fri", "ศ.") },
                        { full: t("Saturday", "เสาร์"), short: t("Sat", "ส.") },
                        { full: t("Sunday", "อาทิตย์"), short: t("Sun", "อา.") },
                    ].map((day, i) => (
                        <div
                            key={i}
                            role="columnheader"
                            aria-label={day.full}
                            className="px-1 md:px-4 py-2 md:py-3 text-center font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 text-xs md:text-base"
                        >
                            <span className="hidden md:inline">{day.full}</span>
                            <span className="md:hidden">{day.short}</span>
                        </div>
                    ))}
                </div>

                {/* Month Grid - 5 or 6 rows */}
                <div role="rowgroup" className="grid grid-cols-7">
                    {monthGridDays.map((day, i) => {
                        const dayClasses = getClassesForDay(day);
                        const dayEvents = getEventsForDay(day);
                        const today = isToday(day);
                        const inMonth = isInMonth(day, currentDate);
                        const totalItems = dayEvents.length + dayClasses.length;
                        const maxVisibleItems = 3;
                        const hiddenCount = Math.max(0, totalItems - maxVisibleItems);

                        return (
                            <div
                                key={i}
                                role="gridcell"
                                tabIndex={today ? 0 : -1}
                                aria-label={`${day.toLocaleDateString(language === "en" ? "en-US" : "th-TH")} ${totalItems} ${t("items", "รายการ")}`}
                                className={`
                                    min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-r border-b
                                    ${today ? "bg-blue-50 dark:bg-blue-900/10 ring-2 ring-inset ring-blue-500" : ""}
                                    ${!inMonth ? "bg-gray-50 dark:bg-gray-900/50 opacity-60" : ""}
                                    ${i % 7 === 6 ? "border-r-0" : ""}
                                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                    focus:outline-none focus:ring-2 focus:ring-blue-500
                                `}
                            >
                                <div className="flex justify-between items-start mb-1 md:mb-2">
                                    <span
                                        className={`text-xs md:text-sm font-medium ${today
                                                ? "text-blue-600 dark:text-blue-400 font-bold"
                                                : !inMonth
                                                    ? "text-gray-400 dark:text-gray-600"
                                                    : "text-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {day.getDate()}
                                    </span>
                                    {/* Add Class Button - Only for current month days */}
                                    {inMonth && (
                                        <button
                                            onClick={() => handleAddClass(day)}
                                            className="p-0.5 md:p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded active:scale-95 transition-all touch-manipulation"
                                            aria-label={
                                                currentUser.role === "moderator" || currentUser.role === "admin"
                                                    ? t("Book class", "จองคลาส")
                                                    : t("Request class", "ขอจองคลาส")
                                            }
                                        >
                                            <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Events & Classes - Compact View */}
                                <div className="space-y-0.5 overflow-y-auto max-h-[60px] md:max-h-[90px]">
                                    {/* Render Events First (max visible) */}
                                    {dayEvents.slice(0, maxVisibleItems).map((event) => (
                                        <div
                                            key={event._id}
                                            className="w-full text-left text-xs p-1 rounded border border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                                            title={language === "en" ? event.description : event.descriptionTh}
                                        >
                                            <div className="flex items-center gap-1">
                                                {getEventIcon(event.eventType)}
                                                <div className="font-semibold truncate text-[9px] md:text-[10px] text-purple-700 dark:text-purple-300">
                                                    {language === "en" ? event.title : event.titleTh}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Render Classes (remaining slots) */}
                                    {dayClasses.slice(0, Math.max(0, maxVisibleItems - dayEvents.length)).map((classItem) => {
                                        const teacher = usersMap.get(classItem.teacherId);
                                        const student = classItem.student;

                                        return (
                                            <div
                                                key={classItem._id}
                                                className={`group relative w-full text-left text-xs p-1 rounded border ${getClassStatusColor(classItem.status)} hover:shadow-md transition-all cursor-pointer ${!student ? 'opacity-60' : ''}`}
                                                onClick={() => handleClassClick(classItem)}
                                            >
                                                <div className={`font-semibold truncate text-[9px] md:text-[10px] ${!student ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                    {student ? `${student.firstName} ${student.lastName}` : t("⚠️ Deleted", "⚠️ ลบแล้ว")}
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-300 truncate text-[8px] md:text-[9px]">
                                                    {teacher?.username}
                                                </div>
                                                {/* Quick actions - mobile visible, desktop hover */}
                                                <div className="absolute top-0.5 right-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <ClassQuickActions
                                                        classItem={classItem as unknown as Doc<"classes">}
                                                        currentUser={currentUser as unknown as Doc<"users">}
                                                        onViewDetails={(cls) => handleClassClick(cls as unknown as ClassWithDetails)}
                                                        onEditClass={(cls) => setEditingClass(cls)}
                                                        onDeleteClass={handleDeleteClass}
                                                        onAddNotes={handleAddNotes}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* "+X more" indicator */}
                                    {hiddenCount > 0 && (
                                        <div className="text-[8px] md:text-[9px] text-gray-500 dark:text-gray-400 text-center py-0.5">
                                            +{hiddenCount} {t("more", "เพิ่มเติม")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded"></div>
                    <span>{t("Pending", "รอดำเนินการ")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded"></div>
                    <span>{t("Acknowledged", "รับทราบ")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                    <span>{t("Approved", "อนุมัติ")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
                    <span>{t("Rejected", "ปฏิเสธ")}</span>
                </div>
            </div>

            {/* Class Detail Modal */}
            {selectedClass && (
                <ClassDetailModal
                    classData={selectedClass as unknown as Doc<"classes">}
                    studentData={selectedClass.student}
                    locationData={selectedClass.location}
                    schoolData={schoolsMap.get(selectedClass.schoolId) || null}
                    teacherData={usersMap.get(selectedClass.teacherId) || null}
                    additionalStudents={selectedClass.additionalStudents}
                    currentUserId={currentUser._id}
                    currentUserRole={currentUser.role}
                    allClasses={monthClasses}
                    onClose={() => setSelectedClass(null)}
                />
            )}

            {/* Add Class Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                        <div className="p-4 md:p-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {currentUser.role === "moderator" || currentUser.role === "admin"
                                        ? t("Book Class", "จองคลาส")
                                        : t("Request Class", "ขอจองคลาส")}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowAddDialog(false);
                                        setSelectedDate(null);
                                        setSchoolId("");
                                        setStudentId("");
                                        setLocationId("");
                                        setTeacherId(currentUser.role === "teacher" ? currentUser._id : "");
                                        setSelectedTime("09:00");
                                        setError("");
                                        setShowStudentForm(false);
                                        setNewStudentNickname("");
                                        setNewStudentGrade("");
                                        setNewStudentClass("");
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedDate && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t("Date:", "วันที่:")}{" "}
                                    {selectedDate.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            )}

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="schoolSelect" className="block text-sm font-medium mb-2">
                                        {t("School", "โรงเรียน")}
                                    </label>
                                    <select
                                        id="schoolSelect"
                                        value={schoolId}
                                        onChange={(e) => setSchoolId(e.target.value as Id<"schools"> | "")}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        disabled={currentUser.role === "moderator"}
                                        required
                                    >
                                        <option value="">{t("-- Select School --", "-- เลือกโรงเรียน --")}</option>
                                        {schools?.map((school) => (
                                            <option key={school._id} value={school._id}>
                                                {language === "en" ? school.name : school.nameTh}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Teacher selection for moderators and admins */}
                                {(currentUser.role === "moderator" || currentUser.role === "admin") && (
                                    <div>
                                        <label htmlFor="teacherSelect" className="block text-sm font-medium mb-2">
                                            {t("Teacher", "ครูผู้สอน")}
                                        </label>
                                        <select
                                            id="teacherSelect"
                                            value={teacherId}
                                            onChange={(e) => setTeacherId(e.target.value as Id<"users"> | "")}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            required
                                        >
                                            <option value="">{t("-- Select Teacher --", "-- เลือกครูผู้สอน --")}</option>
                                            {users?.map((teacher) => (
                                                <option key={teacher._id} value={teacher._id}>
                                                    {teacher.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="studentSelect" className="block text-sm font-medium mb-2">
                                        {t("Student", "นักเรียน")}
                                    </label>
                                    {!schoolId ? (
                                        <div className="w-full px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
                                            {t("Please select a school first", "โปรดเลือกโรงเรียนก่อน")}
                                        </div>
                                    ) : showStudentForm ? (
                                        <div className="space-y-2 p-3 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                    {t("Add New Student", "เพิ่มนักเรียนใหม่")}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowStudentForm(false);
                                                        setNewStudentNickname("");
                                                        setNewStudentGrade("");
                                                        setNewStudentClass("");
                                                    }}
                                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={t("Nickname", "ชื่อเล่น")}
                                                value={newStudentNickname}
                                                onChange={(e) => setNewStudentNickname(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                                required
                                            />
                                            <select
                                                value={newStudentGrade}
                                                onChange={(e) => setNewStudentGrade(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                                required
                                            >
                                                <option value="">{t("-- Select Grade --", "-- เลือกชั้น --")}</option>
                                                <option value="K1">K1</option>
                                                <option value="K2">K2</option>
                                                <option value="K3">K3</option>
                                                <option value="P1">P1</option>
                                                <option value="P2">P2</option>
                                                <option value="P3">P3</option>
                                                <option value="P4">P4</option>
                                                <option value="P5">P5</option>
                                                <option value="P6">P6</option>
                                            </select>
                                            <select
                                                value={newStudentClass}
                                                onChange={(e) => setNewStudentClass(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                                required
                                            >
                                                <option value="">{t("-- Select Class --", "-- เลือกห้อง --")}</option>
                                                <option value="/1">/1</option>
                                                <option value="/2">/2</option>
                                                <option value="/3">/3</option>
                                                <option value="/4">/4</option>
                                                <option value="/5">/5</option>
                                                <option value="/6">/6</option>
                                                <option value="/7">/7</option>
                                                <option value="/8">/8</option>
                                                <option value="/9">/9</option>
                                                <option value="/10">/10</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!newStudentNickname.trim()) {
                                                        setError(t("Please enter a nickname", "โปรดกรอกชื่อเล่น"));
                                                        return;
                                                    }
                                                    if (!newStudentGrade) {
                                                        setError(t("Please select a grade", "โปรดเลือกชั้น"));
                                                        return;
                                                    }
                                                    if (!newStudentClass) {
                                                        setError(t("Please select a class", "โปรดเลือกห้อง"));
                                                        return;
                                                    }
                                                    try {
                                                        const result = await createStudent({
                                                            firstName: newStudentNickname,
                                                            lastName: "",
                                                            nickname: newStudentNickname,
                                                            schoolId: schoolId as Id<"schools">,
                                                            grade: newStudentGrade,
                                                            class: newStudentClass,
                                                            createdBy: currentUser._id,
                                                        });
                                                        setStudentId(result.id);
                                                        setShowStudentForm(false);
                                                        setNewStudentNickname("");
                                                        setNewStudentGrade("");
                                                        setNewStudentClass("");
                                                    } catch (err) {
                                                        const errorMessage = err instanceof Error ? err.message : t("Failed to create student", "ไม่สามารถสร้างนักเรียนได้");
                                                        setError(errorMessage);
                                                        logger.error("Student creation error", err, {
                                                            component: "MonthlyCalendar",
                                                            action: "createStudent",
                                                            userId: currentUser._id
                                                        });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                {t("Create Student", "สร้างนักเรียน")}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <HierarchicalStudentSelector
                                                students={formStudents}
                                                value={studentId}
                                                onChange={setStudentId}
                                                required
                                                schoolId={schoolId}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowStudentForm(true)}
                                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-4 h-4" />
                                                {t("Add New Student", "เพิ่มนักเรียนใหม่")}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="locationSelect" className="block text-sm font-medium mb-2">
                                        {t("Location", "สถานที่")}
                                    </label>
                                    <select
                                        id="locationSelect"
                                        value={locationId}
                                        onChange={(e) => setLocationId(e.target.value as Id<"locations"> | "")}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        required
                                        disabled={!schoolId}
                                    >
                                        <option value="">{t("-- Select Location --", "-- เลือกสถานที่ --")}</option>
                                        {formLocations?.filter(loc => loc.isActive).map((location) => (
                                            <option key={location._id} value={location._id}>
                                                {language === "en" ? location.name : location.nameTh}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="timeSelect" className="block text-sm font-medium mb-2">
                                        {t("Time", "เวลา")}
                                    </label>
                                    <input
                                        type="time"
                                        id="timeSelect"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {currentUser.role === "moderator" || currentUser.role === "admin"
                                            ? t("Book Class", "จองคลาส")
                                            : t("Request Class", "ขอจองคลาส")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddDialog(false);
                                            setSelectedDate(null);
                                            setSchoolId("");
                                            setStudentId("");
                                            setLocationId("");
                                            setTeacherId(currentUser.role === "teacher" ? currentUser._id : "");
                                            setSelectedTime("09:00");
                                            setError("");
                                            setShowStudentForm(false);
                                            setNewStudentNickname("");
                                        }}
                                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        {t("Cancel", "ยกเลิก")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Class Modal */}
            {editingClass && (
                <EditClassModal
                    classData={editingClass}
                    currentUserId={currentUser._id}
                    onClose={() => setEditingClass(null)}
                    onSuccess={() => setEditingClass(null)}
                />
            )}

            {/* Post-Class Notes Modal */}
            {showPostClassNotes && selectedClassForNotes && (
                <PostClassNotesModal
                    classes={[selectedClassForNotes as unknown as Parameters<typeof PostClassNotesModal>[0]['classes'][0]]}
                    currentUserId={currentUser._id}
                    onClose={() => {
                        setShowPostClassNotes(false);
                        setSelectedClassForNotes(null);
                    }}
                    onComplete={() => {
                        setShowPostClassNotes(false);
                        setSelectedClassForNotes(null);
                        toast.success("Notes saved successfully", "บันทึกโน้ตสำเร็จ");
                    }}
                />
            )}
        </div>
    );
}
