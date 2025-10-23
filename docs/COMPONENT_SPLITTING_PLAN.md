# Component Splitting Implementation Plan

## October 24, 2025

**Goal**: Refactor 2 large monolithic components into maintainable sub-components for better performance, testing, and code organization.

---

## Executive Summary

### Current State

- **class-booking.tsx**: 1,939 lines (8 distinct responsibilities)
- **student-management.tsx**: 1,056 lines (5 distinct responsibilities)
- **Total Complexity**: 2,995 lines of tightly-coupled UI logic

### Target State

- **class-booking.tsx**: ~200 lines (coordinator only)
- **student-management.tsx**: ~150 lines (coordinator only)
- **13 new sub-components**: Average 100-150 lines each
- **5 custom hooks**: Shared logic extraction
- **Performance improvement**: 30-50% fewer re-renders via React.memo

### Benefits

1. ✅ **Easier Testing**: Unit test small components independently
2. ✅ **Better Performance**: React.memo prevents unnecessary re-renders
3. ✅ **Simpler Debugging**: Isolate issues to specific sub-components
4. ✅ **Code Reusability**: Share components across features
5. ✅ **Onboarding**: New developers understand small components faster
6. ✅ **Maintainability**: Change one component without affecting others

---

## Part 1: class-booking.tsx (1,939 lines → 8 components)

### Current Structure Analysis

```typescript
// class-booking.tsx (1,939 lines)
├── State Management (26 useState calls)
│   ├── Form state (school, student, location, date)
│   ├── Optional fields (duration, subject, materials, etc.)
│   ├── Student creation state
│   ├── Modal states (conflict, edit, merge, delete, reject)
│   └── Loading/error states
│
├── Form UI (~800 lines)
│   ├── School selection (Step 1)
│   ├── Teacher selection (Step 2 - Admin/Mod only)
│   ├── Student selection (Step 3)
│   ├── Location selection (Step 4)
│   ├── Date/Time picker (Step 5)
│   ├── Optional fields section (collapsible)
│   ├── New location request fields
│   └── Student creation inline form
│
├── Class List Rendering (~300 lines)
│   └── ClassItemDisplay component (539 lines)
│       ├── Student info display
│       ├── Additional students (multi-student classes)
│       ├── Add student form
│       ├── Remove student confirmation
│       ├── Status badges
│       ├── Edit/Delete buttons
│       └── Cancellation request form
│
├── Event Handlers (~200 lines)
│   ├── handleBookClass (multi-date logic)
│   ├── handleMergeFromConflict
│   ├── handleCreateSeparateFromConflict
│   ├── handleAcknowledge/Approve/Reject/Delete
│   ├── handleRequestCancellation
│   └── handleCreateStudent
│
└── Modals (~200 lines)
    ├── EditClassModal (external)
    ├── LocationProposalForm (external)
    ├── MergeClassesModal (external)
    ├── ClassConflictModal (external)
    ├── Delete confirmation dialog
    └── Reject reason dialog
```

### Proposed Component Hierarchy

```
components/
├── class-booking/
│   ├── index.tsx (200 lines) ← Main coordinator
│   ├── BookingForm.tsx (350 lines) ← Steps 1-5
│   ├── OptionalFieldsSection.tsx (150 lines) ← Collapsible extras
│   ├── StudentCreationForm.tsx (120 lines) ← Inline student creation
│   ├── NewLocationRequest.tsx (100 lines) ← Pending location fields
│   ├── ClassList.tsx (150 lines) ← List wrapper with loading state
│   ├── ClassCard.tsx (400 lines) ← Individual class display
│   ├── AddStudentSection.tsx (120 lines) ← Add student to existing class
│   ├── CancellationRequestForm.tsx (100 lines) ← Teacher cancellation
│   ├── ActionButtons.tsx (150 lines) ← Status-based action buttons
│   └── DeleteConfirmDialog.tsx (80 lines) ← Reusable confirmation
│
├── hooks/
│   ├── useBookingForm.ts (200 lines) ← Form state & validation
│   ├── useClassActions.ts (150 lines) ← acknowledge/approve/reject/delete
│   ├── useStudentManagement.ts (100 lines) ← add/remove students logic
│   └── useConflictDetection.ts (80 lines) ← Conflict modal logic
```

