"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { PaginatedList } from "./paginated-list";

// Type for audit log from the database
type AuditLog = {
  _id: Id<"auditLogs">;
  _creationTime: number;
  userId: Id<"users">;
  username: string;
  userRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  affectedCount?: number;
  reason?: string;
  details?: string;
  timestamp: number;
  schoolId?: Id<"schools">;
  userAgent?: string;
};

interface AuditLogsProps {
  currentUserId: Id<"users">;
}

export function AuditLogs({ currentUserId }: AuditLogsProps) {
  const { t } = useLanguage();

  // State for filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);
  const [showStats, setShowStats] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  // Query audit logs
  const logs = useQuery(api.auditLogs.list, {
    userId: currentUserId,
    filters: {
      action: actionFilter || undefined,
      targetType: targetTypeFilter || undefined,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
    },
    limit,
  });

  // Query statistics
  const stats = useQuery(api.auditLogs.getStatistics, {
    userId: currentUserId,
    days: 30,
  });

  // Mutations
  const cleanOldLogs = useMutation(api.auditLogs.cleanOldLogs);

  // Handle export to CSV (using currently loaded logs)
  const handleExport = () => {
    if (!logs || logs.length === 0) {
      toast.error(
        "No logs to export. Please adjust your filters.",
        "ไม่มีบันทึกสำหรับส่งออก กรุณาปรับตัวกรอง",
      );
      return;
    }

    // Convert to CSV
    const headers = [
      "Timestamp",
      "User",
      "Role",
      "Action",
      "Target Type",
      "Target ID",
      "Target Name",
      "Affected Count",
      "Reason",
      "Details",
    ];

    const rows = logs.map((log: AuditLog) => [
      new Date(log.timestamp).toISOString(),
      log.username,
      log.userRole,
      log.action,
      log.targetType,
      log.targetId || "",
      log.targetName || "",
      log.affectedCount || "",
      log.reason || "",
      log.details || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: (string | number)[]) =>
        row.map((cell) => `"${cell}"`).join(","),
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(
      "Audit logs exported successfully",
      "ส่งออกบันทึกการตรวจสอบสำเร็จ",
    );
  };

  // Handle cleanup
  const executeCleanup = async () => {
    try {
      const result = await cleanOldLogs({
        userId: currentUserId,
        daysToKeep: 365,
      });

      toast.success(
        `Deleted ${result.deletedCount} old audit log entries`,
        `ลบบันทึกการตรวจสอบเก่า ${result.deletedCount} รายการ`,
      );
      setShowCleanupConfirm(false);
    } catch {
      toast.error(
        "Failed to clean audit logs",
        "ไม่สามารถลบบันทึกการตรวจสอบได้",
      );
    }
  };

  // Get action color
  const getActionColor = (action: string): string => {
    if (action.includes("delete")) return "text-red-500";
    if (action.includes("create")) return "text-green-500";
    if (action.includes("update")) return "text-blue-500";
    if (action.includes("bulk")) return "text-orange-500";
    return "text-gray-500";
  };

  // Format action name
  const formatAction = (action: string): string => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {t("Audit Logs", "บันทึกการตรวจสอบ")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t(
              "Track all administrative actions for compliance and accountability",
              "ติดตามการดำเนินการของผู้ดูแลระบบเพื่อการปฏิบัติตามกฎและความรับผิดชอบ",
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {t("Statistics", "สถิติ")}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("Export CSV", "ส่งออก CSV")}
          </button>
          <button
            onClick={() => setShowCleanupConfirm(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t("Cleanup Old Logs", "ลบบันทึกเก่า")}
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">
                {t("Total Actions", "การดำเนินการทั้งหมด")}
              </span>
            </div>
            <p className="text-3xl font-bold">{stats.totalActions}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t("Last 30 days", "30 วันที่ผ่านมา")}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">
                {t("Items Affected", "รายการที่ได้รับผลกระทบ")}
              </span>
            </div>
            <p className="text-3xl font-bold">{stats.totalAffected}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">
                {t("Most Active", "ผู้ใช้งานมากที่สุด")}
              </span>
            </div>
            <p className="text-lg font-bold truncate">
              {stats.mostActiveUser ? stats.mostActiveUser[0] : "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.mostActiveUser
                ? `${stats.mostActiveUser[1]} actions`
                : "-"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">
                {t("Most Common", "การดำเนินการที่พบบ่อย")}
              </span>
            </div>
            <p className="text-sm font-bold truncate">
              {stats.mostCommonAction
                ? formatAction(stats.mostCommonAction[0])
                : "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.mostCommonAction
                ? `${stats.mostCommonAction[1]} times`
                : "-"}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">{t("Filters", "ตัวกรอง")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Action Type", "ประเภทการดำเนินการ")}
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">{t("All Actions", "ทุกการดำเนินการ")}</option>
              <option value="delete_class">
                {t("Delete Class", "ลบคลาส")}
              </option>
              <option value="bulk_delete">
                {t("Bulk Delete", "ลบหลายรายการ")}
              </option>
              <option value="update_user">
                {t("Update User", "อัปเดตผู้ใช้")}
              </option>
              <option value="create_school">
                {t("Create School", "สร้างโรงเรียน")}
              </option>
              <option value="delete_student">
                {t("Delete Student", "ลบนักเรียน")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Target Type", "ประเภทเป้าหมาย")}
            </label>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">{t("All Types", "ทุกประเภท")}</option>
              <option value="classes">{t("Classes", "คลาส")}</option>
              <option value="users">{t("Users", "ผู้ใช้")}</option>
              <option value="schools">{t("Schools", "โรงเรียน")}</option>
              <option value="students">{t("Students", "นักเรียน")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Start Date", "วันที่เริ่มต้น")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("End Date", "วันที่สิ้นสุด")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <label className="text-sm font-medium">{t("Limit", "จำกัด")}:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("Timestamp", "เวลา")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("User", "ผู้ใช้")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("Action", "การดำเนินการ")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("Target", "เป้าหมาย")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("Affected", "ผลกระทบ")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("Reason", "เหตุผล")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs === undefined ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">
                      {t("Loading...", "กำลังโหลด...")}
                    </p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {t("No audit logs found", "ไม่พบบันทึกการตรวจสอบ")}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="p-0">
                    {/* Pagination Pattern #19 - Replaces vertical scrolling with button navigation */}
                    <PaginatedList
                      items={logs}
                      itemsPerPage={20}
                      emptyMessageEn="No audit logs found"
                      emptyMessageTh="ไม่พบบันทึกการตรวจสอบ"
                      showPageInfo={true}
                      showJumpButtons={true}
                      renderItem={(log) => (
                        <table className="w-full">
                          <tbody>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td
                                className="px-4 py-3 text-sm whitespace-nowrap"
                                style={{ width: "180px" }}
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div>
                                      {new Date(
                                        log.timestamp,
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(
                                        log.timestamp,
                                      ).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="px-4 py-3 text-sm"
                                style={{ width: "200px" }}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="font-medium">
                                      {log.username}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {log.userRole}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="px-4 py-3 text-sm"
                                style={{ width: "180px" }}
                              >
                                <span
                                  className={`font-medium ${getActionColor(log.action)}`}
                                >
                                  {formatAction(log.action)}
                                </span>
                              </td>
                              <td
                                className="px-4 py-3 text-sm"
                                style={{ width: "200px" }}
                              >
                                <div>
                                  <div className="font-medium">
                                    {log.targetType}
                                  </div>
                                  {log.targetName && (
                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                      {log.targetName}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td
                                className="px-4 py-3 text-sm text-center"
                                style={{ width: "120px" }}
                              >
                                {log.affectedCount ? (
                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-xs font-medium">
                                    {log.affectedCount}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">1</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                {log.reason || "-"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Info */}
      {logs && logs.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {t(
            `Showing ${logs.length} ${logs.length === limit ? "most recent" : ""} audit log entries`,
            `แสดง ${logs.length} ${logs.length === limit ? "ล่าสุด" : ""} รายการบันทึกการตรวจสอบ`,
          )}
        </div>
      )}

      {/* Cleanup Confirmation Modal */}
      {showCleanupConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-50 absolute inset-0" />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm mx-auto z-10">
            <h3 className="text-lg font-semibold mb-4">
              {t("Confirm Cleanup", "ยืนยันการลบข้อมูล")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {t(
                "Are you sure you want to delete audit logs older than 365 days? This action cannot be undone.",
                "คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกการตรวจสอบที่เก่ากว่า 365 วัน? การกระทำนี้ไม่สามารถย้อนกลับได้",
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCleanupConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={executeCleanup}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t("Delete Logs", "ลบข้อมูล")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
