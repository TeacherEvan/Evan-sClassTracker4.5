"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useQuery } from "convex/react";
import { AlertTriangle, Calculator, Lock, Printer, X } from "lucide-react";
import { useState } from "react";

interface ClassPaymentCalculatorProps {
  teacherId?: Id<"users">; // Pre-filled for teachers
  userRole: string;
  onClose: () => void;
}

export function ClassPaymentCalculator({
  teacherId,
  userRole,
  onClose,
}: ClassPaymentCalculatorProps) {
  const { t, language } = useLanguage();

  // STATE - All ephemeral (component-level only, never saved to database)
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] =
    useState<Id<"users"> | null>(teacherId || null);
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
    userRole !== "teacher" ? { role: "teacher" } : "skip",
  );

  // For teachers: fetch own user to display name in print header
  const currentTeacher = useQuery(
    api.users.getById,
    userRole === "teacher" && teacherId ? { id: teacherId } : "skip",
  );

  // Load class data for selected teacher (read-only)
  // Use getClassCountForPrint to support custom date ranges (same as modal)
  const classCountData = useQuery(
    api.teacherClassCount.getClassCountForPrint,
    selectedTeacherId && acceptedDisclaimer
      ? {
          teacherId: selectedTeacherId,
          customStartDate: startDate.getTime(),
          customEndDate: endDate.getTime(),
        }
      : "skip",
  );

  // Get teacher details for display
  const selectedTeacher = allTeachers?.find((t) => t._id === selectedTeacherId);
  const teacherName =
    (userRole === "teacher"
      ? currentTeacher?.username
      : selectedTeacher?.username) || "";

  // CALCULATION - Client-side filtering by provider only (date already filtered by backend query)
  const filteredClasses =
    classCountData?.classes.filter((cls) => {
      // Date filtering removed - backend query already filters by customStartDate/customEndDate

      if (filterProvider === "all") return true;
      if (filterProvider === "schools") return !cls.providerId; // Has no providerId means it's a school class
      if (filterProvider === "providers") return !!cls.providerId; // Has providerId means it's a provider class

      // Specific entity ID - check both schoolId (inferred from schoolName presence) and providerId
      const hasMatchingProvider = cls.providerId === filterProvider;
      // We don't have direct schoolId, but we can infer from absence of providerId and matching name
      const hasMatchingSchool = !cls.providerId && filterProvider === "schools";

      return hasMatchingProvider || hasMatchingSchool;
    }) || [];

  const totalClassCount = filteredClasses.reduce(
    (sum, cls) => sum + cls.classCount,
    0,
  );
  const totalPayment = totalClassCount * rate;

  // Get unique entities (schools + providers) for filter dropdown
  const entities: Array<{
    id: string;
    name: string;
    type: "school" | "provider";
  }> = [];

  if (classCountData?.classes) {
    const seenIds = new Set<string>();

    classCountData.classes.forEach((cls) => {
      // If it has a providerId, it's a provider class
      if (cls.providerId && !seenIds.has(cls.providerId)) {
        seenIds.add(cls.providerId);
        entities.push({
          id: cls.providerId,
          name:
            language === "th"
              ? cls.providerNameTh || cls.providerName || ""
              : cls.providerName || "",
          type: "provider",
        });
      }
      // Otherwise it's a school class - use schoolName as identifier
      // (Since we don't have schoolId in the returned data, we use the name)
      else if (
        !cls.providerId &&
        cls.schoolName &&
        !seenIds.has(cls.schoolName)
      ) {
        seenIds.add(cls.schoolName);
        entities.push({
          id: cls.schoolName, // Using name as ID since schoolId not returned
          name:
            language === "th"
              ? cls.schoolNameTh || cls.schoolName
              : cls.schoolName,
          type: "school",
        });
      }
    });
  }

  // Helpers
  const formatWeekOfMonth = (date: Date) => {
    const day = date.getDate();
    // Week number in month: 1-5 (Mon-Sun based approximation)
    const week = Math.ceil(
      (day +
        (new Date(date.getFullYear(), date.getMonth(), 1).getDay() || 7) -
        1) /
        7,
    );
    const suffix = (n: number) =>
      n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
    const monthName = date.toLocaleString(
      language === "th" ? "th-TH" : "en-US",
      { month: "long" },
    );
    const weekday = date.toLocaleString(language === "th" ? "th-TH" : "en-US", {
      weekday: "long",
    });
    return {
      labelEn: `${suffix(week)} week of ${monthName} ${date.getFullYear()}`,
      weekday,
      weekNum: week,
    };
  };

  const buildClassLabel = (cls: (typeof filteredClasses)[number]) => {
    const d = new Date(cls.scheduledDate);
    const info = formatWeekOfMonth(d);
    const isProvider = !!cls.providerId;
    const kindEn = isProvider ? "PvtClass" : "SchoolClass";
    const kindTh = isProvider ? "คลาสส่วนตัว" : "คลาสโรงเรียน";
    const weekLabelTh = `${info.weekNum} ${t("week", "สัปดาห์")}`; // rough Thai; primary label is date anyway
    const monthYearTh = d.toLocaleString("th-TH", {
      month: "long",
      year: "numeric",
    });
    return language === "th"
      ? `${info.weekday} ${kindTh} - ${weekLabelTh} ของ ${monthYearTh}`
      : `${info.weekday} ${kindEn} - ${formatWeekOfMonth(d).labelEn}`;
  };

  const fullStudentList = (cls: (typeof filteredClasses)[number]) => {
    const names = [
      cls.primaryStudentName,
      ...(cls.additionalStudentNames || []),
    ].filter(Boolean);
    return names.join(", ");
  };

  // Note: getClassCountForPrint doesn't include bookedByUsername or approvalSource fields
  // These are simplified versions that just show teacher name
  const formatBookedBy = () => {
    // Print query doesn't include bookedByUsername, so just show teacher name
    return teacherName || (language === "th" ? "ไม่มีข้อมูล" : "Not recorded");
  };

  const formatApprovedBy = () => {
    // Print query doesn't include approvalSource or approvedByUsername
    // Just return a generic approved status
    return language === "th" ? "อนุมัติแล้ว" : "Approved";
  };

  // Print function - generates HTML report
  const handlePrint = () => {
    if (!selectedTeacherId || !classCountData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error(
        "Please allow popups to print",
        "กรุณาอนุญาตป๊อปอัพเพื่อพิมพ์",
      );
      return;
    }

    // Precompute printable rows to avoid heavy string logic in template
    const printableRows = filteredClasses.map((cls, idx) => {
      const d = new Date(cls.scheduledDate);
      const dateText = d.toLocaleDateString(
        language === "th" ? "th-TH" : "en-US",
      );
      const timeText = d.toLocaleTimeString(
        language === "th" ? "th-TH" : "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );
      const students = fullStudentList(cls);
      const entityName = cls.providerId
        ? language === "th"
          ? cls.providerNameTh || cls.providerName
          : cls.providerName
        : language === "th"
          ? cls.schoolNameTh || cls.schoolName
          : cls.schoolName;
      const locationName =
        language === "th"
          ? cls.locationNameTh || cls.locationName
          : cls.locationName;
      const payment = cls.classCount * rate;
      const approvedBy = formatApprovedBy();
      const bookedBy = formatBookedBy();
      const sessionType = cls.providerId
        ? language === "th"
          ? "คลาสผู้ให้บริการ"
          : "Provider"
        : language === "th"
          ? "คลาสโรงเรียน"
          : "School";
      return {
        idx: idx + 1,
        dateText,
        timeText,
        sessionType,
        students,
        entityName,
        locationName,
        duration: cls.duration,
        classCount: cls.classCount,
        payment,
        approvedBy,
        bookedBy,
      };
    });

    const entitySummaryAccumulator = new Map<
      string,
      {
        labelEn: string;
        labelTh?: string | null;
        type: "provider" | "school";
        sessions: number;
        classCount: number;
        payment: number;
      }
    >();

    filteredClasses.forEach((cls) => {
      const isProvider = !!cls.providerId;
      const key = isProvider
        ? `provider:${cls.providerId}`
        : `school:${cls.schoolName || cls.schoolNameTh || "unknown"}`;

      if (!entitySummaryAccumulator.has(key)) {
        entitySummaryAccumulator.set(key, {
          labelEn: isProvider
            ? cls.providerName || "Provider"
            : cls.schoolName || "School",
          labelTh: isProvider ? cls.providerNameTh : cls.schoolNameTh,
          type: isProvider ? "provider" : "school",
          sessions: 0,
          classCount: 0,
          payment: 0,
        });
      }

      const entry = entitySummaryAccumulator.get(key)!;
      entry.sessions += 1;
      entry.classCount += cls.classCount;
      entry.payment += cls.classCount * rate;
    });

    const entitySummaries = Array.from(entitySummaryAccumulator.values())
      .map((entry) => ({
        label:
          language === "th" ? entry.labelTh || entry.labelEn : entry.labelEn,
        typeLabel:
          entry.type === "provider"
            ? t("Provider", "ผู้ให้บริการ")
            : t("School", "โรงเรียน"),
        sessions: entry.sessions,
        classCount: Math.round(entry.classCount * 10) / 10,
        payment: entry.payment,
      }))
      .sort((a, b) => b.payment - a.payment);

    const html = `
<!DOCTYPE html>
<html lang="${language === "th" ? "th" : "en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t("Class Payment Calculation Report", "รายงานการคำนวณค่าสอน")} - ${teacherName}</title>
    <style>
        @page {
            margin: 6mm;
            size: A4 portrait;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            color: #1f2937;
            line-height: 1.2;
            background: #ffffff;
            font-size: 9px;
        }
        .report-container {
            max-width: 100%;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }
        .header h1 {
            margin: 0 0 3px;
            color: #047857;
            font-size: 14px;
            font-weight: 700;
        }
        .header-left {
            flex: 1;
        }
        .header-right {
            text-align: right;
            font-size: 8px;
            color: #6b7280;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: auto auto;
            gap: 2px 16px;
            font-size: 8px;
            color: #374151;
        }
        .meta-grid strong {
            color: #111827;
        }
        .summary {
            display: flex;
            gap: 8px;
            margin-bottom: 6px;
            padding: 4px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
        }
        .summary-item {
            flex: 1;
            text-align: center;
        }
        .summary-item .label {
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #6b7280;
        }
        .summary-item .value {
            font-size: 13px;
            font-weight: 700;
            color: #047857;
            margin-top: 1px;
        }
        .entity-note {
            font-size: 7.5px;
            color: #6b7280;
            margin-bottom: 4px;
            font-style: italic;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5px;
        }
        th, td {
            padding: 2px 4px;
            border-bottom: 0.5px solid #e5e7eb;
            text-align: left;
        }
        th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            white-space: nowrap;
        }
        td {
            vertical-align: top;
        }
        tbody tr:nth-child(even) {
            background: #fafafa;
        }
        .entity-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: 600;
        }
        .provider-badge {
            background: #ede9fe;
            color: #7c3aed;
        }
        .school-badge {
            background: #dbeafe;
            color: #2563eb;
        }
        .number-cell {
            text-align: right;
            font-weight: 600;
        }
        .class-count {
            color: #047857;
        }
        .signatures {
            display: flex;
            gap: 12px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
        }
        .sig-item {
            flex: 1;
            text-align: center;
        }
        .sig-line {
            border-bottom: 0.5px solid #9ca3af;
            height: 18px;
            margin-bottom: 2px;
        }
        .sig-label {
            font-size: 7px;
            color: #6b7280;
        }
        .footer {
            margin-top: 4px;
            font-size: 7px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
        }
        @media print {
            body {
                margin: 0;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <div class="header-left">
                <h1>${t("Class Payment Report", "รายงานค่าสอน")}</h1>
                <div class="meta-grid">
                    <span><strong>${t("Teacher", "ครู")}:</strong> ${teacherName}</span>
                    <span><strong>${t("Rate", "อัตรา")}:</strong> ฿${rate.toFixed(2)}</span>
                    <span><strong>${t("Period", "ช่วงเวลา")}:</strong> ${startDate.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
            </div>
            <div class="header-right">
                ${new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-US")}<br>
                ${new Date().toLocaleTimeString(language === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
        </div>

        <div class="summary">
            <div class="summary-item">
                <div class="label">${t("Sessions", "จำนวนครั้ง")}</div>
                <div class="value">${filteredClasses.length}</div>
            </div>
            <div class="summary-item">
                <div class="label">${t("ClassCount", "ClassCount")}</div>
                <div class="value">${totalClassCount.toFixed(1)}</div>
            </div>
            <div class="summary-item">
                <div class="label">${t("Total Payment", "ค่าสอนรวม")}</div>
                <div class="value">฿${totalPayment.toFixed(2)}</div>
            </div>
        </div>

        ${entitySummaries.length > 1 ? `<div class="entity-note">${t("Entities", "หน่วยงาน")}: ${entitySummaries.map((e) => `${e.label} (${e.sessions} ${t("sessions", "ครั้ง")}, ฿${e.payment.toFixed(2)})`).join(" • ")}</div>` : ""}

        <table>
            <thead>
                <tr>
                    <th style="width:5%">#</th>
                    <th style="width:11%">${t("Date", "วันที่")}</th>
                    <th style="width:28%">${t("Student(s)", "นักเรียน")}</th>
                    <th style="width:22%">${t("Entity / Location", "หน่วยงาน / สถานที่")}</th>
                    <th style="width:9%">${t("Duration", "ระยะเวลา")}</th>
                    <th style="width:10%">${t("ClassCount", "ClassCount")}</th>
                    <th style="width:15%">${t("Payment", "ค่าสอน")}</th>
                </tr>
            </thead>
            <tbody>
                ${printableRows
                  .map(
                    (row) => `
                    <tr>
                        <td>${row.idx}</td>
                        <td>${row.dateText}</td>
                        <td>${row.students}</td>
                        <td>
                            ${
                              row.bookedBy === "System (Provider Auto)" ||
                              row.sessionType.includes("Provider") ||
                              row.sessionType.includes("ผู้ให้บริการ")
                                ? `<span class="entity-badge provider-badge">${row.entityName}</span>`
                                : `<span class="entity-badge school-badge">${row.entityName}</span>`
                            }
                            ${row.locationName && row.locationName !== "-" ? `<br><small>${row.locationName}</small>` : ""}
                        </td>
                        <td>${row.duration} ${t("min", "นาที")}</td>
                        <td class="number-cell class-count">${row.classCount}</td>
                        <td class="number-cell">฿${row.payment.toFixed(2)}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>

        <div class="signatures">
            <div class="sig-item">
                <div class="sig-line"></div>
                <div class="sig-label">${t("Teacher", "ครู")}</div>
            </div>
            <div class="sig-item">
                <div class="sig-line"></div>
                <div class="sig-label">${t("Reviewer", "ผู้ตรวจสอบ")}</div>
            </div>
            <div class="sig-item">
                <div class="sig-line"></div>
                <div class="sig-label">${t("Date", "วันที่")}</div>
            </div>
        </div>

        <div class="footer">
            <span>${t("This calculation is for record-keeping only.", "การคำนวณนี้ใช้เก็บบันทึกเท่านั้น")}</span>
            <span>Evan's Class Tracker 4.5</span>
        </div>
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
                "เพื่อความปลอดภัย ค่าต่างๆ จะไม่ถูกบันทึกหรือเก็บไว้ในระบบ กรุณาพิมพ์รายงานหรือจดบันทึกไว้!",
              )}
            </p>
          </div>

          <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-2">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {t(
                  "All calculations are temporary",
                  "การคำนวณทั้งหมดเป็นชั่วคราว",
                )}
              </span>
            </li>
            <li className="flex gap-2">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {t(
                  "Data will be deleted when you close this window",
                  "ข้อมูลจะถูกลบเมื่อคุณปิดหน้าต่างนี้",
                )}
              </span>
            </li>
            <li className="flex gap-2">
              <Printer className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {t(
                  "Use the print function to save results",
                  "ใช้ฟังก์ชันพิมพ์เพื่อบันทึกผลลัพธ์",
                )}
              </span>
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
                onChange={(e) =>
                  setSelectedTeacherId(e.target.value as Id<"users">)
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  {t("Select a teacher...", "เลือกครู...")}
                </option>
                {allTeachers
                  ?.filter((u) => u.role === "teacher")
                  .map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.username}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Step 2: Rate Input */}
          <div className="space-y-2">
            <label className="font-medium text-gray-900 dark:text-gray-100">
              {t(
                "Step 2: Enter Rate per Class",
                "ขั้นตอนที่ 2: ระบุอัตราต่อชั้นเรียน",
              )}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                ฿
              </span>
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
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {t("From", "จาก")}
                </label>
                <input
                  type="date"
                  value={startDate.toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {t("To", "ถึง")}
                </label>
                <input
                  type="date"
                  value={endDate.toISOString().split("T")[0]}
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
              <option value="schools">
                {t("Schools Only", "โรงเรียนเท่านั้น")}
              </option>
              <option value="providers">
                {t("Providers Only", "ผู้ให้บริการเท่านั้น")}
              </option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.type === "provider" ? "🟣 " : "🔵 "}
                  {entity.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {selectedTeacherId && classCountData === undefined && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                {t("Loading class data...", "กำลังโหลดข้อมูลคลาส...")}
              </p>
            </div>
          )}

          {/* No Teacher Selected */}
          {!selectedTeacherId && userRole !== "teacher" && (
            <div className="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t(
                  "Please select a teacher to begin",
                  "กรุณาเลือกครูเพื่อเริ่มต้น",
                )}
              </p>
            </div>
          )}

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
                    {totalClassCount.toFixed(1)} × ฿ {rate.toFixed(2)} = ฿{" "}
                    {totalPayment.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Class Breakdown Table (on-screen) */}
          {selectedTeacherId && filteredClasses.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium">#</th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Date", "วันที่")}
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Class Name", "ชื่อคลาส")}
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Student(s)", "นักเรียน")}
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Entity", "หน่วยงาน/ผู้ให้บริการ")}
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Location", "สถานที่เรียน")}
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Booked by", "ผู้จอง")}
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        {t("Approved by", "ผู้อนุมัติ")}
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        {t("ClassCount", "ClassCount")}
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        {t("Payment", "ค่าสอน")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.slice(0, 20).map((cls, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-gray-200 dark:border-gray-600"
                      >
                        <td className="p-3 text-sm">{idx + 1}</td>
                        <td className="p-3 text-sm">
                          {new Date(cls.scheduledDate).toLocaleDateString(
                            language === "th" ? "th-TH" : "en-US",
                          )}
                        </td>
                        <td className="p-3 text-sm">{buildClassLabel(cls)}</td>
                        <td className="p-3 text-sm">{fullStudentList(cls)}</td>
                        <td className="p-3 text-sm">
                          {cls.providerId ? (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                              {language === "th"
                                ? cls.providerNameTh || cls.providerName
                                : cls.providerName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                              {language === "th"
                                ? cls.schoolNameTh || cls.schoolName
                                : cls.schoolName}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {language === "th"
                            ? cls.locationNameTh || cls.locationName
                            : cls.locationName}
                        </td>
                        <td className="p-3 text-sm">{formatBookedBy()}</td>
                        <td className="p-3 text-sm">{formatApprovedBy()}</td>
                        <td className="p-3 text-right font-bold">
                          {cls.classCount}
                        </td>
                        <td className="p-3 text-right">
                          ฿ {(cls.classCount * rate).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredClasses.length > 20 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center text-sm text-gray-600 dark:text-gray-400">
                  {t(
                    `Showing first 20 of ${filteredClasses.length} classes`,
                    `แสดง 20 รายการแรกจาก ${filteredClasses.length} คลาส`,
                  )}
                </div>
              )}
            </div>
          )}

          {/* No data message */}
          {selectedTeacherId &&
            classCountData &&
            filteredClasses.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t(
                  "No classes found in the selected period",
                  "ไม่พบคลาสในช่วงเวลาที่เลือก",
                )}
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
