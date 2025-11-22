"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

interface UserManagementProps {
  currentUserId?: Id<"users">;
}

export function UserManagement({ currentUserId }: UserManagementProps) {
  const { t } = useLanguage();
  const users = useQuery(api.users.list, {});
  const currentUser = users?.find(u => u._id === currentUserId);
  const schools = useQuery(api.schools.list, {});
  const createUser = useMutation(api.users.create);
  const resetPassword = useMutation(api.users.resetPassword);
  const deleteUser = useMutation(api.users.deleteUser);
  const bulkDeleteUsers = useMutation(api.users.bulkDeleteUsers);

  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"teacher" | "moderator" | "admin">("teacher");
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: Id<"users">; username: string } | null>(null);
  const [userToReset, setUserToReset] = useState<{ id: Id<"users">; username: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await createUser({
        username,
        role,
        schoolId: schoolId || undefined,
      });
      setSuccess(
        t(
          `User created! Default password: Teacher${username}`,
          `สร้างผู้ใช้แล้ว! รหัสผ่านเริ่มต้น: Teacher${username}`
        )
      );
      setUsername("");
      setRole("teacher");
      setSchoolId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (userId: Id<"users">, username: string) => {
    setUserToReset({ id: userId, username });
  };

  const executeResetPassword = async () => {
    if (!userToReset) return;

    try {
      await resetPassword({ userId: userToReset.id });
      toast.success(
        `Password reset! New password: Teacher${userToReset.username}`,
        `รีเซ็ตรหัสผ่านแล้ว! รหัสผ่านใหม่: Teacher${userToReset.username}`
      );
      setUserToReset(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password",
        err instanceof Error ? err.message : "ไม่สามารถรีเซ็ตรหัสผ่านได้"
      );
    }
  };

  const handleDeleteUser = (userId: Id<"users">, username: string) => {
    setUserToDelete({ id: userId, username });
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;

    if (!currentUserId) {
      toast.error(
        "Cannot determine admin user",
        "ไม่สามารถระบุผู้ใช้ผู้ดูแลระบบได้"
      );
      return;
    }

    try {
      await deleteUser({
        adminId: currentUserId,
        userIdToDelete: userToDelete.id,
      });
      toast.success(
        `User ${userToDelete.username} has been deleted`,
        `ลบผู้ใช้ ${userToDelete.username} แล้ว`
      );
      setUserToDelete(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete user",
        err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้ได้"
      );
    }
  };

  const handleBulkDelete = async () => {
    if (!currentUserId) {
      toast.error(
        "Cannot determine user",
        "ไม่สามารถระบุผู้ใช้ได้"
      );
      return;
    }

    try {
      const result = await bulkDeleteUsers({
        adminOrModeratorId: currentUserId,
        userIdsToDelete: Array.from(selectedUsers),
      });

      if (result.successful > 0) {
        toast.success(
          `Successfully deleted ${result.successful} user(s)`,
          `ลบผู้ใช้สำเร็จ ${result.successful} คน`
        );
      }

      if (result.failed > 0) {
        toast.error(
          `Failed to delete ${result.failed} user(s). Check console for details.`,
          `ไม่สามารถลบผู้ใช้ได้ ${result.failed} คน ตรวจสอบคอนโซลสำหรับรายละเอียด`
        );
        console.error("Bulk delete errors:", result.errors);
      }

      setSelectedUsers(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to bulk delete users",
        err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้จำนวนมากได้"
      );
    }
  };

  const toggleUserSelection = (userId: Id<"users">) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (!users) return;

    if (selectedUsers.size === selectableUsers.length) {
      // Deselect all
      setSelectedUsers(new Set());
    } else {
      // Select all selectable users
      setSelectedUsers(new Set(selectableUsers.map(u => u._id)));
    }
  };

  // Filter users that can be selected for deletion
  const selectableUsers = users?.filter(user => {
    // Cannot select yourself
    if (user._id === currentUserId) return false;

    // Moderators can only select teachers
    if (currentUser?.role === "moderator") {
      return user.role === "teacher";
    }

    // Admins can select anyone except other admins
    if (currentUser?.role === "admin") {
      return user.role !== "admin";
    }

    return false;
  }) || [];

  // Check if user can perform bulk delete (admin or moderator)
  const canBulkDelete = currentUser?.role === "admin" || currentUser?.role === "moderator";

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
        {t("User Management", "จัดการผู้ใช้")}
      </h2>

      {/* Create User Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t("Create New User", "สร้างผู้ใช้ใหม่")}
        </h3>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              {t("Username", "ชื่อผู้ใช้")}
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={loading}
              placeholder={t("e.g., Evan", "เช่น Evan")}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t(
                `Default password will be: Teacher${username || "{username}"}`,
                `รหัสผ่านเริ่มต้นจะเป็น: Teacher${username || "{username}"}`
              )}
            </p>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              {t("Role", "บทบาท")}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "teacher" | "moderator" | "admin")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
              disabled={loading}
            >
              <option value="teacher">{t("Teacher", "ครู")}</option>
              <option value="moderator">{t("Moderator", "ผู้ดูแล")}</option>
              <option value="admin">{t("Admin", "ผู้จัดการ")}</option>
            </select>
          </div>

          {(role === "teacher" || role === "moderator") && (
            <div>
              <label htmlFor="school" className="block text-sm font-medium mb-2">
                {t("School (Optional)", "โรงเรียน (ไม่บังคับ)")}
              </label>
              <select
                id="school"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value as Id<"schools"> | "")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                disabled={loading}
              >
                <option value="">{t("Select a school", "เลือกโรงเรียน")}</option>
                {schools?.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading
              ? t("Creating...", "กำลังสร้าง...")
              : t("Create User", "สร้างผู้ใช้")}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {t("Users", "ผู้ใช้")}
          </h3>

          {/* Bulk Delete Controls */}
          {canBulkDelete && selectableUsers.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedUsers.size > 0 && (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t(`${selectedUsers.size} selected`, `เลือก ${selectedUsers.size} คน`)}
                  </span>
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
                {selectedUsers.size === selectableUsers.length
                  ? t("Deselect All", "ยกเลิกทั้งหมด")
                  : t("Select All", "เลือกทั้งหมด")}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {users?.map((user) => {
            const isSelectable = selectableUsers.some(u => u._id === user._id);
            const isSelected = selectedUsers.has(user._id);

            return (
              <div
                key={user._id}
                className={`flex items-center justify-between p-3 border rounded-lg ${isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                  }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isSelectable && canBulkDelete && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t(
                        user.role.charAt(0).toUpperCase() + user.role.slice(1),
                        user.role === "teacher"
                          ? "ครู"
                          : user.role === "moderator"
                            ? "ผู้ดูแล"
                            : "ผู้จัดการ"
                      )}
                      {user.requirePasswordChange && (
                        <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                          ({t("Requires password change", "ต้องเปลี่ยนรหัสผ่าน")})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResetPassword(user._id, user.username)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title={t("Reset Password", "รีเซ็ตรหัสผ่าน")}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Reset", "รีเซ็ต")}
                  </button>
                  {currentUserId && user._id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteUser(user._id, user.username)}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title={t("Delete User", "ลบผู้ใช้")}
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("Delete", "ลบ")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {users && users.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {t("No users found", "ไม่พบผู้ใช้")}
            </p>
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              {t("⚠️ Confirm Bulk Deletion", "⚠️ ยืนยันการลบจำนวนมาก")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t(
                `You are about to permanently delete ${selectedUsers.size} user(s). This action cannot be undone!`,
                `คุณกำลังจะลบผู้ใช้ ${selectedUsers.size} คนอย่างถาวร การดำเนินการนี้ไม่สามารถยกเลิกได้!`
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
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("Delete All", "ลบทั้งหมด")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {userToReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("Reset Password", "รีเซ็ตรหัสผ่าน")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t(
                `Reset password for ${userToReset.username}? They will need to change it on next login.`,
                `รีเซ็ตรหัสผ่านสำหรับ ${userToReset.username}? พวกเขาจะต้องเปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งถัดไป`
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToReset(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={executeResetPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("Reset", "รีเซ็ต")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              {t("⚠️ Delete User", "⚠️ ลบผู้ใช้")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t(
                `Are you ABSOLUTELY SURE you want to delete ${userToDelete.username}?`,
                `คุณแน่ใจหรือไม่ว่าต้องการลบ ${userToDelete.username}?`
              )}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6 font-medium">
              {t(
                "This action is PERMANENT and IRREVERSIBLE!",
                "การดำเนินการนี้เป็นการลบถาวรและไม่สามารถยกเลิกได้!"
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={executeDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("Delete", "ลบ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
