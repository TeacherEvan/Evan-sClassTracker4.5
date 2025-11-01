"use client";

import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

interface MultiDateCalendarProps {
    selectedDates: number[]; // Array of timestamps
    onDatesChange: (dates: number[]) => void;
    minDate?: Date;
    maxDate?: Date;
    maxSelections?: number;
    className?: string;
}

export function MultiDateCalendar({
    selectedDates,
    onDatesChange,
    minDate = new Date(),
    maxDate,
    maxSelections = 10,
    className = "",
}: MultiDateCalendarProps) {
    const { t } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get days in current month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

    // Navigate months
    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    // Check if date is selected
    const isDateSelected = (day: number): boolean => {
        const dateTimestamp = new Date(year, month, day).setHours(0, 0, 0, 0);
        return selectedDates.some(
            (timestamp) => new Date(timestamp).setHours(0, 0, 0, 0) === dateTimestamp
        );
    };

    // Check if date is disabled
    const isDateDisabled = (day: number): boolean => {
        const date = new Date(year, month, day);
        const dateTimestamp = date.setHours(0, 0, 0, 0);
        // Create new Date objects to avoid mutating props
        const minTimestamp = new Date(minDate).setHours(0, 0, 0, 0);
        const maxTimestamp = maxDate ? new Date(maxDate).setHours(23, 59, 59, 999) : Infinity;

        return dateTimestamp < minTimestamp || dateTimestamp > maxTimestamp;
    };

    // Toggle date selection
    const toggleDate = (day: number) => {
        const dateTimestamp = new Date(year, month, day).setHours(9, 0, 0, 0); // Default to 9 AM

        if (isDateSelected(day)) {
            // Remove date
            onDatesChange(
                selectedDates.filter(
                    (timestamp) => new Date(timestamp).setHours(0, 0, 0, 0) !== new Date(year, month, day).setHours(0, 0, 0, 0)
                )
            );
        } else {
            // Add date if not at max
            if (selectedDates.length >= maxSelections) {
                toast.warning(
                    `You can only select up to ${maxSelections} dates at once.`,
                    `คุณสามารถเลือกได้สูงสุด ${maxSelections} วันเท่านั้น`
                );
                return;
            }
            onDatesChange([...selectedDates, dateTimestamp].sort((a, b) => a - b));
        }
    };

    // Clear all selections
    const clearAll = () => {
        onDatesChange([]);
    };

    // Select all weekdays in current month
    const selectAllWeekdays = () => {
        const weekdayDates: number[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            // Monday to Friday (1-5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isDateDisabled(day) && !isDateSelected(day)) {
                if (selectedDates.length + weekdayDates.length < maxSelections) {
                    weekdayDates.push(date.setHours(9, 0, 0, 0));
                }
            }
        }
        onDatesChange([...selectedDates, ...weekdayDates].sort((a, b) => a - b));
    };

    // Generate calendar grid
    const calendarDays: (number | null)[] = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const monthNames = [
        t("January", "มกราคม"),
        t("February", "กุมภาพันธ์"),
        t("March", "มีนาคม"),
        t("April", "เมษายน"),
        t("May", "พฤษภาคม"),
        t("June", "มิถุนายน"),
        t("July", "กรกฎาคม"),
        t("August", "สิงหาคม"),
        t("September", "กันยายน"),
        t("October", "ตุลาคม"),
        t("November", "พฤศจิกายน"),
        t("December", "ธันวาคม"),
    ];

    const dayNames = [
        t("Sun", "อา"),
        t("Mon", "จ"),
        t("Tue", "อ"),
        t("Wed", "พ"),
        t("Thu", "พฤ"),
        t("Fri", "ศ"),
        t("Sat", "ส"),
    ];

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={t("Previous month", "เดือนก่อนหน้า")}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold">
                    {monthNames[month]} {year}
                </h3>
                <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={t("Next month", "เดือนถัดไป")}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                    <div key={`day-${index}`} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const selected = isDateSelected(day);
                    const disabled = isDateDisabled(day);

                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => !disabled && toggleDate(day)}
                            disabled={disabled}
                            className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                transition-all touch-manipulation min-h-[48px]
                ${selected
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                                    : disabled
                                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95"
                                }
              `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Selected dates info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">
                        {t(`${selectedDates.length} dates selected`, `เลือก ${selectedDates.length} วันแล้ว`)}
                        {selectedDates.length >= maxSelections && (
                            <span className="text-orange-600 dark:text-orange-400 ml-2">
                                ({t("Maximum reached", "ถึงขีดจำกัดแล้ว")})
                            </span>
                        )}
                    </span>
                    {selectedDates.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            {t("Clear all", "ล้างทั้งหมด")}
                        </button>
                    )}
                </div>

                {/* Quick select weekdays */}
                <button
                    type="button"
                    onClick={selectAllWeekdays}
                    className="w-full py-2 px-4 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                    {t("Select all weekdays (Mon-Fri)", "เลือกวันธรรมดาทั้งหมด (จ-ศ)")}
                </button>

                {/* Display selected dates */}
                {selectedDates.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {t("Selected dates:", "วันที่เลือก:")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedDates.map((timestamp) => (
                                <span
                                    key={timestamp}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                                >
                                    {new Date(timestamp).toLocaleDateString()}
                                    <button
                                        type="button"
                                        onClick={() => onDatesChange(selectedDates.filter((t) => t !== timestamp))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
