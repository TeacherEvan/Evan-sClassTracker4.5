"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GitMerge,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface AdminDuplicateWatchlistProps {
  userId: Id<"users">;
  onClose: () => void;
}

/**
 * ADMIN DUPLICATE WATCHLIST DASHBOARD
 * Review and manage potential duplicate students
 * Shows students flagged by duplicate detection (4+ field matches)
 *
 * Actions:
 * - View details of potential duplicates
 * - Merge duplicate students (reassigns classes)
 * - Dismiss as non-duplicate
 * - Mark as reviewed
 */
export function AdminDuplicateWatchlist({
  userId,
  onClose,
}: AdminDuplicateWatchlistProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, _setSelectedEntry] =
    useState<Id<"duplicateWatchlist"> | null>(null);

  // Query watchlist entries
  const pendingEntries = useQuery(api.duplicateDetection.listWatchlist, {
    userId,
    status: activeTab === "pending" ? "pending" : undefined,
  });

  // Query watchlist stats
  const stats = useQuery(api.duplicateDetection.getWatchlistStats, {
    userId,
  });

  // Query selected entry details (always call hook, conditionally use result)
  const _entryDetails = useQuery(
    api.duplicateDetection.getWatchlistEntry,
    selectedEntry
      ? {
          entryId: selectedEntry,
          userId,
        }
      : ("skip" as never),
  );

  // Mutations
  const dismissDuplicate = useMutation(api.duplicateDetection.dismissDuplicate);
  const markAsReviewed = useMutation(api.duplicateDetection.markAsReviewed);

  // Filter entries by search term
  const filteredEntries = pendingEntries?.filter((entry) => {
    if (!searchTerm) return true;
    const student = entry.student;
    if (!student) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower) ||
      student.grade.toLowerCase().includes(searchLower)
    );
  });

  const handleDismiss = async (entryId: Id<"duplicateWatchlist">) => {
    try {
      await dismissDuplicate({
        entryId,
        userId,
        notes: "Dismissed by admin - not a duplicate",
        notesTh: "ถูกปิดโดยผู้ดูแล - ไม่ใช่ข้อมูลซ้ำ",
      });
      _setSelectedEntry(null);
    } catch (error) {
      console.error("Failed to dismiss duplicate:", error);
    }
  };

  const handleMarkReviewed = async (entryId: Id<"duplicateWatchlist">) => {
    try {
      await markAsReviewed({
        entryId,
        userId,
        notes: "Reviewed by admin",
        notesTh: "ตรวจสอบโดยผู้ดูแล",
      });
    } catch (error) {
      console.error("Failed to mark as reviewed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("Duplicate Watchlist", "รายการตรวจสอบข้อมูลซ้ำ")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t(
                "Review and manage potential duplicate students",
                "ตรวจสอบและจัดการนักเรียนที่อาจเป็นข้อมูลซ้ำ",
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 p-6 border-b bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("Total", "ทั้งหมด")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("Pending", "รอดำเนินการ")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("Reviewed", "ตรวจสอบแล้ว")}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.reviewed}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("Merged", "รวมแล้ว")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.merged}
                  </p>
                </div>
                <GitMerge className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("Dismissed", "ปิดแล้ว")}
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.dismissed}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("Pending", "รอดำเนินการ")} ({stats?.pending || 0})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("All", "ทั้งหมด")} ({stats?.total || 0})
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                "Search by name, ID, or grade...",
                "ค้นหาด้วยชื่อ, รหัส, หรือเกรด...",
              )}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredEntries && filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {t("No duplicate entries found", "ไม่พบรายการข้อมูลซ้ำ")}
              </p>
            </div>
          )}

          {filteredEntries && filteredEntries.length > 0 && (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const student = entry.student;
                if (!student) return null;

                return (
                  <div
                    key={entry._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {student.studentId}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                            {student.grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">
                              {t("Matches", "จำนวนที่ตรง")}:
                            </span>{" "}
                            <span className="text-orange-600 font-bold">
                              {entry.matchedFields} {t("fields", "ฟิลด์")}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">
                              {t("Duplicates", "ข้อมูลซ้ำ")}:
                            </span>{" "}
                            {entry.possibleDuplicateIds.length}
                          </div>
                        </div>

                        {/* Matched Fields */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {entry.matchDetails.firstName && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              {t("First Name", "ชื่อจริง")}
                            </span>
                          )}
                          {entry.matchDetails.lastName && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              {t("Last Name", "นามสกุล")}
                            </span>
                          )}
                          {entry.matchDetails.grade && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              {t("Grade", "เกรด")}
                            </span>
                          )}
                          {entry.matchDetails.dateOfBirth && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              {t("Birth Date", "วันเกิด")}
                            </span>
                          )}
                          {entry.matchDetails.guardianPhone && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              {t("Phone", "โทรศัพท์")}
                            </span>
                          )}
                        </div>

                        {/* Possible Duplicates Preview */}
                        <div className="mt-3 border-t pt-3">
                          <p className="text-xs text-gray-500 mb-2">
                            {t(
                              "Possible duplicates:",
                              "ข้อมูลซ้ำที่อาจเป็นไปได้:",
                            )}
                          </p>
                          <div className="space-y-1">
                            {entry.possibleDuplicates.slice(0, 2).map(
                              (dup) =>
                                dup && (
                                  <div
                                    key={dup._id}
                                    className="text-sm text-gray-600"
                                  >
                                    → {dup.firstName} {dup.lastName} (
                                    {dup.studentId})
                                  </div>
                                ),
                            )}
                            {entry.possibleDuplicates.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{entry.possibleDuplicates.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {entry.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleMarkReviewed(entry._id)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            >
                              {t(
                                "Mark Reviewed",
                                "ทำเครื่องหมายว่าตรวจสอบแล้ว",
                              )}
                            </button>
                            <button
                              onClick={() => handleDismiss(entry._id)}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                            >
                              {t("Dismiss", "ปิด")}
                            </button>
                          </>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded text-center ${
                            entry.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : entry.status === "reviewed"
                                ? "bg-blue-100 text-blue-700"
                                : entry.status === "merged"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {t(
              `Showing ${filteredEntries?.length || 0} entries`,
              `แสดง ${filteredEntries?.length || 0} รายการ`,
            )}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t("Close", "ปิด")}
          </button>
        </div>
      </div>
    </div>
  );
}
