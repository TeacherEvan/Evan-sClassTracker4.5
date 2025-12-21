"use client";

import { PaginatedList } from "@/components/paginated-list";
import { QuickActionButton } from "@/components/quick-action-button";
import { StudentListSkeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { Copy, GraduationCap, Mail, Pencil, Phone, Trash2, User as UserIcon } from "lucide-react";
import type { Student } from "./types";

interface StudentListProps {
    students?: Student[];
    selectedStudents: Set<Id<"students">>;
    toggleStudentSelection: (id: Id<"students">) => void;
    toggleSelectAll: () => void;
    handleEdit: (student: Student) => void;
    handleDelete: (id: Id<"students">, name: string) => void;
    handleDuplicate: (id: Id<"students">, name: string) => void;
    getSchoolName: (id?: Id<"schools">) => string;
}

export function StudentList({
    students,
    selectedStudents,
    toggleStudentSelection,
    toggleSelectAll,
    handleEdit,
    handleDelete,
    handleDuplicate,
    getSchoolName,
}: StudentListProps) {
    const { t, language } = useLanguage();

    if (!students) {
        return <StudentListSkeleton rows={10} />;
    }

    if (students.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                    {t("No students found", "ไม่พบข้อมูลนักเรียน")}
                </p>
                <p className="text-sm mt-2">
                    {t("Add your first student to get started", "เพิ่มนักเรียนคนแรกเพื่อเริ่มต้น")}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th className="px-3 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={students.length > 0 && selectedStudents.size === students.length}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                aria-label={language === "en" ? "Select all students" : "เลือกนักเรียนทั้งหมด"}
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("Student ID", "รหัสนักเรียน")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("Name", "ชื่อ")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("Grade", "ระดับชั้น")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("Class", "คลาส")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("School/Guardian", "โรงเรียน/ผู้ปกครอง")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("Contact", "ติดต่อ")}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("Actions", "การดำเนินการ")}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                        <td colSpan={8} className="p-0">
                            <PaginatedList
                                items={students}
                                itemsPerPage={15}
                                emptyMessageEn="No students found"
                                emptyMessageTh="ไม่พบข้อมูลนักเรียน"
                                showPageInfo={true}
                                showJumpButtons={true}
                                renderItem={(student) => {
                                    const isSelected = selectedStudents.has(student._id);
                                    return (
                                        <table className="w-full">
                                            <tbody>
                                                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-900 quick-action-parent transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                                                    <td className="px-3 py-4 w-12">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleStudentSelection(student._id)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                            aria-label={language === "en" ? `Select student ${student.firstName} ${student.lastName}` : `เลือกนักเรียน ${student.firstName} ${student.lastName}`}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white" style={{ width: "180px" }}>
                                                        {student.studentId}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" style={{ width: "200px" }}>
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {student.firstName} {student.lastName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" style={{ width: "120px" }}>
                                                        {student.grade}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" style={{ width: "100px" }}>
                                                        {student.class || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" style={{ width: "200px" }}>
                                                        <div className="text-sm">
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {student.schoolId ? getSchoolName(student.schoolId) : student.guardianName}
                                                            </div>
                                                            {!student.schoolId && student.guardianName && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {t("Guardian", "ผู้ปกครอง")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" style={{ width: "180px" }}>
                                                        {student.guardianPhone && (
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <Phone className="w-3 h-3" />
                                                                {student.guardianPhone}
                                                            </div>
                                                        )}
                                                        {student.guardianEmail && (
                                                            <div className="flex items-center gap-1 text-xs mt-1">
                                                                <Mail className="w-3 h-3" />
                                                                {student.guardianEmail}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ width: "150px" }}>
                                                        <div className="quick-action-container flex items-center justify-end gap-2">
                                                            {!student.schoolId && student.guardianName && (
                                                                <QuickActionButton
                                                                    icon={Copy}
                                                                    label={t("Duplicate", "คัดลอก")}
                                                                    variant="duplicate"
                                                                    onClick={() => handleDuplicate(student._id, `${student.firstName} ${student.lastName}`)}
                                                                />
                                                            )}
                                                            <QuickActionButton
                                                                icon={Pencil}
                                                                label={t("Edit", "แก้ไข")}
                                                                variant="edit"
                                                                onClick={() => handleEdit(student)}
                                                            />
                                                            <QuickActionButton
                                                                icon={Trash2}
                                                                label={t("Delete", "ลบ")}
                                                                variant="delete"
                                                                onClick={() => handleDelete(student._id, `${student.firstName} ${student.lastName}`)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    );
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
