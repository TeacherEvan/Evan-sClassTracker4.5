"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
    BarChart3,
    Calculator,
    Calendar,
    CheckCircle2,
    Download,
    TrendingUp,
    Users,
    X
} from "lucide-react";
import { useMemo, useState } from "react";
import { ClassPaymentCalculator } from "./class-payment-calculator";

interface ClassAnalyticsProps {
    userId: Id<"users">;
    onClose: () => void;
}

export function ClassAnalytics({ userId, onClose }: ClassAnalyticsProps) {
    const { t, language } = useLanguage();

    // Fetch user to check role
    const user = useQuery(api.users.getById, { id: userId });

    // Default to last 30 days
    const [startDate, setStartDate] = useState<number>(
        Date.now() - 30 * 24 * 60 * 60 * 1000
    );
    const [endDate, setEndDate] = useState<number>(Date.now());

    // Payment Calculator state
    const [showPaymentCalculator, setShowPaymentCalculator] = useState(false);

    // Helper: Convert rating enum to bilingual string
    const getRatingText = (rating: "excellent" | "good" | "needs_improvement"): { en: string; th: string } => {
        const ratings = {
            excellent: { en: "Excellent", th: "ยอดเยี่ยม" },
            good: { en: "Good", th: "ดี" },
            needs_improvement: { en: "Needs Improvement", th: "ต้องปรับปรุง" },
        };
        return ratings[rating];
    };

    // Fetch analytics data
    const summaryData = useQuery(api.analytics.getSummaryAnalytics, {
        userId,
        startDate,
        endDate,
    });

    const studentPerformanceData = useQuery(api.analytics.getStudentPerformance, {
        userId,
        startDate,
        endDate,
    });

    // ✅ NEW: Teacher comparison data (moderator/admin only)
    const teacherComparisonData = useQuery(
        api.analytics.getTeacherComparison,
        user?.role === "moderator" || user?.role === "admin"
            ? { userId, startDate, endDate }
            : "skip"
    );

    // ✅ NEW: Tab state for switching between views (moderator/admin only)
    const [activeTab, setActiveTab] = useState<"students" | "teachers">("students");

    // ✅ OPTIMIZED: Memoize CSV export logic
    const csvData = useMemo(() => {
        if (!studentPerformanceData) return null;

        const headers = [
            t("Student Name", "ชื่อนักเรียน"),
            t("Total Classes", "คลาสทั้งหมด"),
            t("Attended", "เข้าเรียน"),
            t("Attendance Rate", "อัตราเข้าเรียน"),
            t("Avg ClassCount", "ClassCount เฉลี่ย"),
            t("Performance", "ผลการเรียน"),
        ];

        const rows = studentPerformanceData.map((student) => {
            const ratingText = getRatingText(student.rating);
            return [
                student.studentName,
                student.totalClasses,
                student.attendedClasses,
                `${student.attendanceRate}%`,
                student.avgClassCount,
                language === "en" ? ratingText.en : ratingText.th,
            ];
        });

        return { headers, rows };
    }, [studentPerformanceData, language, t]);

    // Handle date changes
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value).getTime();
        if (!isNaN(newDate)) setStartDate(newDate);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value).getTime();
        if (!isNaN(newDate)) setEndDate(newDate);
    };

    // Export to CSV (uses memoized csvData)
    const exportToCSV = () => {
        if (!csvData) return;

        const csvContent = [
            csvData.headers.join(","),
            ...csvData.rows.map((row) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `class-analytics-${new Date().toISOString().split("T")[0]}.csv`
        );
        link.click();
    };

    // Loading state
    if (!summaryData || !studentPerformanceData) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full flex flex-col max-h-[85vh]">
                    <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            {t("Class Analytics", "การวิเคราะห์คลาส")}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label={t("Close", "ปิด")}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow p-6 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t("Loading analytics...", "กำลังโหลดการวิเคราะห์...")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Get performance color
    const getPerformanceColor = (rating: "excellent" | "good" | "needs_improvement"): string => {
        if (rating === "excellent") return "text-green-600 dark:text-green-400";
        if (rating === "good") return "text-blue-600 dark:text-blue-400";
        return "text-yellow-600 dark:text-yellow-400";
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            {t("Class Analytics", "การวิเคราะห์คลาส")}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={t("Close", "ปิด")}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Date Range Selector */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("Date Range", "ช่วงเวลา")}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Start Date", "วันที่เริ่มต้น")}
                                </label>
                                <input
                                    type="date"
                                    value={new Date(startDate).toISOString().split("T")[0]}
                                    onChange={handleStartDateChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("End Date", "วันที่สิ้นสุด")}
                                </label>
                                <input
                                    type="date"
                                    value={new Date(endDate).toISOString().split("T")[0]}
                                    onChange={handleEndDateChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {/* Total Classes Card */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <BarChart3 className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{summaryData.totalClasses}</span>
                            </div>
                            <p className="text-sm opacity-90">
                                {t("Total Classes", "คลาสทั้งหมด")}
                            </p>
                        </div>

                        {/* Attendance Rate Card */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle2 className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{summaryData.attendanceRate}%</span>
                            </div>
                            <p className="text-sm opacity-90">
                                {t("Attendance Rate", "อัตราเข้าเรียน")}
                            </p>
                        </div>

                        {/* Active Students Card */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{summaryData.activeStudents}</span>
                            </div>
                            <p className="text-sm opacity-90">
                                {t("Active Students", "นักเรียนที่ใช้งาน")}
                            </p>
                        </div>

                        {/* Avg ClassCount Card */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{summaryData.avgClassCount}</span>
                            </div>
                            <p className="text-sm opacity-90">
                                {t("Avg ClassCount", "ClassCount เฉลี่ย")}
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher for Moderator/Admin */}
                    {(user?.role === "moderator" || user?.role === "admin") && teacherComparisonData && teacherComparisonData.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab("students")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "students"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {t("Student Performance", "ผลการเรียนนักเรียน")}
                            </button>
                            <button
                                onClick={() => setActiveTab("teachers")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "teachers"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {t("Teacher Comparison", "เปรียบเทียบครู")}
                            </button>
                        </div>
                    )}

                    {/* Teacher Comparison Table (Moderator/Admin Only) */}
                    {activeTab === "teachers" && (user?.role === "moderator" || user?.role === "admin") && teacherComparisonData && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    {t("Teacher Comparison", "เปรียบเทียบครู")}
                                </h3>
                            </div>
                            {teacherComparisonData.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {t("No teacher data available for this date range", "ไม่มีข้อมูลครูในช่วงเวลานี้")}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Teacher", "ครู")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Classes", "คลาส")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("With Notes", "มีบันทึก")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Attendance", "เข้าเรียน")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Students", "นักเรียน")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Total CC", "CC รวม")}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {teacherComparisonData.map((teacher) => (
                                                <tr
                                                    key={teacher.teacherId}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                                        {teacher.teacherName}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {teacher.totalClasses}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`font-semibold ${teacher.attendedClasses / teacher.totalClasses >= 0.8
                                                                ? "text-green-600 dark:text-green-400"
                                                                : teacher.attendedClasses / teacher.totalClasses >= 0.5
                                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                                    : "text-red-600 dark:text-red-400"
                                                            }`}>
                                                            {teacher.attendedClasses} ({Math.round((teacher.attendedClasses / teacher.totalClasses) * 100)}%)
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`font-semibold ${teacher.attendanceRate >= 80
                                                                ? "text-green-600 dark:text-green-400"
                                                                : teacher.attendanceRate >= 60
                                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                                    : "text-red-600 dark:text-red-400"
                                                            }`}>
                                                            {teacher.attendanceRate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {teacher.uniqueStudentCount}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                        {teacher.avgClassCount}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Student Performance Table */}
                    {activeTab === "students" && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    {t("Student Performance", "ผลการเรียนของนักเรียน")}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {/* Payment Calculator Button (Moderators Only) */}
                                    {user?.role === "moderator" && (
                                        <button
                                            onClick={() => setShowPaymentCalculator(true)}
                                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                                            title={t("Payment Calculator", "เครื่องคำนวณค่าสอน")}
                                        >
                                            <Calculator className="w-4 h-4" />
                                            {t("Calculator", "คำนวณ")}
                                        </button>
                                    )}
                                    {/* Export CSV Button */}
                                    <button
                                        onClick={exportToCSV}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        {t("Export CSV", "ส่งออก CSV")}
                                    </button>
                                </div>
                            </div>

                            {studentPerformanceData.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {t("No student data available for this date range", "ไม่มีข้อมูลนักเรียนในช่วงเวลานี้")}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Student", "นักเรียน")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Total", "ทั้งหมด")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Attended", "เข้าเรียน")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Rate", "อัตรา")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Avg CC", "CC เฉลี่ย")}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {t("Performance", "ผลการเรียน")}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {studentPerformanceData.map((student) => {
                                                const ratingText = getRatingText(student.rating);
                                                return (
                                                    <tr
                                                        key={student.studentId}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                                            {student.studentName}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                            {student.totalClasses}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                            {student.attendedClasses}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span
                                                                className={`font-semibold ${student.attendanceRate >= 80
                                                                    ? "text-green-600 dark:text-green-400"
                                                                    : student.attendanceRate >= 60
                                                                        ? "text-yellow-600 dark:text-yellow-400"
                                                                        : "text-red-600 dark:text-red-400"
                                                                    }`}
                                                            >
                                                                {student.attendanceRate}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                            {student.avgClassCount}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`font-semibold ${getPerformanceColor(student.rating)}`}>
                                                                {language === "en" ? ratingText.en : ratingText.th}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
                    >
                        {t("Close", "ปิด")}
                    </button>
                </div>
            </div>

            {/* Payment Calculator Modal (Moderators Only) */}
            {showPaymentCalculator && user?.role === "moderator" && (
                <ClassPaymentCalculator
                    teacherId={userId}
                    userRole={user.role}
                    onClose={() => setShowPaymentCalculator(false)}
                />
            )}
        </div>
    );
}
