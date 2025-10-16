/**
 * Shared TypeScript types for the application
 * Avoids duplication of type definitions across components
 */

import type { Id } from "@/convex/_generated/dataModel";

// User types
export type UserRole = "teacher" | "moderator" | "admin";
export type DeviceType = "mobile" | "tablet" | "desktop";

export type User = {
  _id: Id<"users">;
  username: string;
  role: UserRole;
  schoolId?: Id<"schools">;
  requirePasswordChange: boolean;
  createdAt: number;
  deviceType?: DeviceType;
  lastDeviceUpdate?: number;
  pushSubscription?: string;
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
  name: string;          // Updated to match new schema
  location: string;      // Updated to match new schema
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

// Message types
export type MessageType = "user" | "system" | "acknowledgment";

export type Message = {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  senderId: Id<"users"> | "system";
  content: string;
  readBy: Id<"users">[];
  messageType?: MessageType;
  createdAt: number;
};

// Push Subscription types
export type PushSubscription = {
  _id: Id<"pushSubscriptions">;
  userId: Id<"users">;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: string;
  createdAt: number;
};
