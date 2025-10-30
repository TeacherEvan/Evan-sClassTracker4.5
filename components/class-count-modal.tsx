"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Filter,
    GraduationCap,
    MapPin,
    Printer,
    School,
    Search,
    User,
    X
} from "lucide-react";
import { useMemo, useState } from "react";

interface ClassCountModalProps {
    teacherId: Id<"users">;
    onClose: () => void;
}

export function ClassCountModal({ teacherId, onClose }: ClassCountModalProps) {
    const { t, language } = useLanguage();

    // Custom date range filter (client-side only - NOT saved to database)
    // Default: 1st of current month to 1st of next month
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [viewStartDate, setViewStartDate] = useState<Date>(defaultStart);
    const [viewEndDate, setViewEndDate] = useState<Date>(defaultEnd);

    // NEW: Filter and search state
    const [selectedProvider, setSelectedProvider] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "classCount" | "entity">("date");

    const classCountDetails = useQuery(api.teacherClassCount.getMyClassCountDetails, {
        teacherId,
    });

    // Print data query WITH custom date range
    const printData = useQuery(api.teacherClassCount.getClassCountForPrint, {
        teacherId,
        customStartDate: viewStartDate.getTime(),
        customEndDate: viewEndDate.getTime(),
    });

    const [showAllClasses, setShowAllClasses] = useState(false);

    // Extract unique providers for filter dropdown (must be before conditional return)
    const uniqueProviders = useMemo(() => {
        if (!classCountDetails) return [];
        const { classes } = classCountDetails;
        const providerSet = new Map<string, { id: string; name: string; nameTh: string }>();
        classes.forEach(cls => {
            if (cls.providerId && cls.providerName) {
                providerSet.set(cls.providerId, {
                    id: cls.providerId,
                    name: cls.providerName,
                    nameTh: cls.providerNameTh || cls.providerName,
                });
            }
        });
        return Array.from(providerSet.values());
    }, [classCountDetails]);

    // CLIENT-SIDE FILTERING based on date range, provider, and search (must be before conditional return)
    const filteredAndSearchedClasses = useMemo(() => {
        if (!classCountDetails) return [];
        const { classes } = classCountDetails;

        const result = classes.filter(cls => {
            const classDate = new Date(cls.scheduledDate);
            const inDateRange = classDate >= viewStartDate && classDate <= viewEndDate;

            // Provider filter
            const matchesProvider = selectedProvider === "all" ||
                (selectedProvider === "schools" && !cls.providerId) ||
                (cls.providerId === selectedProvider);

            // Search filter (student name or location)
            const matchesSearch = searchQuery === "" ||
                cls.primaryStudentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (cls.locationName && cls.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (cls.locationNameTh && cls.locationNameTh.toLowerCase().includes(searchQuery.toLowerCase()));

            return inDateRange && matchesProvider && matchesSearch;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === "date") {
                return b.scheduledDate - a.scheduledDate; // Newest first
            } else if (sortBy === "classCount") {
                return b.classCount - a.classCount; // Highest first
            } else if (sortBy === "entity") {
                const aEntity = a.providerName || a.schoolName;
                const bEntity = b.providerName || b.schoolName;
                return aEntity.localeCompare(bEntity);
            }
            return 0;
        });

        return result;
    }, [classCountDetails, viewStartDate, viewEndDate, selectedProvider, searchQuery, sortBy]);

    // Recalculate summary stats for filtered view
    const filteredTotalClassCount = filteredAndSearchedClasses.reduce((sum, cls) => sum + cls.classCount, 0);
    const roundedFilteredTotal = Math.round(filteredTotalClassCount * 10) / 10;

    // Print function
    const handlePrint = () => {
        if (!printData) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print');
            return;
        }

        const html = `
<!DOCTYPE html>
<html lang="${language === "th" ? "th" : "en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t("ClassCount Report", "รายงานจำนวนชั้นเรียน")} - ${printData.teacher.username}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #4CAF50;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 10px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .summary-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .class-count-badge {
            background: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 10px; }
            .header { page-break-after: avoid; }
            tr { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${t("ClassCount Report", "รายงานจำนวนชั้นเรียน")}</h1>
        <p><strong>${t("Teacher", "ครู")}:</strong> ${printData.teacher.displayName || printData.teacher.username}</p>
        <p><strong>${t("Cycle Period", "รอบการนับ")}:</strong> ${new Date(printData.cycle.startDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")} - ${new Date(printData.cycle.endDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}</p>
        <p><strong>${t("Generated", "สร้างเมื่อ")}:</strong> ${new Date(printData.generatedAt).toLocaleString(language === "th" ? "th-TH" : "en-US")}</p>
    </div>

    <div class="summary">
        <h2 style="margin: 0 0 10px 0;">${t("Summary", "สรุป")}</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">${t("Total ClassCount", "จำนวนชั้นเรียนรวม")}</div>
                <div class="value">${printData.summary.totalClassCount}</div>
            </div>
            <div class="summary-item">
                <div class="label">${t("Classes Counted", "ชั้นเรียนที่นับ")}</div>
                <div class="value">${printData.summary.totalClasses}</div>
            </div>
            <div class="summary-item">
                <div class="label">${t("Total Approved", "อนุมัติทั้งหมด")}</div>
                <div class="value">${printData.summary.totalApprovedClasses}</div>
            </div>
        </div>
    </div>

    <h2>${t("Detailed Breakdown", "รายละเอียด")}</h2>
    <table>
        <thead>
            <tr>
                <th>${t("Date", "วันที่")}</th>
                <th>${t("Student(s)", "นักเรียน")}</th>
                <th>${t("Entity", "หน่วยงาน")}</th>
                <th>${t("Duration", "ระยะเวลา")}</th>
                <th>${t("Students", "จำนวนนักเรียน")}</th>
                <th>${t("ClassCount", "จำนวนชั้นเรียน")}</th>
            </tr>
        </thead>
        <tbody>
            ${printData.classes.map(cls => {
            const isProvider = !!cls.providerId;
            const entityName = isProvider
                ? (language === "th" ? cls.providerNameTh : cls.providerName)
                : (language === "th" ? cls.schoolNameTh : cls.schoolName);
            const entityBadge = isProvider
                ? `<span style="background: #e9d5ff; color: #7e22ce; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Provider</span>`
                : '';

            return `
                    <tr>
                        <td>${new Date(cls.scheduledDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}</td>
                        <td>
                            ${cls.primaryStudentName}
                            ${cls.additionalStudentNames.length > 0 ? `<br><small>(+${cls.additionalStudentNames.length} more)</small>` : ''}
                        </td>
                        <td>${entityName} ${entityBadge}</td>
                        <td>${cls.duration} min</td>
                        <td>${cls.studentCount}</td>
                        <td><span class="class-count-badge">${cls.classCount}</span></td>
                    </tr>
                `;
        }).join('')}
        </tbody>
    </table>

    ${printData.cycle.notes || printData.cycle.notesTh ? `
        <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0;">${t("Cycle Notes", "หมายเหตุรอบ")}</h3>
            <p style="margin: 0;">${language === "th" ? (printData.cycle.notesTh || printData.cycle.notes) : printData.cycle.notes}</p>
        </div>
    ` : ''}

    <div class="footer">
        <p>${t("This report is automatically generated and reflects classes that have been approved and acknowledged.", "รายงานนี้ถูกสร้างขึ้นอัตโนมัติและสะท้อนชั้นเรียนที่ได้รับการอนุมัติและยอมรับแล้ว")}</p>
        <p>${t("Evan's Class Tracker 4.5", "Evan's Class Tracker 4.5")} - ${new Date().getFullYear()}</p>
    </div>
