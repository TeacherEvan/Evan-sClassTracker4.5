"use client";

import { useLanguage } from "@/lib/language-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CalendarPickerProps {
    selectedDate: number | null;
    onDateSelect: (timestamp: number) => void;
    disabledDates?: number[]; // Array of timestamps that should be disabled
}

export function CalendarPicker({
    selectedDate,
    onDateSelect,
    disabledDates = [],
}: CalendarPickerProps) {
    const { t, language } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Generate calendar days for current month
    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days in month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const days = getDaysInMonth();
    const monthName = currentMonth.toLocaleDateString(
        language === "en" ? "en-US" : "th-TH",
        { month: "long", year: "numeric" }
    );

    const handlePreviousMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
        );
    };

    const handleNextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
        );
    };

    const isDateDisabled = (day: number) => {
        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        const timestamp = date.setHours(0, 0, 0, 0);

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (timestamp < today.getTime()) return true;

        // Check if date is in disabled dates array
        return disabledDates.some((disabledDate) => {
            const disabled = new Date(disabledDate);
            disabled.setHours(0, 0, 0, 0);
            return disabled.getTime() === timestamp;
        });
    };

    const isDateSelected = (day: number) => {
        if (!selectedDate) return false;
        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        const timestamp = date.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        return timestamp === selected.getTime();
    };

    const handleDateClick = (day: number) => {
        if (isDateDisabled(day)) return;

        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        const timestamp = date.setHours(0, 0, 0, 0);
        onDateSelect(timestamp);
    };

    const weekDays =
        language === "en"
            ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            : ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handlePreviousMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {monthName}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const disabled = isDateDisabled(day);
                    const selected = isDateSelected(day);

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            disabled={disabled}
                            className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${selected
                                    ? "bg-blue-500 text-white shadow-md scale-105"
                                    : disabled
                                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                        : "text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105"
                                }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                            {t("Selected", "เลือกแล้ว")}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                            {t("Unavailable", "ไม่ว่าง")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
