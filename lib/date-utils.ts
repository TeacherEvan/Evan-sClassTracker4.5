/**
 * Shared date utility functions
 */

type Language = "en" | "th";

/**
 * Format relative time from timestamp (e.g., "5 min ago", "2 hours ago")
 */
export function formatRelativeTime(timestamp: number, language: Language): string {
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
