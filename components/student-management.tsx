"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { Copy, GraduationCap, Mail, Pencil, Phone, Plus, Trash2, User, X } from "lucide-react";
import { useMemo, useState } from "react";

type Student = {
    _id: Id<"students">;
    firstName: string;
    lastName: string;
    studentId: string;
    schoolId?: Id<"schools">;
    grade: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    createdAt: number;
};

export function StudentManagement() {
    const { t } = useLanguage();
    const schools = useQuery(api.schools.list, {});
    const createStudent = useMutation(api.students.create);
    const updateStudent = useMutation(api.students.update);
    const removeStudent = useMutation(api.students.remove);
    const duplicateStudent = useMutation(api.students.duplicate);

    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "guardian" | "all">("all");
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Id<"students"> | null>(null);

    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [grade, setGrade] = useState("");
    const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
    const [guardianName, setGuardianName] = useState("");
    const [guardianPhone, setGuardianPhone] = useState("");
    const [guardianEmail, setGuardianEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Query students based on filter
    const students = useQuery(
        api.students.list,
        selectedSchoolId === "all" || selectedSchoolId === "guardian"
            ? {}
            : { schoolId: selectedSchoolId }
    ) as Student[] | undefined;

    // Filter students client-side for guardian-only view
    const filteredStudents = students?.filter((student) => {
        if (selectedSchoolId === "guardian") {
            return !student.schoolId && student.guardianName;
        }
        return true;
    });

    // Create school lookup map for better performance
    const schoolsMap = useMemo(() => {
        if (!schools) return new Map();
        return new Map(schools.map(s => [s._id, s]));
    }, [schools]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!firstName.trim() || !lastName.trim() || !grade.trim()) {
            setError(t("Please fill in required fields", "กรุณากรอกข้อมูลที่จำเป็น"));
            return;
        }

        // Validate: must have either school OR guardian
        if (!schoolId && !guardianName.trim()) {
            setError(
                t(
                    "Student must be linked to either a school or guardian",
                    "นักเรียนต้องเชื่อมโยงกับโรงเรียนหรือผู้ปกครอง"
                )
            );
            return;
        }

        try {
            if (editingStudent) {
                // Update existing student
                await updateStudent({
                    id: editingStudent,
                    firstName,
                    lastName,
                    grade,
                    guardianName: guardianName || undefined,
                    guardianPhone: guardianPhone || undefined,
                    guardianEmail: guardianEmail || undefined,
                });
                setSuccess(t("Student updated!", "อัปเดตข้อมูลนักเรียนแล้ว!"));
            } else {
                // Create new student
                await createStudent({
                    firstName,
                    lastName,
                    schoolId: schoolId || undefined,
                    grade,
                    guardianName: guardianName || undefined,
                    guardianPhone: guardianPhone || undefined,
                    guardianEmail: guardianEmail || undefined,
                });
                setSuccess(t("Student created!", "สร้างข้อมูลนักเรียนแล้ว!"));
            }

            // Reset form
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        }
    };

    const handleEdit = (student: Student) => {
        setEditingStudent(student._id);
        setFirstName(student.firstName);
        setLastName(student.lastName);
        setGrade(student.grade);
        setSchoolId(student.schoolId || "");
        setGuardianName(student.guardianName || "");
        setGuardianPhone(student.guardianPhone || "");
        setGuardianEmail(student.guardianEmail || "");
        setShowForm(true);
        setError("");
        setSuccess("");
    };

    const handleDelete = async (studentId: Id<"students">, studentName: string) => {
        if (
            !confirm(
                t(
                    `Delete student "${studentName}"? This cannot be undone.`,
                    `ลบนักเรียน "${studentName}"? การกระทำนี้ไม่สามารถย้อนกลับได้`
                )
            )
        ) {
            return;
        }

        try {
            await removeStudent({ id: studentId });
            setSuccess(t("Student deleted!", "ลบนักเรียนแล้ว!"));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete student");
        }
    };

    const handleDuplicate = async (studentId: Id<"students">, studentName: string) => {
        if (
            !confirm(
                t(
                    `Duplicate student "${studentName}"?`,
                    `คัดลอกนักเรียน "${studentName}"?`
                )
            )
        ) {
            return;
        }

        try {
            await duplicateStudent({ id: studentId });
            setSuccess(t("Student duplicated!", "คัดลอกนักเรียนแล้ว!"));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to duplicate student");
        }
    };

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setGrade("");
        setSchoolId("");
        setGuardianName("");
        setGuardianPhone("");
        setGuardianEmail("");
        setShowForm(false);
        setEditingStudent(null);
    };

    const cancelEdit = () => {
        resetForm();
        setError("");
        setSuccess("");
    };

    const getSchoolName = (schoolId?: Id<"schools">) => {
        if (!schoolId) return t("Guardian", "ผู้ปกครอง");
        const school = schoolsMap.get(schoolId);
        return school ? school.name : t("Unknown", "ไม่ทราบ");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t("Student Management", "จัดการนักเรียน")}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("Add and manage students", "เพิ่มและจัดการนักเรียน")}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    {t("Add Student", "เพิ่มนักเรียน")}
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("Filter by:", "กรองโดย:")}
                </label>
                <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value as Id<"schools"> | "guardian" | "all")}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">{t("All Students", "นักเรียนทั้งหมด")}</option>
                    <option value="guardian">{t("Guardian Only", "ผู้ปกครองเท่านั้น")}</option>
                    {schools?.map((school) => (
                        <option key={school._id} value={school._id}>
                            {school.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Success/Error Messages */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
                    {success}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingStudent
                                    ? t("Edit Student", "แก้ไขข้อมูลนักเรียน")
                                    : t("Add New Student", "เพิ่มนักเรียนใหม่")}
                            </h3>
                            <button
                                onClick={cancelEdit}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Student Information */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {t("Student Information", "ข้อมูลนักเรียน")}
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t("First Name", "ชื่อ")} *
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Last Name", "นามสกุล")} *
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("Grade", "ระดับชั้น")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        placeholder={t("e.g. Grade 5, P3, M2", "เช่น ป.5, ม.2")}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("School", "โรงเรียน")}
                                    </label>
                                    <select
                                        value={schoolId}
                                        onChange={(e) => setSchoolId(e.target.value as Id<"schools"> | "")}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{t("No School (Guardian)", "ไม่มีโรงเรียน (ผู้ปกครอง)")}</option>
                                        {schools?.map((school) => (
                                            <option key={school._id} value={school._id}>
                                                {school.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Guardian Information */}
                            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {t("Guardian Information", "ข้อมูลผู้ปกครอง")}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                        "Required if no school is selected",
                                        "จำเป็นหากไม่ได้เลือกโรงเรียน"
                                    )}
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("Guardian Name", "ชื่อผู้ปกครอง")}
                                    </label>
                                    <input
                                        type="text"
                                        value={guardianName}
                                        onChange={(e) => setGuardianName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Guardian Phone", "เบอร์โทรผู้ปกครอง")}
                                        </label>
                                        <input
                                            type="tel"
                                            value={guardianPhone}
                                            onChange={(e) => setGuardianPhone(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Guardian Email", "อีเมลผู้ปกครอง")}
                                        </label>
                                        <input
                                            type="email"
                                            value={guardianEmail}
                                            onChange={(e) => setGuardianEmail(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    {editingStudent ? t("Update Student", "อัปเดต") : t("Add Student", "เพิ่มนักเรียน")}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                                >
                                    {t("Cancel", "ยกเลิก")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {!filteredStudents || filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                            {t("No students found", "ไม่พบข้อมูลนักเรียน")}
                        </p>
                        <p className="text-sm mt-2">
                            {t("Add your first student to get started", "เพิ่มนักเรียนคนแรกเพื่อเริ่มต้น")}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
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
                                {filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                                            {student.studentId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {student.firstName} {student.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {student.grade}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {!student.schoolId && student.guardianName && (
                                                    <button
                                                        onClick={() => handleDuplicate(student._id, `${student.firstName} ${student.lastName}`)}
                                                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                        title={t("Duplicate", "คัดลอก")}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title={t("Edit", "แก้ไข")}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student._id, `${student.firstName} ${student.lastName}`)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    title={t("Delete", "ลบ")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