### Step-by-Step Migration Plan

#### Step 1: Extract Custom Hooks (Foundation)

**File**: `lib/hooks/useBookingForm.ts`

```typescript
"use client";

import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { UserRole } from "@/lib/types";

export function useBookingForm(userId: Id<"users">, userRole: UserRole, userSchoolId?: Id<"schools">) {
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<Id<"students"> | "">("");
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">(
    userRole === "moderator" && userSchoolId ? userSchoolId : ""
  );
  const [locationId, setLocationId] = useState<Id<"locations"> | "">("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">(
    userRole === "teacher" ? userId : ""
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [guardianTitle, setGuardianTitle] = useState("");

  // Location request state
  const [requestingNewLocation, setRequestingNewLocation] = useState(false);
  const [pendingLocationName, setPendingLocationName] = useState("");
  const [pendingLocationNameTh, setPendingLocationNameTh] = useState("");
  const [showProposalForm, setShowProposalForm] = useState(false);

  // Optional fields state
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [duration, setDuration] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectTh, setSubjectTh] = useState("");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonTopicTh, setLessonTopicTh] = useState("");
  const [materials, setMaterials] = useState("");
  const [materialsTh, setMaterialsTh] = useState("");
  const [preparationNotes, setPreparationNotes] = useState("");
  const [preparationNotesTh, setPreparationNotesTh] = useState("");
  const [classType, setClassType] = useState<"regular" | "makeup" | "trial" | "assessment">("regular");

  // Loading & error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form validation
  const isFormValid =
    studentId &&
    schoolId &&
    (locationId || requestingNewLocation) &&
    (requestingNewLocation ? (pendingLocationName.trim() || pendingLocationNameTh.trim()) : true) &&
    (selectedDates.length > 0 || scheduledDate) &&
    ((userRole === "admin" || userRole === "moderator") ? selectedTeacherId : true);

  // Reset form
  const resetForm = () => {
    setStudentId("");
    setSchoolId("");
    setLocationId("");
    setScheduledDate("");
    setSelectedDates([]);
    setSelectedTime("09:00");
    setPendingLocationName("");
    setPendingLocationNameTh("");
    setRequestingNewLocation(false);
    setShowCalendar(false);
    setShowForm(false);
    setGuardianTitle("");
    if (userRole === "admin" || userRole === "moderator") {
      setSelectedTeacherId("");
    }
    setShowOptionalFields(false);
    setDuration("");
    setSubject("");
    setSubjectTh("");
    setLessonTopic("");
    setLessonTopicTh("");
    setMaterials("");
    setMaterialsTh("");
    setPreparationNotes("");
    setPreparationNotesTh("");
    setClassType("regular");
  };

  // Get optional fields for submission
  const getOptionalFields = () => ({
    ...(duration ? { duration: Number.parseInt(duration) } : {}),
    ...(subject ? { subject, subjectTh } : {}),
    ...(lessonTopic ? { lessonTopic, lessonTopicTh } : {}),
    ...(materials ? { materials, materialsTh } : {}),
    ...(preparationNotes ? { preparationNotes, preparationNotesTh } : {}),
    ...(classType !== "regular" ? { classType } : {}),
  });

  return {
    // State
    showForm,
    studentId,
    schoolId,
    locationId,
    selectedTeacherId,
    scheduledDate,
    selectedDates,
    selectedTime,
    showCalendar,
    guardianTitle,
    requestingNewLocation,
    pendingLocationName,
    pendingLocationNameTh,
    showProposalForm,
    showOptionalFields,
    duration,
    subject,
    subjectTh,
    lessonTopic,
    lessonTopicTh,
    materials,
    materialsTh,
    preparationNotes,
    preparationNotesTh,
    classType,
    loading,
    error,
    isFormValid,

    // Setters
    setShowForm,
    setStudentId,
    setSchoolId,
    setLocationId,
    setSelectedTeacherId,
    setScheduledDate,
    setSelectedDates,
    setSelectedTime,
    setShowCalendar,
    setGuardianTitle,
    setRequestingNewLocation,
    setPendingLocationName,
    setPendingLocationNameTh,
    setShowProposalForm,
    setShowOptionalFields,
    setDuration,
    setSubject,
    setSubjectTh,
    setLessonTopic,
    setLessonTopicTh,
    setMaterials,
    setMaterialsTh,
    setPreparationNotes,
    setPreparationNotesTh,
    setClassType,
    setLoading,
    setError,

    // Methods
    resetForm,
    getOptionalFields,
  };
}
```

