/**
 * Shared constants and utilities for the application
 */

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// Class status types
export const CLASS_STATUS = {
  PENDING: "pending",
  ACKNOWLEDGED: "acknowledged",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ClassStatus = (typeof CLASS_STATUS)[keyof typeof CLASS_STATUS];

/**
 * Get Tailwind CSS classes for notification type background and border
 */
export function getNotificationTypeColor(type: string): string {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    case NOTIFICATION_TYPES.WARNING:
      return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
    case NOTIFICATION_TYPES.ERROR:
      return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
    default:
      return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
  }
}

/**
 * Get Tailwind CSS classes for notification type text color
 */
export function getNotificationTypeTextColor(type: string): string {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return "text-green-800 dark:text-green-200";
    case NOTIFICATION_TYPES.WARNING:
      return "text-yellow-800 dark:text-yellow-200";
    case NOTIFICATION_TYPES.ERROR:
      return "text-red-800 dark:text-red-200";
    default:
      return "text-blue-800 dark:text-blue-200";
  }
}

/**
 * Get Tailwind CSS classes for class status background and border
 */
export function getClassStatusColor(status: string): string {
  switch (status) {
    case CLASS_STATUS.APPROVED:
      return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
    case CLASS_STATUS.PENDING:
      return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700";
    case CLASS_STATUS.ACKNOWLEDGED:
      return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700";
    case CLASS_STATUS.REJECTED:
      return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
    default:
      return "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600";
  }
}
