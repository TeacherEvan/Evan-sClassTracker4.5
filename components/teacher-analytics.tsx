"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
    Award,
    BarChart3,
    CheckCircle,
    Clock,
    TrendingUp,
    Users,
    XCircle,
} from "lucide-react";
import { useState } from "react";

interface TeacherAnalyticsProps {
    schoolId: Id<"schools">;
}

export function TeacherAnalytics({ schoolId }: TeacherAnalyticsProps) {
    const { t, language } = useLanguage();
    const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    // Calculate date range
    const now = Date.now();
    const startDate =
        dateRange === "all"
            ? undefined
            : now - (dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000;

    // Fetch analytics data
    const schoolAnalytics = useQuery(api.analytics.getSchoolAnalytics, {
        schoolId,
        startDate,
        endDate: now,
    });

    const teacherAnalytics = useQuery(api.analytics.getTeacherAnalytics, {
        schoolId,
        startDate,
        endDate: now,
    });

    const teacherRanking = useQuery(api.analytics.getTeacherRanking, {
        schoolId,
        startDate,
        endDate: now,
        limit: 10,
    });

    const classTrends = useQuery(api.analytics.getClassTrends, {
        schoolId,
        startDate: startDate || now - 90 * 24 * 60 * 60 * 1000,
        endDate: now,
        interval: dateRange === "7d" ? "daily" : dateRange === "30d" ? "daily" : "weekly",
    });

    if (!schoolAnalytics || !teacherAnalytics) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500 dark:text-gray-400">
                    {t("Loading analytics...", "กำลังโหลดข้อมูลการวิเคราะห์...")}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-blue-500" />
                        {t("Teacher Analytics", "การวิเคราะห์ข้อมูลครู")}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t(
                            "Performance metrics and class booking statistics",
                            "ตัวชี้วัดประสิทธิภาพและสถิติการจองคลาส"
                        )}
                    </p>
                </div>

                {/* Date Range Filter */}
                <div className="flex gap-2">
                    {(["7d", "30d", "90d", "all"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${dateRange === range
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            {range === "all"
                                ? t("All Time", "ทั้งหมด")
                                : range === "7d"
                                    ? t("7 Days", "7 วัน")
                                    : range === "30d"
                                        ? t("30 Days", "30 วัน")
                                        : t("90 Days", "90 วัน")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overall Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<BarChart3 className="w-6 h-6" />}
                    title={t("Total Classes", "คลาสทั้งหมด")}
                    value={schoolAnalytics.totalClasses}
                    color="blue"
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    title={t("Approved", "อนุมัติ")}
                    value={schoolAnalytics.approved}
                    color="green"
                />
                <StatCard
                    icon={<XCircle className="w-6 h-6" />}
                    title={t("Rejected", "ปฏิเสธ")}
                    value={schoolAnalytics.rejected}
                    color="red"
                />
                <StatCard
                    icon={<TrendingUp className="w-6 h-6" />}
                    title={t("Approval Rate", "อัตราการอนุมัติ")}
                    value={`${schoolAnalytics.approvalRate.toFixed(1)}%`}
                    color="purple"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={<Clock className="w-6 h-6" />}
                    title={t("Pending", "รอดำเนินการ")}
                    value={schoolAnalytics.pending}
                    color="yellow"
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    title={t("Acknowledged", "รับทราบแล้ว")}
                    value={schoolAnalytics.acknowledged}
                    color="indigo"
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    title={t("Active Teachers", "ครูที่ใช้งาน")}
                    value={schoolAnalytics.uniqueTeachers}
                    color="cyan"
                />
            </div>

            {/* Top Teachers Ranking */}
            {teacherRanking && teacherRanking.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-500" />
                        {t("Top Teachers by Approval Rate", "ครูที่มีอัตราการอนุมัติสูงสุด")}
                    </h3>
                    <div className="space-y-3">
                        {teacherRanking.map((teacher, index) => (
                            <div
                                key={teacher.teacherId}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0
                                                ? "bg-yellow-500 text-white"
                                                : index === 1
                                                    ? "bg-gray-400 text-white"
                                                    : index === 2
                                                        ? "bg-orange-600 text-white"
                                                        : "bg-gray-300 text-gray-700"
                                            }`}
                                    >
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{teacher.teacherName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t(
                                                `${teacher.totalClasses} classes`,
                                                `${teacher.totalClasses} คลาส`
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {teacher.approvalRate.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {t(
                                            `${teacher.approved}/${teacher.approved + teacher.rejected}`,
                                            `${teacher.approved}/${teacher.approved + teacher.rejected}`
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Teachers Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    {t("All Teachers Performance", "ผลงานครูทั้งหมด")}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-semibold">
                                    {t("Teacher", "ครู")}
                                </th>
                                <th className="text-center py-3 px-4 font-semibold">
                                    {t("Total", "ทั้งหมด")}
                                </th>
                                <th className="text-center py-3 px-4 font-semibold">
                                    {t("Approved", "อนุมัติ")}
                                </th>
                                <th className="text-center py-3 px-4 font-semibold">
                                    {t("Rejected", "ปฏิเสธ")}
                                </th>
                                <th className="text-center py-3 px-4 font-semibold">
                                    {t("Pending", "รอดำเนินการ")}
                                </th>
                                <th className="text-center py-3 px-4 font-semibold">
                                    {t("Rate", "อัตรา")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherAnalytics.map((teacher) => (
                                <tr
                                    key={teacher.teacherId}
                                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <td className="py-3 px-4 font-medium">{teacher.teacherName}</td>
                                    <td className="py-3 px-4 text-center">{teacher.totalClasses}</td>
                                    <td className="py-3 px-4 text-center text-green-600 dark:text-green-400">
                                        {teacher.approved}
                                    </td>
                                    <td className="py-3 px-4 text-center text-red-600 dark:text-red-400">
                                        {teacher.rejected}
                                    </td>
                                    <td className="py-3 px-4 text-center text-yellow-600 dark:text-yellow-400">
                                        {teacher.pending + teacher.acknowledged}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${teacher.approvalRate >= 80
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : teacher.approvalRate >= 60
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                }`}
                                        >
                                            {teacher.approvalRate.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Class Trends Chart */}
            {classTrends && classTrends.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-purple-500" />
                        {t("Class Booking Trends", "แนวโน้มการจองคลาส")}
                    </h3>
                    <div className="space-y-2">
                        {classTrends.map((trend) => (
                            <div key={trend.date} className="flex items-center gap-4">
                                <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(trend.timestamp).toLocaleDateString(
                                        language === "en" ? "en-US" : "th-TH",
                                        { month: "short", day: "numeric" }
                                    )}
                                </div>
                                <div className="flex-1 flex gap-1 h-8">
                                    {trend.approved > 0 && (
                                        <div
                                            className="bg-green-500 rounded flex items-center justify-center text-white text-xs font-semibold"
                                            style={{ width: `${(trend.approved / trend.total) * 100}%` }}
                                            title={t(`Approved: ${trend.approved}`, `อนุมัติ: ${trend.approved}`)}
                                        >
                                            {trend.approved}
                                        </div>
                                    )}
                                    {trend.rejected > 0 && (
                                        <div
                                            className="bg-red-500 rounded flex items-center justify-center text-white text-xs font-semibold"
                                            style={{ width: `${(trend.rejected / trend.total) * 100}%` }}
                                            title={t(`Rejected: ${trend.rejected}`, `ปฏิเสธ: ${trend.rejected}`)}
                                        >
                                            {trend.rejected}
                                        </div>
                                    )}
                                    {trend.pending > 0 && (
                                        <div
                                            className="bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-semibold"
                                            style={{ width: `${(trend.pending / trend.total) * 100}%` }}
                                            title={t(`Pending: ${trend.pending}`, `รอดำเนินการ: ${trend.pending}`)}
                                        >
                                            {trend.pending}
                                        </div>
                                    )}
                                </div>
                                <div className="w-12 text-right text-sm font-semibold">
                                    {trend.total}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm">{t("Approved", "อนุมัติ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-sm">{t("Rejected", "ปฏิเสธ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                            <span className="text-sm">{t("Pending", "รอดำเนินการ")}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: "blue" | "green" | "red" | "purple" | "yellow" | "indigo" | "cyan";
}

function StatCard({ icon, title, value, color }: StatCardProps) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
        green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
        red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
        yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
        indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
        cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300",
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
                <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
            </div>
        </div>
    );
}
