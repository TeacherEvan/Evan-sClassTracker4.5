"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  CheckCircle,
  Edit,
  Plus,
  Power,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface AdminNotificationWindowsProps {
  currentUserId: Id<"users">;
}

export function AdminNotificationWindows({
  currentUserId,
}: AdminNotificationWindowsProps) {
  const { t, language } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWindow, setEditingWindow] = useState<{ _id: Id<"notificationWindows">;[key: string]: unknown } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [greeting, setGreeting] = useState("Hello {username}!");
  const [greetingTh, setGreetingTh] = useState("สวัสดี {username}!");
  const [message, setMessage] = useState("");
  const [messageTh, setMessageTh] = useState("");
  const [showUpdateSummary, setShowUpdateSummary] = useState(true);
  const [targetRole, setTargetRole] = useState<"all" | "teacher" | "moderator" | "admin">("all");
  const [priority, setPriority] = useState(5);

  const windows = useQuery(api.notificationWindows.list, { userId: currentUserId });
  const createWindow = useMutation(api.notificationWindows.create);
  const updateWindow = useMutation(api.notificationWindows.update);
  const toggleActive = useMutation(api.notificationWindows.toggleActive);
  const deleteWindow = useMutation(api.notificationWindows.remove);

  const resetForm = () => {
    setTitle("");
    setTitleTh("");
    setGreeting("Hello {username}!");
    setGreetingTh("สวัสดี {username}!");
    setMessage("");
    setMessageTh("");
    setShowUpdateSummary(true);
    setTargetRole("all");
    setPriority(5);
    setEditingWindow(null);
  };

  const openEditModal = (window: { _id: Id<"notificationWindows">;[key: string]: unknown }) => {
    setEditingWindow(window);
    setTitle((window.title as string) || "");
    setTitleTh((window.titleTh as string) || "");
    setGreeting((window.greeting as string) || "");
    setGreetingTh((window.greetingTh as string) || "");
    setMessage((window.message as string) || "");
    setMessageTh((window.messageTh as string) || "");
    setShowUpdateSummary((window.showUpdateSummary as boolean) ?? true);
    setTargetRole((window.targetRole as "all" | "teacher" | "moderator" | "admin") || "all");
    setPriority((window.priority as number) || 5);
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() && !titleTh.trim()) {
      toast.warning("Please provide a title", "กรุณาระบุหัวเรื่อง");
      return;
    }

    if (!message.trim() && !messageTh.trim()) {
      toast.warning("Please provide a message", "กรุณาระบุข้อความ");
      return;
    }

    try {
      if (editingWindow) {
        await updateWindow({
          userId: currentUserId,
          windowId: editingWindow._id,
          title,
          titleTh,
          greeting,
          greetingTh,
          message,
          messageTh,
          showUpdateSummary,
          targetRole,
          priority,
          isActive: (editingWindow.isActive as boolean) ?? true,
        });
        toast.success(
          "Notification window updated successfully",
          "อัปเดตหน้าต่างประกาศสำเร็จ"
        );
      } else {
        await createWindow({
          userId: currentUserId,
          title,
          titleTh,
          greeting,
          greetingTh,
          message,
          messageTh,
          showUpdateSummary,
          targetRole,
          priority,
        });
        toast.success(
          "Notification window created successfully",
          "สร้างหน้าต่างประกาศสำเร็จ"
        );
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save notification window:", error);
      toast.error(
        "Failed to save notification window",
        "บันทึกหน้าต่างประกาศล้มเหลว"
      );
    }
  };

  const handleToggleActive = async (windowId: Id<"notificationWindows">) => {
    try {
      await toggleActive({
        userId: currentUserId,
        windowId,
      });
      toast.success("Status updated", "อัปเดตสถานะแล้ว");
    } catch (error) {
      console.error("Failed to toggle active status:", error);
      toast.error("Failed to update status", "อัปเดตสถานะล้มเหลว");
    }
  };

  const handleDelete = async (windowId: Id<"notificationWindows">) => {
    try {
      await deleteWindow({
        userId: currentUserId,
        windowId,
      });
      toast.success(
        "Notification window deleted",
        "ลบหน้าต่างประกาศแล้ว"
      );
    } catch (error) {
      console.error("Failed to delete notification window:", error);
      toast.error(
        "Failed to delete notification window",
        "ลบหน้าต่างประกาศล้มเหลว"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-7 h-7 text-indigo-600" />
          {t("Notification Windows", "หน้าต่างประกาศ")}
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t("Create Window", "สร้างหน้าต่าง")}
        </button>
      </div>

      {/* Windows List */}
      <div className="grid gap-4">
        {windows === undefined ? (
          <div className="text-center py-12 text-gray-500">
            {t("Loading...", "กำลังโหลด...")}
          </div>
        ) : windows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t("No notification windows yet", "ยังไม่มีหน้าต่างประกาศ")}
          </div>
        ) : (
          windows.map((window) => (
            <div
              key={window._id}
              className={`bg-white dark:bg-gray-800 border-2 rounded-xl p-6 transition-all ${window.isActive
                ? "border-indigo-500 shadow-lg"
                : "border-gray-200 dark:border-gray-700"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {window.isActive ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-semibold">
                        {t("Active", "เปิดใช้งาน")}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 rounded-full text-xs font-semibold">
                        {t("Inactive", "ปิดใช้งาน")}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("Priority", "ลำดับความสำคัญ")}: {window.priority}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("Views", "จำนวนผู้ดู")}: {window.viewCount}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {language === "en" ? window.title : window.titleTh || window.title}
                  </h3>

                  <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                    {language === "en" ? window.message : window.messageTh || window.message}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {window.targetRole === "all"
                        ? t("All users", "ผู้ใช้ทั้งหมด")
                        : window.targetRole}
                    </span>
                    {window.showUpdateSummary && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {t("Shows updates", "แสดงการอัปเดต")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openEditModal(window)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    title={t("Edit", "แก้ไข")}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(window._id)}
                    className={`p-2 rounded-lg transition-all ${window.isActive
                      ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                    title={window.isActive ? t("Deactivate", "ปิดใช้งาน") : t("Activate", "เปิดใช้งาน")}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(window._id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title={t("Delete", "ลบ")}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingWindow
                    ? t("Edit Notification Window", "แก้ไขหน้าต่างประกาศ")
                    : t("Create Notification Window", "สร้างหน้าต่างประกาศ")}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Title", "หัวเรื่อง")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("English title...", "หัวเรื่องภาษาอังกฤษ...")}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-2"
                />
                <input
                  type="text"
                  value={titleTh}
                  onChange={(e) => setTitleTh(e.target.value)}
                  placeholder={t("Thai title...", "หัวเรื่องภาษาไทย...")}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Greeting */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Greeting (use {username} as placeholder)", "คำทักทาย (ใช้ {username} เป็นตัวแทน)")}
                </label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hello {username}!"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-2"
                />
                <input
                  type="text"
                  value={greetingTh}
                  onChange={(e) => setGreetingTh(e.target.value)}
                  placeholder="สวัสดี {username}!"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Message", "ข้อความ")}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("English message...", "ข้อความภาษาอังกฤษ...")}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-2"
                />
                <textarea
                  value={messageTh}
                  onChange={(e) => setMessageTh(e.target.value)}
                  placeholder={t("Thai message...", "ข้อความภาษาไทย...")}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("Target Role", "กลุ่มเป้าหมาย")}
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as "all" | "teacher" | "moderator" | "admin")}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">{t("All users", "ผู้ใช้ทั้งหมด")}</option>
                    <option value="teacher">{t("Teachers only", "ครูเท่านั้น")}</option>
                    <option value="moderator">{t("Moderators only", "ผู้ดูแลเท่านั้น")}</option>
                    <option value="admin">{t("Admins only", "ผู้จัดการเท่านั้น")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("Priority (1-10)", "ลำดับความสำคัญ (1-10)")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Show Update Summary */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUpdateSummary}
                  onChange={(e) => setShowUpdateSummary(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("Show recent updates summary", "แสดงสรุปการอัปเดตล่าสุด")}
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-medium"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg font-medium"
              >
                {editingWindow ? t("Update", "อัปเดต") : t("Create", "สร้าง")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
