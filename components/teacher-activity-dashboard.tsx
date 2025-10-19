"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { Activity, Check, Clock, X } from "lucide-react";
import { useState } from "react";

interface TeacherActivityDashboardProps {
    schoolId: Id<"schools">;
    moderatorId: Id<"users">;
}

export function TeacherActivityDashboard({
    schoolId,
    moderatorId,
}: TeacherActivityDashboardProps) {
    const { t, language } = useLanguage();
    const [activeView, setActiveView] = useState<"cancellations" | "logs">("cancellations");

    // Query pending cancellation requests
    const cancellationRequests = useQuery(api.cancellationRequests.list, {
        schoolId,
        status: "pending",
    });

    // Query recent teacher logs
    const teacherLogs = useQuery(api.teacherLogs.list, {
        schoolId,
        limit: 50,
    });

    const approveCancellation = useMutation(api.cancellationRequests.approve);
    const rejectCancellation = useMutation(api.cancellationRequests.reject);

    const handleApprove = async (requestId: Id<"cancellationRequests">) => {
        try {
            await approveCancellation({ requestId, moderatorId });
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to approve cancellation");
        }
    };

    const handleReject = async (requestId: Id<"cancellationRequests">) => {
        if (
            !confirm(
                t(
                    "Are you sure you want to reject this cancellation request?",
                    "คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอยกเลิกนี้?"
                )
            )
        ) {
            return;
        }

        try {
            await rejectCancellation({ requestId, moderatorId });
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to reject cancellation");
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    {t("Teacher Activity", "กิจกรรมของครู")}
                </h2>
            </div>

            {/* Tab Selection */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveView("cancellations")}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeView === "cancellations"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    {t("Cancellation Requests", "คำขอยกเลิก")}
                    {cancellationRequests && cancellationRequests.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {cancellationRequests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveView("logs")}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeView === "logs"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    {t("Activity Logs", "บันทึกกิจกรรม")}
                </button>
            </div>

            {/* Cancellation Requests View */}
            {activeView === "cancellations" && (
                <div className="space-y-4">
                    {cancellationRequests?.map((request) => (
                        <CancellationRequestItem
                            key={request._id}
                            request={request}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    ))}

                    {cancellationRequests && cancellationRequests.length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                            {t("No pending cancellation requests", "ไม่มีคำขอยกเลิกที่รอดำเนินการ")}
                        </div>
                    )}
                </div>
            )}

            {/* Activity Logs View */}
            {activeView === "logs" && (
                <div className="space-y-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {t("Date/Time", "วันที่/เวลา")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {t("Teacher", "ครู")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {t("Action", "การกระทำ")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {t("Details", "รายละเอียด")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {teacherLogs?.map((log) => (
                                        <TeacherLogRow key={log._id} log={log} language={language} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {teacherLogs && teacherLogs.length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                            {t("No activity logs found", "ไม่พบบันทึกกิจกรรม")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Component to display a single cancellation request
function CancellationRequestItem({
    request,
    onApprove,
    onReject,
}: {
    request: {
        _id: Id<"cancellationRequests">;
        classId: Id<"classes">;
        teacherId: Id<"users">;
        reason: string;
        reasonTh: string;
        createdAt: number;
    };
    onApprove: (id: Id<"cancellationRequests">) => void;
    onReject: (id: Id<"cancellationRequests">) => void;
}) {
    const { t, language } = useLanguage();
    const classData = useQuery(api.classes.getById, { id: request.classId });
    const teacher = useQuery(api.users.getById, { id: request.teacherId });
    const student = useQuery(
        api.students.getById,
        classData ? { id: classData.studentId } : "skip"
    );
    const location = useQuery(
        api.locations.getById,
        classData?.locationId ? { id: classData.locationId } : "skip"
    ); if (!classData || !teacher || !student) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold">
                            {t("Cancellation Request", "คำขอยกเลิก")}
                        </h3>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>
                            <span className="font-medium">{t("Teacher:", "ครู:")}</span> {teacher.username}
                        </p>
                        <p>
                            <span className="font-medium">{t("Student:", "นักเรียน:")}</span>{" "}
                            {student.firstName} {student.lastName}
                        </p>
                        {location && (
                            <p>
                                <span className="font-medium">{t("Location:", "สถานที่:")}</span>{" "}
                                {location.name}
                            </p>
                        )}
                        <p>
                            <span className="font-medium">{t("Scheduled:", "กำหนดการ:")}</span>{" "}
                            {new Date(classData.scheduledDate).toLocaleString()}
                        </p>
                        <p>
                            <span className="font-medium">{t("Requested:", "ขอเมื่อ:")}</span>{" "}
                            {new Date(request.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-1">{t("Reason:", "เหตุผล:")}</p>
                <p className="text-sm">{language === "en" ? request.reason : request.reasonTh}</p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onApprove(request._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    <Check className="w-4 h-4" />
                    {t("Approve Cancellation", "อนุมัติการยกเลิก")}
                </button>
                <button
                    onClick={() => onReject(request._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                    {t("Reject", "ปฏิเสธ")}
                </button>
            </div>
        </div>
    );
}

// Component to display a single teacher log row
function TeacherLogRow({
    log,
    language,
}: {
    log: {
        _id: Id<"teacherLogs">;
        teacherId: Id<"users">;
        action: string;
        actionTh: string;
        details: string;
        detailsTh: string;
        createdAt: number;
    };
    language: "en" | "th";
}) {
    const teacher = useQuery(api.users.getById, { id: log.teacherId });

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-4 py-3 text-sm whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm">{teacher?.username || "..."}</td>
            <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    {language === "en" ? log.action : log.actionTh}
                </span>
            </td>
            <td className="px-4 py-3 text-sm">
                {language === "en" ? log.details : log.detailsTh}
            </td>
        </tr>
    );
}
