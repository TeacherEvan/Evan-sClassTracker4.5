/**
 * Shared date utility functions
 */

type Language = "en" | "th";

/**
 * Safely validates if a value can be converted to a valid date
 */
export function isValidDate(value: unknown): boolean {
  if (value === null || value === undefined) return false;

  const date = new Date(value as string | number);
  return !isNaN(date.getTime());
}

/**
 * Safely format a date, returning fallback if invalid
 */
export function safeFormatDate(
  timestamp: number | null | undefined,
  language: Language = "en",
  fallback: string = "Invalid date"
): string {
  if (!isValidDate(timestamp)) {
    return fallback;
  }

  try {
    const date = new Date(timestamp!);
    return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH");
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

/**
 * Safely format a date with time, returning fallback if invalid
 */
export function safeFormatDateTime(
  timestamp: number | null | undefined,
  language: Language = "en",
  fallback: string = "Invalid date"
): string {
  if (!isValidDate(timestamp)) {
    return fallback;
  }

  try {
    const date = new Date(timestamp!);
    return date.toLocaleString(language === "en" ? "en-US" : "th-TH");
  } catch (error) {
    console.error("Error formatting date/time:", error);
    return fallback;
  }
}

/**
 * Safely format time only, returning fallback if invalid
 */
export function safeFormatTime(
  timestamp: number | null | undefined,
  language: Language = "en",
  fallback: string = "Invalid time"
): string {
  if (!isValidDate(timestamp)) {
    return fallback;
  }

  try {
    const date = new Date(timestamp!);
    return date.toLocaleTimeString(language === "en" ? "en-US" : "th-TH", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return fallback;
  }
}

/**
 * Format relative time from timestamp (e.g., "5 min ago", "2 hours ago")
 */
export function formatRelativeTime(timestamp: number, language: Language): string {
  if (!isValidDate(timestamp)) {
    return language === "en" ? "Invalid date" : "วันที่ไม่ถูกต้อง";
  }

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return language === "en" ? "Just now" : "เมื่อสักครู่";
    } else if (diffMins < 60) {
      return language === "en"
        ? `${diffMins} min ago`
        : `${diffMins} นาทีที่แล้ว`;
    } else if (diffHours < 24) {
      return language === "en"
        ? `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
        : `${diffHours} ชั่วโมงที่แล้ว`;
    } else if (diffDays < 7) {
      return language === "en"
        ? `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
        : `${diffDays} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH");
    }
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return language === "en" ? "Invalid date" : "วันที่ไม่ถูกต้อง";
  }
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
