"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { CheckCircle, Users } from "lucide-react";
import { useState } from "react";

/**
 * Admin component to import Sangsom K1/9 student roster
 * Imports 27 students from the documented class roster into the Sangsom School
 */
export function SangsomStudentImportButton() {
    const { t } = useLanguage();
    const findSangsomSchool = useMutation(api.importSangsomStudents.findSangsomSchool);
    const importK19Students = useMutation(api.importSangsomStudents.importK19Students);

    const [loading, setLoading] = useState(false);
    const [schoolCheck, setSchoolCheck] = useState<{
        found: boolean;
        schoolId?: Id<"schools">;
        schoolName?: string;
        message?: string;
    } | null>(null);
    const [result, setResult] = useState<{
        message: string;
        imported: number;
        failed: number;
        results: Array<{ nickname: string; thaiName: string; studentId: string }>;
        errors: Array<{ nickname: string; error: string; studentId?: string }>;
    } | null>(null);

    const handleCheckSchool = async () => {
        setLoading(true);
        try {
            const data = await findSangsomSchool({});
            setSchoolCheck(data);

            if (data.found) {
                toast.success(
                    `Found Sangsom School: ${data.schoolName}`,
                    `พบโรงเรียนสังสม: ${data.schoolName}`
                );
            } else {
                toast.error(
                    data.message || "Sangsom School not found. Please seed Sangsom data first.",
                    "ไม่พบโรงเรียนสังสม กรุณาเพิ่มข้อมูลสังสมก่อน"
                );
            }
        } catch (err) {
            toast.error(
                `Failed to check school: ${err instanceof Error ? err.message : "Unknown error"}`,
                `ตรวจสอบโรงเรียนไม่สำเร็จ: ${err instanceof Error ? err.message : "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!schoolCheck?.found || !schoolCheck?.schoolId) {
            toast.error(
                "Please check school existence first",
                "กรุณาตรวจสอบโรงเรียนก่อน"
            );
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Get current user from localStorage for createdBy field
            const userStr = localStorage.getItem("currentUser");
            if (!userStr) {
                throw new Error("No user logged in. Please login first.");
            }
            const user = JSON.parse(userStr);

            const res = await importK19Students({
                schoolId: schoolCheck.schoolId,
                createdBy: user._id as Id<"users">,
            });
            setResult(res);

            toast.success(
                `Successfully imported ${res.imported} students! Failed: ${res.failed}`,
                `นำเข้า ${res.imported} นักเรียนสำเร็จ! ไม่สำเร็จ: ${res.failed}`
            );
        } catch (err) {
            toast.error(
                `Failed to import students: ${err instanceof Error ? err.message : "Unknown error"}`,
                `นำเข้านักเรียนไม่สำเร็จ: ${err instanceof Error ? err.message : "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                    <h2 className="text-2xl font-bold">
                        {t("Sangsom K1/9 Student Import", "นำเข้านักเรียน สังสม อ.1/9")}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t(
                            "Import 27 students from K1/9 class roster",
                            "นำเข้า 27 นักเรียนจากรายชื่อชั้น อ.1/9"
                        )}
                    </p>
                </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ {t(
                        "This will import students from the documented K1/9 roster. Duplicates will be skipped.",
                        "การดำเนินการนี้จะนำเข้านักเรียนจากรายชื่อชั้น อ.1/9 รายการที่ซ้ำจะถูกข้าม"
                    )}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={handleCheckSchool}
                    disabled={loading}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? t("Checking...", "กำลังตรวจสอบ...") : t("Check School", "ตรวจสอบโรงเรียน")}
                </button>
                <button
                    onClick={handleImport}
                    disabled={loading || !schoolCheck?.found}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? t("Importing...", "กำลังนำเข้า...") : t("Import Students", "นำเข้านักเรียน")}
                </button>
            </div>

            {/* School Check Result */}
            {schoolCheck && (
                <div className={`rounded-lg p-4 mb-4 ${schoolCheck.found
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}>
                    <div className="flex items-center gap-2">
                        {schoolCheck.found ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <span className="text-red-600">✗</span>
                        )}
                        <p className={schoolCheck.found ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
                            {schoolCheck.found
                                ? `✓ ${t("Sangsom School found", "พบโรงเรียนสังสม")}: ${schoolCheck.schoolName}`
                                : `✗ ${t("Sangsom School not found", "ไม่พบโรงเรียนสังสม")}`
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Import Results */}
            {result && (
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            {result.message}
                        </p>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <p>✅ {t("Imported", "นำเข้าสำเร็จ")}: {result.imported}</p>
                            <p>❌ {t("Failed", "ไม่สำเร็จ")}: {result.failed}</p>
                        </div>
                    </div>

                    {/* Successfully Imported Students */}
                    {result.results.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                                📋 {t("Imported Students", "นักเรียนที่นำเข้า")} ({result.results.length})
                            </p>
                            <div className="max-h-48 overflow-y-auto">
                                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                                    {result.results.map((student, idx) => (
                                        <li key={idx}>
                                            {idx + 1}. {student.nickname} ({student.thaiName}) - {student.studentId}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                                ⚠️ {t("Errors", "ข้อผิดพลาด")} ({result.errors.length})
                            </p>
                            <div className="max-h-48 overflow-y-auto">
                                <ul className="text-sm text-red-800 dark:text-red-200 space-y-2">
                                    {result.errors.map((error, idx) => (
                                        <li key={idx}>
                                            - {error.nickname}: {error.error}
                                            {error.studentId && (
                                                <span className="block ml-4 text-xs">
                                                    {t("Existing ID", "รหัสที่มีอยู่")}: {error.studentId}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
