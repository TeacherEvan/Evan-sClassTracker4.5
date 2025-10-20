"use client";

import { useLanguage } from "@/lib/language-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface MonthCalendarPickerProps {
    selectedDate: number | null;
    onSelectDate: (timestamp: number) => void;
    minDate?: number; // Optional minimum date (timestamp)
    maxDate?: number; // Optional maximum date (timestamp)
}

export function MonthCalendarPicker({
    selectedDate,
    onSelectDate,
    minDate,
    maxDate,
}: MonthCalendarPickerProps) {
    const { t, language } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });

    const monthNames = language === "en"
        ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        : ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    const dayNames = language === "en"
        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        : ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before the 1st of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        return date.getTime() === selected.getTime();
    };

    const isDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        const timestamp = date.getTime();

        if (minDate && timestamp < minDate) return true;
        if (maxDate && timestamp > maxDate) return true;
        return false;
    };

    const handleDayClick = (day: number) => {
        if (isDisabled(day)) return;

        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        onSelectDate(date.getTime());
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            {/* Month/Year Header with Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={t("Previous month", "เดือนก่อนหน้า")}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={t("Next month", "เดือนถัดไป")}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                    <div
                        key={index}
                        className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const disabled = isDisabled(day);
                    const selected = isSelected(day);
                    const todayDate = isToday(day);

                    return (
                        <button
                            key={day}
                            onClick={() => handleDayClick(day)}
                            disabled={disabled}
                            className={`
                aspect-square p-2 rounded-lg text-sm font-medium transition-all
                ${disabled
                                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                }
                ${selected
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : todayDate
                                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                                        : "text-gray-700 dark:text-gray-300"
                                }
                active:scale-95
              `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700" />
                    <span className="text-gray-600 dark:text-gray-400">{t("Today", "วันนี้")}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-blue-500 border border-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">{t("Selected", "เลือกแล้ว")}</span>
                </div>
            </div>
        </div>
    );
}
