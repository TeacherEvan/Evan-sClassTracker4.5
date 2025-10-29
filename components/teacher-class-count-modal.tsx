"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { Calendar, ChevronDown, ChevronRight, Download, Edit2, Printer, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { TeacherCycleEditor } from "./teacher-cycle-editor";

interface TeacherClassCountModalProps {
    teacherId: Id<"users">;
    teacherUsername: string;
    moderatorId: Id<"users">;
    moderatorRole?: "moderator" | "admin"; // For authorization checks
    onClose: () => void;
}

// Type definitions for class count data structure
interface ClassDetail {
    classId: Id<"classes">;
    scheduledDate: number;
    duration: number;
    studentCount: number;
    contributedCount: number;
    location?: string;
    locationTh?: string;
}

interface StudentBreakdown {
    studentId: Id<"students">;
    studentName: string;
    studentNameTh: string;
    classCount: number;
    numberOfClasses: number;
    classes: ClassDetail[];
}

interface ClassCountData {
    teacher: {
        id: Id<"users">;
        username: string;
        role: "teacher" | "moderator" | "admin" | "guardian";
    };
    dateRange: {
        start: number;
        end: number;
    };
    cycleInfo: {
        startDate: number;
        endDate: number;
        isCustomCycle: boolean;
        notes?: string;
        notesTh?: string;
    };
    summary: {
        totalClassCount: number;
        totalApprovedClasses: number;
        totalStudents: number;
    };
    studentBreakdown: StudentBreakdown[];
}


