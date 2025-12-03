import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { UserRole } from "@/lib/types";

/**
 * Props for the main ClassBooking component
 */
export interface ClassBookingProps {
  userId: Id<"users">;
  userRole: UserRole;
  userSchoolId?: Id<"schools">; // Moderator's school ID
}

/**
 * Class item with joined data from queries
 */
export interface ClassItemWithDetails {
  _id: Id<"classes">;
  schoolId?: Id<"schools">; // Optional for provider classes
  studentId: Id<"students">;
  additionalStudentIds?: Id<"students">[];
  locationId?: Id<"locations">;
  pendingLocationName?: string;
  pendingLocationNameTh?: string;
  scheduledDate: number;
  status: "pending" | "acknowledged" | "approved" | "rejected";
  student: Doc<"students"> | null; // Full student object from joined query
  additionalStudents?: (Doc<"students"> | null)[]; // Additional students from joined query
  location: Doc<"locations"> | null; // Full location object from joined query
  isEdited?: boolean;
  editHistory?: Array<{
    editedAt: number;
    editedBy: Id<"users">;
    editedByName: string;
    editedByRole: string;
    changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
  }>;
  bookedByUserId?: Id<"users">;
  bookedByUsername?: string;
  approvedByUserId?: Id<"users">;
  approvedByUsername?: string;
  approvedAt?: number;
  approvalSource?: "moderator" | "admin" | "auto_provider" | "auto_guardian" | "system";
}

/**
 * Props for the ClassItemDisplay component
 */
export interface ClassItemDisplayProps {
  classItem: ClassItemWithDetails;
  userRole: UserRole;
  userId: Id<"users">;
  hasConflicts: boolean;
  conflictCount: number;
  onAcknowledge: (id: Id<"classes">) => void;
  onApprove: (id: Id<"classes">) => void;
  onReject: (id: Id<"classes">) => void;
  onDelete: (id: Id<"classes">) => void;
  onRequestCancellation: (id: Id<"classes">, reason: string, reasonTh: string) => void;
  onEdit: (classData: ClassItemWithDetails) => void;
}

/**
 * Class type for conflict detection
 */
export interface ConflictCheckClass {
  _id: Id<"classes">;
  teacherId: Id<"users">;
  schoolId?: Id<"schools">;
  locationId?: Id<"locations">;
  scheduledDate: number;
  status: string;
}
