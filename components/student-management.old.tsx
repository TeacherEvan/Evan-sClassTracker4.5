"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { COMMON_SHORTCUTS, useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";
import { useMutation, useQuery } from "convex/react";
import { Copy, GraduationCap, Mail, Pencil, Phone, Plus, Trash2, User as UserIcon, X } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { CollapsibleSection } from "./collapsible-section";
import { CreateProviderModal } from "./create-provider-modal";
import { LazyBulkEditStudentsModal, ModalLoadingFallback } from "./lazy-components";
import { PaginatedList } from "./paginated-list";
import { QuickActionButton } from "./quick-action-button";
import { ThailandLocationDropdown } from "./thailand-location-dropdown";
import { StudentListSkeleton } from "./ui/skeleton";

type Student = {
    _id: Id<"students">;
    firstName: string;
    lastName: string;
    studentId: string;
    schoolId?: Id<"schools">;
    providerId?: Id<"providers">;
    guardianId?: Id<"users">;
    guardianTitle?: string;
    grade: string;
    class?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    acknowledged: boolean;
    createdBy: Id<"users">;
    createdAt: number;
};

interface StudentManagementProps {
    currentUser: User;
}

export function StudentManagement({ currentUser }: StudentManagementProps) {
    const { t, language } = useLanguage();
    const schools = useQuery(api.schools.list, {});
    const myProviders = useQuery(api.providers.list, { userId: currentUser._id });
    const createStudent = useMutation(api.students.create);
    const updateStudent = useMutation(api.students.update);
    const removeStudent = useMutation(api.students.remove);
    const duplicateStudent = useMutation(api.students.duplicate);
    const bulkDeleteStudents = useMutation(api.bulkOperations.bulkDeleteStudents);

    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "provider" | "all">("all");
    const [selectedGrade, setSelectedGrade] = useState<string>("all");
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [showForm, setShowForm] = useState(false);


    const [editingStudent, setEditingStudent] = useState<Id<"students"> | null>(null);

    // Form fields
    const [nickname, setNickname] = useState("");
    const [grade, setGrade] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
    const [providerId, setProviderId] = useState<Id<"providers"> | "">("");
    const [guardianName, setGuardianName] = useState("");
    const [guardianPhone, setGuardianPhone] = useState("");
    const [guardianEmail, setGuardianEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Provider modal state
    const [showCreateProvider, setShowCreateProvider] = useState(false);

    // Optional fields state
    const [dateOfBirth, setDateOfBirth] = useState("");
    // NEW: Structured location fields (Dec 2025)
    const [provinceCode, setProvinceCode] = useState("");
    const [districtName, setDistrictName] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [secondaryParentName, setSecondaryParentName] = useState("");
    const [secondaryParentPhone, setSecondaryParentPhone] = useState("");
    const [allergies, setAllergies] = useState("");
    const [specialNeeds, setSpecialNeeds] = useState("");
    const [medicalNotes, setMedicalNotes] = useState("");
    const [notes, setNotes] = useState("");

    // Confirmation dialog states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteStudent, setPendingDeleteStudent] = useState<{ id: Id<"students">; name: string } | null>(null);
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
    const [pendingDuplicateStudent, setPendingDuplicateStudent] = useState<{ id: Id<"students">; name: string } | null>(null);

    // Bulk deletion state
    const [selectedStudents, setSelectedStudents] = useState<Set<Id<"students">>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);

    // Delete reason state
    const [deleteReason, setDeleteReason] = useState("");
    const [forceDelete, setForceDelete] = useState(false);

    // Query students based on filter
    const students = useQuery(
        api.students.list,
        selectedSchoolId === "all" || selectedSchoolId === "provider"
            ? {}
            : { schoolId: selectedSchoolId }
    ) as Student[] | undefined;

    // ✅ PERFORMANCE: Memoize filtered students (avoid re-filtering on every render)
    const filteredStudents = useMemo(() => {
        if (!students) return undefined;

        return students.filter((student) => {
            if (selectedSchoolId === "provider") {
                return !student.schoolId && student.guardianName;
            }

            // Apply grade filter
            if (selectedGrade !== "all" && student.grade !== selectedGrade) {
                return false;
            }

            // Apply class filter
            if (selectedClass !== "all" && student.class !== selectedClass) {
                return false;
            }

            return true;
        });
    }, [students, selectedSchoolId, selectedGrade, selectedClass]);

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            ...COMMON_SHORTCUTS.NEW,
            callback: () => !showForm && setShowForm(true),
            disabled: showForm,
        },
        {
            ...COMMON_SHORTCUTS.CLOSE,
            callback: () => showForm && setShowForm(false),
            disabled: !showForm,
        },
        {
            key: 'a',
            ctrl: true,
            description: "Select all students",
            descriptionTh: "เลือกนักเรียนทั้งหมด",
            callback: () => filteredStudents && setSelectedStudents(new Set(filteredStudents.map(s => s._id))),
            disabled: !filteredStudents || filteredStudents.length === 0,
        },
        {
            key: 'Escape',
            description: "Clear selection",
            descriptionTh: "ล้างการเลือก",
            callback: () => setSelectedStudents(new Set()),
            disabled: selectedStudents.size === 0,
        },
        {
            key: 'e',
            ctrl: true,
            description: "Edit selected students",
            descriptionTh: "แก้ไขนักเรียนที่เลือก",
            callback: () => setShowBulkEditModal(true),
            disabled: selectedStudents.size === 0,
        },
    ]);

    // Get unique grades and classes from filtered students
    const uniqueGrades = useMemo(() => {
        if (!students) return [];
        const grades = new Set(students.map(s => s.grade).filter(Boolean));
        return Array.from(grades).sort();
    }, [students]);

    const uniqueClasses = useMemo(() => {
        if (!students) return [];
        const classes = new Set(students.map(s => s.class).filter(Boolean));
        return Array.from(classes).sort();
    }, [students]);

    // Create school lookup map for better performance
    const schoolsMap = useMemo(() => {
        if (!schools) return new Map();
        return new Map(schools.map(s => [s._id, s]));
    }, [schools]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);

        if (!nickname.trim() || !grade.trim()) {
            setError(t("Please fill in required fields", "กรุณากรอกข้อมูลที่จำเป็น"));
            setIsSubmitting(false);
            return;
        }

        // XOR Validation: Student must be linked to EITHER school OR provider OR guardian (not multiple, not none)
        const hasSchool = !!schoolId;
        const hasProvider = !!providerId;
        const hasGuardian = !!guardianName.trim();

        if (hasSchool && hasProvider) {
            setError(
                t(
                    "Student cannot be linked to both school and provider - please choose one",
                    "นักเรียนไม่สามารถเชื่อมโยงทั้งโรงเรียนและผู้ให้บริการ - กรุณาเลือกอย่างใดอย่างหนึ่ง"
                )
            );
            setIsSubmitting(false);
            return;
        }

        if (!hasSchool && !hasProvider && !hasGuardian) {
            setError(
                t(
                    "Student must be linked to either a school, provider, or guardian",
                    "นักเรียนต้องเชื่อมโยงกับโรงเรียน ผู้ให้บริการ หรือผู้ปกครอง"
                )
            );
            setIsSubmitting(false);
            return;
        }

        // Validate: class is required for school-linked students
        if (schoolId && !studentClass.trim()) {
            setError(
                t(
                    "Class is required for students linked to a school",
                    "ต้องระบุคลาสสำหรับนักเรียนที่เชื่อมโยงกับโรงเรียน"
                )
            );
            setIsSubmitting(false);
            return;
        }

        try {
            if (editingStudent) {
                // Update existing student
                console.log('[DEBUG] Updating student:', {
                    id: editingStudent,
                    nickname,
                    grade,
                    studentClass,
                    schoolId,
                    providerId
                });

                const result = await updateStudent({
                    id: editingStudent,
                    firstName: nickname, // Use nickname as firstName
                    lastName: "", // Empty lastName
                    grade,
                    class: studentClass && studentClass.trim() ? studentClass.trim() : undefined,
                    schoolId: schoolId || undefined,
                    providerId: providerId || undefined,
                    guardianName: guardianName?.trim() ?? undefined,
                    guardianPhone: guardianPhone?.trim() ?? undefined,
                    guardianEmail: guardianEmail?.trim() ?? undefined,
                    updatedBy: currentUser._id,
                    // Optional fields
                    nickname: nickname ?? undefined,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth).getTime() : undefined,
                    // NEW STRUCTURED LOCATION FIELDS (Dec 2025)
                    provinceCode: provinceCode?.trim() ?? undefined,
                    districtName: districtName?.trim() ?? undefined,
                    parentName: parentName?.trim() ?? undefined,
                    parentPhone: parentPhone?.trim() ?? undefined,
                    parentEmail: parentEmail?.trim() ?? undefined,
                    secondaryParentName: secondaryParentName?.trim() ?? undefined,
                    secondaryParentPhone: secondaryParentPhone?.trim() ?? undefined,
                    allergies: allergies?.trim() ?? undefined,
                    specialNeeds: specialNeeds?.trim() ?? undefined,
                    medicalNotes: medicalNotes?.trim() ?? undefined,
                    notes: notes?.trim() ?? undefined,
                });

                console.log('[DEBUG] Update result:', result);
                setSuccess(t("Student updated successfully!", "อัปเดตข้อมูลนักเรียนสำเร็จ!"));

                // Small delay before reset to ensure user sees success message
                setTimeout(() => {
                    resetForm();
                }, 1500);
            } else {
                // Create new student
                await createStudent({
                    firstName: nickname, // Use nickname as firstName
                    lastName: "", // Empty lastName
                    ...(schoolId && { schoolId }),
                    ...(providerId && { providerId }),
                    grade,
                    class: studentClass && studentClass.trim() ? studentClass.trim() : undefined,
                    guardianName: guardianName || undefined,
                    guardianPhone: guardianPhone || undefined,
                    guardianEmail: guardianEmail || undefined,
                    createdBy: currentUser._id,
                    // Optional fields
                    nickname: nickname || undefined,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth).getTime() : undefined,
                    // NEW STRUCTURED LOCATION FIELDS (Dec 2025)
                    provinceCode: provinceCode || undefined,
                    districtName: districtName || undefined,
                    parentName: parentName || undefined,
                    parentPhone: parentPhone || undefined,
                    parentEmail: parentEmail || undefined,
                    secondaryParentName: secondaryParentName || undefined,
                    secondaryParentPhone: secondaryParentPhone || undefined,
                    allergies: allergies || undefined,
                    specialNeeds: specialNeeds || undefined,
                    medicalNotes: medicalNotes || undefined,
                    notes: notes || undefined,
                });
                setSuccess(t("Student created!", "สร้างข้อมูลนักเรียนแล้ว!"));
                resetForm();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (student: Student & {
        nickname?: string;
        dateOfBirth?: number;
        provinceCode?: string; // NEW (Dec 2025)
        districtName?: string; // NEW (Dec 2025)
        parentName?: string;
        parentPhone?: string;
        parentEmail?: string;
        secondaryParentName?: string;
        secondaryParentPhone?: string;
        allergies?: string;
        specialNeeds?: string;
        medicalNotes?: string;
        notes?: string;
    }) => {
        setEditingStudent(student._id);
        setNickname(student.nickname || student.firstName); // Load nickname, fallback to firstName if no nickname
        setGrade(student.grade);
        setStudentClass(student.class || "");
        setSchoolId(student.schoolId || "");
        setProviderId(student.providerId || "");
        setGuardianName(student.guardianName || "");
        setGuardianPhone(student.guardianPhone || "");
        setGuardianEmail(student.guardianEmail || "");

        // Load optional fields
        setDateOfBirth(student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "");
        // NEW STRUCTURED LOCATION FIELDS (Dec 2025)
        setProvinceCode(student.provinceCode || "");
        setDistrictName(student.districtName || "");
        setParentName(student.parentName || "");
        setParentPhone(student.parentPhone || "");
        setParentEmail(student.parentEmail || "");
        setSecondaryParentName(student.secondaryParentName || "");
        setSecondaryParentPhone(student.secondaryParentPhone || "");
        setAllergies(student.allergies || "");
        setSpecialNeeds(student.specialNeeds || "");
        setMedicalNotes(student.medicalNotes || "");
        setNotes(student.notes || "");

        setShowForm(true);
        setError("");
        setSuccess("");
    };

    const handleDelete = (studentId: Id<"students">, studentName: string) => {
        setPendingDeleteStudent({ id: studentId, name: studentName });
        setDeleteReason("");
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!pendingDeleteStudent) return;

        if (!deleteReason || deleteReason.trim() === "") {
            return; // Button should be disabled
        }

        try {
            await removeStudent({
                id: pendingDeleteStudent.id,
                deletedBy: currentUser._id,
                reason: deleteReason.trim()
            });
            setSuccess(t("Student deleted!", "ลบนักเรียนแล้ว!"));
            setShowDeleteConfirm(false);
            setPendingDeleteStudent(null);
            setDeleteReason("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete student");
        }
    };

    const handleDuplicate = (studentId: Id<"students">, studentName: string) => {
        setPendingDuplicateStudent({ id: studentId, name: studentName });
        setShowDuplicateConfirm(true);
    };

    const confirmDuplicate = async () => {
        if (!pendingDuplicateStudent) return;

        try {
            await duplicateStudent({ id: pendingDuplicateStudent.id });
            setSuccess(t("Student duplicated!", "คัดลอกนักเรียนแล้ว!"));
            setShowDuplicateConfirm(false);
            setPendingDuplicateStudent(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to duplicate student");
        }
    };

    const initiateBulkDelete = () => {
        if (selectedStudents.size === 0) return;
        setDeleteReason("");
        setForceDelete(false);
        setShowBulkDeleteConfirm(true);
    };

    const executeBulkDelete = async () => {
        if (!deleteReason || deleteReason.trim() === "") return;

        try {
            const result = await bulkDeleteStudents({
                studentIds: Array.from(selectedStudents),
                userId: currentUser._id,
                reason: deleteReason.trim(),
                force: forceDelete,
            });

            if (result.successful > 0) {
                setSuccess(t(
                    `Successfully deleted ${result.successful} student(s)`,
                    `ลบนักเรียนสำเร็จ ${result.successful} คน`
                ));
            }

            if (result.failed > 0) {
                // Build detailed error message
                const errorDetails = result.errors
                    .slice(0, 5) // Show first 5 errors
                    .map((err) => `• ${err.studentName || 'Unknown'}: ${err.error}`)
                    .join('\n');

                const moreErrors = result.errors.length > 5
                    ? `\n...and ${result.errors.length - 5} more`
                    : '';

                setError(t(
                    `Failed to delete ${result.failed} student(s):\n${errorDetails}${moreErrors}`,
                    `ลบไม่สำเร็จ ${result.failed} คน:\n${errorDetails}${moreErrors}`
                ));
            }

            setSelectedStudents(new Set());
            setShowBulkDeleteConfirm(false);
            setDeleteReason("");
            setForceDelete(false);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Bulk delete failed");
        }
    };





    const toggleStudentSelection = (studentId: Id<"students">) => {
        const newSelection = new Set(selectedStudents);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudents(newSelection);
    };

    const toggleSelectAll = () => {
        if (!filteredStudents) return;

        if (selectedStudents.size === filteredStudents.length) {
            // Deselect all
            setSelectedStudents(new Set());
        } else {
            // Select all
            setSelectedStudents(new Set(filteredStudents.map(s => s._id)));
        }
    };

    const resetForm = () => {
        setNickname("");
        setGrade("");
        setStudentClass("");
        setSchoolId("");
        setProviderId("");
        setGuardianName("");
        setGuardianPhone("");
        setGuardianEmail("");
        setShowForm(false);
        setEditingStudent(null);

        // Reset optional fields
        setDateOfBirth("");
        // NEW STRUCTURED LOCATION FIELDS (Dec 2025)
        setProvinceCode("");
        setDistrictName("");
        setParentName("");
        setParentPhone("");
        setParentEmail("");
        setSecondaryParentName("");
        setSecondaryParentPhone("");
        setAllergies("");
        setSpecialNeeds("");
        setMedicalNotes("");
        setNotes("");
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
                    <div className="flex items-center gap-2">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t("Student Management", "จัดการนักเรียน")}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Add and manage students", "เพิ่มและจัดการนักเรียน")}
                            </p>
                        </div>
                        {selectedStudents.size > 0 && (
                            <span className="px-3 py-1 text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                {selectedStudents.size} {t("selected", "เลือกแล้ว")}
                            </span>
                        )}
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

            {/* Filter and Bulk Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("Filter by:", "กรองโดย:")}
                    </label>
                    <select
                        value={selectedSchoolId}
                        onChange={(e) => {
                            setSelectedSchoolId(e.target.value as Id<"schools"> | "provider" | "all");
                            setSelectedGrade("all");
                            setSelectedClass("all");
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">{t("All Students", "นักเรียนทั้งหมด")}</option>
                        <option value="provider">{t("Provider Only", "ผู้ให้บริการเท่านั้น")}</option>
                        {schools?.map((school) => (
                            <option key={school._id} value={school._id}>
                                {school.name}
                            </option>
                        ))}
                    </select>

                    {/* Grade Filter */}
                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">{t("All Grades", "ทุกชั้นปี")}</option>
                        {uniqueGrades.map((grade) => (
                            <option key={grade} value={grade}>
                                {grade}
                            </option>
                        ))}
                    </select>

                    {/* Class Filter */}
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">{t("All Classes", "ทุกห้อง")}</option>
                        {uniqueClasses.map((cls) => (
                            <option key={cls} value={cls}>
                                {cls}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Bulk Delete Controls */}
                {filteredStudents && filteredStudents.length > 0 && (
                    <div className="flex items-center gap-2">
                        {selectedStudents.size > 0 && (
                            <>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(`${selectedStudents.size} selected`, `เลือก ${selectedStudents.size} คน`)}
                                </span>
                                <button
                                    onClick={() => setShowBulkEditModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                    {t("Edit Selected", "แก้ไขที่เลือก")}
                                </button>
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t("Delete Selected", "ลบที่เลือก")}
                                </button>
                            </>
                        )}
                        <button
                            onClick={toggleSelectAll}
                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            {selectedStudents.size === filteredStudents.length
                                ? t("Deselect All", "ยกเลิกทั้งหมด")
                                : t("Select All", "เลือกทั้งหมด")}
                        </button>
                    </div>
                )}
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
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

                        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                            {/* Student Information */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {t("Student Information", "ข้อมูลนักเรียน")}
                                </h4>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("Nickname", "ชื่อเล่น")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Grade", "ระดับชั้น")} *
                                        </label>
                                        <select
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">{t("Grade", "ระดับชั้น")}</option>
                                            <option value="K1">K1</option>
                                            <option value="K2">K2</option>
                                            <option value="K3">K3</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Class", "คลาส")}{schoolId ? " *" : ""}
                                        </label>
                                        <select
                                            value={studentClass}
                                            onChange={(e) => setStudentClass(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required={!!schoolId}
                                        >
                                            <option value="">{t("Select Class", "เลือกคลาส")}</option>
                                            <option value="/1">/1</option>
                                            <option value="/2">/2</option>
                                            <option value="/3">/3</option>
                                            <option value="/4">/4</option>
                                            <option value="/5">/5</option>
                                            <option value="/6">/6</option>
                                            <option value="/7">/7</option>
                                            <option value="/8">/8</option>
                                            <option value="/9">/9</option>
                                            <option value="/10">/10</option>
                                        </select>
                                    </div>
                                </div>

                                {/* School OR Provider Selection (not for moderators) */}
                                {currentUser.role !== "moderator" && (
                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t("School OR Provider (Choose One)", "โรงเรียนหรือผู้ให้บริการ (เลือกอย่างใดอย่างหนึ่ง)")}
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* School Dropdown */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("School", "โรงเรียน")}
                                                </label>
                                                <select
                                                    value={schoolId}
                                                    onChange={(e) => {
                                                        setSchoolId(e.target.value as Id<"schools"> | "");
                                                        if (e.target.value) setProviderId(""); // Clear provider if school selected
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">{t("No School", "ไม่มีโรงเรียน")}</option>
                                                    {schools?.map((school) => (
                                                        <option key={school._id} value={school._id}>
                                                            {school.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Provider Dropdown */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Provider", "ผู้ให้บริการ")}
                                                </label>
                                                <select
                                                    value={providerId}
                                                    onChange={(e) => {
                                                        setProviderId(e.target.value as Id<"providers"> | "");
                                                        if (e.target.value) setSchoolId(""); // Clear school if provider selected
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">{t("No Provider", "ไม่มีผู้ให้บริการ")}</option>
                                                    {myProviders?.map((provider) => (
                                                        <option key={provider._id} value={provider._id}>
                                                            {language === "th" ? provider.nameTh : provider.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreateProvider(true)}
                                                    className="mt-2 w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t("Create New Provider", "สร้างผู้ให้บริการใหม่")}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t(
                                                "Select either a school OR a provider (not both). Leave both empty to link to guardian only.",
                                                "เลือกโรงเรียนหรือผู้ให้บริการ (ไม่ใช่ทั้งสองอย่าง) เว้นว่างทั้งสองเพื่อเชื่อมโยงกับผู้ปกครองเท่านั้น"
                                            )}
                                        </p>
                                    </div>
                                )}

                                {/* Moderators see school dropdown only (no provider option) */}
                                {currentUser.role === "moderator" && (
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
                                )}
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

                            {/* Optional Fields Section - Pattern #20 Collapsible */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <CollapsibleSection
                                    titleEn="Additional Information (Optional)"
                                    titleTh="ข้อมูลเพิ่มเติม (ไม่บังคับ)"
                                    defaultOpen={false}
                                >
                                    <div className="space-y-4">
                                        {/* Nickname & Date of Birth */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Nickname", "ชื่อเล่น")}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={nickname}
                                                    onChange={(e) => setNickname(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    placeholder={t("e.g., Bee", "เช่น ผึ้ง")}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Date of Birth", "วันเกิด")}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={dateOfBirth}
                                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Thailand Location (Province/District) - NEW Dec 2025 */}
                                        <div className="pt-2">
                                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                                {t("Location (Thailand)", "ที่อยู่ (ประเทศไทย)")}
                                            </h5>
                                            <ThailandLocationDropdown
                                                provinceCode={provinceCode}
                                                districtName={districtName}
                                                onProvinceChange={(code) => setProvinceCode(code)}
                                                onDistrictChange={(name) => setDistrictName(name)}
                                                showLabels={true}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Primary Parent Contact */}
                                        <div className="space-y-4 pt-2">
                                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {t("Primary Parent Contact", "ผู้ปกครองหลัก")}
                                            </h5>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Parent Name", "ชื่อผู้ปกครอง")}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={parentName}
                                                    onChange={(e) => setParentName(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t("Parent Phone", "เบอร์โทรผู้ปกครอง")}
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={parentPhone}
                                                        onChange={(e) => setParentPhone(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t("Parent Email", "อีเมลผู้ปกครอง")}
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={parentEmail}
                                                        onChange={(e) => setParentEmail(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Secondary Parent Contact */}
                                        <div className="space-y-4 pt-2">
                                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {t("Secondary Parent Contact", "ผู้ปกครองรอง")}
                                            </h5>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t("Secondary Parent Name", "ชื่อผู้ปกครองรอง")}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={secondaryParentName}
                                                        onChange={(e) => setSecondaryParentName(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {t("Secondary Parent Phone", "เบอร์ผู้ปกครองรอง")}
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={secondaryParentPhone}
                                                        onChange={(e) => setSecondaryParentPhone(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Health & Special Information */}
                                        <div className="space-y-4 pt-2">
                                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {t("Health & Special Information", "ข้อมูลสุขภาพและพิเศษ")}
                                            </h5>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Allergies", "อาการแพ้")}
                                                </label>
                                                <textarea
                                                    value={allergies}
                                                    onChange={(e) => setAllergies(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    placeholder={t("e.g., Peanuts, shellfish", "เช่น ถั่ว, อาหารทะเล")}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Special Needs", "ความต้องการพิเศษ")}
                                                </label>
                                                <textarea
                                                    value={specialNeeds}
                                                    onChange={(e) => setSpecialNeeds(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    placeholder={t("e.g., ADHD, dyslexia", "เช่น ADHD, ดิสเลกเซีย")}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t("Medical Notes", "หมายเหตุทางการแพทย์")}
                                                </label>
                                                <textarea
                                                    value={medicalNotes}
                                                    onChange={(e) => setMedicalNotes(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    placeholder={t("Any medical conditions or medications", "โรคประจำตัวหรือยาที่ต้องรับประทาน")}
                                                />
                                            </div>
                                        </div>

                                        {/* General Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t("Additional Notes", "หมายเหตุเพิ่มเติม")}
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                placeholder={t("Any other important information", "ข้อมูลสำคัญอื่นๆ")}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t("Saving...", "กำลังบันทึก...")}
                                        </>
                                    ) : (
                                        editingStudent ? t("Update Student", "อัปเดต") : t("Add Student", "เพิ่มนักเรียน")
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                {!filteredStudents ? (
                    // Show skeleton while loading
                    <StudentListSkeleton rows={10} />
                ) : filteredStudents.length === 0 ? (
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
                                    <th className="px-3 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
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
                                {/* Pagination Pattern #19 - Replaces vertical scrolling with button navigation */}
                                <tr>
                                    <td colSpan={8} className="p-0">
                                        <PaginatedList
                                            items={filteredStudents}
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
                )}
            </div>

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 md:p-6">
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                            {t("⚠️ Confirm Bulk Deletion", "⚠️ ยืนยันการลบจำนวนมาก")}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {t(
                                `You are about to permanently delete ${selectedStudents.size} student(s). This action cannot be undone!`,
                                `คุณกำลังจะลบนักเรียน ${selectedStudents.size} คนอย่างถาวร การดำเนินการนี้ไม่สามารถยกเลิกได้!`
                            )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {t(
                                "Note: Students with associated classes cannot be deleted.",
                                "หมายเหตุ: นักเรียนที่มีคลาสที่เกี่ยวข้องไม่สามารถลบได้"
                            )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            {t(
                                "Are you absolutely sure you want to continue?",
                                "คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?"
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={initiateBulkDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {t("Delete All", "ลบทั้งหมด")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && pendingDeleteStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
                            {t("Confirm Delete", "ยืนยันการลบ")}
                        </h3>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">
                            {t(
                                `Delete student "${pendingDeleteStudent.name}"? This cannot be undone.`,
                                `ลบนักเรียน "${pendingDeleteStudent.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`
                            )}
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                {t("Reason for deletion (Required)", "เหตุผลในการลบ (จำเป็น)")}
                            </label>
                            <input
                                type="text"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                placeholder={t("e.g., Moved to another school", "เช่น ย้ายโรงเรียน")}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setPendingDeleteStudent(null);
                                    setDeleteReason("");
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={!deleteReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t("Delete", "ลบ")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Dialog */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
                            {t("Confirm Bulk Delete", "ยืนยันการลบหมู่")}
                        </h3>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">
                            {t(
                                `Delete ${selectedStudents.size} selected student(s)? This cannot be undone.`,
                                `ลบนักเรียนที่เลือก ${selectedStudents.size} คน? การกระทำนี้ไม่สามารถย้อนกลับได้`
                            )}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                {t("Reason for deletion (Required)", "เหตุผลในการลบ (จำเป็น)")}
                            </label>
                            <input
                                type="text"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                placeholder={t("e.g., Graduated", "เช่น จบการศึกษา")}
                                autoFocus
                            />
                        </div>

                        {currentUser.role === "admin" && (
                            <div className="mb-6 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="forceDelete"
                                    checked={forceDelete}
                                    onChange={(e) => setForceDelete(e.target.checked)}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <label htmlFor="forceDelete" className="text-sm text-red-600 dark:text-red-400 font-medium">
                                    {t("Force delete (Ignore active classes)", "บังคับลบ (ไม่สนใจคลาสที่ใช้งานอยู่)")}
                                </label>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowBulkDeleteConfirm(false);
                                    setDeleteReason("");
                                    setForceDelete(false);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={executeBulkDelete}
                                disabled={!deleteReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t("Delete All", "ลบทั้งหมด")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Confirmation Dialog */}
            {showDuplicateConfirm && pendingDuplicateStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">
                            {t("Confirm Duplicate", "ยืนยันการคัดลอก")}
                        </h3>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            {t(
                                `Duplicate student "${pendingDuplicateStudent.name}"?`,
                                `คัดลอกนักเรียน "${pendingDuplicateStudent.name}"?`
                            )}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDuplicateConfirm(false);
                                    setPendingDuplicateStudent(null);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={confirmDuplicate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t("Duplicate", "คัดลอก")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Provider Modal */}
            {showCreateProvider && (
                <CreateProviderModal
                    userId={currentUser._id}
                    onClose={() => setShowCreateProvider(false)}
                    onCreated={(newProviderId) => {
                        setProviderId(newProviderId); // Auto-select new provider
                        setSchoolId(""); // Clear school
                        setShowCreateProvider(false);
                    }}
                />
            )}

            {/* Bulk Edit Students Modal */}
            {showBulkEditModal && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <LazyBulkEditStudentsModal
                        selectedStudentIds={Array.from(selectedStudents)}
                        currentUserId={currentUser._id}
                        onClose={() => setShowBulkEditModal(false)}
                        onSuccess={() => {
                            setSelectedStudents(new Set());
                            setShowBulkEditModal(false);
                            setSuccess(t("Students updated successfully!", "อัปเดตนักเรียนสำเร็จ!"));
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
}
