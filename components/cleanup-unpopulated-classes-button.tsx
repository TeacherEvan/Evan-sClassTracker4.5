"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";

interface CleanupUnpopulatedClassesButtonProps {
    userId: Id<"users">;
    userRole: string;
}

export function CleanupUnpopulatedClassesButton({
    userId,
    userRole,
}: CleanupUnpopulatedClassesButtonProps) {
    const { t } = useLanguage();
    const [showDialog, setShowDialog] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    // Query and mutation hooks MUST be called before early return
    const unpopulatedClasses = useQuery(
        api.classes.findUnpopulatedClasses,
        showDialog ? { userId, includeOrphaned: true } : "skip"
    );

    const cleanUp = useMutation(api.classes.cleanUpUnpopulatedClasses);

    // Only show to admins - early return AFTER hooks
    if (userRole !== "admin") {
        return null;
    }

    const handleCleanUp = async () => {
        if (!unpopulatedClasses || unpopulatedClasses.count === 0) {
            toast.error(
                "No unpopulated classes found",
                "ไม่พบคลาสที่ไม่มีนักเรียน"
            );
            return;
        }

        if (!reason.trim()) {
            toast.error(
                "Please provide a reason for cleanup",
                "กรุณาระบุเหตุผลในการลบ"
            );
            return;
        }

        setLoading(true);
        try {
            const classIds = unpopulatedClasses.classes.map((c) => c._id);
            const result = await cleanUp({
                userId,
                classIds,
                reason: reason.trim(),
            });

            toast.success(
                `Cleaned up ${result.successful.length} classes`,
                `ลบคลาสสำเร็จ ${result.successful.length} คลาส`
            );

            if (result.failed.length > 0) {
                toast.error(
                    `Failed to clean up ${result.failed.length} classes`,
                    `ลบคลาสไม่สำเร็จ ${result.failed.length} คลาส`
                );
            }

            setShowDialog(false);
            setReason("");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Cleanup failed",
                "การลบล้มเหลว"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowDialog(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
                <Trash2 className="w-4 h-4" />
                {t("Clean Up Unpopulated Classes", "ลบคลาสที่ไม่มีนักเรียน")}
            </button>

            {showDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {t(
                                            "Clean Up Unpopulated Classes",
                                            "ลบคลาสที่ไม่มีนักเรียน"
                                        )}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t(
                                            "Remove classes with invalid student references",
                                            "ลบคลาสที่มีการอ้างอิงนักเรียนที่ไม่ถูกต้อง"
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDialog(false)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-4">
                            {!unpopulatedClasses ? (
                                <p className="text-gray-600 dark:text-gray-400">
                                    {t("Loading...", "กำลังโหลด...")}
                                </p>
                            ) : unpopulatedClasses.count === 0 ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                    <p className="text-green-800 dark:text-green-200 font-medium">
                                        {t(
                                            "✓ No unpopulated classes found. Your database is clean!",
                                            "✓ ไม่พบคลาสที่ไม่มีนักเรียน ฐานข้อมูลของคุณสะอาด!"
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            ⚠️{" "}
                                            {t(
                                                `Found ${unpopulatedClasses.count} unpopulated classes`,
                                                `พบคลาสที่ไม่มีนักเรียน ${unpopulatedClasses.count} คลาส`
                                            )}
                                        </p>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                                            {t(
                                                "These classes have student references that no longer exist in the database.",
                                                "คลาสเหล่านี้มีการอ้างอิงนักเรียนที่ไม่มีอยู่ในฐานข้อมูลแล้ว"
                                            )}
                                        </p>
                                    </div>

                                    {/* List of unpopulated classes */}
                                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">
                                                        {t("Date", "วันที่")}
                                                    </th>
                                                    <th className="px-4 py-2 text-left">
                                                        {t("Status", "สถานะ")}
                                                    </th>
                                                    <th className="px-4 py-2 text-left">
                                                        {t("Reason", "เหตุผล")}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {unpopulatedClasses.classes.map(
                                                    (cls) => (
                                                        <tr
                                                            key={cls._id}
                                                            className="border-t border-gray-200 dark:border-gray-700"
                                                        >
                                                            <td className="px-4 py-2">
                                                                {new Date(
                                                                    cls.scheduledDate
                                                                ).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                                                    {cls.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                                                                {cls.reason}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Reason input */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t(
                                                "Reason for cleanup (required)",
                                                "เหตุผลในการลบ (บังคับ)"
                                            )}
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) =>
                                                setReason(e.target.value)
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700"
                                            rows={3}
                                            placeholder={t(
                                                "e.g., Cleanup of orphaned classes from student deletion",
                                                "เช่น ลบคลาสที่เหลือจากการลบนักเรียน"
                                            )}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {unpopulatedClasses && unpopulatedClasses.count > 0 && (
                            <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800 flex justify-between items-center">
                                <button
                                    onClick={() => setShowDialog(false)}
                                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                                >
                                    {t("Cancel", "ยกเลิก")}
                                </button>
                                <button
                                    onClick={handleCleanUp}
                                    disabled={loading || !reason.trim()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {loading
                                        ? t("Cleaning...", "กำลังลบ...")
                                        : t(
                                            `Clean Up ${unpopulatedClasses.count} Classes`,
                                            `ลบ ${unpopulatedClasses.count} คลาส`
                                        )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
