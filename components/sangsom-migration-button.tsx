"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { useState } from "react";

interface SangsomMigrationButtonProps {
    userId: Id<"users">;
}

export function SangsomMigrationButton({ userId }: SangsomMigrationButtonProps) {
    const { t } = useLanguage();
    const migrateStudents = useMutation(api.migrateSangsomStudentsToEvents.migrateSangsomStudentsToEvents);
    const deleteStudents = useMutation(api.migrateSangsomStudentsToEvents.deleteSangsomStudents);
    const [loading, setLoading] = useState(false);
    const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1);

    const handleMigrate = () => {
        setShowMigrateConfirm(true);
    };

    const handleDelete = () => {
        setDeleteStep(1);
        setShowDeleteConfirm(true);
    };

    const executeMigrate = async () => {
        setShowMigrateConfirm(false);
        setLoading(true);
        try {
            const result = await migrateStudents({ adminId: userId });

            if (result.success) {
                toast.success(
                    `✅ ${result.message}\n\nEvents created: ${result.studentsConverted}\nStudents deleted: ${result.studentsDeletedCount}`,
                    `✅ ${result.message}\n\nสร้างกิจกรรม: ${result.studentsConverted}\nลบนักเรียน: ${result.studentsDeletedCount}`
                );
            } else {
                toast.error(result.message, result.message);
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Migration failed",
                err instanceof Error ? err.message : "การย้ายข้อมูลล้มเหลว"
            );
        } finally {
            setLoading(false);
        }
    };

    const executeDelete = async () => {
        setShowDeleteConfirm(false);
        setLoading(true);
        try {
            const result = await deleteStudents({ adminId: userId });

            if (result.success) {
                toast.success(
                    `✅ ${result.message}\n\nStudents deleted: ${result.studentsDeleted}`,
                    `✅ ${result.message}\n\nลบนักเรียน: ${result.studentsDeleted}`
                );
            } else {
                toast.error(result.message, result.message);
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Deletion failed",
                err instanceof Error ? err.message : "การลบล้มเหลว"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                {t("Sangsom Student Migration", "การย้ายข้อมูลนักเรียนสังสม")}
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                {t(
                    "Convert existing Sangsom students to events, or delete them entirely.",
                    "แปลงนักเรียนสังสมที่มีอยู่เป็นกิจกรรม หรือลบทั้งหมด"
                )}
            </p>

            <div className="flex gap-3">
                <button
                    onClick={handleMigrate}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowRightLeft className="w-4 h-4" />
                    {loading
                        ? t("Processing...", "กำลังดำเนินการ...")
                        : t("Convert to Events", "แปลงเป็นกิจกรรม")}
                </button>

                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-4 h-4" />
                    {loading
                        ? t("Processing...", "กำลังดำเนินการ...")
                        : t("Delete All", "ลบทั้งหมด")}
                </button>
            </div>

            <div className="mt-4 text-xs text-orange-600 dark:text-orange-400">
                ⚠️ {t("Warning: These actions cannot be undone!", "คำเตือน: การดำเนินการเหล่านี้ไม่สามารถยกเลิกได้!")}
            </div>

            {/* Migration Confirmation Modal */}
            {showMigrateConfirm && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h4 className="text-lg font-semibold mb-4">
                            {t("Confirm Migration", "ยืนยันการย้ายข้อมูล")}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            {t(
                                "Are you sure you want to convert all Sangsom School students to events?",
                                "คุณแน่ใจหรือไม่ว่าต้องการแปลงนักเรียนโรงเรียนสังสมทั้งหมดเป็นกิจกรรม?"
                            )}
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowMigrateConfirm(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>

                            <button
                                onClick={executeMigrate}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                {t("Yes, Convert", "ใช่ แปลงข้อมูล")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h4 className="text-lg font-semibold mb-4">
                            {t("Confirm Deletion", "ยืนยันการลบข้อมูล")}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            {deleteStep === 1
                                ? t(
                                    "This will permanently remove all student records. This action cannot be undone.",
                                    "การดำเนินการนี้จะลบบันทึกนักเรียนทั้งหมดอย่างถาวร ไม่สามารถยกเลิกได้"
                                )
                                : t(
                                    "Are you ABSOLUTELY SURE? All student data will be lost forever!",
                                    "คุณแน่ใจหรือไม่? ข้อมูลนักเรียนทั้งหมดจะสูญหายตลอดกาล!"
                                )}
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>

                            <button
                                onClick={deleteStep === 1 ? () => setDeleteStep(2) : executeDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                {deleteStep === 1
                                    ? t("Proceed to Delete", "ดำเนินการลบ")
                                    : t("Yes, Delete All", "ใช่ ลบทั้งหมด")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
