/**
 * Shared date utility functions
 */

type Language = "en" | "th";

/**
 * Format relative time from timestamp (e.g., "5 min ago", "2 hours ago")
 */
export function formatRelativeTime(
  timestamp: number,
  language: Language,
): string {
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

/**
 * Get the start of the month (1st day) for a given date
 */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the month (last day) for a given date
 */
export function getMonthEnd(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // Set to last day of previous month
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get all days to display in month grid (includes padding from prev/next month)
 * Returns exactly 35 or 42 days (5 or 6 weeks) for consistent grid layout
 */
export function getMonthGridDays(date: Date): Date[] {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  // Start from Monday of the week containing the 1st
  const gridStart = getWeekStart(monthStart);

  // Calculate if we need 5 or 6 weeks
  // Need 6 weeks if month spans more than 5 weeks when starting from Monday
  const firstDayOfWeek = monthStart.getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const totalDaysNeeded = monthEnd.getDate() + offset;
  const needsSixWeeks = totalDaysNeeded > 35;

  const totalDays = needsSixWeeks ? 42 : 35; // 6 or 5 weeks
  const days: Date[] = [];

  for (let i = 0; i < totalDays; i++) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Check if a date is in the specified month (same month and year)
 */
export function isInMonth(date: Date, referenceMonth: Date): boolean {
  return (
    date.getMonth() === referenceMonth.getMonth() &&
    date.getFullYear() === referenceMonth.getFullYear()
  );
}
