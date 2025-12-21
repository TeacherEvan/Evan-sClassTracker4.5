import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import {
  COMMON_SHORTCUTS,
  useKeyboardShortcuts,
} from "@/lib/use-keyboard-shortcuts";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { INITIAL_FORM_DATA, type Student, type StudentFormData } from "./types";

export function useStudentManagement(currentUser: User) {
  const { t } = useLanguage();
  const schools = useQuery(api.schools.list, {});
  const myProviders = useQuery(api.providers.list, { userId: currentUser._id });
  const createStudent = useMutation(api.students.create);
  const updateStudent = useMutation(api.students.update);
  const removeStudent = useMutation(api.students.remove);
  const duplicateStudent = useMutation(api.students.duplicate);
  const bulkDeleteStudents = useMutation(api.bulkOperations.bulkDeleteStudents);

  // Filter state
  const [selectedSchoolId, setSelectedSchoolId] = useState<
    Id<"schools"> | "provider" | "all"
  >("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Id<"students"> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateProvider, setShowCreateProvider] = useState(false);

  // Form state
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA);

  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState<{
    id: Id<"students">;
    name: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [pendingDuplicateStudent, setPendingDuplicateStudent] = useState<{
    id: Id<"students">;
    name: string;
  } | null>(null);

  // Bulk deletion state
  const [selectedStudents, setSelectedStudents] = useState<Set<Id<"students">>>(
    new Set(),
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  // Query students based on filter
  const students = useQuery(
    api.students.list,
    selectedSchoolId === "all" || selectedSchoolId === "provider"
      ? {}
      : { schoolId: selectedSchoolId },
  ) as Student[] | undefined;

  // Memoize filtered students
  const filteredStudents = useMemo(() => {
    if (!students) return undefined;

    return students.filter((student) => {
      if (selectedSchoolId === "provider") {
        return !student.schoolId && student.guardianName;
      }

      if (selectedGrade !== "all" && student.grade !== selectedGrade) {
        return false;
      }

      if (selectedClass !== "all" && student.class !== selectedClass) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName =
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          (student.nickname && student.nickname.toLowerCase().includes(query));
        const matchesId = student.studentId.toLowerCase().includes(query);

        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [students, selectedSchoolId, selectedGrade, selectedClass, searchQuery]);

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
      key: "a",
      ctrl: true,
      description: "Select all students",
      descriptionTh: "เลือกนักเรียนทั้งหมด",
      callback: () =>
        filteredStudents &&
        setSelectedStudents(new Set(filteredStudents.map((s) => s._id))),
      disabled: !filteredStudents || filteredStudents.length === 0,
    },
    {
      key: "Escape",
      description: "Clear selection",
      descriptionTh: "ล้างการเลือก",
      callback: () => setSelectedStudents(new Set()),
      disabled: selectedStudents.size === 0,
    },
    {
      key: "e",
      ctrl: true,
      description: "Edit selected students",
      descriptionTh: "แก้ไขนักเรียนที่เลือก",
      callback: () => setShowBulkEditModal(true),
      disabled: selectedStudents.size === 0,
    },
  ]);

  // Derived data
  const uniqueGrades = useMemo(() => {
    if (!students) return [];
    const grades = new Set(students.map((s) => s.grade).filter(Boolean));
    return Array.from(grades).sort();
  }, [students]);

  const uniqueClasses = useMemo(() => {
    if (!students) return [];
    const classes = new Set(students.map((s) => s.class).filter(Boolean));
    return Array.from(classes).sort();
  }, [students]);

  const schoolsMap = useMemo(() => {
    if (!schools) return new Map();
    return new Map(schools.map((s) => [s._id, s]));
  }, [schools]);

  // Handlers
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowForm(false);
    setEditingStudent(null);
  };

  const handleEdit = (student: Student & { nickname?: string }) => {
    setEditingStudent(student._id);
    setFormData({
      nickname: student.nickname || student.firstName,
      grade: student.grade,
      studentClass: student.class || "",
      schoolId: student.schoolId || "",
      providerId: student.providerId || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      guardianEmail: student.guardianEmail || "",
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "",
      provinceCode: student.provinceCode || "",
      districtName: student.districtName || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      parentEmail: student.parentEmail || "",
      secondaryParentName: student.secondaryParentName || "",
      secondaryParentPhone: student.secondaryParentPhone || "",
      allergies: student.allergies || "",
      specialNeeds: student.specialNeeds || "",
      medicalNotes: student.medicalNotes || "",
      notes: student.notes || "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const {
      nickname,
      grade,
      studentClass,
      schoolId,
      providerId,
      guardianName,
      guardianPhone,
      guardianEmail,
      dateOfBirth,
      provinceCode,
      districtName,
      parentName,
      parentPhone,
      parentEmail,
      secondaryParentName,
      secondaryParentPhone,
      allergies,
      specialNeeds,
      medicalNotes,
      notes,
    } = formData;

    if (!nickname.trim() || !grade.trim()) {
      setError(t("Please fill in required fields", "กรุณากรอกข้อมูลที่จำเป็น"));
      setIsSubmitting(false);
      return;
    }

    const hasSchool = !!schoolId;
    const hasProvider = !!providerId;
    const hasGuardian = !!guardianName.trim();

    if (hasSchool && hasProvider) {
      setError(
        t(
          "Student cannot be linked to both school and provider - please choose one",
          "นักเรียนไม่สามารถเชื่อมโยงทั้งโรงเรียนและผู้ให้บริการ - กรุณาเลือกอย่างใดอย่างหนึ่ง",
        ),
      );
      setIsSubmitting(false);
      return;
    }

    if (!hasSchool && !hasProvider && !hasGuardian) {
      setError(
        t(
          "Student must be linked to either a school, provider, or guardian",
          "นักเรียนต้องเชื่อมโยงกับโรงเรียน ผู้ให้บริการ หรือผู้ปกครอง",
        ),
      );
      setIsSubmitting(false);
      return;
    }

    if (schoolId && !studentClass.trim()) {
      setError(
        t(
          "Class is required for students linked to a school",
          "ต้องระบุคลาสสำหรับนักเรียนที่เชื่อมโยงกับโรงเรียน",
        ),
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const commonFields = {
        firstName: nickname,
        lastName: "",
        grade,
        class:
          studentClass && studentClass.trim() ? studentClass.trim() : undefined,
        schoolId: schoolId || undefined,
        providerId: providerId || undefined,
        guardianName: guardianName?.trim() ?? undefined,
        guardianPhone: guardianPhone?.trim() ?? undefined,
        guardianEmail: guardianEmail?.trim() ?? undefined,
        nickname: nickname || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).getTime() : undefined,
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
      };

      if (editingStudent) {
        await updateStudent({
          id: editingStudent,
          updatedBy: currentUser._id,
          ...commonFields,
        });
        setSuccess(
          t("Student updated successfully!", "อัปเดตข้อมูลนักเรียนสำเร็จ!"),
        );
        setTimeout(resetForm, 1500);
      } else {
        await createStudent({
          createdBy: currentUser._id,
          ...commonFields,
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

  const handleDelete = (studentId: Id<"students">, studentName: string) => {
    setPendingDeleteStudent({ id: studentId, name: studentName });
    setDeleteReason("");
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteStudent || !deleteReason.trim()) return;

    try {
      await removeStudent({
        id: pendingDeleteStudent.id,
        deletedBy: currentUser._id,
        reason: deleteReason.trim(),
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
      setError(
        err instanceof Error ? err.message : "Failed to duplicate student",
      );
    }
  };

  const initiateBulkDelete = () => {
    if (selectedStudents.size === 0) return;
    setDeleteReason("");
    setForceDelete(false);
    setShowBulkDeleteConfirm(true);
  };

  const executeBulkDelete = async () => {
    if (!deleteReason.trim()) return;

    try {
      const result = await bulkDeleteStudents({
        studentIds: Array.from(selectedStudents),
        userId: currentUser._id,
        reason: deleteReason.trim(),
        force: forceDelete,
      });

      if (result.successful > 0) {
        setSuccess(
          t(
            `Successfully deleted ${result.successful} student(s)`,
            `ลบนักเรียนสำเร็จ ${result.successful} คน`,
          ),
        );
      }

      if (result.failed > 0) {
        const errorDetails = result.errors
          .slice(0, 5)
          .map((err) => `• ${err.studentName || "Unknown"}: ${err.error}`)
          .join("\n");
        const moreErrors =
          result.errors.length > 5
            ? `\n...and ${result.errors.length - 5} more`
            : "";
        setError(
          t(
            `Failed to delete ${result.failed} student(s):\n${errorDetails}${moreErrors}`,
            `ลบไม่สำเร็จ ${result.failed} คน:\n${errorDetails}${moreErrors}`,
          ),
        );
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
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const getSchoolName = (schoolId: Id<"schools">) => {
    return schoolsMap.get(schoolId)?.name || "";
  };

  return {
    // Data
    schools,
    myProviders,
    filteredStudents,
    isLoading: students === undefined,
    uniqueGrades,
    uniqueClasses,
    schoolsMap,

    // State
    searchQuery,
    setSearchQuery,
    selectedSchoolId,
    selectedGrade,
    selectedClass,
    isModalOpen: showForm,
    editingStudent,
    error,
    success,
    isSubmitting,
    showCreateProvider,
    formData,
    showDeleteConfirm,
    pendingDeleteStudent,
    deleteReason,
    showDuplicateConfirm,
    pendingDuplicateStudent,
    selectedStudents,
    showBulkDeleteConfirm,
    isBulkEditOpen: showBulkEditModal,
    forceDelete,

    // Setters
    setSelectedSchoolId,
    setSelectedGrade,
    setSelectedClass,
    setIsModalOpen: setShowForm,
    setFormData,
    setShowCreateProvider,
    setDeleteReason,
    setShowDeleteConfirm,
    setPendingDeleteStudent,
    setShowDuplicateConfirm,
    setPendingDuplicateStudent,
    setShowBulkDeleteConfirm,
    setIsBulkEditOpen: setShowBulkEditModal,
    setForceDelete,
    setError,
    setSuccess,

    // Handlers
    resetForm,
    handleEdit,
    handleSubmit,
    handleSave: handleSubmit,
    handleDelete,
    executeDelete,
    handleDuplicate,
    confirmDuplicate,
    initiateBulkDelete,
    handleBulkDelete: initiateBulkDelete,
    executeBulkDelete,
    toggleStudentSelection,
    toggleSelectAll,
    handleAdd,
    clearSelection,
    getSchoolName,
  };
}
