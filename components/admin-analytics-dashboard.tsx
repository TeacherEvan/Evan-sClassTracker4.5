"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  School,
  TrendingUp,
  Users,
  Users2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ClassAnalytics } from "./class-analytics";

interface AdminAnalyticsDashboardProps {
  userId: Id<"users">;
  currentUser: User | null;
}

export function AdminAnalyticsDashboard({
  userId,
  currentUser: _currentUser,
}: AdminAnalyticsDashboardProps) {
  const { t, language } = useLanguage();

  // State for showing detailed analytics modal
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);

  // State for selected school filter (for future filtering feature)
  const [_selectedSchoolId, _setSelectedSchoolId] = useState<
    Id<"schools"> | "all"
  >("all");

  // Fetch all schools for admin overview
  const schools = useQuery(api.schools.list, {});

  // Fetch all teachers
  const teachers = useQuery(api.users.list, {});

  // Fetch recent classes for stats (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Get all active classes
  const allClasses = useQuery(api.classes.list, {});

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!schools || !teachers || !allClasses) return null;

    // Filter active teachers/moderators (users table doesn't have isActive)
    const activeTeachers = teachers.filter((t) => t.role === "teacher");
    const activeModerators = teachers.filter((t) => t.role === "moderator");
    // Schools don't have isActive field
    const activeSchools = schools;

    // Recent classes (last 30 days)
    const recentClasses = allClasses.filter(
      (c) => c.scheduledDate && c.scheduledDate >= thirtyDaysAgo,
    );

    // Classes by status
    const approvedClasses = recentClasses.filter(
      (c) => c.status === "approved",
    );
    const pendingClasses = recentClasses.filter((c) => c.status === "pending");
    // Use status instead of attended field (approved classes past scheduled date)
    const completedClasses = approvedClasses.filter(
      (c) => c.scheduledDate < Date.now(),
    );

    // Completion rate (approved classes that have passed their scheduled date)
    const totalApproved = approvedClasses.length;
    const completionRate =
      totalApproved > 0
        ? Math.round((completedClasses.length / totalApproved) * 100)
        : 0;

    // Classes by school
    const classesBySchool = activeSchools
      .map((school) => {
        const schoolClasses = recentClasses.filter(
          (c) => c.schoolId === school._id,
        );
        const schoolApproved = schoolClasses.filter(
          (c) => c.status === "approved",
        );
        return {
          school,
          totalClasses: schoolClasses.length,
          approvedClasses: schoolApproved.length,
          pendingClasses: schoolClasses.filter((c) => c.status === "pending")
            .length,
          completedClasses: schoolApproved.filter(
            (c) => c.scheduledDate < Date.now(),
          ).length,
        };
      })
      .sort((a, b) => b.totalClasses - a.totalClasses);

    return {
      totalSchools: activeSchools.length,
      totalTeachers: activeTeachers.length,
      totalModerators: activeModerators.length,
      totalClassesLast30Days: recentClasses.length,
      approvedClasses: approvedClasses.length,
      pendingClasses: pendingClasses.length,
      completedClasses: completedClasses.length,
      completionRate, // Renamed from attendanceRate
      classesBySchool,
    };
  }, [schools, teachers, allClasses, thirtyDaysAgo]);

  // Export CSV
  const handleExportCSV = () => {
    if (!stats?.classesBySchool) return;

    const headers = [
      t("School Name", "ชื่อโรงเรียน"),
      t("Total Classes", "คลาสทั้งหมด"),
      t("Approved", "อนุมัติแล้ว"),
      t("Pending", "รอดำเนินการ"),
      t("Completed", "เสร็จสิ้น"),
    ];

    const rows = stats.classesBySchool.map((item) => [
      language === "en"
        ? item.school.name
        : item.school.nameTh || item.school.name,
      item.totalClasses,
      item.approvedClasses,
      item.pendingClasses,
      item.completedClasses,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) {
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
            {t(
              "Admin Analytics Dashboard",
              "แดชบอร์ดการวิเคราะห์สำหรับผู้ดูแลระบบ",
            )}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("System-wide overview and statistics", "ภาพรวมและสถิติทั้งระบบ")}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("Export CSV", "ส่งออก CSV")}
          </button>
          <button
            onClick={() => setShowDetailedAnalytics(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            {t("Detailed Analytics", "การวิเคราะห์โดยละเอียด")}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Schools */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-5 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {t("Active Schools", "โรงเรียนที่ใช้งาน")}
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalSchools}
              </p>
            </div>
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-5 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {t("Active Teachers", "ครูที่ใช้งาน")}
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.totalTeachers}
              </p>
            </div>
          </div>
        </div>

        {/* Classes (30 days) */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-5 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                {t("Classes (30d)", "คลาส (30 วัน)")}
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.totalClassesLast30Days}
              </p>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-5 border border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {t("Completion Rate", "อัตราการเสร็จสิ้น")}
              </p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{t("Approved", "อนุมัติแล้ว")}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.approvedClasses}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("classes", "คลาส")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">{t("Pending", "รอดำเนินการ")}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.pendingClasses}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("classes", "คลาส")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <Users2 className="w-5 h-5" />
            <span className="font-medium">{t("Completed", "เสร็จสิ้น")}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.completedClasses}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("classes", "คลาส")}
          </p>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            {t(
              "Classes by School (Last 30 Days)",
              "คลาสตามโรงเรียน (30 วันที่ผ่านมา)",
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {t("School", "โรงเรียน")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {t("Total", "ทั้งหมด")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {t("Approved", "อนุมัติ")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {t("Pending", "รอ")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {t("Completed", "เสร็จ")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.classesBySchool.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("No school data available", "ไม่มีข้อมูลโรงเรียน")}
                  </td>
                </tr>
              ) : (
                stats.classesBySchool.map((item) => (
                  <tr
                    key={item.school._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {language === "en"
                            ? item.school.name
                            : item.school.nameTh || item.school.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {item.totalClasses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {item.approvedClasses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        {item.pendingClasses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.completedClasses}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Analytics Modal */}
      {showDetailedAnalytics && (
        <ClassAnalytics
          userId={userId}
          onClose={() => setShowDetailedAnalytics(false)}
        />
      )}
    </div>
  );
}
