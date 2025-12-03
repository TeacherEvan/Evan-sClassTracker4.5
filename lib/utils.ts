/**
 * Utility function to merge class names
 * Used for conditional styling with Tailwind CSS
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
