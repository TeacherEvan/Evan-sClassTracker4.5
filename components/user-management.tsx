"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { RefreshCw, UserPlus } from "lucide-react";
import { useState } from "react";

export function UserManagement() {
  const { t } = useLanguage();
  const users = useQuery(api.users.list, {});
  const schools = useQuery(api.schools.list, {});
  const createUser = useMutation(api.users.create);
  const resetPassword = useMutation(api.users.resetPassword);

  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"teacher" | "moderator" | "admin">("teacher");
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleResetPassword = async (userId: Id<"users">, username: string) => {
    if (
      !confirm(
        t(
          `Reset password for ${username}? They will need to change it on next login.`,
          `รีเซ็ตรหัสผ่านสำหรับ ${username}? พวกเขาจะต้องเปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งถัดไป`
        )
      )
    ) {
      return;
    }

    try {
      await resetPassword({ userId });
      alert(
        t(
          `Password reset! New password: Teacher${username}`,
          `รีเซ็ตรหัสผ่านแล้ว! รหัสผ่านใหม่: Teacher${username}`
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

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
        <h3 className="text-xl font-semibold mb-4">
          {t("Users", "ผู้ใช้")}
        </h3>

        <div className="space-y-2">
          {users?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
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
              <button
                onClick={() => handleResetPassword(user._id, user.username)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t("Reset Password", "รีเซ็ตรหัสผ่าน")}
              </button>
            </div>
          ))}

          {users && users.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {t("No users found", "ไม่พบผู้ใช้")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
