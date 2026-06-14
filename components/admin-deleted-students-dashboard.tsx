"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  FileText,
  GraduationCap,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

interface AdminDeletedStudentsDashboardProps {
  userId: Id<"users">;
  onClose: () => void;
}

/**
 * CRITICAL ADMIN DASHBOARD
 * Investigate student deletions and orphaned classes
 * Shows WHO deleted WHAT student WHEN and WHY
 *
 * NEW FEATURE (Oct 30, 2025) - Emergency investigation tool
 */
export function AdminDeletedStudentsDashboard({
  userId,
  onClose,
}: AdminDeletedStudentsDashboardProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"deleted" | "orphaned">("deleted");
  const [searchTerm, setSearchTerm] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedDeletion, setSelectedDeletion] = useState<any | null>(null);

  // Query deleted students audit logs
  const deletedStudents = useQuery(api.auditLogs.getDeletedStudents, {
    userId,
    limit: 200,
  });

  // Query orphaned classes
  const orphanedClasses = useQuery(api.auditLogs.getOrphanedClasses, {
    userId,
  });

  // Filter deleted students by search
  const filteredDeletions =
    deletedStudents?.filter(
      (log) =>
        log.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.deletedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  // Filter orphaned classes by search
  const filteredOrphaned =
    orphanedClasses?.filter(
      (orphan) =>
        orphan.deletionInfo?.studentName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        orphan.deletionInfo?.deletedBy
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        orphan.deletedStudentId
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    ) || [];

  if (!deletedStudents || !orphanedClasses) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            {t("Loading investigation data...", "กำลังโหลดข้อมูลการสอบสวน...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header - CRITICAL RED */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 md:p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t(
                    "🚨 Deleted Students Investigation",
                    "🚨 การสอบสวนนักเรียนที่ถูกลบ",
                  )}
                </h2>
                <p className="text-sm text-white/90">
                  {t(
                    "Track WHO deleted WHAT student WHEN and WHY",
                    "ติดตามว่าใครลบนักเรียนคนไหน เมื่อไหร่ และทำไม",
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("Total Students Deleted", "นักเรียนที่ถูกลบทั้งหมด")}
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {deletedStudents.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("Orphaned Classes (Broken)", "คลาสที่เสียหาย")}
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {orphanedClasses.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                "Search by student name, ID, deleted by, or reason...",
                "ค้นหาด้วยชื่อนักเรียน, ID, ผู้ลบ, หรือเหตุผล...",
              )}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("deleted")}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === "deleted"
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-2 border-red-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <Trash2 className="inline w-4 h-4 mr-2" />
            {t("Deleted Students", "นักเรียนที่ถูกลบ")} (
            {filteredDeletions.length})
          </button>
          <button
            onClick={() => setActiveTab("orphaned")}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === "orphaned"
                ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-b-2 border-orange-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <AlertCircle className="inline w-4 h-4 mr-2" />
            {t("Orphaned Classes", "คลาสที่เสียหาย")} ({filteredOrphaned.length}
            )
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow p-4">
          {activeTab === "deleted" && (
            <div className="space-y-3">
              {filteredDeletions.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? t(
                          "No deleted students match your search",
                          "ไม่พบนักเรียนที่ถูกลบตามการค้นหา",
                        )
                      : t(
                          "No students have been deleted yet",
                          "ยังไม่มีนักเรียนที่ถูกลบ",
                        )}
                  </p>
                </div>
              ) : (
                filteredDeletions.map((log) => (
                  <div
                    key={log._id}
                    className="border border-red-200 dark:border-red-800 rounded-lg p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedDeletion(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {log.studentName}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            (ID: {log.studentId})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("Deleted by", "ลบโดย")}:
                            </span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {log.deletedBy}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(log.deletedAt).toLocaleString(
                                language === "th" ? "th-TH" : "en-US",
                              )}
                            </span>
                          </div>
                        </div>

                        {log.reason && (
                          <div className="mt-2 flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t("Reason", "เหตุผล")}:
                              </span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                &quot;{log.reason}&quot;
                              </p>
                            </div>
                          </div>
                        )}

                        {log.affectedClasses > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-sm bg-orange-100 dark:bg-orange-900/20 px-3 py-1 rounded-md">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-700 dark:text-orange-400">
                              {log.affectedClasses}{" "}
                              {t("classes affected", "คลาสที่ได้รับผลกระทบ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "orphaned" && (
            <div className="space-y-3">
              {filteredOrphaned.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? t(
                          "No orphaned classes match your search",
                          "ไม่พบคลาสที่เสียหายตามการค้นหา",
                        )
                      : t(
                          "No orphaned classes found - system is clean!",
                          "ไม่พบคลาสที่เสียหาย - ระบบสะอาด!",
                        )}
                  </p>
                </div>
              ) : (
                filteredOrphaned.map((orphan) => (
                  <div
                    key={orphan.classId}
                    className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {t("Orphaned Class", "คลาสที่เสียหาย")}
                        </h3>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("Class Date", "วันที่คลาส")}:
                            </span>
                            <p className="font-medium">
                              {new Date(
                                orphan.scheduledDate,
                              ).toLocaleDateString(
                                language === "th" ? "th-TH" : "en-US",
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("Status", "สถานะ")}:
                            </span>
                            <p className="font-medium">{orphan.status}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("Duration", "ระยะเวลา")}:
                            </span>
                            <p className="font-medium">{orphan.duration} min</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("Students", "นักเรียน")}:
                            </span>
                            <p className="font-medium">{orphan.studentCount}</p>
                          </div>
                        </div>

                        {orphan.deletionInfo ? (
                          <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-orange-200 dark:border-orange-700">
                            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">
                              {t("🔍 Deletion Details", "🔍 รายละเอียดการลบ")}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t("Student", "นักเรียน")}:
                                </span>{" "}
                                <span className="font-medium">
                                  {orphan.deletionInfo.studentName}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t("Deleted by", "ลบโดย")}:
                                </span>{" "}
                                <span className="font-medium text-red-600 dark:text-red-400">
                                  {orphan.deletionInfo.deletedBy}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t("Deleted at", "ลบเมื่อ")}:
                                </span>{" "}
                                <span className="font-medium">
                                  {new Date(
                                    orphan.deletionInfo.deletedAt,
                                  ).toLocaleString(
                                    language === "th" ? "th-TH" : "en-US",
                                  )}
                                </span>
                              </p>
                              {orphan.deletionInfo.reason && (
                                <p>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {t("Reason", "เหตุผล")}:
                                  </span>{" "}
                                  <span className="italic">
                                    &quot;{orphan.deletionInfo.reason}&quot;
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-100 dark:bg-red-900/20 rounded-md p-3 text-sm text-red-700 dark:text-red-400">
                            ⚠️{" "}
                            {t(
                              "No deletion audit log found - student was deleted before logging was implemented",
                              "ไม่พบบันทึกการลบ - นักเรียนถูกลบก่อนที่จะมีระบบบันทึก",
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                "All deletion actions are now permanently logged for accountability",
                "การลบทั้งหมดถูกบันทึกอย่างถาวรเพื่อความรับผิดชอบ",
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              {t("Close", "ปิด")}
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal for Selected Deletion */}
      {selectedDeletion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("Deletion Details", "รายละเอียดการลบ")}
              </h3>
              <button
                onClick={() => setSelectedDeletion(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h4 className="font-bold text-lg mb-2">
                  {selectedDeletion.studentName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Student ID: {selectedDeletion.studentId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("Deleted By", "ลบโดย")}
                  </p>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {selectedDeletion.deletedBy}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("Deleted At", "ลบเมื่อ")}
                  </p>
                  <p className="font-medium">
                    {new Date(selectedDeletion.deletedAt).toLocaleString(
                      language === "th" ? "th-TH" : "en-US",
                    )}
                  </p>
                </div>
              </div>

              {selectedDeletion.reason && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t("Reason", "เหตุผล")}
                  </p>
                  <p className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 italic">
                    &quot;{selectedDeletion.reason}&quot;
                  </p>
                </div>
              )}

              {selectedDeletion.parsedDetails && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t("Additional Details", "รายละเอียดเพิ่มเติม")}
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 space-y-2 text-sm">
                    {selectedDeletion.parsedDetails.grade && (
                      <p>
                        <span className="font-medium">
                          {t("Grade", "ชั้น")}:
                        </span>{" "}
                        {selectedDeletion.parsedDetails.grade}
                      </p>
                    )}
                    {selectedDeletion.parsedDetails.class && (
                      <p>
                        <span className="font-medium">
                          {t("Class", "ห้อง")}:
                        </span>{" "}
                        {selectedDeletion.parsedDetails.class}
                      </p>
                    )}
                    {selectedDeletion.parsedDetails.affectedClasses !==
                      undefined && (
                      <p>
                        <span className="font-medium">
                          {t("Affected Classes", "คลาสที่ได้รับผลกระทบ")}:
                        </span>{" "}
                        {selectedDeletion.parsedDetails.affectedClasses}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDeletion(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {t("Close", "ปิด")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
