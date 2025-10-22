# Implementation Plan: Screenshots & ClassCount Enhancements

**Date**: October 23, 2025  
**Status**: 🎯 Planning Phase

---

## Feature 1: Screenshot Upload for Bug Reports

### Overview

Enable users to attach screenshots when submitting bug reports via the "Contact Admin" feature for better issue diagnosis.

### Current State Analysis

**Existing Contact Admin System:**

- ✅ Form with bilingual fields (subject, message)
- ✅ Request types: general, feature_suggestion, bug_report, help_request, notification_window_request
- ✅ Rate limiting: 10 requests per 10 minutes
- ✅ Admin view to manage requests
- ❌ No file upload capability

**Files Involved:**

- `components/admin-contact-button.tsx` - Contact form UI
- `components/admin-contact-requests.tsx` - Admin view of requests
- `convex/adminContactRequests.ts` - Backend logic
- `convex/schema.ts` - Database schema

### Implementation Plan

#### Step 1: Update Database Schema

**Add to `convex/schema.ts`:**

```typescript
adminContactRequests: defineTable({
  // ... existing fields
  attachmentStorageId: v.optional(v.id("_storage")), // Convex file storage ID
  attachmentName: v.optional(v.string()), // Original filename
  attachmentType: v.optional(v.string()), // MIME type (image/png, image/jpeg)
  attachmentSize: v.optional(v.number()), // File size in bytes
  // ... rest of fields
})
  .index("by_has_attachment", ["attachmentStorageId"]) // Query requests with attachments
```

**Convex File Storage Pattern:**

- Convex provides built-in file storage via `ctx.storage`
- Files stored via `generateUploadUrl` mutation
- Retrieved via `getUrl` query
- Max file size: 1GB (we'll limit to 5MB for screenshots)

#### Step 2: Backend Mutations

**Add to `convex/adminContactRequests.ts`:**

```typescript
// Generate upload URL for screenshot
export const generateUploadUrl = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate upload URL (valid for 1 hour)
    return await ctx.storage.generateUploadUrl();
  },
});

// Updated create mutation with attachment support
export const create = mutation({
  args: {
    userId: v.id("users"),
    requestType: v.union(
      v.literal("general"),
      v.literal("feature_suggestion"),
      v.literal("bug_report"),
      v.literal("help_request"),
      v.literal("notification_window_request")
    ),
    subject: v.string(),
    subjectTh: v.string(),
    message: v.string(),
    messageTh: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")), // NEW
    attachmentName: v.optional(v.string()), // NEW
    attachmentType: v.optional(v.string()), // NEW
    attachmentSize: v.optional(v.number()), // NEW
  },
  handler: async (ctx, args) => {
    // ... existing rate limiting and validation

    // Validate attachment if provided
    if (args.attachmentStorageId) {
      // Verify file exists in storage
      const fileUrl = await ctx.storage.getUrl(args.attachmentStorageId);
      if (!fileUrl) {
        throw new Error("Attachment file not found");
      }

      // Validate file type (images only)
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
      if (args.attachmentType && !allowedTypes.includes(args.attachmentType)) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (args.attachmentSize && args.attachmentSize > maxSize) {
        throw new Error("File size exceeds 5MB limit");
      }
    }

    // Create request with attachment data
    const requestId = await ctx.db.insert("adminContactRequests", {
      userId: args.userId,
      userRole: user.role,
      username: user.username,
      requestType: args.requestType,
      subject: args.subject,
      subjectTh: args.subjectTh,
      message: args.message,
      messageTh: args.messageTh,
      attachmentStorageId: args.attachmentStorageId,
      attachmentName: args.attachmentName,
      attachmentType: args.attachmentType,
      attachmentSize: args.attachmentSize,
      status: "pending",
      createdAt: Date.now(),
    });

    // ... existing notification logic

    return requestId;
  },
});

// Query to get attachment URL
export const getAttachmentUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

#### Step 3: Frontend - Contact Form UI

**Update `components/admin-contact-button.tsx`:**

```tsx
// Add state for file upload
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);

const generateUploadUrl = useMutation(api.adminContactRequests.generateUploadUrl);

