"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface AdminErrorReportsProps {
  userId: Id<"users">;
}

export function AdminErrorReports({ userId }: AdminErrorReportsProps) {
  const { t, language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<
    "new" | "acknowledged" | "resolved" | "closed" | undefined
  >(undefined);
  const [severityFilter, setSeverityFilter] = useState<
    "low" | "medium" | "high" | "critical" | undefined
  >(undefined);
  const [selectedError, setSelectedError] = useState<Id<"errorReports"> | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch error reports with filters
  const errorReports = useQuery(api.errorReports.listErrorReports, {
    adminId: userId,
    status: statusFilter,
    severity: severityFilter,
    limit: 100,
  });

  // Fetch statistics
  const stats = useQuery(api.errorReports.getErrorStats, {
    adminId: userId,
  });

  // Fetch selected error details
  const errorDetail = useQuery(
    api.errorReports.getErrorReport,
    selectedError && showDetailModal
      ? { errorReportId: selectedError, adminId: userId }
      : "skip",
  );

  const updateErrorStatus = useMutation(api.errorReports.updateErrorStatus);

  const handleUpdateStatus = async (
    errorReportId: Id<"errorReports">,
    status: "new" | "acknowledged" | "resolved" | "closed",
    adminNotes?: string,
  ) => {
    try {
      await updateErrorStatus({
        errorReportId,
        adminId: userId,
        status,
        adminNotes,
      });

      toast.success(
        `Error report ${status}`,
        `รายงานข้อผิดพลาด${status === "resolved" ? "แก้ไขแล้ว" : "อัปเดตแล้ว"}`,
      );

      setShowDetailModal(false);
      setSelectedError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update error report";
      toast.error(errorMessage, "ไม่สามารถอัปเดตรายงานข้อผิดพลาดได้");
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "acknowledged":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Bug className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return language === "en"
      ? date.toLocaleString("en-US")
      : date.toLocaleString("th-TH");
  };

  return (
    <div className="space-y-6">
      {/* Header & Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bug className="w-7 h-7" />
            {t("Error Reports", "รายงานข้อผิดพลาด")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t(
              "User-reported errors and system issues",
              "ข้อผิดพลาดที่ผู้ใช้รายงานและปัญหาระบบ",
            )}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("Total Reports", "รายงานทั้งหมด")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t("New", "ใหม่")}
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {stats.new}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t("Critical", "วิกฤต")}
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {stats.critical}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t("Resolved", "แก้ไขแล้ว")}
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {stats.resolved}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("Filters", "ตัวกรอง")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("Status", "สถานะ")}
            </label>
            <select
              value={statusFilter || ""}
              onChange={(e) =>
                setStatusFilter(
                  (e.target.value as
                    | "new"
                    | "acknowledged"
                    | "resolved"
                    | "closed") || undefined,
                )
              }
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">{t("All Statuses", "ทุกสถานะ")}</option>
              <option value="new">{t("New", "ใหม่")}</option>
              <option value="acknowledged">
                {t("Acknowledged", "รับทราบแล้ว")}
              </option>
              <option value="resolved">{t("Resolved", "แก้ไขแล้ว")}</option>
              <option value="closed">{t("Closed", "ปิดแล้ว")}</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("Severity", "ความรุนแรง")}
            </label>
            <select
              value={severityFilter || ""}
              onChange={(e) =>
                setSeverityFilter(
                  (e.target.value as "low" | "medium" | "high" | "critical") ||
                    undefined,
                )
              }
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">{t("All Severities", "ทุกระดับ")}</option>
              <option value="low">{t("Low", "ต่ำ")}</option>
              <option value="medium">{t("Medium", "ปานกลาง")}</option>
              <option value="high">{t("High", "สูง")}</option>
              <option value="critical">{t("Critical", "วิกฤต")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Time", "เวลา")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("User", "ผู้ใช้")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Error", "ข้อผิดพลาด")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Origin", "แหล่งที่มา")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Severity", "ความรุนแรง")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Status", "สถานะ")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Actions", "การดำเนินการ")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {errorReports === undefined ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("Loading...", "กำลังโหลด...")}
                  </td>
                </tr>
              ) : errorReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("No error reports found", "ไม่พบรายงานข้อผิดพลาด")}
                  </td>
                </tr>
              ) : (
                errorReports.map((error) => (
                  <tr
                    key={error._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatTimestamp(error.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {error.username || t("Anonymous", "ไม่ระบุชื่อ")}
                      {error.userRole && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({error.userRole})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      <div className="font-medium">{error.errorType}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {error.errorMessage}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {error.errorOrigin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(error.severity)}`}
                      >
                        {error.severity || "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(error.status)}
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {error.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedError(error._id);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {t("View", "ดู")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && errorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bug className="w-6 h-6" />
                  {t("Error Report Details", "รายละเอียดรายงานข้อผิดพลาด")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatTimestamp(errorDetail.timestamp)}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Error Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Error Type", "ประเภทข้อผิดพลาด")}
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {errorDetail.errorType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Error Code", "รหัสข้อผิดพลาด")}
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {errorDetail.errorCode || "N/A"}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("Error Message", "ข้อความข้อผิดพลาด")}
                </label>
                <p className="text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                  {errorDetail.errorMessage}
                </p>
              </div>

              {/* Origin & Function */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Origin", "แหล่งที่มา")}
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {errorDetail.errorOrigin}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Function", "ฟังก์ชัน")}
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {errorDetail.errorFunction || "N/A"}
                  </p>
                </div>
              </div>

              {/* User Action */}
              {errorDetail.userAction && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("User Action", "การกระทำของผู้ใช้")}
                  </label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {errorDetail.userAction}
                  </p>
                </div>
              )}

              {/* Stack Trace */}
              {errorDetail.stackTrace && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Stack Trace", "Stack Trace")}
                  </label>
                  <pre className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto border border-gray-200 dark:border-gray-700">
                    {errorDetail.stackTrace}
                  </pre>
                </div>
              )}

              {/* Environment Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Device", "อุปกรณ์")}
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {errorDetail.deviceType || "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Browser", "เบราว์เซอร์")}
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {errorDetail.browser || "Unknown"}{" "}
                    {errorDetail.browserVersion}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("OS", "ระบบปฏิบัติการ")}
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {errorDetail.os || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Admin Notes */}
              {errorDetail.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("Admin Notes", "หมายเหตุผู้ดูแล")}
                  </label>
                  <p className="text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                    {errorDetail.adminNotes}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("Update Status", "อัปเดตสถานะ")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {errorDetail.status !== "acknowledged" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(errorDetail._id, "acknowledged")
                      }
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      {t("Acknowledge", "รับทราบ")}
                    </button>
                  )}
                  {errorDetail.status !== "resolved" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(errorDetail._id, "resolved")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t("Mark as Resolved", "ทำเครื่องหมายว่าแก้ไขแล้ว")}
                    </button>
                  )}
                  {errorDetail.status !== "closed" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(errorDetail._id, "closed")
                      }
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {t("Close", "ปิด")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
