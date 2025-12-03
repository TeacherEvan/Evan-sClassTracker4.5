import type { Id } from "@/convex/_generated/dataModel";
import type { ConflictCheckClass } from "./types";

/**
 * Time tolerance for detecting class conflicts (5 minutes)
 */
export const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Helper: Detect time conflicts between classes (same as backend logic)
 * @param classes Array of classes to check against
 * @param targetClass The class to check for conflicts
 * @returns Array of conflicting class IDs
 */
export function detectConflicts(
  classes: ConflictCheckClass[],
  targetClass: ConflictCheckClass
): Array<Id<"classes">> {
  const startRange = targetClass.scheduledDate - TIME_TOLERANCE;
  const endRange = targetClass.scheduledDate + TIME_TOLERANCE;

  return classes
    .filter((cls) => {
      if (cls._id === targetClass._id) return false; // Skip self
      if (cls.teacherId !== targetClass.teacherId) return false; // Different teacher
      if (cls.schoolId !== targetClass.schoolId) return false; // Different school
      if (cls.locationId !== targetClass.locationId) return false; // Different location
      if (!["approved", "pending", "acknowledged"].includes(cls.status)) return false; // Ignore rejected
      if (cls.scheduledDate < startRange || cls.scheduledDate > endRange) return false; // Outside time window
      return true;
    })
    .map((cls) => cls._id);
}