// File input handler
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    toast.error(
      "Invalid file type. Please select an image file.",
      "ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์รูปภาพ"
    );
    return;
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error(
      "File size exceeds 5MB limit",
      "ขนาดไฟล์เกิน 5MB"
    );
    return;
  }

  setSelectedFile(file);
};

// Upload file to Convex storage
const uploadFile = async (): Promise<{
  storageId: string;
  name: string;
  type: string;
  size: number;
} | null> => {
  if (!selectedFile) return null;

  setIsUploading(true);
  setUploadProgress(0);

  try {
    // Get upload URL
    const uploadUrl = await generateUploadUrl({ userId: currentUserId });

    // Upload file
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": selectedFile.type },
      body: selectedFile,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const { storageId } = await response.json();

    setUploadProgress(100);

    return {
      storageId,
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    };
  } catch (error) {
    console.error("File upload error:", error);
    toast.error(
      "Failed to upload file",
      "อัปโหลดไฟล์ล้มเหลว"
    );
    return null;
  } finally {
    setIsUploading(false);
  }
};

// Updated submit handler
const handleSubmit = async () => {
  // ... existing validation

  setIsSending(true);

  try {
    // Upload file if selected
    let attachmentData = null;
    if (selectedFile) {
      attachmentData = await uploadFile();
      if (!attachmentData) {
        setIsSending(false);
        return;
      }
    }

    // Create request with attachment
    await createContactRequest({
      userId: currentUserId,
      requestType,
      subject,
      subjectTh,
      message,
      messageTh,
      attachmentStorageId: attachmentData?.storageId,
      attachmentName: attachmentData?.name,
      attachmentType: attachmentData?.type,
      attachmentSize: attachmentData?.size,
    });

    toast.success(
      "Your request has been sent to the administrator",
      "คำขอของคุณถูกส่งไปยังผู้จัดการแล้ว"
    );

    // Clear inputs
    setSubject("");
    setSubjectTh("");
    setMessage("");
    setMessageTh("");
    setSelectedFile(null);
    setRequestType("general");
    setShowDialog(false);
  } catch (error) {
    console.error("Failed to send contact request:", error);
    toast.error(
      "Failed to send request. Please try again.",
      "การส่งคำขอล้มเหลว กรุณาลองอีกครั้ง"
    );
  } finally {
    setIsSending(false);
  }
};

