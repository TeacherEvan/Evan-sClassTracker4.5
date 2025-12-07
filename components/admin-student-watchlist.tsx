"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { StudentMergeDialog } from "./student-merge-dialog";

interface AdminStudentWatchlistProps {
    currentUserId: Id<"users">;
}

export function AdminStudentWatchlist({ currentUserId }: AdminStudentWatchlistProps) {
    const { t } = useLanguage();
    const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "dismissed" | undefined>("pending");
    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const [selectedSourceId, setSelectedSourceId] = useState<Id<"students"> | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<Id<"students"> | null>(null);

    const watchlistEntries = useQuery(api.studentWatchlist.listWatchlist, {
        status: statusFilter,
    });

    const dismissEntry = useMutation(api.studentWatchlist.dismissWatchlistEntry);
    const resolveEntry = useMutation(api.studentWatchlist.resolveWatchlistEntry);

    const handleDismiss = async (entryId: Id<"studentWatchlist">) => {
        try {
            await dismissEntry({
                id: entryId,
                resolvedBy: currentUserId,
                notes: "Dismissed by admin - not a duplicate",
                notesTh: "ยกเลิกโดยผู้ดูแลระบบ - ไม่ใช่ข้อมูลซ้ำซ้อน",
            });
            toast.success("Entry dismissed", "ยกเลิกรายการแล้ว");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to dismiss entry",
                "ไม่สามารถยกเลิกรายการได้"
            );
        }
    };

    const handleMergeClick = (sourceId: Id<"students">, targetId: Id<"students">) => {
        setSelectedSourceId(sourceId);
        setSelectedTargetId(targetId);
        setShowMergeDialog(true);
    };

    const handleMergeSuccess = async () => {
        // Find the watchlist entry for this student and resolve it
        const entry = watchlistEntries?.find(e => e.studentId === selectedSourceId);
        if (entry && selectedTargetId) {
            try {
                await resolveEntry({
                    id: entry._id,
                    resolvedBy: currentUserId,
                    mergedIntoId: selectedTargetId,
                    notes: "Merged successfully",
                    notesTh: "รวมสำเร็จ",
                });
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "Failed to resolve watchlist entry",
                    "ไม่สามารถแก้ไขรายการเฝ้าระวังได้"
                );
            }
        }
        setShowMergeDialog(false);
        setSelectedSourceId(null);
        setSelectedTargetId(null);
    };

    if (!watchlistEntries) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">
                        {t("Loading watchlist...", "กำลังโหลดรายการเฝ้าระวัง...")}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {t("Student Watchlist", "รายการเฝ้าระวังนักเรียน")}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t("Filter:", "กรอง:")}
                        </span>
                        <select
                            value={statusFilter || "all"}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value === "all" ? undefined : (e.target.value as "pending" | "resolved" | "dismissed")
                                )
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                        >
                            <option value="all">{t("All", "ทั้งหมด")}</option>
                            <option value="pending">{t("Pending", "รอดำเนินการ")}</option>
                            <option value="resolved">{t("Resolved", "แก้ไขแล้ว")}</option>
                            <option value="dismissed">{t("Dismissed", "ยกเลิก")}</option>
                        </select>
                    </div>
                </div>

                {/* Empty State */}
                {watchlistEntries.length === 0 && (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {t("No entries found", "ไม่พบรายการ")}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {statusFilter === "pending"
                                ? t("No pending duplicates to review", "ไม่มีข้อมูลซ้ำซ้อนที่รอตรวจสอบ")
                                : t("No entries with the selected filter", "ไม่มีรายการตามฟิลเตอร์ที่เลือก")}
                        </p>
                    </div>
                )}

                {/* Watchlist Entries */}
                <div className="space-y-4">
                    {watchlistEntries.map((entry) => (
                        <div
                            key={entry._id}
                            className={`border-2 rounded-xl p-5 transition-all ${
                                entry.status === "pending"
                                    ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10"
                                    : entry.status === "resolved"
                                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/10"
                            }`}
                        >
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {entry.student?.firstName} {entry.student?.lastName}
                                        </h3>
                                        <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                            {entry.student?.grade}{entry.student?.class || ""}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ID: {entry.student?.studentId}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        {entry.status === "pending" && (
                                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                                <Clock className="w-4 h-4" />
                                                {t("Pending Review", "รอตรวจสอบ")}
                                            </span>
                                        )}
                                        {entry.status === "resolved" && (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-4 h-4" />
                                                {t("Resolved", "แก้ไขแล้ว")}
                                            </span>
                                        )}
                                        {entry.status === "dismissed" && (
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                <XCircle className="w-4 h-4" />
                                                {t("Dismissed", "ยกเลิก")}
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span>
                                            {t("Flagged by", "ระบุโดย")}: {entry.flaggedByUser?.username}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(entry.flaggedAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {entry.status === "pending" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDismiss(entry._id)}
                                            className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                                            title={t("Dismiss", "ยกเลิก")}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Matched Fields */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {entry.matchedFields.map((field) => (
                                    <span
                                        key={field}
                                        className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                                    >
                                        ✓ {field}
                                    </span>
                                ))}
                            </div>

                            {/* Potential Duplicates */}
                            {entry.potentialDuplicates && entry.potentialDuplicates.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {t("Potential Duplicates:", "ข้อมูลที่อาจซ้ำซ้อน:")}
                                    </h4>
                                    {entry.potentialDuplicates.map((duplicate) => (
                                        <div
                                            key={duplicate._id}
                                            className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {duplicate.firstName} {duplicate.lastName}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {duplicate.grade}{duplicate.class || ""} • ID: {duplicate.studentId}
                                                </div>
                                            </div>
                                            {entry.status === "pending" && entry.student && (
                                                <button
                                                    onClick={() => handleMergeClick(entry.student!._id, duplicate._id)}
                                                    className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    {t("Merge", "รวม")}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            {entry.notes && (
                                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {t("Notes:", "หมายเหตุ:")}
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">{entry.notes}</div>
                                </div>
                            )}

                            {/* Resolution Info */}
                            {entry.status !== "pending" && entry.resolvedByUser && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                                    {t("Resolved by", "แก้ไขโดย")}: {entry.resolvedByUser.username} •{" "}
                                    {entry.resolvedAt && new Date(entry.resolvedAt).toLocaleString()}
                                    {entry.mergedIntoId && (
                                        <span className="ml-2">
                                            • {t("Merged into", "รวมเข้ากับ")}: {entry.mergedIntoId}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Merge Dialog */}
            {showMergeDialog && selectedSourceId && selectedTargetId && (
                <StudentMergeDialog
                    sourceStudentId={selectedSourceId}
                    targetStudentId={selectedTargetId}
                    currentUserId={currentUserId}
                    onClose={() => {
                        setShowMergeDialog(false);
                        setSelectedSourceId(null);
                        setSelectedTargetId(null);
                    }}
                    onSuccess={handleMergeSuccess}
                />
            )}
        </>
    );
}
