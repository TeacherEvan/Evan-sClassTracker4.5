"use client";

import { useDevice } from "@/lib/device-context";
import { useLanguage } from "@/lib/language-context";
import { AlertTriangle, Bell, CheckCircle, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastNotification {
  id: string;
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  type: ToastType;
}

interface DesktopNotificationToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  duration?: number; // Auto-dismiss duration in milliseconds
}

export function DesktopNotificationToast({
  notification,
  onDismiss,
  duration = 5000,
}: DesktopNotificationToastProps) {
  const { t, language } = useLanguage();
  const { isDesktop } = useDevice();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, notification.id, onDismiss]);

  // Only show on desktop devices
  if (!isDesktop) {
    return null;
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles =
      "border-l-4 shadow-lg rounded-lg transition-all duration-300";
    switch (notification.type) {
      case "success":
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-500`;
      case "warning":
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500`;
      case "error":
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-500`;
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-500`;
    }
  };

  const title = language === "en" ? notification.title : notification.titleTh;
  const message =
    language === "en" ? notification.message : notification.messageTh;

  return (
    <div
      className={`${getStyles()} ${isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-full"
        } max-w-md p-4`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(notification.id), 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label={t("Dismiss", "ปิด")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({
  notifications,
  onDismiss,
}: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <DesktopNotificationToast
            notification={notification}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
}
