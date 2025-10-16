"use client";

import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Bell, CheckCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/date-utils";
import { getNotificationTypeColor, getNotificationTypeTextColor } from "@/lib/constants";
import { memo } from "react";
import type { Notification } from "@/lib/types";

// Memoized notification item component for better performance
const NotificationItem = memo(({ 
  notification, 
  language, 
  onMarkAsRead, 
  onRemove 
}: { 
  notification: Notification; 
  language: "en" | "th"; 
  onMarkAsRead: (id: Id<"notifications">) => void; 
  onRemove: (id: Id<"notifications">) => void; 
}) => {
  const { t } = useLanguage();
  
  return (
    <div
      className={`p-4 border rounded-lg ${getNotificationTypeColor(notification.type)} ${
        !notification.read ? "border-l-4" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3
            className={`font-semibold mb-1 ${getNotificationTypeTextColor(notification.type)}`}
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
            {formatRelativeTime(notification.createdAt, language)}
          </p>
        </div>
        <div className="flex gap-2">
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title={t("Mark as read", "ทำเครื่องหมายว่าอ่านแล้ว")}
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onRemove(notification._id)}
            className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            title={t("Delete", "ลบ")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";

export function NotificationList({ userId }: { userId?: string }) {
  const { language, t } = useLanguage();
  const notifications = useQuery(api.notifications.list, {
    userId,
  }) as Notification[] | undefined;
  const unreadCount = useQuery(api.notifications.unreadCount, { userId });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const remove = useMutation(api.notifications.remove);

  const handleMarkAsRead = (id: Id<"notifications">) => {
    markAsRead({ id });
  };

  const handleRemove = (id: Id<"notifications">) => {
    remove({ id });
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
            <NotificationItem
              key={notification._id}
              notification={notification}
              language={language}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
