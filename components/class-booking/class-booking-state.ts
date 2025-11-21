import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { UserRole } from "@/lib/types";
import { useState } from "react";

export interface ConflictClass {
    _id: Id<"classes">;
    studentId: Id<"students">;
    additionalStudentIds?: Id<"students">[];
    locationId?: Id<"locations">;
    scheduledDate: number;
    status: string;
    student: Partial<Doc<"students">> & { _id: Id<"students">; firstName: string; lastName: string } | null;
    location: Partial<Doc<"locations">> & { _id: Id<"locations">; name: string; nameTh: string } | null;
    teacherId: Id<"users">;
    schoolId?: Id<"schools">;
}

export type PendingBookingData = {
    teacherId: Id<"users">;
    schoolId?: Id<"schools">;
    studentId: Id<"students">;
    locationId?: Id<"locations">;
    pendingLocationName?: string;
    pendingLocationNameTh?: string;
    scheduledDate: number;
    bookedByUserId: Id<"users">;
    guardianTitle?: string;
    duration?: number;
    subject?: string;
    subjectTh?: string;
    lessonTopic?: string;
    lessonTopicTh?: string;
    materials?: string;
    materialsTh?: string;
    preparationNotes?: string;
    preparationNotesTh?: string;
    classType?: "regular" | "makeup" | "trial" | "assessment";
};

export function useClassBookingState(userId: Id<"users">, userRole: UserRole, userSchoolId?: Id<"schools">) {
    // Form Selection State
    const [studentId, setStudentId] = useState<Id<"students"> | "">("");
    const [schoolId, setSchoolId] = useState<Id<"schools"> | "">(
        userRole === "moderator" && userSchoolId ? userSchoolId : ""
    );
    const [providerId, setProviderId] = useState<Id<"providers"> | "">("");
    const [locationId, setLocationId] = useState<Id<"locations"> | "">("");
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">(
        userRole === "teacher" ? userId : ""
    );

    // Date & Time State
    const [scheduledDate, setScheduledDate] = useState("");
    const [selectedDates, setSelectedDates] = useState<number[]>([]);
    const [selectedTime, setSelectedTime] = useState("09:00");
    const [showCalendar, setShowCalendar] = useState(false);
    const [isRecurringWeekly, setIsRecurringWeekly] = useState(false);
    const [recurringWeeks, setRecurringWeeks] = useState(12);

    // Location Request State
    const [pendingLocationName, setPendingLocationName] = useState("");
    const [pendingLocationNameTh, setPendingLocationNameTh] = useState("");
    const [requestingNewLocation, setRequestingNewLocation] = useState(false);
    const [showProposalForm, setShowProposalForm] = useState(false);

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showCreateProvider, setShowCreateProvider] = useState(false);

    // Modal States
    const [editingClass, setEditingClass] = useState<Doc<"classes"> | null>(null);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Conflict Detection State
    const [conflictingClasses, setConflictingClasses] = useState<ConflictClass[]>([]);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState<PendingBookingData | null>(null);

    // Optional Fields State
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

    // Student Creation State
    const [creatingStudent, setCreatingStudent] = useState(false);
    const [studentType, setStudentType] = useState<"school" | "guardian">("school");
    const [newStudentNickname, setNewStudentNickname] = useState("");
    const [newStudentGrade, setNewStudentGrade] = useState("");
    const [newStudentClass, setNewStudentClass] = useState("");
    const [newStudentSchoolId, setNewStudentSchoolId] = useState<Id<"schools"> | "">("");
    const [guardianBirthDate, setGuardianBirthDate] = useState("");
    const [guardianArea, setGuardianArea] = useState("");
    const [newGuardianName, setNewGuardianName] = useState("");
    const [newGuardianPhone, setNewGuardianPhone] = useState("");
    const [guardianTitle, setGuardianTitle] = useState("");

    // Location Creation State
    const [creatingLocation, setCreatingLocation] = useState(false);
    const [newLocationName, setNewLocationName] = useState("");
    const [newLocationNameTh, setNewLocationNameTh] = useState("");

    // Confirmation Dialog States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<Id<"classes"> | null>(null);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [pendingRejectId, setPendingRejectId] = useState<Id<"classes"> | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // Filter States
    const [filterTeacherId, setFilterTeacherId] = useState<Id<"users"> | "all">("all");
    const [filterSchoolId, setFilterSchoolId] = useState<Id<"schools"> | "all">("all");
    const [filterStudentId, setFilterStudentId] = useState<Id<"students"> | "all">("all");
    const [filterGrade, setFilterGrade] = useState<string>("all");
    const [filterClass, setFilterClass] = useState<string>("all");
    const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState(false);
    const [expandedStudents, setExpandedStudents] = useState<Set<Id<"students">>>(new Set());

    return {
        // Form Selection
        studentId, setStudentId,
        schoolId, setSchoolId,
        providerId, setProviderId,
        locationId, setLocationId,
        selectedTeacherId, setSelectedTeacherId,

        // Date & Time
        scheduledDate, setScheduledDate,
        selectedDates, setSelectedDates,
        selectedTime, setSelectedTime,
        showCalendar, setShowCalendar,
        isRecurringWeekly, setIsRecurringWeekly,
        recurringWeeks, setRecurringWeeks,

        // Location Request
        pendingLocationName, setPendingLocationName,
        pendingLocationNameTh, setPendingLocationNameTh,
        requestingNewLocation, setRequestingNewLocation,
        showProposalForm, setShowProposalForm,

        // UI
        showForm, setShowForm,
        loading, setLoading,
        error, setError,
        showCreateProvider, setShowCreateProvider,

        // Modals
        editingClass, setEditingClass,
        showMergeModal, setShowMergeModal,
        showAnalytics, setShowAnalytics,

        // Conflict Detection
        conflictingClasses, setConflictingClasses,
        showConflictModal, setShowConflictModal,
        pendingBookingData, setPendingBookingData,

        // Optional Fields
        duration, setDuration,
        subject, setSubject,
        subjectTh, setSubjectTh,
        lessonTopic, setLessonTopic,
        lessonTopicTh, setLessonTopicTh,
        materials, setMaterials,
        materialsTh, setMaterialsTh,
        preparationNotes, setPreparationNotes,
        preparationNotesTh, setPreparationNotesTh,
        classType, setClassType,

        // Student Creation
        creatingStudent, setCreatingStudent,
        studentType, setStudentType,
        newStudentNickname, setNewStudentNickname,
        newStudentGrade, setNewStudentGrade,
        newStudentClass, setNewStudentClass,
        newStudentSchoolId, setNewStudentSchoolId,
        guardianBirthDate, setGuardianBirthDate,
        guardianArea, setGuardianArea,
        newGuardianName, setNewGuardianName,
        newGuardianPhone, setNewGuardianPhone,
        guardianTitle, setGuardianTitle,

        // Location Creation
        creatingLocation, setCreatingLocation,
        newLocationName, setNewLocationName,
        newLocationNameTh, setNewLocationNameTh,

        // Confirmation Dialogs
        showDeleteConfirm, setShowDeleteConfirm,
        pendingDeleteId, setPendingDeleteId,
        showRejectDialog, setShowRejectDialog,
        pendingRejectId, setPendingRejectId,
        rejectionReason, setRejectionReason,

        // Filters
        filterTeacherId, setFilterTeacherId,
        filterSchoolId, setFilterSchoolId,
        filterStudentId, setFilterStudentId,
        filterGrade, setFilterGrade,
        filterClass, setFilterClass,
        isFilterPanelExpanded, setIsFilterPanelExpanded,
        expandedStudents, setExpandedStudents,
    };
}
