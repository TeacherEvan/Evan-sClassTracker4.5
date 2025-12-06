"use client";

/**
 * Moderator Analytics Panel - Simplified Initial Version
 * 
 * Features (Phase 1):
 * - View analytics for ONLY their assigned school
 * - District/province filtering
 * - Teacher comparison view
 * 
 * Future enhancements (to be added):
 * - Teacher connection management (Phase 2)
 * - Class flagging and review (Phase 3)
 * 
 * Security:
 * - STRICTLY school-scoped (moderator can ONLY access THEIR school)
 * 
 * ✅ PATTERN: School-Scoped Moderator Operations (Dec 2025)
 * ✅ PATTERN: Bilingual UI (English/Thai labels)
 */

import { api } from "@/convex/_generated/api";
import type { User } from "@/lib/types";
import { useQuery } from "convex/react";
import {
    BarChart3,
    Building2,
    CheckCircle2,
    TrendingUp,
    Users,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useState } from "react";

interface ModeratorAnalyticsPanelProps {
    currentUser: User;
}

export function ModeratorAnalyticsPanel({ currentUser }: ModeratorAnalyticsPanelProps) {
    const { t, language } = useLanguage();
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedProvince, setSelectedProvince] = useState<string>("");

    // Fetch school details (use optional chaining for safety)
    const schoolId = currentUser.schoolId || undefined;
    const school = useQuery(api.schools.getById, schoolId ? { id: schoolId } : ({} as { id: Id<"schools"> }));

    // Fetch analytics data
    const summaryAnalytics = useQuery(api.analytics.getSummaryAnalytics, {
        userId: currentUser._id,
    });

    const teacherComparison = useQuery(api.analytics.getTeacherComparison, {
        userId: currentUser._id,
        district: selectedDistrict || undefined,
        province: selectedProvince || undefined,
    });

    // Fetch available filters
    const availableFilters = useQuery(api.analytics.getAvailableFilters, {
        userId: currentUser._id,
    });

    // ✅ SECURITY: Only moderators with assigned school can access
    if (currentUser.role !== "moderator" || !schoolId) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">
                    {t(
                        "Access denied: Moderators must have an assigned school",
                        "ไม่สามารถเข้าถึง: ผู้ดูแลต้องมีโรงเรียนที่ได้รับมอบหมาย"
                    )}
                </p>
            </div>
        );
    }

    // Loading state
    const isLoading = !school || !summaryAnalytics || !teacherComparison || !availableFilters;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-500" />
                        {t("Moderator Analytics", "การวิเคราะห์สำหรับผู้ดูแล")}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Building2 className="inline w-4 h-4 mr-1" />
                        {language === "en" ? school.name : school.nameTh}
                    </p>
                </div>
            </div>

            {/* Filters */}
            {(availableFilters.districts.length > 0 || availableFilters.provinces.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                        {t("Filters", "ตัวกรอง")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableFilters.districts.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("District", "เขต")}
                                </label>
                                <select
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">{t("All Districts", "ทุกเขต")}</option>
                                    {availableFilters.districts.map((district) => (
                                        <option key={district.value} value={district.value}>
                                            {language === "en" ? district.label : district.labelTh}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {availableFilters.provinces.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Province", "จังหวัด")}
                                </label>
                                <select
                                    value={selectedProvince}
                                    onChange={(e) => setSelectedProvince(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">{t("All Provinces", "ทุกจังหวัด")}</option>
                                    {availableFilters.provinces.map((province) => (
                                        <option key={province.value} value={province.value}>
                                            {language === "en" ? province.label : province.labelTh}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Total Classes", "คลาสทั้งหมด")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {summaryAnalytics.totalClasses}
                            </p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Attendance Rate", "อัตราการเข้าร่วม")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {summaryAnalytics.attendanceRate}%
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Active Students", "นักเรียนที่ใช้งาน")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {summaryAnalytics.activeStudents}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Avg ClassCount", "ClassCount เฉลี่ย")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {summaryAnalytics.avgClassCount}
                            </p>
                        </div>
                        <Building2 className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Teacher Comparison */}
            {teacherComparison.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {t("Teacher Comparison", "เปรียบเทียบครู")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t(
                                "Performance overview of teachers with classes in your school",
                                "ภาพรวมประสิทธิภาพของครูที่มีคลาสในโรงเรียนของคุณ"
                            )}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {t("Teacher", "ครู")}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {t("Classes", "คลาส")}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {t("Students", "นักเรียน")}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {t("Attendance", "การเข้าร่วม")}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {t("Rating", "คะแนน")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {teacherComparison.map((teacher) => (
                                    <tr key={teacher.teacherId}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {teacher.teacherName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {teacher.totalClasses}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {teacher.uniqueStudentCount}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {teacher.attendanceRate}%
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    teacher.rating === "excellent"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        : teacher.rating === "good"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                }`}
                                            >
                                                {t(
                                                    teacher.rating === "excellent" ? "Excellent" : teacher.rating === "good" ? "Good" : "Needs Improvement",
                                                    teacher.rating === "excellent" ? "ดีเยี่ยม" : teacher.rating === "good" ? "ดี" : "ต้องปรับปรุง"
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {teacherComparison.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        {t(
                            "No teacher data available for the selected filters",
                            "ไม่มีข้อมูลครูสำหรับตัวกรองที่เลือก"
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