</body>
</html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    if (!classCountDetails) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-4 md:p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                    </div>
                </div>
            </div>
        );
    }

    const displayedClasses = showAllClasses ? filteredAndSearchedClasses : filteredAndSearchedClasses.slice(0, 5);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl">
                {/* Sticky Header */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 p-4 md:p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-full">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {t("Your ClassCount", "จำนวนชั้นเรียนของคุณ")}
                                </h2>
                                <p className="text-sm text-white/90">
                                    {roundedFilteredTotal} {t("classes in selected period", "ชั้นเรียนในช่วงที่เลือก")}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Print Button */}
                            <button
                                onClick={handlePrint}
                                disabled={!printData}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                                title={t("Print Report", "พิมพ์รายงาน")}
                            >
                                <Printer className="w-5 h-5 text-white" />
                            </button>
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-grow">

                    {/* Disclaimer */}
                    <div className="p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                                    {t(
                                        "This is your current class count for the month. Value will reset at the end of each cycle determined by your moderator.",
                                        "นี่คือจำนวนชั้นเรียนปัจจุบันของคุณสำหรับเดือนนี้ ค่าจะรีเซ็ตในตอนท้ายของแต่ละรอบที่กำหนดโดยผู้ดูแลของคุณ"
                                    )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {t("Current Cycle:", "รอบปัจจุบัน:")} {new Date(cycleInfo.startDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")} -{" "}
                                        {new Date(cycleInfo.endDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                                    </span>
                                </div>
                                {cycleInfo.notes && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                                        {language === "th" ? cycleInfo.notesTh || cycleInfo.notes : cycleInfo.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Custom Date Range Filter (Client-Side View Only) */}
                    <div className="p-4 md:p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-200 dark:border-purple-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                    {t("View Period:", "ช่วงเวลาที่ดู:")}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 dark:text-gray-300">
                                        {t("From", "จาก")}:
                                    </label>
                                    <input
                                        type="date"
                                        value={viewStartDate.toISOString().split('T')[0]}
                                        onChange={(e) => setViewStartDate(new Date(e.target.value))}
                                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 dark:text-gray-300">
                                        {t("To", "ถึง")}:
                                    </label>
                                    <input
                                        type="date"
                                        value={viewEndDate.toISOString().split('T')[0]}
                                        onChange={(e) => setViewEndDate(new Date(e.target.value))}
                                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setViewStartDate(defaultStart);
                                        setViewEndDate(defaultEnd);
                                    }}
                                    className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-700 rounded transition-colors"
                                >
                                    {t("Reset to Default", "รีเซ็ตเป็นค่าเริ่มต้น")}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">
                            {t(
                                "This filter only changes your view - it doesn't modify the actual cycle period.",
                                "ตัวกรองนี้เปลี่ยนเฉพาะมุมมองของคุณ - ไม่ได้แก้ไขรอบจริง"
                            )}
                        </p>
                    </div>

                    {/* NEW: Filter & Search Bar */}
                    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t("Filters & Search", "ตัวกรองและค้นหา")}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Provider Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Entity", "หน่วยงาน")}
                                </label>
                                <select
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">{t("All Entities", "ทุกหน่วยงาน")}</option>
                                    <option value="schools">{t("Schools Only", "โรงเรียนเท่านั้น")}</option>
                                    {uniqueProviders.map(provider => (
                                        <option key={provider.id} value={provider.id}>
                                            {language === "th" ? provider.nameTh : provider.name} ({t("Provider", "ผู้ให้บริการ")})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Sort By", "เรียงตาม")}
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as "date" | "classCount" | "entity")}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="date">{t("Date (Newest First)", "วันที่ (ใหม่สุดก่อน)")}</option>
                                    <option value="classCount">{t("ClassCount (Highest First)", "จำนวนชั้นเรียน (มากสุดก่อน)")}</option>
                                    <option value="entity">{t("Entity (A-Z)", "หน่วยงาน (A-Z)")}</option>
                                </select>
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Search", "ค้นหา")}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t("Student or location...", "นักเรียนหรือสถานที่...")}
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Badge */}
                        {(selectedProvider !== "all" || searchQuery !== "") && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedProvider !== "all" && (
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                        {selectedProvider === "schools" ? t("Schools Only", "โรงเรียนเท่านั้น") :
                                            uniqueProviders.find(p => p.id === selectedProvider)?.[language === "th" ? "nameTh" : "name"]}
                                    </span>
                                )}
                                {searchQuery !== "" && (
                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                        {t("Search:", "ค้นหา:")} &quot;{searchQuery}&quot;
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedProvider("all");
                                        setSearchQuery("");
                                    }}
                                    className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    {t("Clear All", "ล้างทั้งหมด")}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div className="p-4 md:p-6 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                    {t("ClassCount (Filtered)", "จำนวนชั้นเรียน (กรอง)")}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {roundedFilteredTotal}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    {t("Classes Shown", "ชั้นเรียนที่แสดง")}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {filteredAndSearchedClasses.length}
                            </p>
                        </div>
                    </div>

                    {/* Classes List */}
                    <div className="p-4 md:p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {t("Classes in Selected Period", "ชั้นเรียนในช่วงที่เลือก")}
                        </h3>

                        {filteredAndSearchedClasses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{t("No classes found in this date range", "ไม่พบชั้นเรียนในช่วงวันที่นี้")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedClasses.map((cls) => {
                                    const isProvider = !!cls.providerId;

                                    return (
                                        <div
                                            key={cls.classId}
                                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                                        >
                                            {/* Main Card Content */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                {cls.primaryStudentName}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>
                                                                    {new Date(cls.scheduledDate).toLocaleDateString(
                                                                        language === "th" ? "th-TH" : "en-US"
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>{cls.duration} min</span>
                                                            </div>
                                                            {/* Entity Badge - Provider or School */}
                                                            {isProvider ? (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                                                    <Building2 className="w-3.5 h-3.5" />
                                                                    <span className="text-xs font-medium">
                                                                        {language === "th" ? cls.providerNameTh : cls.providerName}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <School className="w-3.5 h-3.5" />
                                                                    <span>{language === "th" ? cls.schoolNameTh : cls.schoolName}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                <span>{language === "th" ? cls.locationNameTh : cls.locationName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
                                                            {cls.classCount}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {cls.studentCount} {cls.studentCount === 1 ? "student" : "students"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                        {t("Acknowledged by", "ยอมรับโดย")} {cls.acknowledgedBy}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredAndSearchedClasses.length > 5 && !showAllClasses && (
                                    <button
                                        onClick={() => setShowAllClasses(true)}
                                        className="w-full py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                                    >
                                        {t(`Show All ${filteredAndSearchedClasses.length} Classes`, `แสดงทั้งหมด ${filteredAndSearchedClasses.length} ชั้นเรียน`)}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {t(
                            "For full class history, visit the Teachers Log tab",
                            "สำหรับประวัติชั้นเรียนทั้งหมด ไปที่แท็บ Teachers Log"
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
