"use client";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { BulkEditStudentsModal } from "@/components/bulk-edit-students-modal";
import { CreateProviderModal } from "@/components/create-provider-modal";
import { StudentListSkeleton } from "@/components/ui/skeleton";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { Filter, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { StudentFormModal } from "./student-form-modal";
import { StudentList } from "./student-list";
import { useStudentManagement } from "./use-student-management";

interface StudentManagementProps {
  userId: Id<"users">;
  userRole: "admin" | "moderator" | "teacher";
  userSchoolId?: Id<"schools">;
}

export function StudentManagement({
  userId,
  userRole,
  userSchoolId,
}: StudentManagementProps) {
  const { t, language } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);

  // Construct a partial User object to satisfy the hook's requirement
  // The hook primarily uses _id, role, and schoolId
  const currentUser = {
    _id: userId,
    role: userRole,
    schoolId: userSchoolId,
    username: "current_user", // Placeholder, not used by hook logic
    requirePasswordChange: false,
    createdAt: Date.now(),
  } as User;

  const {
    // Data
    filteredStudents,
    schools,
    myProviders,
    isLoading,

    // State
    searchQuery,
    setSearchQuery,
    selectedSchoolId,
    setSelectedSchoolId,
    selectedGrade,
    setSelectedGrade,
    selectedClass,
    setSelectedClass,
    selectedStudents,

    // Modal State
    isModalOpen,
    setIsModalOpen,
    editingStudent,
    isBulkEditOpen,
    setIsBulkEditOpen,
    showCreateProvider,
    setShowCreateProvider,
    formData,
    setFormData,
    isSubmitting,

    // Actions
    handleAdd,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleSave,
    handleBulkDelete,
    toggleStudentSelection,
    toggleSelectAll,
    clearSelection,
    getSchoolName,
  } = useStudentManagement(currentUser);

  if (isLoading) {
    return <StudentListSkeleton rows={10} />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("Search students...", "ค้นหานักเรียน...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            {t("Filters", "ตัวกรอง")}
          </button>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t("Add Student", "เพิ่มนักเรียน")}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
          {/* School Filter (Admin/Teacher only) */}
          {(userRole === "admin" || userRole === "teacher") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("School", "โรงเรียน")}
              </label>
              <select
                value={selectedSchoolId || ""}
                onChange={(e) =>
                  setSelectedSchoolId(
                    (e.target.value as Id<"schools">) || "all",
                  )
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="all">{t("All Schools", "ทุกโรงเรียน")}</option>
                {schools?.map((school) => (
                  <option key={school._id} value={school._id}>
                    {language === "en" ? school.name : school.nameTh}
                  </option>
                ))}
                <option value="provider">
                  {t("Provider Students", "นักเรียนจากผู้ให้บริการ")}
                </option>
              </select>
            </div>
          )}

          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("Grade", "ระดับชั้น")}
            </label>
            <input
              type="text"
              value={selectedGrade === "all" ? "" : selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value || "all")}
              placeholder={t("e.g. P1, G7", "เช่น ป.1, ม.1")}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("Class", "ห้องเรียน")}
            </label>
            <input
              type="text"
              value={selectedClass === "all" ? "" : selectedClass}
              onChange={(e) => setSelectedClass(e.target.value || "all")}
              placeholder={t("e.g. /1, A", "เช่น /1, A")}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          {/* Clear Filters Button */}
          {(selectedSchoolId !== "all" ||
            selectedGrade !== "all" ||
            selectedClass !== "all") && (
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedSchoolId("all");
                  setSelectedGrade("all");
                  setSelectedClass("all");
                }}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t("Clear Filters", "ล้างตัวกรอง")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Student List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <StudentList
          students={filteredStudents}
          selectedStudents={selectedStudents}
          toggleStudentSelection={toggleStudentSelection}
          toggleSelectAll={toggleSelectAll}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleDuplicate={handleDuplicate}
          getSchoolName={(id) => (id ? getSchoolName(id) : "")}
        />
      </div>

      {/* Bulk Actions */}
      <BulkActionBar
        selectedIds={selectedStudents}
        onClearSelection={clearSelection}
        onDelete={handleBulkDelete}
        onEdit={() => setIsBulkEditOpen(true)}
        entityType="student"
      />

      {/* Modals */}
      {isModalOpen && (
        <StudentFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          isSubmitting={isSubmitting}
          isEditing={!!editingStudent}
          formData={formData}
          setFormData={setFormData}
          schools={schools}
          myProviders={myProviders}
          currentUser={currentUser as unknown as Doc<"users">}
          onCreateProviderClick={() => setShowCreateProvider(true)}
        />
      )}

      {showCreateProvider && (
        <CreateProviderModal
          userId={userId}
          onClose={() => setShowCreateProvider(false)}
          onCreated={(providerId) => {
            setFormData({ ...formData, providerId });
            setShowCreateProvider(false);
          }}
        />
      )}

      {isBulkEditOpen && (
        <BulkEditStudentsModal
          selectedStudentIds={Array.from(selectedStudents)}
          currentUserId={userId}
          onClose={() => setIsBulkEditOpen(false)}
          onSuccess={() => {
            setIsBulkEditOpen(false);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}
