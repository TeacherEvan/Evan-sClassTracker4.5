"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { getWeekStart, isToday } from "@/lib/date-utils";
import { getClassStatusColor } from "@/lib/constants";
import type { ClassData, User } from "@/lib/types";

type WeeklyCalendarProps = {
    currentUser: User;
};

export function WeeklyCalendar({ currentUser }: WeeklyCalendarProps) {
    const { t, language } = useLanguage();
    const schools = useQuery(api.schools.list, {});
    const users = useQuery(api.users.list, {});
    const bookClass = useMutation(api.classes.book);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">("");

    // Form fields
    const [title, setTitle] = useState("");
    const [titleTh, setTitleTh] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
    const [error, setError] = useState("");

    // Memoize week range calculations
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

    // Get classes for current week
    const classes = useQuery(
        api.classes.getByDateRange,
        {
            startDate: weekStart.getTime(),
            endDate: weekEnd.getTime(),
            schoolId: currentUser.role === "moderator" ? currentUser.schoolId : selectedSchoolId || undefined,
            teacherId: currentUser.role === "teacher" ? currentUser._id : undefined,
        }
    ) as ClassData[] | undefined;

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

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleAddClass = (date: Date) => {
        setSelectedDate(date);
        setShowAddDialog(true);
        setError("");

        // Pre-fill school if moderator
        if (currentUser?.role === "moderator" && currentUser.schoolId) {
            setSchoolId(currentUser.schoolId);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !titleTh.trim() || !description.trim() || !descriptionTh.trim()) {
            setError(t("Please fill in all fields in both languages", "กรุณากรอกข้อมูลทุกช่องทั้งสองภาษา"));
            return;
        }

        if (!schoolId) {
            setError(t("Please select a school", "กรุณาเลือกโรงเรียน"));
            return;
        }

        if (!selectedDate) {
            return;
        }

        try {
            await bookClass({
                teacherId: currentUser._id,
                schoolId: schoolId as Id<"schools">,
                title,
                titleTh,
                description,
                descriptionTh,
                scheduledDate: selectedDate.getTime(),
            });

            // Reset form
            setTitle("");
            setTitleTh("");
            setDescription("");
            setDescriptionTh("");
            setSchoolId("");
            setShowAddDialog(false);
            setSelectedDate(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create class");
        }
    };

    const getClassesForDay = (day: Date) => {
        if (!classes) return [];
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return classes.filter(
            (c) => c.scheduledDate >= dayStart.getTime() && c.scheduledDate <= dayEnd.getTime()
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">
                        {t("Weekly Calendar", "ปฏิทินรายสัปดาห์")}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t("Today", "วันนี้")}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-medium min-w-[200px] text-center">
                            {weekStart.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                month: "long",
                                day: "numeric",
                            })}{" "}
                            -{" "}
                            {weekEnd.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                        <button
                            onClick={goToNextWeek}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* School filter for teachers and admins */}
                    {currentUser.role !== "moderator" && (
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value as Id<"schools"> | "")}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                    {[
                        t("Monday", "จันทร์"),
                        t("Tuesday", "อังคาร"),
                        t("Wednesday", "พุธ"),
                        t("Thursday", "พฤหัสบดี"),
                        t("Friday", "ศุกร์"),
                        t("Saturday", "เสาร์"),
                        t("Sunday", "อาทิตย์"),
                    ].map((day, i) => (
                        <div
                            key={i}
                            className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                    {weekDays.map((day, i) => {
                        const dayClasses = getClassesForDay(day);
                        const today = isToday(day);

                        return (
                            <div
                                key={i}
                                className={`min-h-[150px] p-2 ${today ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className={`text-sm font-medium ${today
                                            ? "text-blue-600 dark:text-blue-400 font-bold"
                                            : "text-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {day.getDate()}
                                    </span>
                                    <button
                                        onClick={() => handleAddClass(day)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                        title={t("Add class", "เพิ่มคลาส")}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {dayClasses.map((classItem) => {
                                        const teacher = users?.find((u) => u._id === classItem.teacherId);
                                        const school = schools?.find((s) => s._id === classItem.schoolId);

                                        return (
                                            <div
                                                key={classItem._id}
                                                className={`text-xs p-2 rounded border ${getClassStatusColor(classItem.status)}`}
                                            >
                                                <div className="font-semibold truncate">
                                                    {language === "en" ? classItem.title : classItem.titleTh}
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-300 truncate">
                                                    {teacher?.username}
                                                </div>
                                                {school && (
                                                    <div className="text-gray-500 dark:text-gray-400 text-[10px] truncate">
                                                        {language === "en" ? school.name : school.nameTh}
                                                    </div>
                                                )}
                                            </div>
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

            {/* Add Class Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">
                                    {t("Add Class", "เพิ่มคลาส")}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowAddDialog(false);
                                        setSelectedDate(null);
                                        setError("");
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

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="titleEn" className="block text-sm font-medium mb-2">
                                            {t("Title (English)", "หัวข้อ (อังกฤษ)")}
                                        </label>
                                        <input
                                            type="text"
                                            id="titleEn"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="titleTh" className="block text-sm font-medium mb-2">
                                            {t("Title (Thai)", "หัวข้อ (ไทย)")}
                                        </label>
                                        <input
                                            type="text"
                                            id="titleTh"
                                            value={titleTh}
                                            onChange={(e) => setTitleTh(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="descEn" className="block text-sm font-medium mb-2">
                                            {t("Description (English)", "รายละเอียด (อังกฤษ)")}
                                        </label>
                                        <textarea
                                            id="descEn"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="descTh" className="block text-sm font-medium mb-2">
                                            {t("Description (Thai)", "รายละเอียด (ไทย)")}
                                        </label>
                                        <textarea
                                            id="descTh"
                                            value={descriptionTh}
                                            onChange={(e) => setDescriptionTh(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {t("Create Class", "สร้างคลาส")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddDialog(false);
                                            setSelectedDate(null);
                                            setError("");
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
