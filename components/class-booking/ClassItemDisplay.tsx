"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getStatusAriaLabel, getStatusBadgeClasses, MIN_TOUCH_TARGET } from "@/lib/accessibility-utils";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Check, Clock, Edit2, Info, MapPin, Trash2, UserMinus, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { HierarchicalStudentSelector } from "../hierarchical-student-selector";
import type { ClassItemDisplayProps } from "./types";

/**
 * ClassItemDisplay Component
 * Displays a single class item with all its details, actions, and related data
 */
export function ClassItemDisplay({
  classItem,
  userRole,
  userId,
  hasConflicts,
  conflictCount,
  onAcknowledge,
  onApprove,
  onReject,
  onDelete,
  onRequestCancellation,
  onEdit,
}: ClassItemDisplayProps) {
  const { t, language } = useLanguage();
  // Load students filtered by the class's school to prevent cross-school contamination
  const students = useQuery(
    api.students.list,
    classItem.schoolId ? { schoolId: classItem.schoolId } : "skip"
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
    const { bg, text } = getStatusBadgeClasses(status);
    return `${bg} ${text}`;
  };

  const getStatusText = (status: string) => {
    return getStatusAriaLabel(status, language);
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
            <Trash2 className="w-4 h-4" />
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow ${hasConflicts ? 'ring-2 ring-yellow-500' : ''}`}>
      {/* Conflict Warning Banner */}
      {hasConflicts && (
        <div className="mb-2 -mt-1 -mx-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-t-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {t(
                `Conflicts with ${conflictCount} other ${conflictCount === 1 ? 'class' : 'classes'}`,
                `ขัดแย้งกับอีก ${conflictCount} คลาส`
              )}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold truncate">
              {student.firstName} {student.lastName}
            </h3>
            {totalStudents > 1 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                <Users className="w-3 h-3" />
                {totalStudents}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${MIN_TOUCH_TARGET} ${getStatusBadge(classItem.status)}`}
              role="status"
              aria-label={getStatusText(classItem.status)}
            >
              {classItem.status === "approved" && <Check className="w-3 h-3" aria-hidden="true" />}
              {classItem.status === "pending" && <Clock className="w-3 h-3" aria-hidden="true" />}
              {classItem.status === "acknowledged" && <Info className="w-3 h-3" aria-hidden="true" />}
              {classItem.status === "rejected" && <X className="w-3 h-3" aria-hidden="true" />}
              <span>{getStatusText(classItem.status)}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationDisplay}
            </span>
            <span>{new Date(classItem.scheduledDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Metadata Row - Who Booked & Who Approved */}
          {(classItem.bookedByUsername || classItem.approvedByUsername || classItem.approvalSource) && (
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Booked By */}
              {classItem.bookedByUsername && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">
                    {t("Booked by:", "จองโดย:")}{" "}
                    <span className="font-semibold">{classItem.bookedByUsername}</span>
                  </span>
                </div>
              )}

              {/* Approved By */}
              {classItem.approvedByUsername && classItem.status === "approved" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                  <Check className="w-3 h-3" />
                  <span className="font-medium">
                    {t("Approved by:", "อนุมัติโดย:")}{" "}
                    <span className="font-semibold">{classItem.approvedByUsername}</span>
                  </span>
                  {classItem.approvedAt && (
                    <span className="opacity-75 ml-1">
                      ({new Date(classItem.approvedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </div>
              )}

              {/* Approval Source Badge */}
              {classItem.approvalSource && classItem.status === "approved" && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${classItem.approvalSource === "auto_provider"
                  ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                  : classItem.approvalSource === "auto_guardian"
                    ? "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400"
                    : classItem.approvalSource === "moderator"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      : classItem.approvalSource === "admin"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                  }`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {classItem.approvalSource === "auto_provider" && t("Auto-approved (Provider)", "อนุมัติอัตโนมัติ (ผู้ให้บริการ)")}
                  {classItem.approvalSource === "auto_guardian" && t("Auto-approved (Guardian)", "อนุมัติอัตโนมัติ (ผู้ปกครอง)")}
                  {classItem.approvalSource === "moderator" && t("Moderator Approval", "อนุมัติโดยผู้ดูแล")}
                  {classItem.approvalSource === "admin" && t("Admin Approval", "อนุมัติโดยผู้จัดการ")}
                  {classItem.approvalSource === "system" && t("System Approval", "อนุมัติโดยระบบ")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show additional students if any */}
      {classItem.additionalStudents && classItem.additionalStudents.length > 0 && (
        <div className="mt-1 mb-2">
          <div className="flex flex-wrap gap-1">
            {classItem.additionalStudents.map((addStudent) => (
              addStudent && (
                <div
                  key={addStudent._id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
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

      {/* Add Student Section - Available to all users */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {!showAddStudent ? (
          <button
            onClick={() => setShowAddStudent(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm"
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
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <button
            onClick={() => onAcknowledge(classItem._id)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transition-all text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            {t("Acknowledge", "รับทราบ")}
          </button>
          <button
            onClick={() => onApprove(classItem._id)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 active:scale-95 transition-all text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            {t("Approve", "อนุมัติ")}
          </button>
          <button
            onClick={() => onReject(classItem._id)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            {t("Reject", "ปฏิเสธ")}
          </button>
        </div>
      )}

      {(userRole === "moderator" || userRole === "admin") && classItem.status === "acknowledged" && (
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <button
            onClick={() => onApprove(classItem._id)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 active:scale-95 transition-all text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            {t("Approve", "อนุมัติ")}
          </button>
          <button
            onClick={() => onReject(classItem._id)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            {t("Reject", "ปฏิเสธ")}
          </button>
        </div>
      )}

      {/* Edit and Delete Buttons - Available to Admin/Moderator/Teacher */}
      {(userRole === "admin" || userRole === "moderator" || userRole === "teacher") && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onEdit(classItem)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm"
            >
              <Edit2 className="w-4 h-4" />
              {t("Edit Class", "แก้ไขคลาส")}
            </button>
            {(userRole === "admin" || userRole === "moderator") && classItem.scheduledDate >= Date.now() && (
              <button
                onClick={() => onDelete(classItem._id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {t("Delete Class", "ลบคラส")}
              </button>
            )}
          </div>

          {/* Show "Edited" badge if class has been edited - with detailed change information */}
          {classItem.isEdited && classItem.editHistory && classItem.editHistory.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded font-medium">
                  <Edit2 className="w-3 h-3" />
                  {t("Edited", "แก้ไขแล้ว")}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {t(
                    `Last edited by ${classItem.editHistory[classItem.editHistory.length - 1].editedByName} on ${new Date(classItem.editHistory[classItem.editHistory.length - 1].editedAt).toLocaleDateString()}`,
                    `แก้ไขล่าสุดโดย ${classItem.editHistory[classItem.editHistory.length - 1].editedByName} เมื่อ ${new Date(classItem.editHistory[classItem.editHistory.length - 1].editedAt).toLocaleDateString('th-TH')}`
                  )}
                </span>
              </div>
              {/* Show what changed in the last edit */}
              {classItem.editHistory[classItem.editHistory.length - 1].changes.length > 0 && (
                <div className="pl-7 space-y-1">
                  {classItem.editHistory[classItem.editHistory.length - 1].changes.map((change, idx) => (
                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        {t(
                          change.field.charAt(0).toUpperCase() + change.field.slice(1).replace(/([A-Z])/g, ' $1'),
                          change.field.charAt(0).toUpperCase() + change.field.slice(1).replace(/([A-Z])/g, ' $1')
                        )}:
                      </span>{" "}
                      <span className="line-through text-red-600 dark:text-red-400">{String(change.oldValue)}</span>
                      {" → "}
                      <span className="text-green-600 dark:text-green-400">{String(change.newValue)}</span>
                    </div>
                  ))}
                  {classItem.editHistory && classItem.editHistory.length > 1 && (
                    <button
                      onClick={() => {
                        // Show full edit history modal (future enhancement)
                        toast.info(
                          `This class has been edited ${classItem.editHistory!.length} times. Full edit history coming soon!`,
                          `คลาสนี้ถูกแก้ไข ${classItem.editHistory!.length} ครั้ง ประวัติการแก้ไขทั้งหมดจะมาเร็วๆ นี้!`
                        );
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs mt-1"
                    >
                      {t(`View all ${classItem.editHistory!.length} edits`, `ดูการแก้ไขทั้งหมด ${classItem.editHistory!.length} รายการ`)}
                    </button>
                  )}
                </div>
              )}
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
