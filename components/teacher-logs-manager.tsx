"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Clock, Download, FileText, Filter } from "lucide-react";
import { useState } from "react";

interface TeacherLogsManagerProps {
    currentUser: User;
}

export default function TeacherLogsManager({ currentUser }: TeacherLogsManagerProps) {
    const { t, language } = useLanguage();
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    // Get users (teachers) for admin/moderator to filter
    const teachers = useQuery(
        api.users.list,
        currentUser && (currentUser.role === "admin" || currentUser.role === "moderator")
            ? { role: "teacher" }
            : "skip"
    );

    // Get pending logs for admins/moderators
    const pendingLogs = useQuery(
        api.teacherLogs.listPendingLogs,
        currentUser && (currentUser.role === "admin" || currentUser.role === "moderator")
            ? { userId: currentUser._id, schoolId: currentUser.schoolId }
            : "skip"
    );

    // Get all logs based on filters
    const allLogs = useQuery(
        api.teacherLogs.list,
        currentUser ? {
            teacherId: selectedTeacherId || (currentUser.role === "teacher" ? currentUser._id : undefined),
            startDate: startDate ? new Date(startDate).getTime() : undefined,
            endDate: endDate ? new Date(endDate).getTime() : undefined,
        } : "skip"
    );

    // Acknowledge log mutation
    const acknowledgeLog = useMutation(api.teacherLogs.acknowledgeLog);

    // Export logs query for download (conditional - only runs when currentUser is available)
    const exportLogs = useQuery(
        api.exports.exportTeacherLogs,
        currentUser ? {
            userId: currentUser._id,
            teacherId: selectedTeacherId || (currentUser.role === "teacher" ? currentUser._id : undefined),
            startDate: startDate ? new Date(startDate).getTime() : undefined,
            endDate: endDate ? new Date(endDate).getTime() : undefined,
        } : "skip"
    );

    const handleAcknowledge = async (logId: Id<"teacherLogs">) => {
        try {
            await acknowledgeLog({ userId: currentUser._id, logId });
        } catch (error) {
            console.error("Error acknowledging log:", error);
            toast.error("Failed to acknowledge log", "ไม่สามารถยืนยันบันทึกได้");
        }
    };

    const handleDownload = () => {
        if (!exportLogs || exportLogs.length === 0) {
            toast.warning("No logs to download", "ไม่มีบันทึกให้ดาวน์โหลด");
            return;
        }

        // Convert to CSV
        const headers = Object.keys(exportLogs[0]);
        const csvContent = [
            headers.join(","),
            ...exportLogs.map((log) =>
                headers.map((header) => {
                    const value = log[header as keyof typeof log];
                    // Escape commas and quotes in values
                    const stringValue = String(value || "");
                    return stringValue.includes(",") || stringValue.includes('"')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                }).join(",")
            ),
        ].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const filename = `teacher_logs_${new Date().toISOString().split("T")[0]}.csv`;
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const displayLogs = showPendingOnly ? pendingLogs : allLogs;
    const isAdminOrModerator = currentUser.role === "admin" || currentUser.role === "moderator";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t("Teacher Logs Manager", "จัดการบันทึกการสอน")}
                    </h2>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={!exportLogs || exportLogs.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <Download className="w-5 h-5" />
                    {t("Download CSV", "ดาวน์โหลด CSV")}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Filter className="w-5 h-5" />
                    {t("Filters", "ตัวกรอง")}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Teacher selection (Admin/Moderator only) */}
                    {isAdminOrModerator && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Teacher", "ครู")}
                            </label>
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users"> | "")}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">
                                    {t("All Teachers", "ครูทั้งหมด")}
                                </option>
                                {teachers?.map((teacher) => (
                                    <option key={teacher._id} value={teacher._id}>
                                        {teacher.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("Start Date", "วันเริ่มต้น")}
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("End Date", "วันสิ้นสุด")}
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Show Pending Only Toggle (Admin/Moderator only) */}
                {isAdminOrModerator && (
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showPendingOnly"
                            checked={showPendingOnly}
                            onChange={(e) => setShowPendingOnly(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                            htmlFor="showPendingOnly"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            {t("Show pending logs only", "แสดงเฉพาะบันทึกที่รอยืนยัน")}
                        </label>
                        {pendingLogs && pendingLogs.length > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">
                                {pendingLogs.length}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {isAdminOrModerator && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        {t("Teacher", "ครู")}
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {t("Action", "กิจกรรม")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {t("Details", "รายละเอียด")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {t("Date", "วันที่")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {t("Status", "สถานะ")}
                                </th>
                                {isAdminOrModerator && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        {t("Actions", "การจัดการ")}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {displayLogs?.map((log) => (
                                <TeacherLogRow
                                    key={log._id}
                                    log={log}
                                    language={language}
                                    isAdminOrModerator={isAdminOrModerator}
                                    onAcknowledge={handleAcknowledge}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!displayLogs || displayLogs.length === 0) && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {t("No logs found", "ไม่พบบันทึก")}
                    </div>
                )}
            </div>
        </div>
    );
}

// Component to display a single log row
function TeacherLogRow({
    log,
    language,
    isAdminOrModerator,
    onAcknowledge,
}: {
    log: {
        _id: Id<"teacherLogs">;
        teacherId: Id<"users">;
        action: string;
        actionTh: string;
        details: string;
        detailsTh: string;
        acknowledged?: boolean;
        createdAt: number;
    };
    language: "en" | "th";
    isAdminOrModerator: boolean;
    onAcknowledge: (logId: Id<"teacherLogs">) => void;
}) {
    const { t } = useLanguage();
    const teacher = useQuery(api.users.getById, { id: log.teacherId });

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
            {isAdminOrModerator && (
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {teacher?.username || t("Loading...", "กำลังโหลด...")}
                </td>
            )}
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {language === "th" ? log.actionTh : log.action}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {language === "th" ? log.detailsTh : log.details}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {new Date(log.createdAt).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
            </td>
            <td className="px-4 py-3 text-sm">
                {log.acknowledged ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        {t("Acknowledged", "ยืนยันแล้ว")}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold">
                        <Clock className="w-3 h-3" />
                        {t("Pending", "รอยืนยัน")}
                    </span>
                )}
            </td>
            {isAdminOrModerator && (
                <td className="px-4 py-3 text-sm">
                    {!log.acknowledged && (
                        <button
                            onClick={() => onAcknowledge(log._id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                            <CheckCircle className="w-3 h-3" />
                            {t("Acknowledge", "ยืนยัน")}
                        </button>
                    )}
                </td>
            )}
        </tr>
    );
}
