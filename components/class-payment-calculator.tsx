"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
    AlertTriangle,
    Calculator,
    Lock,
    Printer,
    X
} from "lucide-react";
import { useState } from "react";

interface ClassPaymentCalculatorProps {
    teacherId?: Id<"users">;     // Pre-filled for teachers
    userRole: string;
    onClose: () => void;
}

export function ClassPaymentCalculator({ teacherId, userRole, onClose }: ClassPaymentCalculatorProps) {
    const { t, language } = useLanguage();

    // STATE - All ephemeral (component-level only, never saved to database)
    const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | null>(teacherId || null);
    const [rate, setRate] = useState<number>(0);

    // Default date range: Last 30 days
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month

    const [startDate, setStartDate] = useState<Date>(defaultStartDate);
    const [endDate, setEndDate] = useState<Date>(defaultEndDate);
    const [filterProvider, setFilterProvider] = useState<string>("all");

    // Load all teachers (for moderator/admin dropdown)
    const allTeachers = useQuery(
        api.users.list,
        userRole !== "teacher" ? { role: "teacher" } : "skip"
    );

    // Load class data for selected teacher (read-only)
    const classCountData = useQuery(
        api.teacherClassCount.getMyClassCountDetails,
        selectedTeacherId && acceptedDisclaimer
            ? { teacherId: selectedTeacherId }
            : "skip"
    );

    // Get teacher details for display
    const selectedTeacher = allTeachers?.find(t => t._id === selectedTeacherId);
    const teacherName = selectedTeacher?.username || "";

    // CALCULATION - Client-side only
    const filteredClasses = classCountData?.classes.filter(cls => {
        const classDate = cls.scheduledDate;
        const inDateRange = classDate >= startDate.getTime() && classDate <= endDate.getTime();

        if (!inDateRange) return false;

        if (filterProvider === "all") return true;
        if (filterProvider === "schools") return !cls.providerId; // Has no providerId means it's a school class
        if (filterProvider === "providers") return !!cls.providerId; // Has providerId means it's a provider class

        // Specific entity ID - check both schoolId (inferred from schoolName presence) and providerId
        const hasMatchingProvider = cls.providerId === filterProvider;
        // We don't have direct schoolId, but we can infer from absence of providerId and matching name
        const hasMatchingSchool = !cls.providerId && filterProvider === "schools";

        return hasMatchingProvider || hasMatchingSchool;
    }) || [];

    const totalClassCount = filteredClasses.reduce((sum, cls) => sum + cls.classCount, 0);
    const totalPayment = totalClassCount * rate;

    // Get unique entities (schools + providers) for filter dropdown
    const entities: Array<{ id: string; name: string; type: "school" | "provider" }> = [];

    if (classCountData?.classes) {
        const seenIds = new Set<string>();

        classCountData.classes.forEach(cls => {
            // If it has a providerId, it's a provider class
            if (cls.providerId && !seenIds.has(cls.providerId)) {
                seenIds.add(cls.providerId);
                entities.push({
                    id: cls.providerId,
                    name: language === "th" ? cls.providerNameTh || cls.providerName || "" : cls.providerName || "",
                    type: "provider"
                });
            }
            // Otherwise it's a school class - use schoolName as identifier
            // (Since we don't have schoolId in the returned data, we use the name)
            else if (!cls.providerId && cls.schoolName && !seenIds.has(cls.schoolName)) {
                seenIds.add(cls.schoolName);
                entities.push({
                    id: cls.schoolName, // Using name as ID since schoolId not returned
                    name: language === "th" ? cls.schoolNameTh || cls.schoolName : cls.schoolName,
                    type: "school"
                });
            }
        });
    }

    // Print function - generates HTML report
    const handlePrint = () => {
        if (!selectedTeacherId || !classCountData) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert(t('Please allow popups to print', 'กรุณาอนุญาตป๊อปอัพเพื่อพิมพ์'));
            return;
        }

        const html = `
<!DOCTYPE html>
<html lang="${language === "th" ? "th" : "en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t("Class Payment Calculation Report", "รายงานการคำนวณค่าสอน")} - ${teacherName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #22c55e;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #22c55e;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background: #f0fdf4;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #22c55e;
            margin-bottom: 20px;
        }
        .summary h2 {
            margin: 0 0 15px 0;
            color: #16a34a;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-item .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #16a34a;
            margin-top: 5px;
        }
        .total-payment {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .total-payment .label {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .total-payment .value {
            font-size: 48px;
            font-weight: bold;
        }
        .total-payment .calculation {
            font-size: 14px;
            margin-top: 10px;
            opacity: 0.9;
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
            background-color: #22c55e;
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
            background: #22c55e;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .provider-badge {
            background: #a855f7;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        .school-badge {
            background: #3b82f6;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        .disclaimer {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-top: 30px;
            border-radius: 4px;
        }
        .disclaimer strong {
            color: #ff6b00;
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
        <h1>${t("Class Payment Calculation Report", "รายงานการคำนวณค่าสอน")}</h1>
        <p><strong>${t("Teacher", "ครู")}:</strong> ${teacherName}</p>
        <p><strong>${t("Period", "ช่วงเวลา")}:</strong> ${startDate.toLocaleDateString(language === "th" ? "th-TH" : "en-US")} - ${endDate.toLocaleDateString(language === "th" ? "th-TH" : "en-US")}</p>
        <p><strong>${t("Generated", "สร้างเมื่อ")}:</strong> ${new Date().toLocaleString(language === "th" ? "th-TH" : "en-US")}</p>
    </div>

    <div class="summary">
        <h2>${t("Calculation Summary", "สรุปการคำนวณ")}</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">${t("Total Classes", "จำนวนคลาส")}</div>
                <div class="value">${filteredClasses.length}</div>
            </div>
            <div class="summary-item">
                <div class="label">${t("Total ClassCount", "ClassCount รวม")}</div>
                <div class="value">${totalClassCount.toFixed(1)}</div>
            </div>
            <div class="summary-item">
                <div class="label">${t("Rate per Class", "อัตราต่อคลาส")}</div>
                <div class="value">฿ ${rate.toFixed(2)}</div>
            </div>
        </div>
    </div>

    <div class="total-payment">
        <div class="label">${t("Total Payment", "ค่าสอนรวม")}</div>
        <div class="value">฿ ${totalPayment.toFixed(2)}</div>
        <div class="calculation">${totalClassCount.toFixed(1)} × ฿ ${rate.toFixed(2)} = ฿ ${totalPayment.toFixed(2)}</div>
    </div>

    <h2>${t("Detailed Breakdown", "รายละเอียด")}</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>${t("Date", "วันที่")}</th>
                <th>${t("Student(s)", "นักเรียน")}</th>
                <th>${t("Entity", "สถานที่")}</th>
                <th>${t("Duration", "ระยะเวลา")}</th>
                <th style="text-align: center">${t("ClassCount", "ClassCount")}</th>
                <th style="text-align: right">${t("Payment", "ค่าสอน")}</th>
            </tr>
        </thead>
        <tbody>
            ${filteredClasses.map((cls, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${new Date(cls.scheduledDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}</td>
                    <td>${cls.primaryStudentName}${cls.additionalStudentNames.length > 0 ? ` +${cls.additionalStudentNames.length}` : ''}</td>
                    <td>
                        ${cls.providerId
                ? `<span class="provider-badge">${language === "th" ? cls.providerNameTh || cls.providerName : cls.providerName}</span>`
                : `<span class="school-badge">${language === "th" ? cls.schoolNameTh || cls.schoolName : cls.schoolName}</span>`
            }
                    </td>
                    <td>${cls.duration} min</td>
                    <td style="text-align: center"><span class="class-count-badge">${cls.classCount}</span></td>
                    <td style="text-align: right">฿ ${(cls.classCount * rate).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="disclaimer">
        <strong>${t("IMPORTANT", "สำคัญ")}:</strong> ${t(
                "This calculation is for reference only and has not been saved to the system. Please keep this printed report for your records.",
                "การคำนวณนี้เป็นเพียงข้อมูลอ้างอิงและไม่ได้ถูกบันทึกในระบบ กรุณาเก็บรายงานที่พิมพ์ไว้เป็นหลักฐาน"
            )}
    </div>

    <div class="footer">
        <p>Evan's Class Tracker 4.5 - ${t("Payment Calculator", "เครื่องคำนวณค่าสอน")}</p>
        <p>${t("This report was generated on", "รายงานนี้สร้างเมื่อ")} ${new Date().toLocaleString(language === "th" ? "th-TH" : "en-US")}</p>
    </div>
</body>
</html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    };

    // Disclaimer Screen
    if (!acceptedDisclaimer) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                    <div className="text-center mb-6">
                        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {t("Important Security Notice", "ประกาศความปลอดภัยที่สำคัญ")}
                        </h2>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium">
                            {t(
                                "For security purposes, values will not be saved or stored to the system. Please print the report or write it down!",
                                "เพื่อความปลอดภัย ค่าต่างๆ จะไม่ถูกบันทึกหรือเก็บไว้ในระบบ กรุณาพิมพ์รายงานหรือจดบันทึกไว้!"
                            )}
                        </p>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex gap-2">
                            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{t("All calculations are temporary", "การคำนวณทั้งหมดเป็นชั่วคราว")}</span>
                        </li>
                        <li className="flex gap-2">
                            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{t("Data will be deleted when you close this window", "ข้อมูลจะถูกลบเมื่อคุณปิดหน้าต่างนี้")}</span>
                        </li>
                        <li className="flex gap-2">
                            <Printer className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{t("Use the print function to save results", "ใช้ฟังก์ชันพิมพ์เพื่อบันทึกผลลัพธ์")}</span>
                        </li>
                    </ul>

                    <button
                        onClick={() => setAcceptedDisclaimer(true)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        {t("I Understand, Continue", "ฉันเข้าใจ ดำเนินการต่อ")}
                    </button>
                </div>
            </div>
        );
    }

    // Main Calculator Screen
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full flex flex-col max-h-[85vh] shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 md:p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calculator className="w-6 h-6 text-white" />
                            <h2 className="text-2xl font-bold text-white">
                                {t("Class Payment Calculator", "เครื่องคำนวณค่าสอน")}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label={t("Close", "ปิด")}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-6">
                    {/* Step 1: Teacher Selection (Moderators/Admins only) */}
                    {userRole !== "teacher" && (
                        <div className="space-y-2">
                            <label className="font-medium text-gray-900 dark:text-gray-100">
                                {t("Step 1: Select Teacher", "ขั้นตอนที่ 1: เลือกครู")}
                            </label>
                            <select
                                value={selectedTeacherId || ""}
                                onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users">)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">{t("Select a teacher...", "เลือกครู...")}</option>
                                {allTeachers?.filter(u => u.role === "teacher").map(teacher => (
                                    <option key={teacher._id} value={teacher._id}>{teacher.username}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Step 2: Rate Input */}
                    <div className="space-y-2">
                        <label className="font-medium text-gray-900 dark:text-gray-100">
                            {t("Step 2: Enter Rate per Class", "ขั้นตอนที่ 2: ระบุอัตราต่อชั้นเรียน")}
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">฿</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={rate || ""}
                                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Step 3: Date Range */}
                    <div className="space-y-2">
                        <label className="font-medium text-gray-900 dark:text-gray-100">
                            {t("Step 3: Select Period", "ขั้นตอนที่ 3: เลือกช่วงเวลา")}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400">{t("From", "จาก")}</label>
                                <input
                                    type="date"
                                    value={startDate.toISOString().split('T')[0]}
                                    onChange={(e) => setStartDate(new Date(e.target.value))}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400">{t("To", "ถึง")}</label>
                                <input
                                    type="date"
                                    value={endDate.toISOString().split('T')[0]}
                                    onChange={(e) => setEndDate(new Date(e.target.value))}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Optional: Filter by Entity */}
                    <div className="space-y-2">
                        <label className="font-medium text-gray-900 dark:text-gray-100">
                            {t("Filter by Entity (Optional)", "กรองตามสถานที่ (ไม่บังคับ)")}
                        </label>
                        <select
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">{t("All", "ทั้งหมด")}</option>
                            <option value="schools">{t("Schools Only", "โรงเรียนเท่านั้น")}</option>
                            <option value="providers">{t("Providers Only", "ผู้ให้บริการเท่านั้น")}</option>
                            {entities.map(entity => (
                                <option key={entity.id} value={entity.id}>
                                    {entity.type === "provider" ? "🟣 " : "🔵 "}
                                    {entity.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Calculation Results */}
                    {selectedTeacherId && classCountData && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                                {t("Calculation Summary", "สรุปการคำนวณ")}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {t("Total Classes in Period:", "คลาสทั้งหมดในช่วง:")}
                                    </span>
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {filteredClasses.length}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {t("Total ClassCount:", "ClassCount รวม:")}
                                    </span>
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {totalClassCount.toFixed(1)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {t("Rate per Class:", "อัตราต่อชั้นเรียน:")}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        ฿ {rate.toFixed(2)}
                                    </span>
                                </div>

                                <div className="border-t-2 border-green-300 dark:border-green-700 pt-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                            {t("Total Payment:", "ค่าสอนรวม:")}
                                        </span>
                                        <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                                            ฿ {totalPayment.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                                        {totalClassCount.toFixed(1)} × ฿ {rate.toFixed(2)} = ฿ {totalPayment.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Class Breakdown Table */}
                    {selectedTeacherId && filteredClasses.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-3 text-left text-sm font-medium">#</th>
                                            <th className="p-3 text-left text-sm font-medium">{t("Date", "วันที่")}</th>
                                            <th className="p-3 text-left text-sm font-medium">{t("Student(s)", "นักเรียน")}</th>
                                            <th className="p-3 text-left text-sm font-medium">{t("Entity", "สถานที่")}</th>
                                            <th className="p-3 text-right text-sm font-medium">{t("ClassCount", "ClassCount")}</th>
                                            <th className="p-3 text-right text-sm font-medium">{t("Payment", "ค่าสอน")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClasses.slice(0, 20).map((cls, idx) => (
                                            <tr key={idx} className="border-t border-gray-200 dark:border-gray-600">
                                                <td className="p-3 text-sm">{idx + 1}</td>
                                                <td className="p-3 text-sm">
                                                    {new Date(cls.scheduledDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {cls.primaryStudentName}
                                                    {cls.additionalStudentNames.length > 0 && ` +${cls.additionalStudentNames.length}`}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {cls.providerId ? (
                                                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                                                            {language === "th" ? cls.providerNameTh || cls.providerName : cls.providerName}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                                            {language === "th" ? cls.schoolNameTh || cls.schoolName : cls.schoolName}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right font-bold">{cls.classCount}</td>
                                                <td className="p-3 text-right">฿ {(cls.classCount * rate).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredClasses.length > 20 && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center text-sm text-gray-600 dark:text-gray-400">
                                    {t(`Showing first 20 of ${filteredClasses.length} classes`, `แสดง 20 รายการแรกจาก ${filteredClasses.length} คลาส`)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* No data message */}
                    {selectedTeacherId && classCountData && filteredClasses.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {t("No classes found in the selected period", "ไม่พบคลาสในช่วงเวลาที่เลือก")}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600 flex gap-3">
                    <button
                        onClick={handlePrint}
                        disabled={!selectedTeacherId || filteredClasses.length === 0}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-5 h-5" />
                        {t("Print Report", "พิมพ์รายงาน")}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
                    >
                        {t("Close", "ปิด")}
                    </button>
                </div>
            </div>
        </div>
    );
}
