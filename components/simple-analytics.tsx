"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useQuery } from "convex/react";
import { BarChart3, CheckCircle, Clock, Edit2, FileText, TrendingDown, TrendingUp, Users, XCircle } from "lucide-react";
import { Suspense, useState } from "react";
import { LazyTeacherClassCountModal, ModalLoadingFallback } from "./lazy-components";
import TeacherLogsManager from "./teacher-logs-manager";

interface SimpleAnalyticsProps {
    schoolId: Id<"schools">;
    currentUserId?: Id<"users">;
    currentUserRole?: string;
    currentUser?: User; // Simple User type for TeacherLogsManager
}

export function SimpleAnalytics({ schoolId, currentUserId, currentUserRole, currentUser }: SimpleAnalyticsProps) {
    const { t } = useLanguage();
    const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("month");
    const [showDetails, setShowDetails] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<{ id: Id<"users">; username: string } | null>(null);
    const [analyticsView, setAnalyticsView] = useState<"statistics" | "logs">("statistics");

    // Check if user can view ClassCount (moderator or admin)
    const canViewClassCount = currentUserRole === "moderator" || currentUserRole === "admin";

    // Calculate date range based on selected period
    const getDateRange = () => {
        const now = Date.now();
        switch (selectedPeriod) {
            case "week":
                return { startDate: now - 7 * 24 * 60 * 60 * 1000, endDate: now };
            case "month":
                return { startDate: now - 30 * 24 * 60 * 60 * 1000, endDate: now };
            default:
                return undefined;
        }
    };

    const dateRange = getDateRange();
    const classCount = useQuery(api.simpleAnalytics.getSchoolClassCount, { schoolId });
    const engagementMetrics = useQuery(
        api.simpleAnalytics.getEngagementMetrics,
        dateRange ? { schoolId, ...dateRange } : { schoolId }
    );
    const weeklyComparison = useQuery(api.simpleAnalytics.getWeeklyComparison, { schoolId });
    const activeTeachers = useQuery(
        api.simpleAnalytics.getMostActiveTeachers,
        dateRange ? { schoolId, limit: 5, ...dateRange } : { schoolId, limit: 5 }
    );

    if (!classCount) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500 dark:text-gray-400">
                    {t("Loading...", "กำลังโหลด...")}
                </div>
            </div>
        );
    }

    const renderTrendIndicator = (change: number) => {
        if (change > 0) {
            return (
                <span className="flex items-center text-green-600 dark:text-green-400 text-sm font-semibold">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{change}%
                </span>
            );
        } else if (change < 0) {
            return (
                <span className="flex items-center text-red-600 dark:text-red-400 text-sm font-semibold">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {change}%
                </span>
            );
        }
        return <span className="text-gray-500 text-sm">0%</span>;
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
            {/* View Switcher: Statistics vs Teacher Logs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setAnalyticsView("statistics")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${analyticsView === "statistics"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    <BarChart3 className="w-5 h-5" />
                    {t("Statistics", "สถิติ")}
                </button>
                <button
                    onClick={() => setAnalyticsView("logs")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${analyticsView === "logs"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    <FileText className="w-5 h-5" />
                    {t("Teacher Logs", "บันทึกการสอน")}
                </button>
            </div>

            {/* Render Statistics View */}
            {analyticsView === "statistics" && (
                <>
                    {/* Header with Period Selector */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                <BarChart3 className="w-8 h-8 text-blue-500" />
                                {t("Class Statistics & Engagement", "สถิติและการมีส่วนร่วมของชั้นเรียน")}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t(
                                    "Interactive overview with engagement metrics",
                                    "ภาพรวมแบบโต้ตอบพร้อมตัวชี้วัดการมีส่วนร่วม"
                                )}
                            </p>
                        </div>

                        {/* Period Selector */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedPeriod("week")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === "week"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {t("Week", "สัปดาห์")}
                            </button>
                            <button
                                onClick={() => setSelectedPeriod("month")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === "month"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {t("Month", "เดือน")}
                            </button>
                            <button
                                onClick={() => setSelectedPeriod("all")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === "all"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {t("All Time", "ทั้งหมด")}
                            </button>
                        </div>
                    </div>

                    {/* Main Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Classes */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                    {t("Total Classes", "ชั้นเรียนทั้งหมด")}
                                </h3>
                            </div>
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                {classCount.total}
                            </p>
                            {weeklyComparison && (
                                <div className="mt-2">
                                    {renderTrendIndicator(weeklyComparison.changes.total)}
                                </div>
                            )}
                        </div>

                        {/* Approved Classes */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                <h3 className="font-semibold text-green-900 dark:text-green-100">
                                    {t("Approved", "อนุมัติแล้ว")}
                                </h3>
                            </div>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                {classCount.approved}
                            </p>
                            {weeklyComparison && (
                                <div className="mt-2">
                                    {renderTrendIndicator(weeklyComparison.changes.approved)}
                                </div>
                            )}
                        </div>

                        {/* Pending Classes */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                    {t("Pending", "รอดำเนินการ")}
                                </h3>
                            </div>
                            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                                {classCount.pending}
                            </p>
                            {weeklyComparison && (
                                <div className="mt-2">
                                    {renderTrendIndicator(weeklyComparison.changes.pending)}
                                </div>
                            )}
                        </div>

                        {/* Rejected Classes */}
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                <h3 className="font-semibold text-red-900 dark:text-red-100">
                                    {t("Rejected", "ปฏิเสธ")}
                                </h3>
                            </div>
                            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                                {classCount.rejected}
                            </p>
                            {weeklyComparison && (
                                <div className="mt-2">
                                    {renderTrendIndicator(weeklyComparison.changes.rejected)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Engagement Metrics Section */}
                    {engagementMetrics && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-purple-500" />
                                {t("Engagement Metrics", "ตัวชี้วัดการมีส่วนร่วม")}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                                        {t("Approval Rate", "อัตราการอนุมัติ")}
                                    </p>
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                        {engagementMetrics.approvalRate}%
                                    </p>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1">
                                        <Edit2 className="w-4 h-4" />
                                        {t("Edit Rate", "อัตราการแก้ไข")}
                                    </p>
                                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                        {engagementMetrics.editRate}%
                                    </p>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                        {engagementMetrics.editedClassesCount} {t("edited", "แก้ไข")}
                                    </p>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                                        {t("Pending Response Rate", "อัตราการตอบสนองที่รอดำเนินการ")}
                                    </p>
                                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                        {engagementMetrics.pendingResponseRate}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Most Active Teachers */}
                    {activeTeachers && activeTeachers.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6 text-teal-500" />
                                {t("Most Active Teachers", "ครูที่ใช้งานมากที่สุด")}
                            </h3>
                            <div className="space-y-3">
                                {activeTeachers.map((teacher, index) => (
                                    <div
                                        key={teacher.teacherId}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="font-medium">{teacher.username}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                                {teacher.count}
                                            </span>
                                            {canViewClassCount && (
                                                <button
                                                    onClick={() => setSelectedTeacher({ id: teacher.teacherId, username: teacher.username })}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5 group"
                                                    title={t("View Class Count Details", "ดูรายละเอียดจำนวนชั้นเรียน")}
                                                >
                                                    <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    {t("ClassCount", "จำนวนชั้น")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toggle Details Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            {showDetails
                                ? t("Hide Details", "ซ่อนรายละเอียด")
                                : t("Show More Details", "แสดงรายละเอียดเพิ่มเติม")}
                        </button>
                    </div>

                    {/* Additional Details Section (Collapsible) */}
                    {showDetails && weeklyComparison && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4">
                                {t("Weekly Comparison", "การเปรียบเทียบรายสัปดาห์")}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-lg mb-3 text-green-600 dark:text-green-400">
                                        {t("Current Week", "สัปดาห์นี้")}
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>{t("Total", "ทั้งหมด")}:</span>
                                            <span className="font-bold">{weeklyComparison.currentWeek.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t("Approved", "อนุมัติ")}:</span>
                                            <span className="font-bold text-green-600">
                                                {weeklyComparison.currentWeek.approved}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t("Pending", "รอดำเนินการ")}:</span>
                                            <span className="font-bold text-yellow-600">
                                                {weeklyComparison.currentWeek.pending}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t("Rejected", "ปฏิเสธ")}:</span>
                                            <span className="font-bold text-red-600">
                                                {weeklyComparison.currentWeek.rejected}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-3 text-gray-600 dark:text-gray-400">
                                        {t("Previous Week", "สัปดาห์ที่แล้ว")}
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>{t("Total", "ทั้งหมด")}:</span>
                                            <span className="font-bold">{weeklyComparison.previousWeek.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t("Approved", "อนุมัติ")}:</span>
                                            <span className="font-bold text-green-600">
                                                {weeklyComparison.previousWeek.approved}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t("Pending", "รอดำเนินการ")}:</span>
                                            <span className="font-bold text-yellow-600">
                                                {weeklyComparison.previousWeek.pending}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t("Rejected", "ปฏิเสธ")}:</span>
                                            <span className="font-bold text-red-600">
                                                {weeklyComparison.previousWeek.rejected}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Render Teacher Logs View */}
            {analyticsView === "logs" && currentUser && (
                <TeacherLogsManager currentUser={currentUser} />
            )}

            {/* ClassCount Modal */}
            {selectedTeacher && currentUserId && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <LazyTeacherClassCountModal
                        teacherId={selectedTeacher.id}
                        teacherUsername={selectedTeacher.username}
                        moderatorId={currentUserId}
                        moderatorRole={currentUserRole as "moderator" | "admin"}
                        onClose={() => setSelectedTeacher(null)}
                    />
                </Suspense>
            )}
        </div>
    );
}
