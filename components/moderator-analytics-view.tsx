/* eslint-disable */
// @ts-nocheck
// TODO: This component is under development - api.classReview is not yet exported from Convex
"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { CheckSquare, Flag, Square, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

interface ModeratorAnalyticsViewProps {
  currentUser: User;
}

export function ModeratorAnalyticsView({
  currentUser,
}: ModeratorAnalyticsViewProps) {
  const { t, language } = useLanguage();

  // Date range state (last 30 days by default)
  const [dateRange, setDateRange] = useState(() => {
    const endDate = Date.now();
    const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
    return { startDate, endDate };
  });

  // Get school ID (moderators use their assigned school)
  const schoolId =
    currentUser.role === "moderator" ? currentUser.schoolId : null;
  const school = useQuery(
    schoolId ? api.schools.getById : ("skip" as any),
    schoolId ? { id: schoolId } : ({} as any),
  );

  // Fetch analytics data
  const summaryAnalytics = useQuery(api.analytics.getSummaryAnalytics, {
    userId: currentUser._id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const teacherComparison = useQuery(api.analytics.getTeacherComparison, {
    userId: currentUser._id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Get all classes for the school
  const allClasses = useQuery(api.classes.list, {});

  // Filter classes for this school
  const schoolClasses = useMemo(() => {
    if (!allClasses || !schoolId) return [];
    return allClasses.filter(
      (c) =>
        c.schoolId === schoolId &&
        c.scheduledDate >= dateRange.startDate &&
        c.scheduledDate <= dateRange.endDate,
    );
  }, [allClasses, schoolId, dateRange]);

  // Mutations for class management
  // TODO: Uncomment when api.classReview is added to Convex exports
  // const flagClass = useMutation(api.classReview.flagForReview);
  // const toggleIncludeInReports = useMutation(api.classReview.toggleIncludeInReports);
  const flagClass = async (_args: any) => {
    throw new Error(
      "Feature not yet implemented - api.classReview not exported from Convex",
    );
  };
  const toggleIncludeInReports = async (_args: any) => {
    throw new Error(
      "Feature not yet implemented - api.classReview not exported from Convex",
    );
  };

  // Only moderators and admins can use this component
  if (currentUser.role !== "moderator" && currentUser.role !== "admin") {
    return null;
  }

  // Moderators must have a schoolId
  if (currentUser.role === "moderator" && !currentUser.schoolId) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          {t(
            "You must be assigned to a school to view analytics.",
            "คุณต้องได้รับมอบหมายให้เป็นของโรงเรียนเพื่อดูการวิเคราะห์",
          )}
        </p>
      </div>
    );
  }

  // TODO: Feature not yet implemented
  if (true) {
    // Always return early until classReview API is exported
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          {t(
            "⚠️ This feature is under development. The classReview API is not yet exported from Convex.",
            "⚠️ ฟีเจอร์นี้อยู่ระหว่างการพัฒนา classReview API ยังไม่ได้ถูก export จาก Convex",
          )}
        </p>
      </div>
    );
  }

  const handleFlagClass = async (classId: Id<"classes">) => {
    try {
      await flagClass({
        classId,
        userId: currentUser._id,
      });

      toast.success(
        "Class flagged for review",
        "ทำเครื่องหมายคลาสเพื่อตรวจสอบ",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to flag class",
        err instanceof Error ? err.message : "ทำเครื่องหมายคลาสล้มเหลว",
      );
    }
  };

  const handleToggleIncludeInReports = async (
    classId: Id<"classes">,
    currentValue: boolean,
  ) => {
    try {
      await toggleIncludeInReports({
        classId,
        includeInReports: !currentValue,
        userId: currentUser._id,
      });

      toast.success(
        !currentValue
          ? "Class included in reports"
          : "Class excluded from reports",
        !currentValue ? "รวมคลาสในรายงาน" : "ไม่รวมคลาสในรายงาน",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update class",
        err instanceof Error ? err.message : "อัปเดตคลาสล้มเหลว",
      );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(
      language === "th" ? "th-TH" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with school info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h2 className="text-xl font-semibold text-blue-900">
          {t("School Analytics", "การวิเคราะห์โรงเรียน")}
        </h2>
        <p className="mt-1 text-sm text-blue-700">
          {school?.name} / {school?.nameTh}
        </p>
        {(school?.district || school?.province) && (
          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
            <MapPin className="h-4 w-4" />
            <span>
              {language === "th"
                ? `${school.districtTh || school.district || ""} ${school.provinceTh || school.province || ""}`
                : `${school.district || ""} ${school.province || ""}`}
            </span>
          </div>
        )}
      </div>

      {/* Date range filter */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          {t("Date Range", "ช่วงวันที่")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t("Start Date", "วันที่เริ่มต้น")}
            </label>
            <input
              type="date"
              value={new Date(dateRange.startDate).toISOString().split("T")[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value).getTime();
                setDateRange((prev) => ({ ...prev, startDate: newDate }));
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t("End Date", "วันที่สิ้นสุด")}
            </label>
            <input
              type="date"
              value={new Date(dateRange.endDate).toISOString().split("T")[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value).getTime();
                setDateRange((prev) => ({ ...prev, endDate: newDate }));
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      {summaryAnalytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              {t("Total Classes", "จำนวนคลาสทั้งหมด")}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {summaryAnalytics.totalClasses}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              {t("Attendance Rate", "อัตราการเข้าเรียน")}
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {summaryAnalytics.attendanceRate}%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              {t("Active Students", "นักเรียนที่ใช้งานอยู่")}
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {summaryAnalytics.activeStudents}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              {t("Avg. ClassCount", "ค่าเฉลี่ย ClassCount")}
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600">
              {summaryAnalytics.avgClassCount}
            </p>
          </div>
        </div>
      )}

      {/* Classes list with management controls */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t(
            `Classes (${schoolClasses.length})`,
            `คลาส (${schoolClasses.length})`,
          )}
        </h3>

        {schoolClasses.length === 0 ? (
          <p className="text-center text-sm text-gray-600">
            {t(
              "No classes found for the selected date range",
              "ไม่พบคลาสสำหรับช่วงวันที่ที่เลือก",
            )}
          </p>
        ) : (
          <div className="space-y-2">
            {schoolClasses.slice(0, 20).map((cls) => {
              const includeInReports = cls.includeInReports ?? true;
              const isFlagged = cls.flaggedForReview ?? false;

              return (
                <div
                  key={cls._id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(cls.scheduledDate)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {cls.duration || 60} {t("min", "นาที")} •{" "}
                      {t(
                        cls.status.charAt(0).toUpperCase() +
                          cls.status.slice(1),
                        cls.status === "approved"
                          ? "อนุมัติ"
                          : cls.status === "pending"
                            ? "รอดำเนินการ"
                            : "ปฏิเสธ",
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Flag button */}
                    <button
                      onClick={() => handleFlagClass(cls._id)}
                      disabled={isFlagged}
                      className={`rounded-md p-2 ${
                        isFlagged
                          ? "cursor-not-allowed bg-orange-100 text-orange-600"
                          : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                      title={t("Flag for review", "ทำเครื่องหมายเพื่อตรวจสอบ")}
                    >
                      <Flag className="h-4 w-4" />
                    </button>

                    {/* Include/exclude toggle */}
                    <button
                      onClick={() =>
                        handleToggleIncludeInReports(cls._id, includeInReports)
                      }
                      className={`rounded-md p-2 ${
                        includeInReports
                          ? "bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600"
                          : "bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-600"
                      }`}
                      title={
                        includeInReports
                          ? t("Exclude from reports", "ไม่รวมในรายงาน")
                          : t("Include in reports", "รวมในรายงาน")
                      }
                    >
                      {includeInReports ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {schoolClasses.length > 20 && (
              <p className="pt-2 text-center text-xs text-gray-500">
                {t(
                  `Showing first 20 of ${schoolClasses.length} classes`,
                  `แสดง 20 รายการแรกจาก ${schoolClasses.length} คลาส`,
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Teacher comparison (if available) */}
      {teacherComparison && teacherComparison.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {t("Teacher Comparison", "เปรียบเทียบครู")}
          </h3>
          <div className="space-y-2">
            {teacherComparison.map((teacher) => (
              <div
                key={teacher.teacherId}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {teacher.teacherName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {teacher.totalClasses} {t("classes", "คลาส")} •{" "}
                    {teacher.uniqueStudentCount} {t("students", "นักเรียน")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {teacher.attendanceRate}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {t("Attendance", "การเข้าเรียน")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
