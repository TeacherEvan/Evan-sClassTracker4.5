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

    const handleMigrate = async () => {
        if (
            !confirm(
                t(
                    "Convert all Sangsom School students to events?\n\nThis will:\n- Create an event for each student\n- Delete all student records\n\nThis action cannot be undone!",
                    "แปลงนักเรียนโรงเรียนสังสมทั้งหมดเป็นกิจกรรม?\n\nการดำเนินการนี้จะ:\n- สร้างกิจกรรมสำหรับแต่ละนักเรียน\n- ลบบันทึกนักเรียนทั้งหมด\n\nไม่สามารถยกเลิกได้!"
                )
            )
        ) {
            return;
        }

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

    const handleDelete = async () => {
        if (
            !confirm(
                t(
                    "⚠️ DELETE all Sangsom School students?\n\nThis will permanently remove all student records without creating events.\n\nThis action cannot be undone!",
                    "⚠️ ลบนักเรียนโรงเรียนสังสมทั้งหมด?\n\nการดำเนินการนี้จะลบบันทึกนักเรียนทั้งหมดอย่างถาวรโดยไม่สร้างกิจกรรม\n\nไม่สามารถยกเลิกได้!"
                )
            )
        ) {
            return;
        }

        // Double confirmation
        if (
            !confirm(
                t(
                    "Are you ABSOLUTELY SURE?\n\nAll student data will be lost forever!",
                    "คุณแน่ใจหรือไม่?\n\nข้อมูลนักเรียนทั้งหมดจะสูญหายตลอดกาล!"
                )
            )
        ) {
            return;
        }

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
        </div>
    );
}
