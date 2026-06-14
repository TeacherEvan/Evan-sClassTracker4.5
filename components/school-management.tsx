"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Building2, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";

interface SchoolManagementProps {
  currentUser: User;
}

export function SchoolManagement({ currentUser }: SchoolManagementProps) {
  const { t } = useLanguage();
  const schools = useQuery(api.schools.list, {});
  const users = useQuery(api.users.list, {});
  const createSchool = useMutation(api.schools.create);
  const updateSchool = useMutation(api.schools.update);
  const deleteSchool = useMutation(api.schools.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<Id<"schools"> | null>(
    null,
  );
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [moderatorId, setModeratorId] = useState<Id<"users"> | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<{
    id: Id<"schools">;
    name: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonTh, setDeleteReasonTh] = useState("");

  // Filter moderators from user list
  const moderators = users?.filter((u) => u.role === "moderator") || [];

  // Create user lookup map for better performance
  const usersMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map((u) => [u._id, u]));
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() && !nameTh.trim()) {
      setError(
        t(
          "Please fill at least one name field",
          "กรุณากรอกชื่ออย่างน้อยหนึ่งภาษา",
        ),
      );
      return;
    }

    try {
      if (editingSchool) {
        // Update existing school (name, nameTh, and moderator)
        await updateSchool({
          schoolId: editingSchool,
          name,
          nameTh,
          moderatorId: moderatorId || null,
          adminId: currentUser._id,
        });
        setSuccess(t("School updated!", "อัปเดตโรงเรียนแล้ว!"));
      } else {
        // Create new school
        await createSchool({
          name,
          nameTh,
          moderatorId: moderatorId || undefined,
          adminId: currentUser._id,
        });
        setSuccess(t("School created!", "สร้างโรงเรียนแล้ว!"));
      }

      // Reset form
      setName("");
      setNameTh("");
      setModeratorId("");
      setShowForm(false);
      setEditingSchool(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleEdit = (school: {
    _id: Id<"schools">;
    name: string;
    nameTh: string;
    moderatorId?: Id<"users">;
  }) => {
    setEditingSchool(school._id);
    setName(school.name);
    setNameTh(school.nameTh);
    setModeratorId(school.moderatorId || "");
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleDelete = (schoolId: Id<"schools">, schoolName: string) => {
    setSchoolToDelete({ id: schoolId, name: schoolName });
    setDeleteReason("");
    setDeleteReasonTh("");
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!schoolToDelete) return;

    // Require at least one reason
    if (!deleteReason.trim() && !deleteReasonTh.trim()) {
      setError(t("Please provide a reason", "กรุณาระบุเหตุผล"));
      return;
    }

    const reason = deleteReason.trim() || deleteReasonTh.trim();

    try {
      await deleteSchool({
        id: schoolToDelete.id,
        adminId: currentUser._id,
        reason: reason,
      });
      setSuccess(t("School deleted!", "ลบโรงเรียนแล้ว!"));
      setShowDeleteModal(false);
      setSchoolToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete school");
    }
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingSchool(null);
    setName("");
    setNameTh("");
    setModeratorId("");
    setError("");
    setSuccess("");
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSchoolToDelete(null);
    setDeleteReason("");
    setDeleteReasonTh("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          {t("School Management", "จัดการโรงเรียน")}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("Add School", "เพิ่มโรงเรียน")}
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingSchool
              ? t("Edit School", "แก้ไขโรงเรียน")
              : t("Create New School", "สร้างโรงเรียนใหม่")}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  {t("School Name (English)", "ชื่อโรงเรียน (อังกฤษ)")}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="nameTh"
                  className="block text-sm font-medium mb-2"
                >
                  {t("School Name (Thai)", "ชื่อโรงเรียน (ไทย)")}
                </label>
                <input
                  type="text"
                  id="nameTh"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="moderator"
                className="block text-sm font-medium mb-2"
              >
                {t("Assign Moderator (Optional)", "มอบหมายผู้ดูแล (ไม่บังคับ)")}
              </label>
              <select
                id="moderator"
                value={moderatorId}
                onChange={(e) =>
                  setModeratorId(e.target.value as Id<"users"> | "")
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
              >
                <option value="">
                  {t("-- Select Moderator --", "-- เลือกผู้ดูแล --")}
                </option>
                {moderators.map((mod) => (
                  <option key={mod._id} value={mod._id}>
                    {mod.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSchool ? t("Update", "อัปเดต") : t("Create", "สร้าง")}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schools List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("School Name", "ชื่อโรงเรียน")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("Moderator", "ผู้ดูแล")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("Actions", "การดำเนินการ")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {schools?.map((school) => {
                const moderator = usersMap.get(school.moderatorId);
                return (
                  <tr
                    key={school._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {school.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {school.nameTh}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {moderator ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {moderator.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t("No moderator", "ไม่มีผู้ดูแล")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(school)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title={t("Edit", "แก้ไข")}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(school._id, school.name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={t("Delete", "ลบ")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!schools || schools.length === 0) && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t(
                      "No schools found. Create one to get started!",
                      "ไม่พบโรงเรียน สร้างโรงเรียนเพื่อเริ่มต้น!",
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && schoolToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-30"
            aria-hidden="true"
          ></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 z-10 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              {t("Confirm Deletion", "ยืนยันการลบ")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {t(
                `Are you sure you want to delete the school "${schoolToDelete.name}"? This action cannot be undone.`,
                `คุณแน่ใจหรือว่าต้องการลบโรงเรียน "${schoolToDelete.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`,
              )}
            </p>

            <div className="grid gap-4">
              <div>
                <label
                  htmlFor="deleteReason"
                  className="block text-sm font-medium mb-2"
                >
                  {t(
                    "Reason for Deletion (Optional)",
                    "เหตุผลในการลบ (ไม่บังคับ)",
                  )}
                </label>
                <input
                  type="text"
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                  placeholder={t(
                    "Enter reason in English",
                    "กรุณาระบุเหตุผลเป็นภาษาอังกฤษ",
                  )}
                />
              </div>

              <div>
                <label
                  htmlFor="deleteReasonTh"
                  className="block text-sm font-medium mb-2"
                >
                  {t(
                    "เหตุผลในการลบ (ไม่บังคับ)",
                    "Reason for Deletion (Optional)",
                  )}
                </label>
                <input
                  type="text"
                  id="deleteReasonTh"
                  value={deleteReasonTh}
                  onChange={(e) => setDeleteReasonTh(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                  placeholder={t(
                    "กรุณาระบุเหตุผลเป็นภาษาอังกฤษ",
                    "Enter reason in English",
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("Delete School", "ลบโรงเรียน")}
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