**File**: `lib/hooks/useClassActions.ts`

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "@/lib/toast";
import { useState } from "react";

export function useClassActions(userId: Id<"users">) {
  const acknowledgeClass = useMutation(api.classes.acknowledge);
  const approveClass = useMutation(api.classes.approve);
  const rejectClass = useMutation(api.classes.reject);
  const deleteClass = useMutation(api.classes.deleteClass);
  const requestCancellation = useMutation(api.cancellationRequests.create);

  // Reject dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<Id<"classes"> | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Delete dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"classes"> | null>(null);

  const handleAcknowledge = async (classId: Id<"classes">) => {
    try {
      await acknowledgeClass({ userId, classId });
      toast.success("Class acknowledged", "รับทราบคลาสแล้ว");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to acknowledge class",
        err instanceof Error ? err.message : "ไม่สามารถรับทราบคลาสได้"
      );
    }
  };

  const handleApprove = async (classId: Id<"classes">) => {
    try {
      await approveClass({ userId, classId });
      toast.success("Class approved", "อนุมัติคลาสแล้ว");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve class",
        err instanceof Error ? err.message : "ไม่สามารถอนุมัติคลาสได้"
      );
    }
  };

  const handleReject = (classId: Id<"classes">) => {
    setPendingRejectId(classId);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!pendingRejectId || !rejectionReason.trim()) {
      toast.error("Please enter a reason", "กรุณาระบุเหตุผล");
      return;
    }

    try {
      await rejectClass({ userId, classId: pendingRejectId, reason: rejectionReason, reasonTh: rejectionReason });
      toast.success("Class rejected", "ปฏิเสธคลาสแล้ว");
      setShowRejectDialog(false);
      setPendingRejectId(null);
      setRejectionReason("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject class",
        err instanceof Error ? err.message : "ไม่สามารถปฏิเสธคลาสได้"
      );
    }
  };

  const handleDelete = (classId: Id<"classes">) => {
    setPendingDeleteId(classId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteClass({ classId: pendingDeleteId, userId });
      toast.success("Class deleted successfully", "ลบคลาสสำเร็จแล้ว");
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete class",
        err instanceof Error ? err.message : "ไม่สามารถลบคลาสได้"
      );
    }
  };

  const handleRequestCancellation = async (classId: Id<"classes">, reason: string, reasonTh: string) => {
    try {
      await requestCancellation({
        classId,
        teacherId: userId,
        requestType: "cancel",
        reason,
        reasonTh,
      });
      toast.success("Cancellation request submitted", "ส่งคำขอยกเลิกแล้ว");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit cancellation request",
        err instanceof Error ? err.message : "ไม่สามารถส่งคำขอยกเลิกได้"
      );
    }
  };

  return {
    handleAcknowledge,
    handleApprove,
    handleReject,
    confirmReject,
    handleDelete,
    confirmDelete,
    handleRequestCancellation,

    // Dialog states
    showRejectDialog,
    setShowRejectDialog,
    pendingRejectId,
    rejectionReason,
    setRejectionReason,
    showDeleteConfirm,
    setShowDeleteConfirm,
    pendingDeleteId,
  };
}
```

#### Step 2: Extract Sub-Components

**File**: `components/class-booking/OptionalFieldsSection.tsx`

```typescript
"use client";

