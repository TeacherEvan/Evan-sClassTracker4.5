"use client";

import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import { useMutation } from "convex/react";
import { useState } from "react";

export function NotificationForm({ userId }: { userId?: string }) {
  const { t } = useLanguage();
  const createNotification = useMutation(api.notifications.create);

  const [title, setTitle] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [message, setMessage] = useState("");
  const [messageTh, setMessageTh] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">(
    "info",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNotification({
      title,
      titleTh,
      message,
      messageTh,
      type,
      userId,
    });
    setTitle("");
    setTitleTh("");
    setMessage("");
    setMessageTh("");
    setType("info");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 mb-8">
      <h2 className="text-2xl font-semibold mb-4">
        {t("Create Notification", "สร้างการแจ้งเตือน")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Title (English)", "หัวข้อ (อังกฤษ)")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Title (Thai)", "หัวข้อ (ไทย)")}
            </label>
            <input
              type="text"
              value={titleTh}
              onChange={(e) => setTitleTh(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Message (English)", "ข้อความ (อังกฤษ)")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Message (Thai)", "ข้อความ (ไทย)")}
            </label>
            <textarea
              value={messageTh}
              onChange={(e) => setMessageTh(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Type", "ประเภท")}
          </label>
          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target.value as "info" | "success" | "warning" | "error",
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="info">{t("Info", "ข้อมูล")}</option>
            <option value="success">{t("Success", "สำเร็จ")}</option>
            <option value="warning">{t("Warning", "คำเตือน")}</option>
            <option value="error">{t("Error", "ข้อผิดพลาด")}</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          {t("Create Notification", "สร้างการแจ้งเตือน")}
        </button>
      </form>
    </div>
  );
}
