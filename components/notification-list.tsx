"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getNotificationTypeColor,
  getNotificationTypeTextColor,
} from "@/lib/constants";
import { formatRelativeTime } from "@/lib/date-utils";
import { useLanguage } from "@/lib/language-context";
import type { Notification, User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { memo, useState } from "react";
import { PaginatedList } from "./paginated-list";

// Memoized notification item component for better performance
const NotificationItem = memo(
  ({
    notification,
    language,
    onMarkAsRead,
    onRemove,
    onDelete,
    isAdmin,
  }: {
    notification: Notification;
    language: "en" | "th";
    onMarkAsRead: (id: Id<"notifications">) => void;
    onRemove: (id: Id<"notifications">) => void;
    onDelete?: (id: Id<"notifications">) => void;
    isAdmin?: boolean;
  }) => {
    const { t } = useLanguage();

    return (
      <div
        className={`p-4 md:p-5 border rounded-2xl md:rounded-lg ${getNotificationTypeColor(notification.type)} ${
          !notification.read ? "border-l-4" : ""
        } shadow-sm active:scale-[0.99] transition-transform touch-manipulation`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold mb-1 text-base md:text-sm ${getNotificationTypeTextColor(notification.type)}`}
            >
              {language === "en" ? notification.title : notification.titleTh}
            </h3>
            <p className="text-sm md:text-sm text-gray-700 dark:text-gray-300 mb-2 break-words">
              {language === "en"
                ? notification.message
                : notification.messageTh}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(notification.createdAt, language)}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification._id)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 active:scale-95 transition-all touch-manipulation rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t("Mark as read", "ทำเครื่องหมายว่าอ่านแล้ว")}
              >
                <CheckCheck className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            )}
            {isAdmin && onDelete ? (
              <button
                onClick={() => onDelete(notification._id)}
                className="p-2 text-red-600 hover:text-red-700 dark:hover:text-red-400 active:scale-95 transition-all touch-manipulation rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title={t("Delete (Admin)", "ลบ (ผู้ดูแลระบบ)")}
              >
                <Trash2 className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            ) : (
              <button
                onClick={() => onRemove(notification._id)}
                className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all touch-manipulation rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t("Delete", "ลบ")}
              >
                <X className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

NotificationItem.displayName = "NotificationItem";

export function NotificationList({
  userId,
  currentUser,
}: {
  userId?: string;
  currentUser?: User;
}) {
  const { language, t } = useLanguage();
  const notifications = useQuery(api.notifications.list, {
    userId,
  }) as Notification[] | undefined;
  const unreadCount = useQuery(api.notifications.unreadCount, { userId });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const remove = useMutation(api.notifications.remove);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const [notificationToDelete, setNotificationToDelete] =
    useState<Id<"notifications"> | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const handleMarkAsRead = (id: Id<"notifications">) => {
    markAsRead({ id });
  };

  const handleRemove = (id: Id<"notifications">) => {
    remove({ id });
  };

  const handleDelete = (id: Id<"notifications">) => {
    setNotificationToDelete(id);
  };

  const executeDelete = () => {
    if (!userId || !notificationToDelete) return;

    deleteNotification({
      userId: userId as Id<"users">,
      id: notificationToDelete,
    });
    setNotificationToDelete(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-4 md:p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 md:w-6 md:h-6" />
          <h2 className="text-xl md:text-2xl font-semibold">
            {t("Notifications", "การแจ้งเตือน")}
          </h2>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead({ userId })}
            className="flex items-center gap-2 px-4 py-2.5 md:py-2 bg-blue-500 text-white rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-95 transition-all touch-manipulation shadow-lg shadow-blue-500/20 text-sm md:text-base w-full md:w-auto justify-center"
          >
            <CheckCheck className="w-5 h-5 md:w-4 md:h-4" />
            <span className="font-medium">
              {t("Mark all as read", "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว")}
            </span>
          </button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm md:text-base">
            {t("Loading notifications...", "กำลังโหลดการแจ้งเตือน...")}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 md:py-16 text-gray-500">
          <Bell className="w-16 h-16 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
          <p className="text-base md:text-base">
            {t("No notifications yet", "ยังไม่มีการแจ้งเตือน")}
          </p>
        </div>
      ) : (
        <PaginatedList
          items={notifications}
          itemsPerPage={20}
          renderItem={(notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              language={language}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemove}
              onDelete={isAdmin ? handleDelete : undefined}
              isAdmin={isAdmin}
            />
          )}
          className="space-y-3 md:space-y-3"
        />
      )}

      {/* Delete Confirmation Modal */}
      {notificationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {t("Delete Notification?", "ลบการแจ้งเตือน?")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t(
                "Are you sure you want to permanently delete this notification? This action cannot be undone.",
                "คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนนี้อย่างถาวร? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNotificationToDelete(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