// Add to dialog JSX (after message textarea):
<div className="space-y-2">
  <label className="block text-sm font-medium">
    {t("Attach Screenshot (Optional)", "แนบภาพหน้าจอ (ไม่บังคับ)")}
  </label>
  <input
    type="file"
    accept="image/*"
    onChange={handleFileSelect}
    disabled={isSending || isUploading}
    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
  />
  {selectedFile && (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
        {selectedFile.name}
      </span>
      <span className="text-xs text-gray-500">
        {(selectedFile.size / 1024).toFixed(1)} KB
      </span>
      <button
        onClick={() => setSelectedFile(null)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}
  {isUploading && (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
  )}
</div>
```

#### Step 4: Frontend - Admin View

**Update `components/admin-contact-requests.tsx`:**

```tsx
const getAttachmentUrl = useQuery(
  api.adminContactRequests.getAttachmentUrl,
  selectedRequest?.attachmentStorageId
    ? { storageId: selectedRequest.attachmentStorageId }
    : "skip"
);

// Add to request detail view:
{selectedRequest?.attachmentStorageId && (
  <div className="mt-4">
    <label className="block text-sm font-medium mb-2">
      {t("Attached Screenshot", "ภาพหน้าจอที่แนบมา")}
    </label>
    {getAttachmentUrl ? (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <img
          src={getAttachmentUrl}
          alt={selectedRequest.attachmentName || "Screenshot"}
          className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
        />
        <div className="p-2 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400">
          {selectedRequest.attachmentName} ({(selectedRequest.attachmentSize! / 1024).toFixed(1)} KB)
        </div>
      </div>
    ) : (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg" />
    )}
  </div>
)}
```

---

## Feature 2: ClassCount Enhancement - Interactive Modal

### Overview

Make the ClassCount badge clickable to show a detailed modal with:

- Disclaimer about monthly reset cycle
- List of counted classes with acknowledgment details
- Moderator-editable date ranges for tracking

### Current State Analysis

**Existing ClassCount System:**

- ✅ Teacher badge showing total count (`app/page.tsx`)
- ✅ Backend query: `getTeacherClassCount` (basic total)
- ✅ Backend query: `getTeacherClassCountDetailed` (moderator view with date range)
- ✅ Formula: `studentCount × (duration / 60)`
- ✅ Audit logging: `classCountAuditLogs` table
- ❌ No teacher-clickable modal
- ❌ No cycle date management UI
- ❌ No teacher view of which classes were counted

### Implementation Plan

#### Step 1: Database Schema Updates

**Add to `convex/schema.ts`:**

```typescript
// NEW TABLE: Teacher ClassCount Cycles (Moderator-configured)
teacherClassCountCycles: defineTable({
  teacherId: v.id("users"),
  schoolId: v.id("schools"),
  cycleStartDate: v.number(),
  cycleEndDate: v.number(),
  notes: v.optional(v.string()), // Moderator notes about this cycle
  notesTh: v.optional(v.string()),
  createdBy: v.id("users"), // Moderator who set this cycle
  createdAt: v.number(),
  isActive: v.boolean(), // Current active cycle vs historical
})
  .index("by_teacher", ["teacherId"])
  .index("by_school", ["schoolId"])
  .index("by_active", ["isActive"])
  .index("by_teacher_and_active", ["teacherId", "isActive"])
  .index("by_created_at", ["createdAt"]),
```

#### Step 2: Backend Queries

**Add to `convex/teacherClassCount.ts`:**

```typescript
/**
 * Get teacher's ClassCount for CURRENT cycle with full details
 * Teachers can view their own data
 */
export const getMyClassCountDetails = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get teacher
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get active cycle for this teacher
    const activeCycle = await ctx.db
      .query("teacherClassCountCycles")
      .withIndex("by_teacher_and_active", (q) =>
        q.eq("teacherId", args.teacherId).eq("isActive", true)
      )
      .first();

    // If no active cycle, use current month as default
    const now = Date.now();
    const currentMonth = new Date(now);
    const defaultStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
    const defaultEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

    const startDate = activeCycle?.cycleStartDate || defaultStart;
    const endDate = activeCycle?.cycleEndDate || defaultEnd;

    // Get classes in date range
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", args.teacherId)
          .gte("scheduledDate", startDate)
          .lte("scheduledDate", endDate)
      )
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    // Batch fetch students and schools
    const studentIds = new Set<Id<"students">>();
    const schoolIds = new Set<Id<"schools">>();
    classes.forEach(cls => {
      studentIds.add(cls.studentId);
      schoolIds.add(cls.schoolId);
      cls.additionalStudentIds?.forEach(id => studentIds.add(id));
    });

    const students = await Promise.all(
      Array.from(studentIds).map(id => ctx.db.get(id))
    );
    const schools = await Promise.all(
      Array.from(schoolIds).map(id => ctx.db.get(id))
    );
    const locations = await ctx.db.query("locations").collect();

    const studentMap = new Map(students.filter(s => s !== null).map(s => [s!._id, s]));
    const schoolMap = new Map(schools.filter(s => s !== null).map(s => [s!._id, s]));
    const locationMap = new Map(locations.map(l => [l._id, l]));

    // Calculate total and build class details
    let totalClassCount = 0;
    const classDetails = classes.map(cls => {
      const studentCount = 1 + (cls.additionalStudentIds?.length || 0);
      const durationMinutes = cls.duration || 60;
      const classCount = studentCount * (durationMinutes / 60);
      totalClassCount += classCount;

      const primaryStudent = studentMap.get(cls.studentId);
      const school = schoolMap.get(cls.schoolId);
      const location = cls.locationId ? locationMap.get(cls.locationId) : null;

      return {
        classId: cls._id,
        scheduledDate: cls.scheduledDate,
        duration: durationMinutes,
        studentCount,
        classCount: Math.round(classCount * 10) / 10,
        primaryStudentName: primaryStudent
          ? `${primaryStudent.firstName} ${primaryStudent.lastName}`
          : "Unknown",
        schoolName: school?.name || "Unknown",
        schoolNameTh: school?.nameTh || "ไม่ทราบ",
        locationName: location?.name || cls.pendingLocationName || "Not specified",
        locationNameTh: location?.nameTh || cls.pendingLocationNameTh || "ไม่ระบุ",
        acknowledgedBy: cls.lastEditedBy ? "Moderator" : "System", // Simplified
        acknowledgedAt: cls.createdAt,
      };
    });

    return {
      cycleInfo: {
        startDate,
        endDate,
        isCustomCycle: !!activeCycle,
        notes: activeCycle?.notes,
        notesTh: activeCycle?.notesTh,
      },
      summary: {
        totalClassCount: Math.round(totalClassCount * 10) / 10,
        totalClasses: classes.length,
      },
      classes: classDetails,
    };
  },
});

