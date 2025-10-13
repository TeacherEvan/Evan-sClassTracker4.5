"use client";

import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Bell, CheckCheck } from "lucide-react";

interface Notification {
  _id: Id<"notifications">;
  _creationTime: number;
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  type: "info" | "success" | "warning" | "error";
  userId?: string;
  read: boolean;
  createdAt: number;
}

export function NotificationList({ userId }: { userId?: string }) {
  const { language, t } = useLanguage();
  const notifications = useQuery(api.notifications.list, {
    userId,
  }) as Notification[] | undefined;
  const unreadCount = useQuery(api.notifications.unreadCount, { userId });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const remove = useMutation(api.notifications.remove);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      case "error":
        return "text-red-800 dark:text-red-200";
      default:
        return "text-blue-800 dark:text-blue-200";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t("Just now", "เมื่อสักครู่");
    } else if (diffMins < 60) {
      return t(`${diffMins} min ago`, `${diffMins} นาทีที่แล้ว`);
    } else if (diffHours < 24) {
      return t(`${diffHours} hour${diffHours > 1 ? "s" : ""} ago`, `${diffHours} ชั่วโมงที่แล้ว`);
    } else if (diffDays < 7) {
      return t(`${diffDays} day${diffDays > 1 ? "s" : ""} ago`, `${diffDays} วันที่แล้ว`);
    } else {
      return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <h2 className="text-2xl font-semibold">
            {t("Notifications", "การแจ้งเตือน")}
          </h2>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead({ userId })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            {t("Mark all as read", "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว")}
          </button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="text-center py-8 text-gray-500">
          {t("Loading notifications...", "กำลังโหลดการแจ้งเตือน...")}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t("No notifications yet", "ยังไม่มีการแจ้งเตือน")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border rounded-lg ${getTypeColor(notification.type)} ${
                !notification.read ? "border-l-4" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-1 ${getTypeTextColor(notification.type)}`}
                  >
                    {language === "en"
                      ? notification.title
                      : notification.titleTh}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {language === "en"
                      ? notification.message
                      : notification.messageTh}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead({ id: notification._id })}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title={t("Mark as read", "ทำเครื่องหมายว่าอ่านแล้ว")}
                    >
                      <CheckCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove({ id: notification._id })}
                    className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                    title={t("Delete", "ลบ")}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