export function TeacherClassCountModal({
    teacherId: initialTeacherId,
    teacherUsername: initialTeacherUsername,
    moderatorId,
    moderatorRole,
    onClose,
}: TeacherClassCountModalProps) {
    const { t, language } = useLanguage();

    // Teacher selection state (for moderators to switch between teachers)
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users">>(initialTeacherId);
    const [selectedTeacherUsername, setSelectedTeacherUsername] = useState(initialTeacherUsername);

    // Load all teachers (for moderator dropdown)
    const allTeachers = useQuery(
        api.users.list,
        (moderatorRole === "moderator" || moderatorRole === "admin") ? { role: "teacher" } : "skip"
    );

    // Cycle editor state
    const [showCycleEditor, setShowCycleEditor] = useState(false);

    // Print language selection
    const [showPrintLanguageDialog, setShowPrintLanguageDialog] = useState(false);

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

    // Escape key handler for cycle editor
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showCycleEditor) {
                setShowCycleEditor(false);
            }
        };

        if (showCycleEditor) {
            window.addEventListener("keydown", handleEscape);
            return () => window.removeEventListener("keydown", handleEscape);
        }
    }, [showCycleEditor]);

    // Query detailed class count
    const classCountData = useQuery(
        api.teacherClassCount.getTeacherClassCountDetailed,
        {
            teacherId: selectedTeacherId,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1), // End of day
            moderatorId,
        }
    );

    const logView = useMutation(api.teacherClassCount.logClassCountView);

    // Log view on mount and when teacher changes
    useEffect(() => {
        logView({
            teacherId: selectedTeacherId,
            moderatorId,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            action: "viewed",
        }).catch(err => {
            console.error("Failed to log view:", err);
        });
    }, [selectedTeacherId, logView, moderatorId, startDate, endDate]);

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
                teacherId: selectedTeacherId,
                moderatorId,
                startDate: new Date(startDate).getTime(),
                endDate: new Date(endDate).getTime(),
                action: "exported",
            });

            // Generate CSV content
            const csvLines = [
                `Teacher,${selectedTeacherUsername}`,
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
            link.setAttribute("download", `ClassCount_${selectedTeacherUsername}_${startDate}_${endDate}.csv`);
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
        // Show language selection dialog before printing
        setShowPrintLanguageDialog(true);
    };

    const handlePrintWithLanguage = (printLanguage: "en" | "th") => {
        setShowPrintLanguageDialog(false);

        if (!classCountData) {
            toast.error("No data to print", "ไม่มีข้อมูลสำหรับพิมพ์");
            return;
        }

        // Open print view in new window
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Please allow popups to print", "กรุณาอนุญาตป๊อปอัพเพื่อพิมพ์");
            return;
        }

        // Generate print content
        const printContent = generatePrintHTML(classCountData, selectedTeacherUsername, startDate, endDate, printLanguage);

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    const generatePrintHTML = (data: ClassCountData, teacherName: string, start: string, end: string, lang: "en" | "th") => {
        if (!data) return "";

        const isEnglish = lang === "en";

        return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isEnglish ? 'Teacher Class Count Report' : 'รายงานการนับชั้นเรียนของครู'}</title>
    <style>
        @media print {
            @page { margin: 1cm; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #1a1a1a;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #2563eb;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .summary-card .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .student-row {
            font-size: 14px;
        }
        .class-details {
            padding-left: 20px;
            font-size: 13px;
            color: #666;
        }
        .class-item {
            padding: 5px 0;
            border-left: 2px solid #e5e7eb;
            padding-left: 15px;
            margin: 5px 0;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${isEnglish ? 'Teacher ClassCount Report' : 'รายงานการนับชั้นเรียนของครู'}</h1>
        <p><strong>${isEnglish ? 'Teacher' : 'ครู'}:</strong> ${teacherName}</p>
        <p><strong>${isEnglish ? 'Period' : 'ระยะเวลา'}:</strong> ${new Date(start).toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(end).toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <div class="label">${isEnglish ? 'Total ClassCount' : 'จำนวนชั้นเรียนทั้งหมด'}</div>
            <div class="value">${data.summary.totalClassCount}</div>
        </div>
        <div class="summary-card">
            <div class="label">${isEnglish ? 'Approved Classes' : 'คลาสที่อนุมัติ'}</div>
            <div class="value">${data.summary.totalApprovedClasses}</div>
        </div>
        <div class="summary-card">
            <div class="label">${isEnglish ? 'Students Taught' : 'นักเรียนที่สอน'}</div>
            <div class="value">${data.summary.totalStudents}</div>
        </div>
    </div>

    <h2>${isEnglish ? 'Detailed Breakdown by Student' : 'รายละเอียดตามนักเรียน'}</h2>
    <table>
        <thead>
            <tr>
                <th>${isEnglish ? 'Student Name' : 'ชื่อนักเรียน'}</th>
                <th>${isEnglish ? 'ClassCount' : 'จำนวนชั้นเรียน'}</th>
                <th>${isEnglish ? 'Classes' : 'คลาส'}</th>
            </tr>
        </thead>
        <tbody>
            ${data.studentBreakdown.map((student: StudentBreakdown) => `
                <tr class="student-row">
                    <td><strong>${isEnglish ? student.studentName : student.studentNameTh}</strong></td>
                    <td><strong>${student.classCount}</strong></td>
                    <td>${student.numberOfClasses}</td>
                </tr>
                ${student.classes.map((cls: ClassDetail) => `
                    <tr class="class-details">
                        <td colspan="3">
                            <div class="class-item">
                                📅 ${new Date(cls.scheduledDate).toLocaleDateString(lang === "en" ? "en-US" : "th-TH", {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                📍 ${isEnglish ? (cls.location || 'N/A') : (cls.locationTh || 'ไม่ระบุ')}
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                ⏱️ ${cls.duration} ${isEnglish ? 'min' : 'นาที'}
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                ${isEnglish ? 'Count' : 'นับ'}: <strong>${cls.contributedCount}</strong>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>${isEnglish ? 'Generated on' : 'สร้างเมื่อ'} ${new Date().toLocaleString(lang === "en" ? "en-US" : "th-TH", { dateStyle: 'full', timeStyle: 'short' })}</p>
        <p>${isEnglish ? 'Class Tracker System' : 'ระบบติดตามชั้นเรียน'}</p>
    </div>
</body>
</html>
        `;
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="teacher-classcount-modal bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh]">
                {/* Header - Sticky */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h2 className="text-2xl font-bold">
                        {t(`Teacher ClassCount`, `จำนวนชั้นเรียนครู`)}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors print-hide"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto flex-grow">
                    {/* Teacher Selector - Only for moderators/admins */}
                    {(moderatorRole === "moderator" || moderatorRole === "admin") && allTeachers && allTeachers.length > 0 && (
                        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 print-hide">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium">{t("Select Teacher:", "เลือกครู:")}</span>
                                </div>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => {
                                        const newTeacherId = e.target.value as Id<"users">;
                                        setSelectedTeacherId(newTeacherId);
                                        const teacher = allTeachers.find(t => t._id === newTeacherId);
                                        if (teacher) {
                                            setSelectedTeacherUsername(teacher.username);
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                                >
                                    {allTeachers.map((teacher) => (
                                        <option key={teacher._id} value={teacher._id}>
                                            {teacher.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Date Range Selector */}
                    <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 print-hide">
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

                    {/* Active Cycle Indicator */}
                    {classCountData.cycleInfo.isCustomCycle && (
                        <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-l-4 border-indigo-500 rounded-r-lg shadow-sm">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        <span>{t("Active ClassCount Cycle:", "รอบการนับชั้นเรียนที่ใช้งาน:")}</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">
                                            {new Date(classCountData.cycleInfo.startDate).toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">
                                            {new Date(classCountData.cycleInfo.endDate).toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </span>
                                    </div>
                                    {/* Show notes if available */}
                                    {(classCountData.cycleInfo.notes || classCountData.cycleInfo.notesTh) && (
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                            💡 {language === "en" ? classCountData.cycleInfo.notes : (classCountData.cycleInfo.notesTh || classCountData.cycleInfo.notes)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
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
                    <div className="p-4 md:p-6">
                        <h3 className="text-lg font-semibold mb-4">{t("Student Breakdown", "รายละเอียดนักเรียน")}</h3>
                        <div className="space-y-2">
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
                </div>
                {/* End Scrollable Content */}

                {/* Export Actions - Sticky Footer */}
                <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 print-hide">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            💡 {t("Note: Teacher will be notified of this view", "หมายเหตุ: ครูจะได้รับการแจ้งเตือนการดูนี้")}
                        </div>
                        <div className="flex gap-3">
                            {/* Edit Cycle Button - Only for moderators/admins */}
                            {(moderatorRole === "moderator" || moderatorRole === "admin") && (
                                <button
                                    onClick={() => setShowCycleEditor(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    aria-label={t("Edit cycle period", "แก้ไขรอบการนับ")}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    {t("Edit Cycle", "แก้ไขรอบ")}
                                </button>
                            )}
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

                {/* Cycle Editor Modal - Rendered conditionally */}
                {showCycleEditor && (
                    <div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cycle-editor-title"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 id="cycle-editor-title" className="text-xl font-bold">
                                    {t("Edit ClassCount Cycle", "แก้ไขรอบการนับชั้นเรียน")}
                                </h3>
                                <button
                                    onClick={() => setShowCycleEditor(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label={t("Close", "ปิด")}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <TeacherCycleEditor
                                teacherId={selectedTeacherId}
                                teacherName={selectedTeacherUsername}
                                moderatorId={moderatorId}
                                onComplete={() => {
                                    setShowCycleEditor(false);
                                    // Optionally trigger data refresh by updating date range
                                    toast.success(
                                        "Cycle updated successfully. Refresh to see changes.",
                                        "อัปเดตรอบสำเร็จ รีเฟรชเพื่อดูการเปลี่ยนแปลง"
                                    );
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Print Language Selection Dialog */}
                {showPrintLanguageDialog && (
                    <div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">
                                    {t("Select Print Language", "เลือกภาษาสำหรับพิมพ์")}
                                </h3>
                                <button
                                    onClick={() => setShowPrintLanguageDialog(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label={t("Close", "ปิด")}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {t(
                                    "Choose the language for your printed report:",
                                    "เลือกภาษาสำหรับรายงานที่พิมพ์:"
                                )}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handlePrintWithLanguage("en")}
                                    className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-medium flex items-center justify-center gap-2"
                                >
                                    🇬🇧 English
                                </button>
                                <button
                                    onClick={() => handlePrintWithLanguage("th")}
                                    className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-medium flex items-center justify-center gap-2"
                                >
                                    🇹🇭 ไทย (Thai)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
