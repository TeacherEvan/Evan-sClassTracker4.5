"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Check, GraduationCap, UserCheck } from "lucide-react";
import { useState } from "react";

interface GuardianDashboardProps {
    currentUser: User;
}

export function GuardianDashboard({ currentUser }: GuardianDashboardProps) {
    const { t, language } = useLanguage();
    const [acknowledging, setAcknowledging] = useState<Id<"students"> | null>(
        null
    );

    // Queries
    const students = useQuery(api.students.getByGuardianId, {
        guardianId: currentUser._id,
    });

    // Mutations
    const acknowledgeStudent = useMutation(api.students.acknowledgeStudent);

    const handleAcknowledge = async (studentId: Id<"students">) => {
        setAcknowledging(studentId);
        try {
            await acknowledgeStudent({ studentId });
        } catch (error) {
            console.error("Failed to acknowledge student:", error);
        } finally {
            setAcknowledging(null);
        }
    };

    const pendingStudents =
        students?.filter((student) => !student.acknowledged) || [];
    const acknowledgedStudents =
        students?.filter((student) => student.acknowledged) || [];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-6 h-6" />
                    {t("Guardian Dashboard", "แดชบอร์ดผู้ปกครอง")}
                </h2>
                <p className="text-green-50 mt-2">
                    {t(
                        "Manage your students and acknowledge new additions",
                        "จัดการนักเรียนของคุณและยืนยันการเพิ่มใหม่"
                    )}
                </p>
            </div>

            {/* Pending Acknowledgements */}
            {pendingStudents.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2 mb-4">
                        <GraduationCap className="w-5 h-5" />
                        {t(
                            "Pending Student Acknowledgements",
                            "นักเรียนรอการยืนยัน"
                        )}
                    </h3>
                    <div className="space-y-3">
                        {pendingStudents.map((student) => (
                            <div
                                key={student._id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {student.firstName} {student.lastName}
                                        </h4>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <p>
                                                <span className="font-medium">
                                                    {t("Student ID:", "รหัสนักเรียน:")}
                                                </span>{" "}
                                                {student.studentId}
                                            </p>
                                            <p>
                                                <span className="font-medium">
                                                    {t("Grade:", "ชั้นเรียน:")}
                                                </span>{" "}
                                                {student.grade}
                                            </p>
                                            {student.guardianTitle && (
                                                <p>
                                                    <span className="font-medium">
                                                        {t("Relationship:", "ความสัมพันธ์:")}
                                                    </span>{" "}
                                                    {student.guardianTitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAcknowledge(student._id)}
                                        disabled={acknowledging === student._id}
                                        className="ml-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
                                    >
                                        <Check className="w-5 h-5" />
                                        {acknowledging === student._id
                                            ? t("Acknowledging...", "กำลังยืนยัน...")
                                            : t("Acknowledge", "ยืนยัน")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Acknowledged Students */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <GraduationCap className="w-5 h-5" />
                    {t("My Students", "นักเรียนของฉัน")}
                    <span className="ml-auto text-sm font-normal text-gray-500">
                        {acknowledgedStudents.length} {t("students", "นักเรียน")}
                    </span>
                </h3>

                {acknowledgedStudents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <GraduationCap className="w-16 h-16 mx-auto mb-3 opacity-50" />
                        <p>
                            {t(
                                "No acknowledged students yet",
                                "ยังไม่มีนักเรียนที่ยืนยันแล้ว"
                            )}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {acknowledgedStudents.map((student) => (
                            <div
                                key={student._id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                                <div className="flex items-start gap-2 mb-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {student.firstName} {student.lastName}
                                        </h4>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <p>
                                        <span className="font-medium">
                                            {t("ID:", "รหัส:")}
                                        </span>{" "}
                                        {student.studentId}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            {t("Grade:", "ชั้น:")}
                                        </span>{" "}
                                        {student.grade}
                                    </p>
                                    {student.guardianTitle && (
                                        <p>
                                            <span className="font-medium">
                                                {t("Relation:", "ความสัมพันธ์:")}
                                            </span>{" "}
                                            {student.guardianTitle}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 pt-2">
                                        {t("Added:", "เพิ่มเมื่อ:")}{" "}
                                        {new Date(student.createdAt).toLocaleDateString(
                                            language === "en" ? "en-US" : "th-TH"
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
