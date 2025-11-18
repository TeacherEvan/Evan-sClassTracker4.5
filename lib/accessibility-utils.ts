/**
 * Accessibility Utilities
 * Helper functions for WCAG 2.1 Level AA compliance
 */

/**
 * Get ARIA label for class status
 */
export function getStatusAriaLabel(
  status: string,
  language: "en" | "th"
): string {
  const labels: Record<string, { en: string; th: string }> = {
    approved: { en: "Approved", th: "อนุมัติแล้ว" },
    pending: { en: "Pending approval", th: "รอการอนุมัติ" },
    acknowledged: { en: "Acknowledged", th: "รับทราบแล้ว" },
    rejected: { en: "Rejected", th: "ปฏิเสธ" },
  };
  return labels[status]?.[language] || status;
}

/**
 * Get icon name for class status (use with lucide-react)
 */
export function getStatusIconName(status: string): string {
  const icons: Record<string, string> = {
    approved: "Check",
    pending: "Clock",
    acknowledged: "Info",
    rejected: "X",
  };
  return icons[status] || "Info";
}

/**
 * Get background color class for status
 */
export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    approved: "bg-green-100 dark:bg-green-900",
    pending: "bg-yellow-100 dark:bg-yellow-900",
    acknowledged: "bg-blue-100 dark:bg-blue-900",
    rejected: "bg-red-100 dark:bg-red-900",
  };
  return colors[status] || "bg-gray-100 dark:bg-gray-900";
}

/**
 * Get text color class for status
 */
export function getStatusTextColor(status: string): string {
  const colors: Record<string, string> = {
    approved: "text-green-800 dark:text-green-200",
    pending: "text-yellow-800 dark:text-yellow-200",
    acknowledged: "text-blue-800 dark:text-blue-200",
    rejected: "text-red-800 dark:text-red-200",
  };
  return colors[status] || "text-gray-800 dark:text-gray-200";
}

/**
 * Status Badge Component Props
 */
export interface StatusBadgeProps {
  status: string;
  language: "en" | "th";
  showIcon?: boolean;
  className?: string;
}

/**
 * Get combined status badge classes
 * Use this helper to build accessible status badges
 */
export function getStatusBadgeClasses(
  status: string,
  className = ""
): { bg: string; text: string; combined: string } {
  const bg = getStatusBgColor(status);
  const text = getStatusTextColor(status);
  const combined = `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium min-h-[44px] min-w-[44px] justify-center ${bg} ${text} ${className}`;
  
  return { bg, text, combined };
}

/**
 * Get ARIA live region politeness level for notification type
 */
export function getAriaLive(
  type: "success" | "error" | "warning" | "info"
): "polite" | "assertive" {
  return type === "error" ? "assertive" : "polite";
}

/**
 * Ensure minimum touch target size (44x44px for mobile)
 */
export const MIN_TOUCH_TARGET = "min-h-[44px] min-w-[44px]";

/**
 * Focus-visible ring for keyboard navigation
 */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

/**
 * Get skip link attributes for screen readers
 */
export function getSkipLinkProps() {
  return {
    href: "#main-content",
    className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-blue-600 px-4 py-2 rounded-md shadow-lg z-50",
    children: "Skip to main content"
  };
}

/**
 * Announce to screen readers (for dynamic content changes)
 */
export function announceToScreenReader(message: string) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get loading state ARIA label
 */
export function getLoadingAriaLabel(
  isLoading: boolean,
  language: "en" | "th"
): string {
  if (!isLoading) return "";
  return language === "en" ? "Loading..." : "กำลังโหลด...";
}

/**
 * Accessible button classes with minimum touch target
 */
export const ACCESSIBLE_BUTTON = `${MIN_TOUCH_TARGET} ${FOCUS_RING} inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors`;

/**
 * Accessible icon button classes
 */
export const ACCESSIBLE_ICON_BUTTON = `${MIN_TOUCH_TARGET} ${FOCUS_RING} inline-flex items-center justify-center p-2 rounded-md transition-colors`;
