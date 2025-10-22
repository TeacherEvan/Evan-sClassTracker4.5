"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { Calendar, ChevronDown, ChevronRight, Download, Printer, X } from "lucide-react";
import { useState } from "react";

interface TeacherClassCountModalProps {
    teacherId: Id<"users">;
    teacherUsername: string;
    moderatorId: Id<"users">;
    onClose: () => void;
}

export function TeacherClassCountModal({
    teacherId,
    teacherUsername,
    moderatorId,
    onClose,
}: TeacherClassCountModalProps) {
    const { t, language } = useLanguage();

    // Date range state (default: last 30 days)
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });

    // Expanded students tracking
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

    // Query detailed class count
    const classCountData = useQuery(
        api.teacherClassCount.getTeacherClassCountDetailed,
        {
            teacherId,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1), // End of day
            moderatorId,
        }
    );

    const logView = useMutation(api.teacherClassCount.logClassCountView);

    // Log view on mount
    useState(() => {
        logView({
            teacherId,
            moderatorId,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            action: "viewed",
        }).catch(err => {
            console.error("Failed to log view:", err);
        });
    });

    const toggleStudent = (studentId: string) => {
        setExpandedStudents(prev => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    const handleExportCSV = async () => {
        if (!classCountData) return;

        try {
            // Log export action
            await logView({
                teacherId,
                moderatorId,
                startDate: new Date(startDate).getTime(),
                endDate: new Date(endDate).getTime(),
                action: "exported",
            });

            // Generate CSV content
            const csvLines = [
                `Teacher,${teacherUsername}`,
                `Period,${startDate} to ${endDate}`,
                `Total ClassCount,${classCountData.summary.totalClassCount}`,
                `Approved Classes,${classCountData.summary.totalApprovedClasses}`,
                `Students Taught,${classCountData.summary.totalStudents}`,
                "",
                "Student Name,Student Name (Thai),ClassCount,Number of Classes",
                ...classCountData.studentBreakdown.map(student =>
                    `"${student.studentName}","${student.studentNameTh}",${student.classCount},${student.numberOfClasses}`
                ),
            ];

            // Create download
            const csvContent = csvLines.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `ClassCount_${teacherUsername}_${startDate}_${endDate}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(
                "CSV exported successfully",
                "ส่งออก CSV สำเร็จ"
            );
        } catch (error) {
            console.error("Export failed:", error);
            toast.error(
                "Failed to export CSV",
                "ส่งออก CSV ไม่สำเร็จ"
            );
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!classCountData) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3">{t("Loading...", "กำลังโหลด...")}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="teacher-classcount-modal bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">
                        {t(`Teacher ClassCount - ${teacherUsername}`, `จำนวนชั้นเรียนครู - ${teacherUsername}`)}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors print-hide"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Date Range Selector */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 print-hide">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="font-medium">{t("Date Range:", "ช่วงเวลา:")}</span>
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        />
                        <span>{t("to", "ถึง")}</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <h3 className="text-lg font-semibold mb-3">{t("Summary", "สรุป")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Total ClassCount", "จำนวนชั้นเรียนทั้งหมด")}
                            </div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {classCountData.summary.totalClassCount}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Approved Classes", "คลาสที่อนุมัติ")}
                            </div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {classCountData.summary.totalApprovedClasses}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Students Taught", "นักเรียนที่สอน")}
                            </div>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {classCountData.summary.totalStudents}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Breakdown */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">{t("Student Breakdown", "รายละเอียดนักเรียน")}</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {classCountData.studentBreakdown.map((student, index) => {
                            const isExpanded = expandedStudents.has(student.studentId);
                            return (
                                <div
                                    key={student.studentId}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleStudent(student.studentId)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <span className="text-gray-500 font-medium">{index + 1}.</span>
                                            <div>
                                                <div className="font-medium">
                                                    {language === "en" ? student.studentName : student.studentNameTh}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {t("ClassCount:", "จำนวนชั้นเรียน:")} <span className="font-semibold text-blue-600">{student.classCount}</span>
                                                    {" | "}
                                                    {t("Classes:", "คลาส:")} <span className="font-semibold">{student.numberOfClasses}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                                            {student.classes.map((cls) => (
                                                <div
                                                    key={cls.classId}
                                                    className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div>
                                                            <span className="font-medium">
                                                                {new Date(cls.scheduledDate).toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric"
                                                                })}
                                                            </span>
                                                            <span className="mx-2 text-gray-400">•</span>
                                                            <span>{cls.duration} {t("min", "นาที")}</span>
                                                            <span className="mx-2 text-gray-400">•</span>
                                                            <span>{cls.studentCount} {t("students", "นักเรียน")}</span>
                                                        </div>
                                                        <div className="font-semibold text-blue-600">
                                                            {cls.contributedCount.toFixed(1)}
                                                        </div>
                                                    </div>
                                                    {cls.location && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            📍 {language === "en" ? cls.location : (cls.locationTh || cls.location)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Export Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 print-hide">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            💡 {t("Note: Teacher will be notified of this view", "หมายเหตุ: ครูจะได้รับการแจ้งเตือนการดูนี้")}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {t("Export CSV", "ส่งออก CSV")}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                {t("Print", "พิมพ์")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
