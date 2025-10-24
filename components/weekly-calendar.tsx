"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { getClassStatusColor } from "@/lib/constants";
import { getWeekStart, isToday } from "@/lib/date-utils";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useSwipeGesture } from "@/lib/use-swipe-gesture";
import { useMutation, useQuery } from "convex/react";
import { Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Globe, MapPin, Plus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ClassDetailModal } from "./class-detail-modal";

type WeeklyCalendarProps = {
    currentUser: User;
};

export function WeeklyCalendar({ currentUser }: WeeklyCalendarProps) {
    const { t, language } = useLanguage();
    const schools = useQuery(api.schools.list, {});
    // Only load teachers since we only display teacher names in calendar
    const users = useQuery(api.users.list, { role: "teacher" });
    const bookClass = useMutation(api.classes.book);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">("");

    // Class detail modal state - using enriched class type from listWithDetails
    type ClassWithDetails = {
        _id: Id<"classes">;
        studentId: Id<"students">;
        teacherId: Id<"users">;
        schoolId: Id<"schools">;
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

    // Get students and locations filtered by school (server-side)
    // For the Add Class form, use the form's selected schoolId
    const formStudents = useQuery(
        api.students.list,
        schoolId ? { schoolId } : "skip"
    );
    const formLocations = useQuery(
        api.locations.list,
        schoolId ? { schoolId, activeOnly: true } : "skip"
    );    // Memoize week range calculations
    const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
    const weekEnd = useMemo(() => {
        const end = new Date(weekStart);
        end.setDate(weekStart.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return end;
    }, [weekStart]);

    // Memoize week days array
    const weekDays = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            return day;
        }), [weekStart]);

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

    // Get events for current week
    const events = useQuery(
        api.events.listByDateRange,
        {
            userId: currentUser._id,
            startDate: weekStart.getTime(),
            endDate: weekEnd.getTime()
        }
    );

    // Filter classes by date range on client side (since we're using listWithDetails)
    const weekClasses = useMemo(() => {
        if (!classes) return [];
        return classes.filter(c =>
            c.scheduledDate >= weekStart.getTime() &&
            c.scheduledDate <= weekEnd.getTime()
        );
    }, [classes, weekStart, weekEnd]);

    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // Swipe gestures for week navigation
    useSwipeGesture({
        onSwipeLeft: goToNextWeek,
        onSwipeRight: goToPreviousWeek,
    });

    const goToToday = () => {
        setCurrentDate(new Date());
    };

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
        if (!weekClasses) return [];
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return weekClasses.filter(
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

    return (
        <div className="w-full max-w-7xl mx-auto px-3 py-4 md:p-4">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-4 gap-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {t("Weekly Calendar", "ปฏิทินรายสัปดาห์")}
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
                            onClick={goToPreviousWeek}
                            className="p-2.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all touch-manipulation"
                        >
                            <ChevronLeft className="w-6 h-6 md:w-5 md:h-5" />
                        </button>
                        <span className="text-base md:text-lg font-medium flex-1 md:min-w-[200px] text-center">
                            {weekStart.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                month: "short",
                                day: "numeric",
                            })}{" "}
                            -{" "}
                            {weekEnd.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                        <button
                            onClick={goToNextWeek}
                            className="p-2.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all touch-manipulation"
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-lg shadow-lg overflow-hidden">
                {/* Day headers - abbreviated on mobile */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
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
                            className="px-1 md:px-4 py-2 md:py-3 text-center font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 text-xs md:text-base"
                        >
                            <span className="hidden md:inline">{day.full}</span>
                            <span className="md:hidden">{day.short}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                    {weekDays.map((day, i) => {
                        const dayClasses = getClassesForDay(day);
                        const dayEvents = getEventsForDay(day);
                        const today = isToday(day);

                        return (
                            <div
                                key={i}
                                className={`min-h-[120px] md:min-h-[150px] p-1 md:p-2 ${today ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
                            >
                                <div className="flex justify-between items-start mb-1 md:mb-2">
                                    <span
                                        className={`text-sm md:text-sm font-medium ${today
                                            ? "text-blue-600 dark:text-blue-400 font-bold"
                                            : "text-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {day.getDate()}
                                    </span>
                                    <button
                                        onClick={() => handleAddClass(day)}
                                        className="p-1 md:p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded active:scale-95 transition-all touch-manipulation"
                                        title={
                                            currentUser.role === "moderator" || currentUser.role === "admin"
                                                ? t("Book class", "จองคลาส")
                                                : t("Request class", "ขอจองคลาส")
                                        }
                                    >
                                        <Plus className="w-4 h-4 md:w-4 md:h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {/* Render Events First */}
                                    {dayEvents.map((event) => {
                                        return (
                                            <div
                                                key={event._id}
                                                className="w-full text-left text-xs p-1.5 md:p-2 rounded-lg md:rounded border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                                title={language === "en" ? event.description : event.descriptionTh}
                                            >
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    {getEventIcon(event.eventType)}
                                                    <div className="font-semibold truncate text-[11px] md:text-xs text-purple-700 dark:text-purple-300">
                                                        {language === "en" ? event.title : event.titleTh}
                                                    </div>
                                                </div>
                                                {!event.allDay && (
                                                    <div className="text-purple-600 dark:text-purple-400 text-[9px] md:text-[10px] flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(event.eventDate).toLocaleTimeString(
                                                            language === "en" ? "en-US" : "th-TH",
                                                            { hour: "2-digit", minute: "2-digit" }
                                                        )}
                                                    </div>
                                                )}
                                                {event.location && (
                                                    <div className="text-purple-500 dark:text-purple-400 text-[9px] md:text-[10px] truncate flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {language === "en" ? event.location : event.locationTh}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Render Classes */}
                                    {dayClasses.map((classItem) => {
                                        const teacher = usersMap.get(classItem.teacherId);
                                        const school = schoolsMap.get(classItem.schoolId);
                                        const student = classItem.student;

                                        return (
                                            <button
                                                key={classItem._id}
                                                onClick={() => handleClassClick(classItem)}
                                                className={`w-full text-left text-xs p-1.5 md:p-2 rounded-lg md:rounded border ${getClassStatusColor(classItem.status)} hover:opacity-80 active:scale-95 transition-all touch-manipulation cursor-pointer ${!student ? 'opacity-60' : ''}`}
                                            >
                                                <div className={`font-semibold truncate text-[11px] md:text-xs ${!student ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                    {student ? `${student.firstName} ${student.lastName}` : t("⚠️ Deleted Student", "⚠️ นักเรียนถูกลบ")}
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-300 truncate text-[10px] md:text-xs">
                                                    {teacher?.username}
                                                </div>
                                                {school && (
                                                    <div className="text-gray-500 dark:text-gray-400 text-[9px] md:text-[10px] truncate hidden md:block">
                                                        {language === "en" ? school.name : school.nameTh}
                                                    </div>
                                                )}
                                                <div className="text-gray-500 dark:text-gray-400 text-[9px] md:text-[10px] mt-0.5">
                                                    {new Date(classItem.scheduledDate).toLocaleTimeString(
                                                        language === "en" ? "en-US" : "th-TH",
                                                        { hour: "2-digit", minute: "2-digit" }
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
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
                    allClasses={weekClasses}
                    onClose={() => setSelectedClass(null)}
                />
            )}

            {/* Add Class Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
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
                                                    } catch {
                                                        setError(t("Failed to create student", "ไม่สามารถสร้างนักเรียนได้"));
                                                    }
                                                }}
                                                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                {t("Create Student", "สร้างนักเรียน")}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                id="studentSelect"
                                                value={studentId}
                                                onChange={(e) => setStudentId(e.target.value as Id<"students"> | "")}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                                required
                                            >
                                                <option value="">{t("-- Select Student --", "-- เลือกนักเรียน --")}</option>
                                                {formStudents?.map((student) => (
                                                    <option key={student._id} value={student._id}>
                                                        {student.firstName} {student.lastName}
                                                        {student.grade ? ` (${student.grade}` : ""}
                                                        {student.class ? `${student.class})` : student.grade ? ")" : ""}
                                                    </option>
                                                ))}
                                            </select>
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
        </div>
    );
}
