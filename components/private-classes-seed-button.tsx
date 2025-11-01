"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { useState } from "react";

/**
 * Admin component to seed Private Classes for T. Che, T. Cale, and T. Lee
 * Creates 12 weeks of recurring private tutoring classes (Nov 4, 2025 - Jan 24, 2026)
 */
export function PrivateClassesSeedButton() {
    const { t } = useLanguage();
    const seedPrivateClasses = useMutation(api.seedPrivateClasses.seedPrivateClasses);
    const checkPrivateClasses = useMutation(api.seedPrivateClasses.checkPrivateClasses);

    const [loading, setLoading] = useState(false);
    const [testMode, setTestMode] = useState(true); // Start with test mode
    const [selectedTeacher, setSelectedTeacher] = useState<"Che" | "Cale" | "Lee">("Che");
    const [result, setResult] = useState<{
        success: boolean;
        teacher: string;
        weeksCreated: number;
        bookingsCreated: number;
        message?: string;
        bookings?: Array<{ classId: Id<"classes">; date: string; teacher: string; student: string; location: string }>;
        errors?: Array<{ error: string; week?: number; day?: number; studentCode?: string }>;
    } | null>(null);
    const [existingData, setExistingData] = useState<{
        [key: string]: { exists: boolean; privateClassCount?: number };
    }>({});

    const handleCheckData = async (teacher: "Che" | "Cale" | "Lee") => {
        setLoading(true);
        try {
            const data = await checkPrivateClasses({ teacherUsername: teacher });
            setExistingData(prev => ({ ...prev, [teacher]: data }));

            if (data.exists && data.privateClassCount && data.privateClassCount > 0) {
                toast.info(
                    `${teacher}: Found ${data.privateClassCount} private classes`,
                    `${teacher}: พบ ${data.privateClassCount} คลาสส่วนตัว`
                );
            } else {
                toast.info(
                    `${teacher}: No private classes found. Ready to seed.`,
                    `${teacher}: ไม่พบคลาสส่วนตัว พร้อมที่จะเพิ่มข้อมูล`
                );
            }
        } catch (err) {
            toast.error(
                `Failed to check data: ${err instanceof Error ? err.message : "Unknown error"}`,
                `ตรวจสอบข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : "ข้อผิดพลาด"}`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        setLoading(true);
        setResult(null);

        try {
            const res = await seedPrivateClasses({
                teacherUsername: selectedTeacher,
                testMode,
            });
            setResult(res);

            if (res.errors && res.errors.length > 0) {
                toast.error(
                    `Created ${res.bookingsCreated} classes with ${res.errors.length} errors`,
                    `สร้าง ${res.bookingsCreated} คลาสโดยมี ${res.errors.length} ข้อผิดพลาด`
                );
            } else {
                toast.success(
                    `Successfully created ${res.bookingsCreated} classes for ${res.teacher} (${res.weeksCreated} weeks)!`,
                    `สร้าง ${res.bookingsCreated} คลาสสำหรับ ${res.teacher} (${res.weeksCreated} สัปดาห์) สำเร็จ!`
                );
            }
        } catch (err) {
            toast.error(
                `Failed to seed data: ${err instanceof Error ? err.message : "Unknown error"}`,
                `เพิ่มข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : "ข้อผิดพลาด"}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("Seed Private Classes", "เพิ่มข้อมูลคลาสส่วนตัว")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t(
                            "Create 12 weeks of private tutoring classes for T. Che, T. Cale, and T. Lee",
                            "สร้างคลาสสอนพิเศษ 12 สัปดาห์สำหรับครูเช, ครูเคล, และครูลี"
                        )}
                    </p>
                </div>
            </div>

            {/* Teacher Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Select Teacher", "เลือกครู")}
                </label>
                <div className="flex gap-2">
                    {(["Che", "Cale", "Lee"] as const).map((teacher) => (
                        <button
                            key={teacher}
                            onClick={() => setSelectedTeacher(teacher)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedTeacher === teacher
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                } disabled:opacity-50`}
                        >
                            T. {teacher}
                        </button>
                    ))}
                </div>
            </div>

            {/* Test Mode Toggle */}
            <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={testMode}
                        onChange={(e) => setTestMode(e.target.checked)}
                        disabled={loading}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("Test Mode (Week 1 only)", "โหมดทดสอบ (สัปดาห์ที่ 1 เท่านั้น)")}
                    </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                    {t(
                        "Enable test mode to create only Week 1 classes for verification",
                        "เปิดโหมดทดสอบเพื่อสร้างเฉพาะคลาสสัปดาห์ที่ 1 เพื่อตรวจสอบ"
                    )}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
                <button
                    onClick={() => handleCheckData(selectedTeacher)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? t("Checking...", "กำลังตรวจสอบ...") : t("Check Existing Data", "ตรวจสอบข้อมูลที่มีอยู่")}
                </button>
                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? t("Seeding...", "กำลังเพิ่มข้อมูล...") : t("Seed Classes", "เพิ่มคลาส")}
                </button>
            </div>

            {/* Existing Data Summary */}
            {Object.keys(existingData).length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        {t("Existing Private Classes", "คลาสส่วนตัวที่มีอยู่")}
                    </h4>
                    <div className="space-y-1">
                        {Object.entries(existingData).map(([teacher, data]) => (
                            <div key={teacher} className="text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-medium">T. {teacher}:</span>{" "}
                                {data.exists && data.privateClassCount
                                    ? `${data.privateClassCount} ${t("classes", "คลาส")}`
                                    : t("No data", "ไม่มีข้อมูล")}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Result Display */}
            {result && (
                <div
                    className={`rounded-lg p-4 ${result.errors && result.errors.length > 0
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : "bg-green-50 dark:bg-green-900/20"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {result.errors && result.errors.length > 0 ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <h4
                                className={`font-medium mb-2 ${result.errors && result.errors.length > 0
                                        ? "text-yellow-900 dark:text-yellow-300"
                                        : "text-green-900 dark:text-green-300"
                                    }`}
                            >
                                {t("Seeding Complete", "เพิ่มข้อมูลเสร็จสิ้น")}
                            </h4>
                            <div className="space-y-1 text-sm">
                                <p
                                    className={
                                        result.errors && result.errors.length > 0
                                            ? "text-yellow-800 dark:text-yellow-200"
                                            : "text-green-800 dark:text-green-200"
                                    }
                                >
                                    <span className="font-medium">{t("Teacher", "ครู")}:</span> T. {result.teacher}
                                </p>
                                <p
                                    className={
                                        result.errors && result.errors.length > 0
                                            ? "text-yellow-800 dark:text-yellow-200"
                                            : "text-green-800 dark:text-green-200"
                                    }
                                >
                                    <span className="font-medium">{t("Weeks Created", "สัปดาห์ที่สร้าง")}:</span> {result.weeksCreated}
                                </p>
                                <p
                                    className={
                                        result.errors && result.errors.length > 0
                                            ? "text-yellow-800 dark:text-yellow-200"
                                            : "text-green-800 dark:text-green-200"
                                    }
                                >
                                    <span className="font-medium">{t("Bookings Created", "คลาสที่สร้าง")}:</span>{" "}
                                    {result.bookingsCreated}
                                </p>
                            </div>

                            {/* Error Details */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
                                    <p className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                                        {t("Errors", "ข้อผิดพลาด")} ({result.errors.length}):
                                    </p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {result.errors.map((err, idx) => (
                                            <div
                                                key={idx}
                                                className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 rounded p-2"
                                            >
                                                {err.week && err.day && (
                                                    <span className="font-medium">
                                                        Week {err.week}, Day {err.day}:{" "}
                                                    </span>
                                                )}
                                                {err.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                    {t("Schedule Details", "รายละเอียดตารางเรียน")}
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>T. Che:</strong> 5 days/week, OLD MUSIC TOILET (60 classes)</li>
                    <li>• <strong>T. Cale:</strong> 5 days/week, Big kitchen/OLD TEG (59 classes + special cases)</li>
                    <li>• <strong>T. Lee:</strong> 4 days/week, PLAY ROOM B.5 (45 classes + trial students)</li>
                    <li>• <strong>{t("Duration", "ระยะเวลา")}:</strong> Nov 4, 2025 - Jan 24, 2026 (12 weeks)</li>
                    <li>• <strong>{t("Time", "เวลา")}:</strong> 15:00-16:00 (3:00 PM - 4:00 PM)</li>
                </ul>
            </div>
        </div>
    );
}
