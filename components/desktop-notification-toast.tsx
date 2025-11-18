"use client";

import { api } from "@/convex/_generated/api";
import { useDevice } from "@/lib/device-context";
import { useLanguage } from "@/lib/language-context";
import { loadUserSession } from "@/lib/session-utils";
import type { ErrorContext } from "@/lib/toast";
import { useMutation } from "convex/react";
import { AlertTriangle, Bell, CheckCircle, Send, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastAction {
  label: string;
  labelTh: string;
  onClick: () => void;
}

export interface ToastNotification {
  id: string;
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  type: ToastType;
  errorContext?: ErrorContext;
  showReportButton?: boolean;
  action?: ToastAction; // Optional action button (e.g., undo)
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
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const submitErrorReport = useMutation(api.errorReports.submitErrorReport);

  // Get browser/device info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let browserVersion = "";
    let os = "Unknown";

    // Detect browser
    if (ua.includes("Firefox/")) {
      browser = "Firefox";
      browserVersion = ua.match(/Firefox\/(\S+)/)?.[1] || "";
    } else if (ua.includes("Edg/")) {
      browser = "Edge";
      browserVersion = ua.match(/Edg\/(\S+)/)?.[1] || "";
    } else if (ua.includes("Chrome/")) {
      browser = "Chrome";
      browserVersion = ua.match(/Chrome\/(\S+)/)?.[1] || "";
    } else if (ua.includes("Safari/")) {
      browser = "Safari";
      browserVersion = ua.match(/Version\/(\S+)/)?.[1] || "";
    }

    // Detect OS
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS")) os = "iOS";

    return { browser, browserVersion, os };
  };

  const handleSendToAdmin = async () => {
    if (!notification.errorContext || reportSent) return;

    setIsReporting(true);
    try {
      const user = loadUserSession();
      const { browser, browserVersion, os } = getBrowserInfo();
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent)
        ? "mobile"
        : /Tablet|iPad/i.test(navigator.userAgent)
          ? "tablet"
          : "desktop";

      await submitErrorReport({
        userId: user?._id,
        errorType: "ui_error",
        errorMessage: language === "en" ? notification.message : notification.messageTh,
        errorCode: notification.errorContext.errorCode,
        errorOrigin: notification.errorContext.errorOrigin,
        errorFunction: notification.errorContext.errorFunction,
        stackTrace: notification.errorContext.stackTrace,
        userAction: notification.errorContext.userAction,
        componentState: notification.errorContext.componentState,
        deviceType,
        browser,
        browserVersion,
        os,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent,
      });

      setReportSent(true);
      // Show success feedback briefly
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }, 2000);
    } catch (error) {
      console.error("Failed to send error report:", error);
      setIsReporting(false);
    }
  };

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

          {/* Send to Admin Button (for errors with context) */}
          {notification.showReportButton && !reportSent && (
            <button
              onClick={handleSendToAdmin}
              disabled={isReporting}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isReporting
                ? t("Sending...", "กำลังส่ง...")
                : t("Send to Admin", "ส่งให้ผู้ดูแล")}
            </button>
          )}

          {/* Action Button (for undo, etc.) */}
          {notification.action && (
            <button
              onClick={() => {
                notification.action?.onClick();
                onDismiss(notification.id);
              }}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {language === "en" ? notification.action.label : notification.action.labelTh}
            </button>
          )}

          {/* Confirmation message after sending */}
          {reportSent && (
            <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {t("Report sent to admin", "ส่งรายงานให้ผู้ดูแลแล้ว")}
            </p>
          )}
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