/**
 * Moderator sets custom cycle dates for a teacher
 */
export const setTeacherCycle = mutation({
  args: {
    teacherId: v.id("users"),
    cycleStartDate: v.number(),
    cycleEndDate: v.number(),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
    moderatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify moderator authorization
    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
      throw new Error("Unauthorized: Only moderators can set cycle dates");
    }

    // Get teacher
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify moderator school access (moderators can only manage their school)
    if (moderator.role === "moderator" && teacher.schoolId !== moderator.schoolId) {
      throw new Error("Unauthorized: Moderators can only manage teachers from their school");
    }

    // Validate dates
    if (args.cycleStartDate >= args.cycleEndDate) {
      throw new Error("Cycle start date must be before end date");
    }

    // Deactivate existing active cycles
    const existingCycles = await ctx.db
      .query("teacherClassCountCycles")
      .withIndex("by_teacher_and_active", (q) =>
        q.eq("teacherId", args.teacherId).eq("isActive", true)
      )
      .collect();

    for (const cycle of existingCycles) {
      await ctx.db.patch(cycle._id, { isActive: false });
    }

    // Create new active cycle
    const cycleId = await ctx.db.insert("teacherClassCountCycles", {
      teacherId: args.teacherId,
      schoolId: teacher.schoolId!,
      cycleStartDate: args.cycleStartDate,
      cycleEndDate: args.cycleEndDate,
      notes: args.notes,
      notesTh: args.notesTh,
      createdBy: args.moderatorId,
      createdAt: Date.now(),
      isActive: true,
    });

    // Send notification to teacher
    await ctx.db.insert("notifications", {
      title: "ClassCount Cycle Updated",
      titleTh: "อัปเดตรอบการนับชั้นเรียน",
      message: `Your ClassCount tracking period has been updated by ${moderator.username}. New period: ${new Date(args.cycleStartDate).toLocaleDateString()} - ${new Date(args.cycleEndDate).toLocaleDateString()}`,
      messageTh: `รอบการนับชั้นเรียนของคุณถูกอัปเดตโดย ${moderator.username} รอบใหม่: ${new Date(args.cycleStartDate).toLocaleDateString('th-TH')} - ${new Date(args.cycleEndDate).toLocaleDateString('th-TH')}`,
      type: "info",
      userId: args.teacherId,
      read: false,
      createdAt: Date.now(),
    });

    return cycleId;
  },
});
```

#### Step 3: Frontend - ClassCount Modal Component

**Create `components/class-count-modal.tsx`:**

```tsx
"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  MapPin,
  School,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

interface ClassCountModalProps {
  teacherId: Id<"users">;
  onClose: () => void;
}