import { useLanguage } from "@/lib/language-context";
import { ChevronDown, ChevronUp } from "lucide-react";

interface OptionalFieldsSectionProps {
  show: boolean;
  onToggle: () => void;
  duration: string;
  setDuration: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  subjectTh: string;
  setSubjectTh: (value: string) => void;
  lessonTopic: string;
  setLessonTopic: (value: string) => void;
  lessonTopicTh: string;
  setLessonTopicTh: (value: string) => void;
  materials: string;
  setMaterials: (value: string) => void;
  materialsTh: string;
  setMaterialsTh: (value: string) => void;
  preparationNotes: string;
  setPreparationNotes: (value: string) => void;
  preparationNotesTh: string;
  setPreparationNotesTh: (value: string) => void;
  classType: "regular" | "makeup" | "trial" | "assessment";
  setClassType: (value: "regular" | "makeup" | "trial" | "assessment") => void;
}

export function OptionalFieldsSection({
  show,
  onToggle,
  duration,
  setDuration,
  subject,
  setSubject,
  subjectTh,
  setSubjectTh,
  lessonTopic,
  setLessonTopic,
  lessonTopicTh,
  setLessonTopicTh,
  materials,
  setMaterials,
  materialsTh,
  setMaterialsTh,
  preparationNotes,
  setPreparationNotes,
  preparationNotesTh,
  setPreparationNotesTh,
  classType,
  setClassType,
}: OptionalFieldsSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
      >
        <span className="text-sm font-medium">
          {t("Additional Class Details (Optional)", "รายละเอียดเพิ่มเติม (ไม่บังคับ)")}
        </span>
        {show ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {show && (
        <div className="p-4 space-y-4">
          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium mb-2">
              {t("Duration (minutes)", "ระยะเวลา (นาที)")}
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          {/* Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                {t("Subject (English)", "วิชา (อังกฤษ)")}
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("e.g., Math", "เช่น คณิตศาสตร์")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="subjectTh" className="block text-sm font-medium mb-2">
                {t("Subject (Thai)", "วิชา (ไทย)")}
              </label>
              <input
                type="text"
                id="subjectTh"
                value={subjectTh}
                onChange={(e) => setSubjectTh(e.target.value)}
                placeholder={t("e.g., คณิตศาสตร์", "เช่น คณิตศาสตร์")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Lesson Topic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lessonTopic" className="block text-sm font-medium mb-2">
                {t("Lesson Topic (English)", "หัวข้อบทเรียน (อังกฤษ)")}
              </label>
              <input
                type="text"
                id="lessonTopic"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                placeholder={t("e.g., Fractions", "เช่น เศษส่วน")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="lessonTopicTh" className="block text-sm font-medium mb-2">
                {t("Lesson Topic (Thai)", "หัวข้อบทเรียน (ไทย)")}
              </label>
              <input
                type="text"
                id="lessonTopicTh"
                value={lessonTopicTh}
                onChange={(e) => setLessonTopicTh(e.target.value)}
                placeholder={t("e.g., เศษส่วน", "เช่น เศษส่วน")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Materials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="materials" className="block text-sm font-medium mb-2">
                {t("Materials Needed (English)", "อุปกรณ์ที่ต้องใช้ (อังกฤษ)")}
              </label>
              <textarea
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                rows={2}
                placeholder={t("e.g., Textbook, calculator", "เช่น หนังสือเรียน, เครื่องคิดเลข")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="materialsTh" className="block text-sm font-medium mb-2">
                {t("Materials Needed (Thai)", "อุปกรณ์ที่ต้องใช้ (ไทย)")}
              </label>
              <textarea
                id="materialsTh"
                value={materialsTh}
                onChange={(e) => setMaterialsTh(e.target.value)}
                rows={2}
                placeholder={t("e.g., หนังสือเรียน, เครื่องคิดเลข", "เช่น หนังสือเรียน, เครื่องคิดเลข")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Preparation Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preparationNotes" className="block text-sm font-medium mb-2">
                {t("Preparation Notes (English)", "หมายเหตุการเตรียมการ (อังกฤษ)")}
              </label>
              <textarea
                id="preparationNotes"
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
                rows={2}
                placeholder={t("e.g., Review chapter 3", "เช่น ทบทวนบทที่ 3")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="preparationNotesTh" className="block text-sm font-medium mb-2">
                {t("Preparation Notes (Thai)", "หมายเหตุการเตรียมการ (ไทย)")}
              </label>
              <textarea
                id="preparationNotesTh"
                value={preparationNotesTh}
                onChange={(e) => setPreparationNotesTh(e.target.value)}
                rows={2}
                placeholder={t("e.g., ทบทวนบทที่ 3", "เช่น ทบทวนบทที่ 3")}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Class Type */}
          <div>
            <label htmlFor="classType" className="block text-sm font-medium mb-2">
              {t("Class Type", "ประเภทคลาส")}
            </label>
            <select
              id="classType"
              value={classType}
              onChange={(e) => setClassType(e.target.value as typeof classType)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="regular">{t("Regular", "ปกติ")}</option>
              <option value="makeup">{t("Makeup", "ชดเชย")}</option>
              <option value="trial">{t("Trial", "ทดลอง")}</option>
              <option value="assessment">{t("Assessment", "ประเมินผล")}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
```

*(Continue with 6 more sub-components...)*

#### Step 3: Update Main Coordinator

**File**: `components/class-booking/index.tsx` (NEW - 200 lines)

```typescript
"use client";

import { useBookingForm } from "@/lib/hooks/useBookingForm";
import { useClassActions } from "@/lib/hooks/useClassActions";
import { BookingForm } from "./BookingForm";
import { ClassList } from "./ClassList";
import { EditClassModal } from "../edit-class-modal";
import { MergeClassesModal } from "../merge-classes-modal";
import { ClassConflictModal } from "../class-conflict-modal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { RejectDialog } from "./RejectDialog";
import type { Id } from "@/convex/_generated/dataModel";
import type { UserRole } from "@/lib/types";

interface ClassBookingProps {
  userId: Id<"users">;
  userRole: UserRole;
  userSchoolId?: Id<"schools">;
}

export function ClassBooking({ userId, userRole, userSchoolId }: ClassBookingProps) {
  const bookingForm = useBookingForm(userId, userRole, userSchoolId);
  const classActions = useClassActions(userId);

  // ... rest of coordinator logic (query orchestration, modal state, event delegation)

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-4 md:p-4">
      {/* Header */}
      {/* ... */}

      {/* Booking Form */}
      {bookingForm.showForm && (
        <BookingForm
          {...bookingForm}
          userId={userId}
          userRole={userRole}
          onSubmit={handleBookClass}
          onCancel={() => bookingForm.setShowForm(false)}
        />
      )}

      {/* Classes List */}
      <ClassList
        classes={classes}
        userId={userId}
        userRole={userRole}
        onAcknowledge={classActions.handleAcknowledge}
        onApprove={classActions.handleApprove}
        onReject={classActions.handleReject}
        onDelete={classActions.handleDelete}
        onRequestCancellation={classActions.handleRequestCancellation}
        onEdit={setEditingClass}
      />

      {/* Modals */}
      {editingClass && <EditClassModal {...} />}
      {showConflictModal && <ClassConflictModal {...} />}
      {classActions.showDeleteConfirm && <DeleteConfirmDialog {...} />}
      {classActions.showRejectDialog && <RejectDialog {...} />}
    </div>
  );
}
```

---

## Part 2: student-management.tsx (1,056 lines → 5 components)

### Current Structure Analysis

```typescript
// student-management.tsx (1,056 lines)
├── State Management (12 useState calls)
│   ├── Filter state (search, school, grade, class, status)
│   ├── Student creation form state
│   ├── Edit student state
│   ├── Bulk selection state
│   └── Modal states (delete confirm, bulk delete confirm)
│
├── Student Form (~300 lines)
│   ├── Create new student
│   ├── Edit existing student
│   ├── Bilingual input fields
│   ├── School selection
│   └── Validation logic
│
├── Filter Controls (~150 lines)
│   ├── Search bar
│   ├── School dropdown
│   ├── Grade dropdown
│   ├── Class dropdown
│   └── Status toggle (active/inactive)
│
├── Student Table (~400 lines)
│   ├── Table headers with sorting
│   ├── Student rows
│   ├── Edit/Delete buttons
│   ├── Bulk selection checkboxes
│   └── Empty state
│
└── Bulk Actions (~200 lines)
    ├── Select all/none
    ├── Bulk delete with confirmation
    ├── Bulk export (future)
    └── Reason prompt dialog
```

### Proposed Component Hierarchy

```
components/
├── student-management/
│   ├── index.tsx (150 lines) ← Main coordinator
│   ├── StudentForm.tsx (300 lines) ← Create/Edit form
│   ├── FilterControls.tsx (150 lines) ← Search & filters
│   ├── StudentTable.tsx (200 lines) ← Table wrapper
│   ├── StudentTableRow.tsx (150 lines) ← Individual row
│   └── BulkActions.tsx (100 lines) ← Bulk operations toolbar
│
├── hooks/
│   └── useStudentFilters.ts (80 lines) ← Filter logic
```

*(Detailed implementation similar to class-booking pattern)*

---

## Performance Optimization Strategy

### React.memo Wrapping Rules

```typescript
// ✅ WRAP THESE - Expensive or frequently re-rendered
export const OptionalFieldsSection = React.memo(OptionalFieldsSectionComponent);
export const StudentTable = React.memo(StudentTableComponent);
export const ClassCard = React.memo(ClassCardComponent);

// ❌ DON'T WRAP - Already optimized or change frequently
// Main coordinator components (ClassBooking, StudentManagement)
// Components with useQuery hooks (data always changes)
```

### useMemo / useCallback Targets

```typescript
// Expensive computations
const filteredStudents = useMemo(() => {
  return students.filter(/* complex filter logic */);
}, [students, searchTerm, schoolId, grade]);

// Event handlers passed to children
const handleEdit = useCallback((id: Id<"students">) => {
  // ... edit logic
}, [/* dependencies */]);
```

### Expected Performance Gains

- **Initial Render**: No change (same total work)
- **Re-renders**: 30-50% reduction (React.memo prevents child re-renders when props unchanged)
- **Editing Forms**: 60-80% faster (isolated state updates don't affect parent)
- **Bundle Size**: +5-10 KB (more files, but lazy-loadable in future)

---

## Testing Strategy

### Unit Testing (New Capability)

```typescript
// tests/components/OptionalFieldsSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionalFieldsSection } from '@/components/class-booking/OptionalFieldsSection';

describe('OptionalFieldsSection', () => {
  it('should toggle visibility on button click', () => {
    const onToggle = jest.fn();
    render(<OptionalFieldsSection show={false} onToggle={onToggle} {...mockProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should update duration input', () => {
    const setDuration = jest.fn();
    render(<OptionalFieldsSection show={true} setDuration={setDuration} {...mockProps} />);
    fireEvent.change(screen.getByLabelText(/Duration/), { target: { value: '90' } });
    expect(setDuration).toHaveBeenCalledWith('90');
  });
});
```

### Integration Testing Checklist

- [ ] Book single class → verify in class list
- [ ] Book multiple classes (multi-date) → verify all created
- [ ] Conflict detection → modal appears with correct data
- [ ] Optional fields submission → verify in database
- [ ] Student creation inline → auto-select created student
- [ ] Add student to existing class → verify additional students list
- [ ] Edit class → audit trail created
- [ ] Delete class → confirmation → removed from list
- [ ] Role-based access (teacher vs moderator) → correct buttons shown
- [ ] Bilingual UI → all strings have English + Thai

---

## Migration Checklist

### Pre-Migration

- [ ] Commit current working state
- [ ] Create feature branch `refactor/component-splitting`
- [ ] Run `npm run build` → establish baseline
- [ ] Take screenshot of class booking UI for visual regression

### During Migration

- [ ] Extract hooks first (foundation)
- [ ] Extract one sub-component at a time
- [ ] Test after each extraction (compile + manual test)
- [ ] Add React.memo wrappers progressively
- [ ] Update imports in main coordinator
- [ ] Remove old code from monolith

### Post-Migration

- [ ] Run `npm run build` → verify no errors
- [ ] Visual regression test → compare screenshots
- [ ] Full workflow test (booking, editing, deleting)
- [ ] Performance test (open DevTools Profiler, compare re-renders)
- [ ] Update documentation
- [ ] Create implementation summary

---

## Rollback Plan

### If Issues Arise

```bash
# Immediate rollback (keep work in branch)
git checkout main
npm run build
npm run dev

# Fix issues in branch, then retry
git checkout refactor/component-splitting
# ... fix issues ...
npm run build  # verify
git checkout main
git merge refactor/component-splitting
```

### Partial Rollback Option

If only some components have issues:

1. Keep working sub-components
2. Restore problematic ones from main branch
3. Fix issues incrementally
4. Re-apply sub-component extraction when fixed

---

## Timeline Estimate

| Task | Duration | Cumulative |
|------|----------|------------|
| Extract hooks (2 files) | 1 hour | 1 hour |
| Extract class-booking sub-components (8 files) | 3 hours | 4 hours |
| Update class-booking coordinator | 30 min | 4.5 hours |
| Test class-booking workflows | 30 min | 5 hours |
| Extract student-management sub-components (5 files) | 2 hours | 7 hours |
| Update student-management coordinator | 30 min | 7.5 hours |
| Test student-management workflows | 30 min | 8 hours |
| Add React.memo optimizations | 30 min | 8.5 hours |
| Performance testing & benchmarking | 30 min | 9 hours |
| Documentation & implementation summary | 30 min | 9.5 hours |
| **TOTAL** | **~10 hours** | **Over 2-3 sessions** |

---

## Success Criteria

### Functional Requirements

- ✅ All existing workflows still work (no regressions)
- ✅ Bilingual UI preserved
- ✅ Role-based access preserved
- ✅ Toast notifications working
- ✅ Real-time updates via Convex working

### Non-Functional Requirements

- ✅ class-booking.tsx < 250 lines
- ✅ student-management.tsx < 200 lines
- ✅ Each sub-component < 400 lines
- ✅ 30-50% fewer re-renders (measured in DevTools Profiler)
- ✅ Production build succeeds with no new errors

### Code Quality

- ✅ TypeScript strict mode compliance
- ✅ No ESLint errors
- ✅ Consistent naming conventions
- ✅ All components have proper TypeScript interfaces
- ✅ Bilingual support in all new components

---

## Next Steps

1. **Create feature branch**: `git checkout -b refactor/component-splitting`
2. **Start with hooks extraction** (foundation for all sub-components)
3. **Extract one sub-component at a time** (test after each)
4. **Update coordinators** (remove old code, wire up new components)
5. **Add performance optimizations** (React.memo, useMemo, useCallback)
6. **Test thoroughly** (all workflows, all roles, both languages)
7. **Document results** (implementation summary, performance gains)
8. **Merge to main** (after passing all checks)

---

**Report Date**: October 24, 2025  
**Analyst**: AI Agent (GitHub Copilot)  
**Estimated Completion**: 2-3 work sessions (~10 hours total)
