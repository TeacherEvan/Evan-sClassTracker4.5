"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useDataContext } from "@/lib/data-context";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { UserRole } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Calendar, Check, ChevronDown, ChevronUp, Edit2, MapPin, Trash2, UserMinus, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { ClassConflictModal } from "./class-conflict-modal";
import { EditClassModal } from "./edit-class-modal";
import { HierarchicalStudentSelector } from "./hierarchical-student-selector";
import LocationProposalForm from "./location-proposal-form";
import { MergeClassesModal } from "./merge-classes-modal";
import { MultiDateCalendar } from "./multi-date-calendar";

interface ClassBookingProps {
  userId: Id<"users">;
  userRole: UserRole;
  userSchoolId?: Id<"schools">; // Moderator's school ID
}

export function ClassBooking({ userId, userRole, userSchoolId }: ClassBookingProps) {
  const { t } = useLanguage();
  const { schools } = useDataContext(); // Use shared context instead of individual query

  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<Id<"students"> | "">("");
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">(
    // Moderators auto-select their school, others start empty
    userRole === "moderator" && userSchoolId ? userSchoolId : ""
  );

  // Load students filtered by selected school - prevents cross-school contamination
  const students = useQuery(
    api.students.list,
    schoolId ? { schoolId: schoolId as Id<"schools"> } : "skip"
  );

  // Filter classes by role: teachers see their classes, moderators see their school's classes
  const classes = useQuery(
    api.classes.listWithDetails,
    userRole === "teacher"
      ? { teacherId: userId }
      : userRole === "moderator" && userSchoolId
        ? { schoolId: userSchoolId }
        : {}
  );
  // Query all teachers for admin/moderator to select from
  const allTeachers = useQuery(
    api.users.list,
    (userRole === "admin" || userRole === "moderator") ? { role: "teacher" } : "skip"
  );
  const bookClass = useMutation(api.classes.book);
  const bookClassWithConflictCheck = useMutation(api.classes.bookWithConflictCheck);
  const acknowledgeClass = useMutation(api.classes.acknowledge);
  const approveClass = useMutation(api.classes.approve);
  const rejectClass = useMutation(api.classes.reject);
  const deleteClass = useMutation(api.classes.deleteClass);
  const requestCancellation = useMutation(api.cancellationRequests.create);
  const createStudent = useMutation(api.students.create);
  const addStudentToClass = useMutation(api.classes.addStudentToClass);
  const createLocation = useMutation(api.locations.create);

  const [locationId, setLocationId] = useState<Id<"locations"> | "">("");
  // Teacher selection for admin/moderator
  const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">(
    userRole === "teacher" ? userId : ""
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedDates, setSelectedDates] = useState<number[]>([]); // Multi-date selection (supports 1+ dates)
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isRecurringWeekly, setIsRecurringWeekly] = useState(false); // NEW: Recurring weekly toggle
  const [recurringWeeks, setRecurringWeeks] = useState(12); // NEW: Number of weeks to repeat (default 12 weeks ~ 3 months)
  const [pendingLocationName, setPendingLocationName] = useState("");
  const [pendingLocationNameTh, setPendingLocationNameTh] = useState("");
  const [requestingNewLocation, setRequestingNewLocation] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit modal state - using Doc type from classes query
  const [editingClass, setEditingClass] = useState<Doc<"classes"> | null>(null);

  // Merge classes state
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Conflict detection state
  type ConflictClass = {
    _id: Id<"classes">;
    studentId: Id<"students">;
    additionalStudentIds?: Id<"students">[];
    locationId?: Id<"locations">;
    scheduledDate: number;
    status: string;
    student: Partial<Doc<"students">> & { _id: Id<"students">; firstName: string; lastName: string } | null;
    location: Partial<Doc<"locations">> & { _id: Id<"locations">; name: string; nameTh: string } | null;
    teacherId: Id<"users">;
    schoolId: Id<"schools">;
  };

  type PendingBookingData = {
    teacherId: Id<"users">;
    schoolId: Id<"schools">;
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

  const [conflictingClasses, setConflictingClasses] = useState<ConflictClass[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<PendingBookingData | null>(null);

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

  // Student creation state
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

  // Guardian title state
  const [guardianTitle, setGuardianTitle] = useState("");

  // Location creation state (for moderators/admins)
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationNameTh, setNewLocationNameTh] = useState("");

  // Confirmation dialog states (for parent-level modals)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"classes"> | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<Id<"classes"> | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Query locations for selected school
  const locations = useQuery(
    api.locations.list,
    schoolId ? { schoolId: schoolId as Id<"schools">, activeOnly: true } : "skip"
  );

  // Check if selected location is guardian type
  const selectedLocation = locations?.find(loc => loc._id === locationId);
  const isGuardianLocation = selectedLocation?.type === "guardian";

  // Form validation
  const isFormValid =
    studentId &&
    schoolId &&
    (locationId || requestingNewLocation) &&
    (requestingNewLocation ? (pendingLocationName.trim() || pendingLocationNameTh.trim()) : true) &&
    (selectedDates.length > 0 || scheduledDate) &&
    (isGuardianLocation ? guardianTitle.trim() : true) &&
    // Admin/Moderator must select a teacher
    ((userRole === "admin" || userRole === "moderator") ? selectedTeacherId : true);

  const handleBookClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!schoolId) {
        throw new Error("Please select a school");
      }
      if (!studentId) {
        throw new Error("Please select a student");
      }
      if (!locationId && !requestingNewLocation) {
        throw new Error("Please select a location or request a new one");
      }
      if (requestingNewLocation && !pendingLocationName.trim() && !pendingLocationNameTh.trim()) {
        throw new Error("Please provide at least one location name (English or Thai)");
      }
      // Admin/Moderator must select a teacher
      if ((userRole === "admin" || userRole === "moderator") && !selectedTeacherId) {
        throw new Error(t("Please select a teacher", "กรุณาเลือกครูผู้สอน"));
      }

      // Date booking support (supports single or multiple dates)
      const datesToBook: number[] = [];

      if (isRecurringWeekly && (selectedDates.length > 0 || scheduledDate)) {
        // Generate recurring weekly dates
        const baseDate = selectedDates.length > 0
          ? new Date(selectedDates[0])
          : new Date(scheduledDate);

        const [hours, minutes] = selectedDates.length > 0
          ? selectedTime.split(":")
          : [baseDate.getHours().toString(), baseDate.getMinutes().toString()];

        // Generate dates for each week
        for (let week = 0; week < recurringWeeks; week++) {
          const recurringDate = new Date(baseDate);
          recurringDate.setDate(baseDate.getDate() + (week * 7)); // Add 7 days per week
          recurringDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
          datesToBook.push(recurringDate.getTime());
        }
      } else if (selectedDates.length > 0) {
        // Use selected dates from multi-date calendar with selected time
        for (const dateTimestamp of selectedDates) {
          const date = new Date(dateTimestamp);
          const [hours, minutes] = selectedTime.split(":");
          date.setHours(Number.parseInt(hours), Number.parseInt(minutes));
          datesToBook.push(date.getTime());
        }
      } else if (scheduledDate) {
        // Fallback to manual datetime-local input
        datesToBook.push(new Date(scheduledDate).getTime());
      } else {
        throw new Error("Please select at least one date");
      }

      // Validate guardian title if guardian location selected
      if (isGuardianLocation && !guardianTitle.trim()) {
        throw new Error(t(
          "Please enter the guardian's title (e.g., Mom, Dad, Grandma)",
          "กรุณาระบุความสัมพันธ์กับผู้ปกครอง (เช่น แม่, พ่อ, ยาย)"
        ));
      }

      // Prepare optional fields (only include if filled)
      const optionalFields = {
        ...(duration ? { duration: Number.parseInt(duration) } : {}),
        ...(subject ? { subject, subjectTh } : {}),
        ...(lessonTopic ? { lessonTopic, lessonTopicTh } : {}),
        ...(materials ? { materials, materialsTh } : {}),
        ...(preparationNotes ? { preparationNotes, preparationNotesTh } : {}),
        ...(classType !== "regular" ? { classType } : {}),
      };

      // Determine the teacher ID (use selected teacher for admin/mod, or current user for teachers)
      const effectiveTeacherId = (userRole === "admin" || userRole === "moderator")
        ? (selectedTeacherId as Id<"users">)
        : userId;

      // For multiple dates, book all without conflict checking (to avoid complex UX)
      if (datesToBook.length > 1) {
        const bookingPromises = datesToBook.map(timestamp =>
          bookClass({
            teacherId: effectiveTeacherId,
            schoolId: schoolId as Id<"schools">,
            studentId: studentId as Id<"students">,
            locationId: locationId ? (locationId as Id<"locations">) : undefined,
            pendingLocationName: requestingNewLocation ? pendingLocationName : undefined,
            pendingLocationNameTh: requestingNewLocation ? pendingLocationNameTh : undefined,
            scheduledDate: timestamp,
            bookedByUserId: userId,
            guardianTitle: isGuardianLocation ? guardianTitle : undefined,
            ...optionalFields,
          })
        );

        await Promise.all(bookingPromises);
        toast.success(
          `Successfully booked ${datesToBook.length} classes!`,
          `จองคลาสสำเร็จแล้ว ${datesToBook.length} คลาส!`
        );
      } else {
        // For single date, use conflict checking
        const result = await bookClassWithConflictCheck({
          teacherId: effectiveTeacherId,
          schoolId: schoolId as Id<"schools">,
          studentId: studentId as Id<"students">,
          locationId: locationId ? (locationId as Id<"locations">) : undefined,
          pendingLocationName: requestingNewLocation ? pendingLocationName : undefined,
          pendingLocationNameTh: requestingNewLocation ? pendingLocationNameTh : undefined,
          scheduledDate: datesToBook[0],
          bookedByUserId: userId,
          guardianTitle: isGuardianLocation ? guardianTitle : undefined,
          ...optionalFields,
        }) as {
          success: boolean; hasConflicts: boolean; conflicts?: Array<{
            classId: Id<"classes">;
            studentId: Id<"students">;
            studentName: string;
            locationId?: Id<"locations">;
            locationName: string;
            scheduledDate: number;
            status: string;
            additionalStudentIds?: Id<"students">[];
          }>; classId?: Id<"classes">
        };

        if (result.hasConflicts) {
          // Show conflict modal

          setPendingBookingData({
            ...optionalFields,
            teacherId: effectiveTeacherId,
            schoolId: schoolId as Id<"schools">,
            studentId: studentId as Id<"students">,
            locationId: locationId ? (locationId as Id<"locations">) : undefined,
            pendingLocationName: requestingNewLocation ? pendingLocationName : undefined,
            pendingLocationNameTh: requestingNewLocation ? pendingLocationNameTh : undefined,
            scheduledDate: datesToBook[0],
            bookedByUserId: userId,
            guardianTitle: isGuardianLocation ? guardianTitle : undefined,
          });
          setConflictingClasses((result.conflicts || []).map((c) => ({
            _id: c.classId,
            studentId: c.studentId,
            additionalStudentIds: c.additionalStudentIds,
            locationId: c.locationId,
            scheduledDate: c.scheduledDate,
            status: c.status,
            student: { _id: c.studentId, firstName: c.studentName.split(" ")[0], lastName: c.studentName.split(" ")[1] || "" },
            location: c.locationId ? { _id: c.locationId, name: c.locationName, nameTh: c.locationName } : null,
            teacherId: effectiveTeacherId,
            schoolId: schoolId as Id<"schools">,
          })));
          setShowConflictModal(true);
          setLoading(false);
          return; // Don't proceed with booking yet
        }

        toast.success("Class booked successfully!", "จองคลาสสำเร็จแล้ว!");
      }

      // Reset form
      setStudentId("");
      setSchoolId("");
      setLocationId("");
      setScheduledDate("");
      setSelectedDates([]);
      setSelectedTime("09:00");
      setIsRecurringWeekly(false);
      setRecurringWeeks(12);
      setPendingLocationName("");
      setPendingLocationNameTh("");
      setRequestingNewLocation(false);
      setShowCalendar(false);
      setShowForm(false);
      setGuardianTitle("");
      // Reset teacher selection for admin/moderator
      if (userRole === "admin" || userRole === "moderator") {
        setSelectedTeacherId("");
      }

      // Reset optional fields
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : userRole === "moderator" || userRole === "admin"
            ? "Failed to book class"
            : "Failed to request class"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handler for when user confirms merge from conflict modal
  const handleMergeFromConflict = async () => {
    if (!pendingBookingData || conflictingClasses.length === 0) return;

    try {
      // First, create the new class with forceCreate flag
      const result = await bookClassWithConflictCheck({
        ...pendingBookingData,
        forceCreate: true,
      }) as { success: boolean; classId?: Id<"classes"> };

      if (result.success && result.classId) {
        // Then add the student to the first conflicting class instead
        const targetClass = conflictingClasses[0];
        await addStudentToClass({
          userId,
          classId: targetClass._id,
          studentId: pendingBookingData.studentId,
        });

        // Delete the newly created class since we merged instead
        // (This is a bit wasteful, but simplifies the flow)
        // Alternatively, we could use mergeClasses mutation here

        toast.success("Student added to existing class!", "เพิ่มนักเรียนในคลาสที่มีอยู่แล้ว!");

        // Reset states
        setPendingBookingData(null);
        setConflictingClasses([]);
        setShowConflictModal(false);

        // Reset form
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
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to merge classes",
        err instanceof Error ? err.message : "ไม่สามารถรวมคลาสได้"
      );
    }
  };

  // Handler for when user chooses to create separate from conflict modal
  const handleCreateSeparateFromConflict = async () => {
    if (!pendingBookingData) return;

    try {
      await bookClassWithConflictCheck({
        ...pendingBookingData,
        forceCreate: true,
      });

      toast.success("Class created separately!", "สร้างคลาสแยกแล้ว!");

      // Reset states
      setPendingBookingData(null);
      setConflictingClasses([]);
      setShowConflictModal(false);

      // Reset form
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
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create class",
        err instanceof Error ? err.message : "ไม่สามารถสร้างคลาสได้"
      );
    }
  };

  const handleAcknowledge = async (classId: Id<"classes">) => {
    try {
      await acknowledgeClass({ userId, classId });
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

  const handleCreateStudent = async () => {
    // Validation based on student type
    if (!newStudentNickname.trim()) {
      setError(t("Please enter student nickname", "กรุณากรอกชื่อเล่นนักเรียน"));
      return;
    }

    if (studentType === "school") {
      // School student requires grade, class, and school
      if (!newStudentGrade.trim() || !newStudentClass.trim() || !newStudentSchoolId) {
        setError(t("Please fill in all student fields", "กรุณากรอกข้อมูลนักเรียนให้ครบถ้วน"));
        return;
      }
    } else {
      // Guardian student requires birthDate and area
      if (!guardianBirthDate.trim() || !guardianArea.trim()) {
        setError(t("Birth date and area are required for guardian students", "ต้องกรอกวันเกิดและพื้นที่สำหรับนักเรียนของผู้ปกครอง"));
        return;
      }
    }

    setLoading(true);
    try {
      // Convert date string to timestamp for guardian students
      const birthTimestamp = studentType === "guardian" && guardianBirthDate
        ? new Date(guardianBirthDate).getTime()
        : undefined;

      const newStudentData = await createStudent({
        firstName: newStudentNickname,
        lastName: "", // Empty lastName
        nickname: newStudentNickname,
        grade: studentType === "school" ? newStudentGrade : "N/A", // Required field, use N/A for guardian
        class: studentType === "school" ? newStudentClass : undefined,
        schoolId: studentType === "school" ? (newStudentSchoolId as Id<"schools">) : undefined,
        dateOfBirth: birthTimestamp,
        area: studentType === "guardian" ? guardianArea : undefined,
        guardianName: studentType === "guardian" && newGuardianName ? newGuardianName : undefined,
        guardianPhone: studentType === "guardian" && newGuardianPhone ? newGuardianPhone : undefined,
        createdBy: userId,
      });

      // Auto-select the newly created student
      setStudentId(newStudentData.id);
      if (studentType === "school" && newStudentSchoolId) {
        setSchoolId(newStudentSchoolId as Id<"schools">);
      }

      // Reset student creation form
      setCreatingStudent(false);
      setStudentType("school");
      setNewStudentNickname("");
      setNewStudentGrade("");
      setNewStudentClass("");
      setNewStudentSchoolId("");
      setGuardianBirthDate("");
      setGuardianArea("");
      setNewGuardianName("");
      setNewGuardianPhone("");

      if (studentType === "school") {
        toast.success("Student created successfully!", "สร้างข้อมูลนักเรียนสำเร็จ!");
      } else {
        toast.success("Guardian student created successfully!", "สร้างข้อมูลนักเรียนของผู้ปกครองสำเร็จ!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!newLocationName.trim() && !newLocationNameTh.trim()) {
      setError(t("Please enter location name in at least one language", "กรุณากรอกชื่อสถานที่อย่างน้อยหนึ่งภาษา"));
      return;
    }

    if (!schoolId) {
      setError(t("Please select a school first", "กรุณาเลือกโรงเรียนก่อน"));
      return;
    }

    setLoading(true);
    try {
      const newLocationId = await createLocation({
        name: newLocationName,
        nameTh: newLocationNameTh,
        schoolId: schoolId as Id<"schools">,
        createdBy: userId,
      });

      // Auto-select the newly created location
      setLocationId(newLocationId);

      // Reset location creation form
      setCreatingLocation(false);
      setNewLocationName("");
      setNewLocationNameTh("");

      toast.success("Location created successfully!", "สร้างสถานที่สำเร็จ!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Content Container */}
      <div className="w-full max-w-4xl mx-auto px-3 py-4 md:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {userRole === "moderator" || userRole === "admin"
              ? t("Class Bookings", "การจองชั้นเรียน")
              : t("Class Requests", "คำขอชั้นเรียน")}
          </h2>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex-1 md:flex-none bg-blue-500 text-white px-4 py-3 md:py-2 rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-95 transition-all font-medium flex items-center justify-center gap-2 touch-manipulation shadow-lg shadow-blue-500/20 text-base md:text-sm"
            >
              <Calendar className="w-5 h-5" />
              {userRole === "moderator" || userRole === "admin"
                ? t("Book Class", "จองชั้นเรียน")
                : t("Req/Book Class", "ขอ/จองชั้นเรียน")}
            </button>
            {classes && classes.length > 1 && (
              <button
                onClick={() => setShowMergeModal(true)}
                className="flex-1 md:flex-none bg-purple-500 text-white px-4 py-3 md:py-2 rounded-xl md:rounded-lg hover:bg-purple-600 active:scale-95 transition-all font-medium flex items-center justify-center gap-2 touch-manipulation shadow-lg shadow-purple-500/20 text-base md:text-sm"
              >
                <Users className="w-5 h-5" />
                {t("Merge Classes", "รวมคลาส")}
              </button>
            )}
          </div>
        </div>

        {/* Booking Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b-2 border-gray-200 dark:border-gray-700">
              {userRole === "moderator" || userRole === "admin"
                ? t("Book a New Class", "จองชั้นเรียนใหม่")
                : t("Request a New Class", "ขอชั้นเรียนใหม่")}
            </h3>

            <form onSubmit={handleBookClass} className="space-y-4">
              {/* Step 1: School Selection - FIRST PRIORITY */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                    <label htmlFor="school" className="block text-sm font-medium">
                      {t("School", "โรงเรียน")} *
                    </label>
                  </div>
                  <select
                    id="school"
                    value={schoolId}
                    onChange={(e) => {
                      setSchoolId(e.target.value as Id<"schools"> | "");
                      setLocationId(""); // Reset location when school changes
                      setStudentId(""); // Reset student when school changes
                      if (userRole === "admin" || userRole === "moderator") {
                        setSelectedTeacherId(""); // Reset teacher selection
                      }
                    }}
                    className="w-full px-4 py-3 md:py-2 text-base md:text-sm border-2 border-blue-500 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 dark:bg-gray-800 dark:border-blue-600 touch-manipulation transition-all shadow-sm"
                    required
                    disabled={loading || userRole === "moderator"} // Moderators can't change their school
                  >
                    <option value="">{t("Select a school first", "เลือกโรงเรียนก่อน")}</option>
                    {schools === undefined ? (
                      <option disabled>{t("Loading schools...", "กำลังโหลดโรงเรียน...")}</option>
                    ) : (
                      schools?.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
                        </option>
                      ))
                    )}
                  </select>
                  {userRole === "moderator" && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {t("Your school is pre-selected", "โรงเรียนของคุณถูกเลือกไว้แล้ว")}
                    </p>
                  )}
                </div>

                {/* Step 2: Teacher Selection (Admin/Moderator only) */}
                {(userRole === "admin" || userRole === "moderator") && (
                  <div className={`relative transition-opacity ${schoolId ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                      <label htmlFor="teacher" className="block text-sm font-medium">
                        {t("Teacher", "ครูผู้สอน")} *
                      </label>
                    </div>
                    <select
                      id="teacher"
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users"> | "")}
                      className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 touch-manipulation transition-all"
                      required
                      disabled={loading || !schoolId}
                    >
                      <option value="">
                        {schoolId
                          ? t("Select a teacher", "เลือกครูผู้สอน")
                          : t("Select school first", "เลือกโรงเรียนก่อน")
                        }
                      </option>
                      {allTeachers === undefined ? (
                        <option disabled>{t("Loading teachers...", "กำลังโหลดครู...")}</option>
                      ) : (
                        allTeachers?.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.username}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {t(
                        "Select which teacher will teach this class",
                        "เลือกครูที่จะสอนคลาสนี้"
                      )}
                    </p>
                  </div>
                )}

                {/* Step 3: Student Selection - Filtered by School */}
                <div className={`relative transition-opacity ${schoolId ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                        {(userRole === "admin" || userRole === "moderator") ? "3" : "2"}
                      </span>
                      <label htmlFor="student" className="block text-sm font-medium">
                        {t("Student Name", "ชื่อนักเรียน")} *
                      </label>
                    </div>
                    {schoolId && (
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingStudent(!creatingStudent);
                          // Auto-set school ID when creating new student
                          if (!creatingStudent && schoolId) {
                            setNewStudentSchoolId(schoolId);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        disabled={!schoolId}
                      >
                        {creatingStudent
                          ? t("← Select Existing", "← เลือกนักเรียนที่มีอยู่")
                          : t("+ Create New", "+ สร้างใหม่")
                        }
                      </button>
                    )}
                  </div>

                  {creatingStudent && schoolId ? (
                    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      {/* Student Type Selection */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentType("school")}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${studentType === "school"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          disabled={loading}
                        >
                          {t("School Student", "นักเรียนในโรงเรียน")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentType("guardian")}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${studentType === "guardian"
                            ? "bg-purple-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          disabled={loading}
                        >
                          {t("Guardian Student", "นักเรียนของผู้ปกครอง")}
                        </button>
                      </div>

                      {/* Common Fields */}
                      <input
                        type="text"
                        placeholder={t("Nickname *", "ชื่อเล่น *")}
                        value={newStudentNickname}
                        onChange={(e) => setNewStudentNickname(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        disabled={loading}
                      />

                      {/* Conditional Fields Based on Student Type */}
                      {studentType === "school" ? (
                        <>
                          <select
                            value={newStudentGrade}
                            onChange={(e) => setNewStudentGrade(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            disabled={loading}
                          >
                            <option value="">{t("Grade", "ระดับชั้น")}</option>
                            <option value="K1">K1</option>
                            <option value="K2">K2</option>
                            <option value="K3">K3</option>
                          </select>
                          <select
                            value={newStudentClass}
                            onChange={(e) => setNewStudentClass(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            disabled={loading}
                          >
                            <option value="">{t("Select Class", "เลือกคลาส")}</option>
                            <option value="/1">/1</option>
                            <option value="/2">/2</option>
                            <option value="/3">/3</option>
                            <option value="/4">/4</option>
                            <option value="/5">/5</option>
                            <option value="/6">/6</option>
                            <option value="/7">/7</option>
                            <option value="/8">/8</option>
                            <option value="/9">/9</option>
                            <option value="/10">/10</option>
                          </select>
                          <input
                            type="text"
                            value={schoolId}
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                            placeholder={schools?.find(s => s._id === schoolId)?.name || t("School", "โรงเรียน")}
                          />
                        </>
                      ) : (
                        <>
                          <input
                            type="date"
                            placeholder={t("Birth Date *", "วันเกิด *")}
                            value={guardianBirthDate}
                            onChange={(e) => setGuardianBirthDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                            disabled={loading}
                          />
                          <input
                            type="text"
                            placeholder={t("Area (e.g., BKK01, CNX02) *", "พื้นที่ (เช่น BKK01, CNX02) *")}
                            value={guardianArea}
                            onChange={(e) => setGuardianArea(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                            disabled={loading}
                          />
                          <input
                            type="text"
                            placeholder={t("Guardian Name", "ชื่อผู้ปกครอง")}
                            value={newGuardianName}
                            onChange={(e) => setNewGuardianName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                            disabled={loading}
                          />
                          <input
                            type="tel"
                            placeholder={t("Guardian Phone", "เบอร์ผู้ปกครอง")}
                            value={newGuardianPhone}
                            onChange={(e) => setNewGuardianPhone(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                            disabled={loading}
                          />
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleCreateStudent}
                        disabled={loading}
                        className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 text-sm font-medium ${studentType === "school"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-purple-600 hover:bg-purple-700"
                          }`}
                      >
                        {studentType === "school"
                          ? t("✓ Create & Select Student", "✓ สร้างและเลือกนักเรียน")
                          : t("✓ Create Guardian Student", "✓ สร้างนักเรียนของผู้ปกครอง")
                        }
                      </button>
                    </div>
                  ) : (
                    <HierarchicalStudentSelector
                      students={students}
                      value={studentId}
                      onChange={setStudentId}
                      disabled={loading || !schoolId}
                      required
                      schoolId={schoolId}
                    />
                  )}
                </div>
              </div>

              {/* Step 4: Location & Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`transition-opacity ${schoolId ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {(userRole === "admin" || userRole === "moderator") ? "4" : "3"}
                    </span>
                    <label htmlFor="location" className="block text-sm font-medium">
                      {t("Location", "สถานที่")} *
                    </label>
                  </div>
                  <select
                    id="location"
                    value={locationId}
                    onChange={(e) => {
                      setLocationId(e.target.value as Id<"locations"> | "");
                      if (e.target.value) {
                        setRequestingNewLocation(false);
                        setPendingLocationName("");
                        setPendingLocationNameTh("");
                        setCreatingLocation(false);
                        setNewLocationName("");
                        setNewLocationNameTh("");
                      }
                    }}
                    className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 touch-manipulation transition-all"
                    disabled={loading || !schoolId || requestingNewLocation || creatingLocation}
                  >
                    <option value="">
                      {!schoolId
                        ? t("Select school first", "เลือกโรงเรียนก่อน")
                        : locations === undefined
                          ? t("Loading locations...", "กำลังโหลดสถานที่...")
                          : locations.length === 0
                            ? t("No locations available", "ไม่มีสถานที่")
                            : t("Select a location", "เลือกสถานที่")
                      }
                    </option>
                    {locations?.map((location) => (
                      <option key={location._id} value={location._id}>
                        {location.name} {location.type === "guardian" ? "👨‍👩‍👧" : ""}
                      </option>
                    ))}
                  </select>

                  {/* Request new location button (for teachers) */}
                  {userRole === "teacher" && schoolId && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestingNewLocation(!requestingNewLocation);
                          if (!requestingNewLocation) {
                            setLocationId("");
                          } else {
                            setPendingLocationName("");
                            setPendingLocationNameTh("");
                          }
                        }}
                        className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <MapPin className="w-4 h-4" />
                        {requestingNewLocation
                          ? t("Use existing location", "ใช้สถานที่ที่มีอยู่")
                          : t("Request new location", "ขอสถานที่ใหม่")
                        }
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setShowProposalForm(true)}
                        className="text-sm text-green-500 hover:text-green-600 flex items-center gap-1"
                      >
                        <MapPin className="w-4 h-4" />
                        {t("Propose New Location", "เสนอสถานที่ใหม่")}
                      </button>
                    </div>
                  )}

                  {/* Create new location button (for moderators/admins) */}
                  {(userRole === "moderator" || userRole === "admin") && schoolId && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingLocation(!creatingLocation);
                          if (!creatingLocation) {
                            setLocationId("");
                          } else {
                            setNewLocationName("");
                            setNewLocationNameTh("");
                          }
                        }}
                        className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
                      >
                        <MapPin className="w-4 h-4" />
                        {creatingLocation
                          ? t("← Select Existing Location", "← เลือกสถานที่ที่มีอยู่")
                          : t("+ Create New Location", "+ สร้างสถานที่ใหม่")
                        }
                      </button>
                    </div>
                  )}

                  {/* Location creation form (for moderators/admins) */}
                  {creatingLocation && schoolId && (userRole === "moderator" || userRole === "admin") && (
                    <div className="mt-3 space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <input
                        type="text"
                        placeholder={t("Location Name (English) *", "ชื่อสถานที่ (อังกฤษ) *")}
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        disabled={loading}
                      />
                      <input
                        type="text"
                        placeholder={t("Location Name (Thai) *", "ชื่อสถานที่ (ไทย) *")}
                        value={newLocationNameTh}
                        onChange={(e) => setNewLocationNameTh(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={handleCreateLocation}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {t("✓ Create & Select Location", "✓ สร้างและเลือกสถานที่")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Guardian Title (only if guardian location selected) */}
                {isGuardianLocation && (
                  <div>
                    <label htmlFor="guardianTitle" className="block text-sm font-medium mb-2">
                      {t("Guardian Title", "ความสัมพันธ์กับผู้ปกครอง")} *
                    </label>
                    <input
                      type="text"
                      id="guardianTitle"
                      value={guardianTitle}
                      onChange={(e) => setGuardianTitle(e.target.value)}
                      placeholder={t("e.g. Mom, Dad, Grandma", "เช่น แม่, พ่อ, ยาย")}
                      className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required={isGuardianLocation}
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      {t(
                        "Classes at guardian's home are auto-approved",
                        "ชั้นเรียนที่บ้านผู้ปกครองจะได้รับการอนุมัติอัตโนมัติ"
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-2">
                    {t("Start Date", "วันที่เริ่มต้น")}
                  </label>

                  {/* Multi-date calendar button (supports single or multiple dates) */}
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 text-left flex items-center justify-between"
                    disabled={loading}
                  >
                    <span className={selectedDates.length > 0 ? "text-gray-900 dark:text-white" : "text-gray-500"}>
                      {selectedDates.length > 0
                        ? t(`${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`, `เลือกแล้ว ${selectedDates.length} วัน`)
                        : t("Select date(s)", "เลือกวันที่")
                      }
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </button>

                  {/* Fallback to datetime-local input for manual entry */}
                  <input
                    type="datetime-local"
                    id="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      setScheduledDate(e.target.value);
                      setSelectedDates([]); // Clear calendar selection
                    }}
                    className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 touch-manipulation transition-shadow mt-2"
                    disabled={loading}
                    placeholder={t("Or enter date/time manually", "หรือกรอกวันที่/เวลาด้วยตนเอง")}
                  />
                </div>
              </div>

              {/* Calendar Picker - supports single or multiple date selection */}
              {showCalendar && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                  <MultiDateCalendar
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                    minDate={new Date()}
                    maxSelections={14}
                  />
                  {/* Time picker for all selected dates */}
                  {selectedDates.length > 0 && (
                    <div className="mt-4">
                      <label htmlFor="time" className="block text-sm font-medium mb-2">
                        {t(
                          selectedDates.length > 1 ? "Time for all classes" : "Select Time",
                          selectedDates.length > 1 ? "เวลาสำหรับทุกคลาส" : "เลือกเวลา"
                        )}
                      </label>
                      <input
                        type="time"
                        id="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Recurring Weekly Booking Option */}
              {(selectedDates.length > 0 || scheduledDate) && (
                <div className="border border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="recurringWeekly"
                      checked={isRecurringWeekly}
                      onChange={(e) => {
                        setIsRecurringWeekly(e.target.checked);
                        if (!e.target.checked) {
                          // Reset when disabled
                          setRecurringWeeks(12);
                        }
                      }}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      disabled={loading}
                    />
                    <label htmlFor="recurringWeekly" className="text-sm font-medium cursor-pointer">
                      {t("Recurring Weekly", "ซ้ำทุกสัปดาห์")}
                    </label>
                  </div>

                  {isRecurringWeekly && (
                    <div className="space-y-3 mt-4">
                      <div>
                        <label htmlFor="recurringWeeks" className="block text-sm font-medium mb-2">
                          {t("Number of Weeks", "จำนวนสัปดาห์")}
                        </label>
                        <input
                          type="number"
                          id="recurringWeeks"
                          min="1"
                          max="52"
                          value={recurringWeeks}
                          onChange={(e) => setRecurringWeeks(Math.max(1, Math.min(52, Number.parseInt(e.target.value) || 1)))}
                          className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600"
                          disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {t(
                            `Will book ${recurringWeeks} classes, repeating every week on the same day`,
                            `จะจองคลาส ${recurringWeeks} ครั้ง ซ้ำทุกสัปดาห์ในวันเดียวกัน`
                          )}
                        </p>
                      </div>

                      {/* Preview of recurring dates */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("Preview of Dates:", "ตัวอย่างวันที่:")}
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {(() => {
                            const baseDate = selectedDates.length > 0
                              ? new Date(selectedDates[0])
                              : new Date(scheduledDate);
                            const [hours, minutes] = selectedDates.length > 0
                              ? selectedTime.split(":")
                              : [baseDate.getHours().toString(), baseDate.getMinutes().toString()];

                            return Array.from({ length: Math.min(recurringWeeks, 10) }, (_, i) => {
                              const date = new Date(baseDate);
                              date.setDate(baseDate.getDate() + (i * 7));
                              date.setHours(Number.parseInt(hours), Number.parseInt(minutes));
                              return (
                                <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                  {i + 1}. {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              );
                            });
                          })()}
                          {recurringWeeks > 10 && (
                            <div className="text-xs text-gray-500 italic">
                              {t(`... and ${recurringWeeks - 10} more`, `... และอีก ${recurringWeeks - 10} วัน`)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New location request fields */}
              {requestingNewLocation && (
                <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {t("Request New Location", "ขอสถานที่ใหม่")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pendingLocationName" className="block text-sm font-medium mb-2">
                        {t("Location Name (English)", "ชื่อสถานที่ (อังกฤษ)")}
                      </label>
                      <input
                        type="text"
                        id="pendingLocationName"
                        value={pendingLocationName}
                        onChange={(e) => setPendingLocationName(e.target.value)}
                        className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        placeholder={t("e.g., Room 301", "เช่น ห้อง 301")}
                        required={requestingNewLocation}
                      />
                    </div>
                    <div>
                      <label htmlFor="pendingLocationNameTh" className="block text-sm font-medium mb-2">
                        {t("Location Name (Thai)", "ชื่อสถานที่ (ไทย)")}
                      </label>
                      <input
                        type="text"
                        id="pendingLocationNameTh"
                        value={pendingLocationNameTh}
                        onChange={(e) => setPendingLocationNameTh(e.target.value)}
                        className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        placeholder={t("e.g., ห้อง 301", "เช่น ห้อง 301")}
                        required={requestingNewLocation}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {t(
                      "This location will need moderator approval before being used.",
                      "สถานที่นี้จะต้องได้รับการอนุมัติจากผู้ดูแลก่อนจึงจะสามารถใช้งานได้"
                    )}
                  </p>
                </div>
              )}

              {/* Optional Fields Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                >
                  <span className="text-sm font-medium">
                    {t("Additional Class Details (Optional)", "รายละเอียดเพิ่มเติม (ไม่บังคับ)")}
                  </span>
                  {showOptionalFields ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showOptionalFields && (
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

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl md:rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="flex-1 bg-blue-500 text-white py-3.5 md:py-2.5 px-4 rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-98 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-lg shadow-blue-500/20 text-base md:text-sm"
                >
                  {loading ? (
                    userRole === "moderator" || userRole === "admin"
                      ? t("Booking...", "กำลังจอง...")
                      : t("Submitting Request...", "กำลังส่งคำขอ...")
                  ) : (
                    <>
                      {userRole === "moderator" || userRole === "admin" ? (
                        selectedDates.length > 1
                          ? t(`Book ${selectedDates.length} Classes`, `จอง ${selectedDates.length} คลาส`)
                          : t("Book Class", "จองคลาส")
                      ) : (
                        selectedDates.length > 1
                          ? t(`Submit ${selectedDates.length} Class Requests`, `ส่งคำขอ ${selectedDates.length} คลาส`)
                          : t("Submit Class Request", "ส่งคำขอคลาส")
                      )}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-3.5 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl md:rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-98 transition-all touch-manipulation text-base md:text-sm font-medium"
                >
                  {t("Cancel", "ยกเลิก")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classes List */}
        <div className="space-y-4">
          {classes?.map((classItem) => {
            // We'll need to fetch related data for display
            return (
              <ClassItemDisplay
                key={classItem._id}
                classItem={classItem}
                userRole={userRole}
                userId={userId}
                onAcknowledge={handleAcknowledge}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                onRequestCancellation={handleRequestCancellation}
                onEdit={(item) => {
                  // Convert classItem to Doc<"classes"> by extracting core fields
                  const classDoc = item as unknown as Doc<"classes">;
                  setEditingClass(classDoc);
                }}
              />
            );
          })}

          {classes && classes.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-lg shadow-lg p-8 md:p-6 text-center text-gray-500 dark:text-gray-400">
              <Calendar className="w-16 h-16 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-base md:text-base">
                {userRole === "moderator" || userRole === "admin"
                  ? t("No classes found", "ไม่พบชั้นเรียน")
                  : t("No class requests found", "ไม่พบคำขอชั้นเรียน")}
              </p>
            </div>
          )}
        </div>
        {/* End of main content container */}
      </div>

      {/* MODALS - Rendered outside main container to prevent scroll issues */}

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          classData={editingClass}
          currentUserId={userId}
          onClose={() => setEditingClass(null)}
          onSuccess={() => {
            setEditingClass(null);
            // Data will auto-refresh via Convex real-time updates
          }}
        />
      )}

      {/* Location Proposal Modal */}
      {showProposalForm && (
        <LocationProposalForm
          userId={userId}
          onClose={() => setShowProposalForm(false)}
        />
      )}

      {/* Merge Classes Modal */}
      {showMergeModal && classes && (
        <MergeClassesModal
          userId={userId}
          classes={classes}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            setShowMergeModal(false);
            // Data will auto-refresh via Convex real-time updates
          }}
        />
      )}

      {/* Conflict Detection Modal */}
      {showConflictModal && pendingBookingData && conflictingClasses.length > 0 && (
        <ClassConflictModal
          userId={userId}
          conflicts={conflictingClasses}
          newClassData={{
            studentId: pendingBookingData.studentId,
            studentName: (students?.find(s => s._id === pendingBookingData.studentId)?.firstName || "Unknown") + " " + (students?.find(s => s._id === pendingBookingData.studentId)?.lastName || ""),
            scheduledDate: pendingBookingData.scheduledDate,
            locationId: pendingBookingData.locationId,
            locationName: locations?.find(l => l._id === pendingBookingData.locationId)?.name || pendingBookingData.pendingLocationName || "Unknown",
          }}
          onMerge={handleMergeFromConflict}
          onCreateSeparate={handleCreateSeparateFromConflict}
          onCancel={() => {
            setShowConflictModal(false);
            setPendingBookingData(null);
            setConflictingClasses([]);
            setLoading(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
              {t("Confirm Delete", "ยืนยันการลบ")}
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              {t(
                "Are you sure you want to delete this class? The teacher will be notified.",
                "คุณแน่ใจหรือไม่ที่จะลบคลาสนี้? ครูจะได้รับการแจ้งเตือน"
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPendingDeleteId(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("Delete", "ลบ")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
              {t("Reject Class", "ปฏิเสธคลาส")}
            </h3>
            <label className="block mb-4">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("Reason for rejection:", "เหตุผลในการปฏิเสธ:")}
              </span>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder={t("Enter reason...", "ระบุเหตุผล...")}
              />
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setPendingRejectId(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("Reject", "ปฏิเสธ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Separate component to display individual class items with related data
function ClassItemDisplay({
  classItem,
  userRole,
  userId,
  onAcknowledge,
  onApprove,
  onReject,
  onDelete,
  onRequestCancellation,
  onEdit,
}: {
  classItem: {
    _id: Id<"classes">;
    schoolId: Id<"schools">; // Required for school isolation
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
  };
  userRole: UserRole;
  userId: Id<"users">;
  onAcknowledge: (id: Id<"classes">) => void;
  onApprove: (id: Id<"classes">) => void;
  onReject: (id: Id<"classes">) => void;
  onDelete: (id: Id<"classes">) => void;
  onRequestCancellation: (id: Id<"classes">, reason: string, reasonTh: string) => void;
  onEdit: (classData: typeof classItem) => void;
}) {
  const { t, language } = useLanguage();
  // Load students filtered by the class's school to prevent cross-school contamination
  const students = useQuery(
    api.students.list,
    { schoolId: classItem.schoolId }
  );

  const addStudentToClass = useMutation(api.classes.addStudentToClass);
  const removeStudentFromClass = useMutation(api.classes.removeStudentFromClass);

  const hasPendingRequest = useQuery(api.cancellationRequests.hasPendingRequest, {
    classId: classItem._id,
  });

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonTh, setCancelReasonTh] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<Id<"students"> | "">("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [showRemoveStudentConfirm, setShowRemoveStudentConfirm] = useState(false);
  const [pendingRemoveStudentId, setPendingRemoveStudentId] = useState<Id<"students"> | null>(null);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: t("Pending", "รอดำเนินการ"),
      acknowledged: t("Acknowledged", "รับทราบแล้ว"),
      approved: t("Approved", "อนุมัติแล้ว"),
      rejected: t("Rejected", "ปฏิเสธแล้ว"),
    };
    return texts[status as keyof typeof texts] || status;
  };

  // Use joined data from query instead of loading indicator
  const student = classItem.student;
  const location = classItem.location;

  // Handle deleted student case - show error state with delete option
  if (!student) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl md:rounded-lg shadow-lg p-4 md:p-6 border-2 border-red-200 dark:border-red-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <X className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-800 dark:text-red-400">
                {t("Deleted Student Reference", "อ้างอิงนักเรียนที่ถูกลบ")}
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {t(
                "This class references a student that has been deleted. Please delete this class or contact an administrator.",
                "คลาสนี้อ้างอิงถึงนักเรียนที่ถูกลบแล้ว กรุณาลบคลาสนี้หรือติดต่อผู้ดูแลระบบ"
              )}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>{t("Class ID:", "รหัสคลาส:")} {classItem._id}</p>
              <p>{t("Scheduled:", "กำหนดการ:")} {new Date(classItem.scheduledDate).toLocaleString()}</p>
              <p>{t("Status:", "สถานะ:")} {getStatusText(classItem.status)}</p>
            </div>
          </div>
          <button
            onClick={() => onDelete(classItem._id)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t("Delete", "ลบ")}
          </button>
        </div>
      </div>
    );
  }

  // Determine location display name
  const locationDisplay = location
    ? (language === "en" ? location.name : location.nameTh)
    : classItem.pendingLocationName
      ? `${language === "en" ? classItem.pendingLocationName : classItem.pendingLocationNameTh} ${t("(Pending Approval)", "(รอการอนุมัติ)")}`
      : t("Location not specified", "ไม่ได้ระบุสถานที่");

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd) return;
    setAddingStudent(true);
    try {
      await addStudentToClass({
        userId,
        classId: classItem._id,
        studentId: selectedStudentToAdd as Id<"students">,
      });
      setSelectedStudentToAdd("");
      setShowAddStudent(false);
      toast.success("Student added successfully!", "เพิ่มนักเรียนสำเร็จ!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add student",
        err instanceof Error ? err.message : "ไม่สามารถเพิ่มนักเรียนได้"
      );
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = (studentId: Id<"students">) => {
    setPendingRemoveStudentId(studentId);
    setShowRemoveStudentConfirm(true);
  };

  const confirmRemoveStudent = async () => {
    if (!pendingRemoveStudentId) return;

    try {
      await removeStudentFromClass({
        userId,
        classId: classItem._id,
        studentId: pendingRemoveStudentId,
      });
      toast.success("Student removed successfully!", "ลบนักเรียนสำเร็จ!");
      setShowRemoveStudentConfirm(false);
      setPendingRemoveStudentId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove student",
        err instanceof Error ? err.message : "ไม่สามารถลบนักเรียนได้"
      );
    }
  };

  const totalStudents = 1 + (classItem.additionalStudents?.length || 0);
  const availableStudents = students?.filter(
    (s) =>
      s._id !== classItem.studentId &&
      !(classItem.additionalStudentIds?.includes(s._id))
  ) || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-lg shadow-lg p-4 md:p-6 active:scale-[0.99] transition-transform">
      <div className="flex flex-col md:flex-row items-start md:items-start justify-between mb-4 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg md:text-xl font-semibold">
              {student.firstName} {student.lastName}
            </h3>
            {totalStudents > 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                <Users className="w-3 h-3" />
                {totalStudents} {t("students", "คน")}
              </span>
            )}
          </div>

          {/* Show additional students if any */}
          {classItem.additionalStudents && classItem.additionalStudents.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("Additional Students:", "นักเรียนเพิ่มเติม:")}
              </p>
              <div className="flex flex-wrap gap-2">
                {classItem.additionalStudents.map((addStudent) => (
                  addStudent && (
                    <div
                      key={addStudent._id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                    >
                      <span>{addStudent.firstName} {addStudent.lastName}</span>
                      <button
                        onClick={() => handleRemoveStudent(addStudent._id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title={t("Remove student", "ลบนักเรียน")}
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            {t("Location:", "สถานที่:")} {locationDisplay}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t("Scheduled:", "กำหนดการ:")} {new Date(classItem.scheduledDate).toLocaleString()}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl md:rounded-full text-xs md:text-sm font-medium ${getStatusBadge(classItem.status)} whitespace-nowrap`}>
          {getStatusText(classItem.status)}
        </span>
      </div>

      {/* Add Student Section - Available to all users */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {!showAddStudent ? (
          <button
            onClick={() => setShowAddStudent(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            {t("Add Student to Class", "เพิ่มนักเรียนในคลาส")}
          </button>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-sm">
              {t("Add Another Student", "เพิ่มนักเรียนอีกคน")}
            </h4>
            <div className="space-y-3">
              <HierarchicalStudentSelector
                students={availableStudents}
                value={selectedStudentToAdd}
                onChange={setSelectedStudentToAdd}
                disabled={addingStudent}
                schoolId={classItem.schoolId}
                placeholder="Select a student to add"
                placeholderTh="เลือกนักเรียนที่จะเพิ่ม"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentToAdd || addingStudent}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {addingStudent ? t("Adding...", "กำลังเพิ่ม...") : t("Add", "เพิ่ม")}
                </button>
                <button
                  onClick={() => {
                    setShowAddStudent(false);
                    setSelectedStudentToAdd("");
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  {t("Cancel", "ยกเลิก")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(userRole === "moderator" || userRole === "admin") && classItem.status === "pending" && (
        <div className="flex flex-col md:flex-row gap-2 mt-4">
          <button
            onClick={() => onAcknowledge(classItem._id)}
            className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-blue-500 text-white rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-95 transition-all touch-manipulation shadow-lg shadow-blue-500/20 text-sm md:text-base font-medium"
          >
            <Check className="w-5 h-5 md:w-4 md:h-4" />
            {t("Acknowledge", "รับทราบ")}
          </button>
          <button
            onClick={() => onApprove(classItem._id)}
            className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-green-500 text-white rounded-xl md:rounded-lg hover:bg-green-600 active:scale-95 transition-all touch-manipulation shadow-lg shadow-green-500/20 text-sm md:text-base font-medium"
          >
            <Check className="w-5 h-5 md:w-4 md:h-4" />
            {t("Approve", "อนุมัติ")}
          </button>
          <button
            onClick={() => onReject(classItem._id)}
            className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-red-500 text-white rounded-xl md:rounded-lg hover:bg-red-600 active:scale-95 transition-all touch-manipulation shadow-lg shadow-red-500/20 text-sm md:text-base font-medium"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
            {t("Reject", "ปฏิเสธ")}
          </button>
        </div>
      )}

      {(userRole === "moderator" || userRole === "admin") && classItem.status === "acknowledged" && (
        <div className="flex flex-col md:flex-row gap-2 mt-4">
          <button
            onClick={() => onApprove(classItem._id)}
            className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-green-500 text-white rounded-xl md:rounded-lg hover:bg-green-600 active:scale-95 transition-all touch-manipulation shadow-lg shadow-green-500/20 text-sm md:text-base font-medium"
          >
            <Check className="w-4 h-4" />
            {t("Approve", "อนุมัติ")}
          </button>
          <button
            onClick={() => onReject(classItem._id)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
            {t("Reject", "ปฏิเสธ")}
          </button>
        </div>
      )}

      {/* Edit and Delete Buttons - Available to Admin/Moderator/Teacher */}
      {(userRole === "admin" || userRole === "moderator" || userRole === "teacher") && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onEdit(classItem)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              {t("Edit Class", "แก้ไขคลาส")}
            </button>
            {(userRole === "admin" || userRole === "moderator") && classItem.scheduledDate >= Date.now() && (
              <button
                onClick={() => onDelete(classItem._id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {t("Delete Class", "ลบคラส")}
              </button>
            )}
          </div>

          {/* Show "Edited" badge if class has been edited */}
          {classItem.isEdited && classItem.editHistory && classItem.editHistory.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded font-medium">
                <Edit2 className="w-3 h-3" />
                {t("Edited", "แก้ไขแล้ว")}
              </span>
              <span>
                {t(
                  `Last edited by ${classItem.editHistory[classItem.editHistory.length - 1].editedByName} on ${new Date(classItem.editHistory[classItem.editHistory.length - 1].editedAt).toLocaleDateString()}`,
                  `แก้ไขล่าสุดโดย ${classItem.editHistory[classItem.editHistory.length - 1].editedByName} เมื่อ ${new Date(classItem.editHistory[classItem.editHistory.length - 1].editedAt).toLocaleDateString('th-TH')}`
                )}
              </span>
            </div>
          )}

          {(userRole === "admin" || userRole === "moderator") && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t("Teacher will be notified of any changes", "ครูจะได้รับแจ้งเตือนเกี่ยวกับการเปลี่ยนแปลง")}
            </p>
          )}
        </div>
      )}

      {/* Teacher cancellation request for approved classes */}
      {userRole === "teacher" && classItem.status === "approved" && !hasPendingRequest && (
        <div className="mt-4">
          {!showCancelForm ? (
            <button
              onClick={() => setShowCancelForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <X className="w-4 h-4" />
              {t("Request Cancellation", "ขอยกเลิก")}
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-3">
                {t("Request Class Cancellation", "ขอยกเลิกคลาส")}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("Reason (English):", "เหตุผล (ภาษาอังกฤษ):")}
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    rows={3}
                    placeholder="Enter reason in English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("Reason (Thai):", "เหตุผล (ภาษาไทย):")}
                  </label>
                  <textarea
                    value={cancelReasonTh}
                    onChange={(e) => setCancelReasonTh(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    rows={3}
                    placeholder="ใส่เหตุผลเป็นภาษาไทย"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!cancelReason.trim() && !cancelReasonTh.trim()) {
                        toast.warning(
                          "Please provide reason in at least one language",
                          "กรุณาระบุเหตุผลอย่างน้อยหนึ่งภาษา"
                        );
                        return;
                      }
                      onRequestCancellation(classItem._id, cancelReason, cancelReasonTh);
                      setShowCancelForm(false);
                      setCancelReason("");
                      setCancelReasonTh("");
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {t("Submit Request", "ส่งคำขอ")}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelReason("");
                      setCancelReasonTh("");
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    {t("Cancel", "ยกเลิก")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show pending cancellation status */}
      {userRole === "teacher" && classItem.status === "approved" && hasPendingRequest && (
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            {t("Cancellation request pending moderator approval", "คำขอยกเลิกรอการอนุมัติจากผู้ดูแล")}
          </p>
        </div>
      )}

      {/* Remove Student Confirmation Dialog */}
      {showRemoveStudentConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-orange-600 dark:text-orange-400">
              {t("Confirm Remove", "ยืนยันการลบ")}
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              {t("Remove this student from the class?", "ลบนักเรียนคนนี้ออกจากคลาสหรือไม่?")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRemoveStudentConfirm(false);
                  setPendingRemoveStudentId(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={confirmRemoveStudent}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t("Remove", "ลบ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