export function ClassCountModal({ teacherId, onClose }: ClassCountModalProps) {
  const { t, language } = useLanguage();
  const classCountDetails = useQuery(api.teacherClassCount.getMyClassCountDetails, {
    teacherId,
  });

  const [showAllClasses, setShowAllClasses] = useState(false);

  if (!classCountDetails) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  const { cycleInfo, summary, classes } = classCountDetails;
  const displayedClasses = showAllClasses ? classes : classes.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t("Your ClassCount", "จำนวนชั้นเรียนของคุณ")}
                </h2>
                <p className="text-sm text-white/90">
                  {summary.totalClassCount} {t("classes this cycle", "ชั้นเรียนในรอบนี้")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                {t(
                  "This is your current class count for the month. Value will reset at the end of each cycle determined by your moderator.",
                  "นี่คือจำนวนชั้นเรียนปัจจุบันของคุณสำหรับเดือนนี้ ค่าจะรีเซ็ตในตอนท้ายของแต่ละรอบที่กำหนดโดยผู้ดูแลของคุณ"
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <Calendar className="w-4 h-4" />
                <span>
                  {t("Current Cycle:", "รอบปัจจุบัน:")} {new Date(cycleInfo.startDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")} -{" "}
                  {new Date(cycleInfo.endDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                </span>
              </div>
              {cycleInfo.notes && (
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  {language === "th" ? cycleInfo.notesTh || cycleInfo.notes : cycleInfo.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {t("Total ClassCount", "จำนวนชั้นเรียนรวม")}
              </span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {summary.totalClassCount}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t("Classes Counted", "ชั้นเรียนที่นับ")}
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalClasses}
            </p>
          </div>
        </div>

        {/* Classes List */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t("Classes Counted & Acknowledged", "ชั้นเรียนที่นับและยอมรับแล้ว")}
          </h3>

          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("No classes counted in this cycle yet", "ยังไม่มีชั้นเรียนที่นับในรอบนี้")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedClasses.map((cls) => (
                <div
                  key={cls.classId}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {cls.primaryStudentName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(cls.scheduledDate).toLocaleDateString(
                              language === "th" ? "th-TH" : "en-US"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{cls.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <School className="w-3.5 h-3.5" />
                          <span>{language === "th" ? cls.schoolNameTh : cls.schoolName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{language === "th" ? cls.locationNameTh : cls.locationName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
                        {cls.classCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {cls.studentCount} {cls.studentCount === 1 ? "student" : "students"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t("Acknowledged by", "ยอมรับโดย")} {cls.acknowledgedBy}
                    </span>
                  </div>
                </div>
              ))}

              {classes.length > 5 && !showAllClasses && (
                <button
                  onClick={() => setShowAllClasses(true)}
                  className="w-full py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                >
                  {t(`Show All ${classes.length} Classes`, `แสดงทั้งหมด ${classes.length} ชั้นเรียน`)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t(
              "For full class history, visit the Teachers Log tab",
              "สำหรับประวัติชั้นเรียนทั้งหมด ไปที่แท็บ Teachers Log"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### Step 4: Update Main UI to Make Badge Clickable

**Update `app/page.tsx`:**

```tsx
// Add state at top of component
const [showClassCountModal, setShowClassCountModal] = useState(false);

// Update the ClassCount badge to be clickable:
{user.role === "teacher" && teacherClassCount && (
  <>
    <button
      onClick={() => setShowClassCountModal(true)}
      className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
    >
      <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-yellow-900 dark:text-yellow-100" />
      <span className="text-xs md:text-sm font-bold text-yellow-900 dark:text-yellow-100">
        {teacherClassCount.total}
      </span>
    </button>

    {showClassCountModal && (
      <ClassCountModal
        teacherId={user._id}
        onClose={() => setShowClassCountModal(false)}
      />
    )}
  </>
)}
```

#### Step 5: Moderator Interface for Setting Cycles

**Create `components/teacher-cycle-editor.tsx`:**

```tsx
"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Calendar, Save } from "lucide-react";
import { useState } from "react";

interface TeacherCycleEditorProps {
  teacherId: Id<"users">;
  teacherName: string;
  moderatorId: Id<"users">;
  onComplete: () => void;
}

export function TeacherCycleEditor({
  teacherId,
  teacherName,
  moderatorId,
  onComplete,
}: TeacherCycleEditorProps) {
  const { t, language } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [notesTh, setNotesTh] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const setTeacherCycle = useMutation(api.teacherClassCount.setTeacherCycle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.warning("Please select start and end dates", "กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
      return;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate + "T23:59:59").getTime();

    if (start >= end) {
      toast.error("Start date must be before end date", "วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด");
      return;
    }

    setIsSaving(true);

    try {
      await setTeacherCycle({
        teacherId,
        cycleStartDate: start,
        cycleEndDate: end,
        notes: notes.trim() || undefined,
        notesTh: notesTh.trim() || undefined,
        moderatorId,
      });

      toast.success(
        `ClassCount cycle updated for ${teacherName}`,
        `อัปเดตรอบการนับชั้นเรียนสำหรับ ${teacherName} แล้ว`
      );

      onComplete();
    } catch (error) {
      console.error("Failed to set cycle:", error);
      toast.error("Failed to update cycle", "อัปเดตรอบล้มเหลว");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t(`Set ClassCount Cycle for ${teacherName}`, `ตั้งรอบการนับชั้นเรียนสำหรับ ${teacherName}`)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            "Define the date range for tracking this teacher's ClassCount",
            "กำหนดช่วงวันที่สำหรับติดตาม ClassCount ของครูคนนี้"
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Start Date", "วันที่เริ่มต้น")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("End Date", "วันที่สิ้นสุด")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Notes (English)", "หมายเหตุ (ภาษาอังกฤษ)")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("Optional notes about this cycle", "หมายเหตุเกี่ยวกับรอบนี้ (ไม่บังคับ)")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Notes (Thai)", "หมายเหตุ (ภาษาไทย)")}
        </label>
        <textarea
          value={notesTh}
          onChange={(e) => setNotesTh(e.target.value)}
          placeholder={t("Optional notes about this cycle", "หมายเหตุเกี่ยวกับรอบนี้ (ไม่บังคับ)")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
          rows={2}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
      >
        {isSaving ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            {t("Save Cycle", "บันทึกรอบ")}
          </>
        )}
      </button>
    </form>
  );
}
```

---

## Testing Checklist

### Feature 1: Screenshots

- [ ] Upload PNG/JPG/WebP files successfully
- [ ] File size validation (5MB limit)
- [ ] File type validation (images only)
- [ ] Preview uploaded screenshot before submit
- [ ] Remove selected file
- [ ] Admin can view screenshots in requests
- [ ] Screenshot displays with correct aspect ratio
- [ ] Download/open screenshot in new tab
- [ ] Works on mobile (camera upload)
- [ ] Bilingual error messages

### Feature 2: ClassCount Modal

- [ ] Badge is clickable for teachers
- [ ] Modal shows disclaimer correctly
- [ ] Cycle dates display (custom or default month)
- [ ] Classes list shows all details
- [ ] Show All button works for 5+ classes
- [ ] Empty state when no classes
- [ ] Moderator can set cycle dates
- [ ] Teacher receives notification on cycle update
- [ ] Total calculation matches badge
- [ ] Bilingual content throughout
- [ ] Responsive on mobile/tablet/desktop
- [ ] Teachers Log link noted in footer

---

## Deployment Steps

1. **Deploy Schema Changes**

   ```powershell
   # Deploy Convex schema first
   npx convex deploy
   ```

2. **Deploy Backend Functions**
   - Convex automatically deploys all functions

3. **Deploy Frontend**

   ```powershell
   # Build Next.js
   npm run build
   
   # Deploy to Vercel (if using Vercel)
   vercel --prod
   ```

4. **Test in Production**
   - Test screenshot upload
   - Test ClassCount modal
   - Test moderator cycle editor

---

## Post-Implementation Documentation

After completing both features, create:

**`IMPLEMENTATION_SUMMARY_SCREENSHOTS_CLASSCOUNT_OCT_23_2025.md`**

- Files created/modified
- Testing results
- Screenshots/demos
- Known issues
- Future enhancements

**Update `.github/copilot-instructions.md`**

- Add ClassCount modal pattern
- Add Convex file storage pattern
- Document new schema tables
- Add testing procedures

---

## Estimated Timeline

**Feature 1 (Screenshots):**

- Schema + Backend: 1-2 hours
- Frontend Form: 2-3 hours
- Admin View: 1-2 hours
- Testing: 1 hour
- **Total: ~6-8 hours**

**Feature 2 (ClassCount Modal):**

- Schema + Backend: 2-3 hours
- Modal Component: 3-4 hours
- Moderator Editor: 2-3 hours
- Integration: 1-2 hours
- Testing: 1-2 hours
- **Total: ~9-14 hours**

**Combined: ~15-22 hours** (2-3 days of focused work)

---

## Next Steps

1. **Review this plan** - Confirm requirements and approach
2. **Schema updates** - Deploy schema changes first
3. **Backend implementation** - Add mutations/queries
4. **Frontend components** - Build UI components
5. **Integration** - Connect components to backend
6. **Testing** - Comprehensive testing
7. **Documentation** - Update instructions and summaries
8. **Deploy** - Production deployment

Would you like me to proceed with implementation, or would you like to discuss any modifications to this plan?
