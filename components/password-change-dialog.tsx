"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation } from "convex/react";
import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";

interface PasswordChangeDialogProps {
  userId: Id<"users">;
  onPasswordChanged: () => void;
  canSkip?: boolean;
}

export function PasswordChangeDialog({
  userId,
  onPasswordChanged,
  canSkip = false,
}: PasswordChangeDialogProps) {
  const { t } = useLanguage();
  const changePassword = useMutation(api.users.changePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("Passwords do not match", "รหัสผ่านไม่ตรงกัน"));
      return;
    }

    if (newPassword.length < 1) {
      setError(
        t(
          "Password cannot be empty",
          "รหัสผ่านต้องไม่เป็นค่าว่าง"
        )
      );
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        userId,
        currentPassword,
        newPassword,
      });
      onPasswordChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[95vh]">
        {/* Sticky Header */}
        <div className="p-6 md:p-8 bg-white dark:bg-gray-800 rounded-t-lg">
          <h2 className="text-2xl font-bold mb-4">
            {t("Change Password", "เปลี่ยนรหัสผ่าน")}
          </h2>

          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg flex gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">
                {t("First-time login", "เข้าสู่ระบบครั้งแรก")}
              </p>
              <p>
                {t(
                  "Please change your password. Note: Admin can only reset passwords, not view them.",
                  "กรุณาเปลี่ยนรหัสผ่านของคุณ หมายเหตุ: ผู้ดูแลระบบสามารถรีเซ็ตรหัสผ่านเท่านั้น ไม่สามารถดูรหัสผ่านได้"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow px-6 md:px-8">
          <form id="password-change-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current" className="block text-sm font-medium mb-2">
                {t("Current Password", "รหัสผ่านปัจจุบัน")}
              </label>
              <input
                type="password"
                id="current"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="new" className="block text-sm font-medium mb-2">
                {t("New Password", "รหัสผ่านใหม่")}
              </label>
              <input
                type="password"
                id="new"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t(
                  "No minimum requirements - create any password you want",
                  "ไม่มีข้อกำหนดขั้นต่ำ - สร้างรหัสผ่านที่คุณต้องการได้"
                )}
              </p>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-2">
                {t("Confirm New Password", "ยืนยันรหัสผ่านใหม่")}
              </label>
              <input
                type="password"
                id="confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
          <div className="flex gap-3">
            <button
              type="submit"
              form="password-change-form"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("Changing...", "กำลังเปลี่ยน...")
                : t("Change Password", "เปลี่ยนรหัสผ่าน")}
            </button>
            {canSkip && (
              <button
                type="button"
                onClick={onPasswordChanged}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("Skip", "ข้าม")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
