/**
 * Shared TypeScript types for the application
 * Avoids duplication of type definitions across components
 */

import type { Id } from "@/convex/_generated/dataModel";

// User types
export type UserRole = "teacher" | "moderator" | "admin";

export type User = {
  _id: Id<"users">;
  username: string;
  role: UserRole;
  schoolId?: Id<"schools">;
  requirePasswordChange: boolean;
  createdAt: number;
};

export type UserWithSchool = User & {
  schoolName: string;
  schoolNameTh: string;
};

// Notification types
export type NotificationType = "info" | "success" | "warning" | "error";

export type Notification = {
  _id: Id<"notifications">;
  _creationTime: number;
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  type: NotificationType;
  userId?: string | Id<"users">;
  read: boolean;
  createdAt: number;
};

// Class types
export type ClassStatus = "pending" | "acknowledged" | "approved" | "rejected";

export type ClassData = {
  _id: Id<"classes">;
  teacherId: Id<"users">;
  schoolId: Id<"schools">;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  status: ClassStatus;
  scheduledDate: number;
  createdAt: number;
};

// School types
export type School = {
  _id: Id<"schools">;
  name: string;
  nameTh: string;
  moderatorId?: Id<"users">;
  createdAt: number;
};

// Student types
export type Student = {
  _id: Id<"students">;
  firstName: string;
  lastName: string;
  studentId: string;
  schoolId?: Id<"schools">;
  grade: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  createdAt: number;
};
