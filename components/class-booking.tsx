"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { UserRole } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Calendar, Check, X } from "lucide-react";
import { useState } from "react";

interface ClassBookingProps {
  userId: Id<"users">;
  userRole: UserRole;
}

export function ClassBooking({ userId, userRole }: ClassBookingProps) {
  const { t } = useLanguage();
  const schools = useQuery(api.schools.list);
  const students = useQuery(api.students.list, {});
  const classes = useQuery(
    api.classes.list,
    userRole === "teacher" ? { teacherId: userId } : {}
  );
  const bookClass = useMutation(api.classes.book);
  const acknowledgeClass = useMutation(api.classes.acknowledge);
  const approveClass = useMutation(api.classes.approve);
  const rejectClass = useMutation(api.classes.reject);
  const requestCancellation = useMutation(api.cancellationRequests.create);

  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<Id<"students"> | "">("");
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
  const [locationId, setLocationId] = useState<Id<"locations"> | "">("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Query locations for selected school
  const locations = useQuery(
    api.locations.list,
    schoolId ? { schoolId: schoolId as Id<"schools">, activeOnly: true } : "skip"
  );

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
      if (!locationId) {
        throw new Error("Please select a location");
      }

      await bookClass({
        teacherId: userId,
        schoolId,
        studentId: studentId as Id<"students">,
        locationId: locationId as Id<"locations">,
        scheduledDate: new Date(scheduledDate).getTime(),
        bookedByUserId: userId, // Pass the current user's ID
      });

      // Reset form
      setStudentId("");
      setSchoolId("");
      setLocationId("");
      setScheduledDate("");
      setShowForm(false);
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

  const handleAcknowledge = async (classId: Id<"classes">) => {
    try {
      await acknowledgeClass({ classId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to acknowledge class");
    }
  };

  const handleApprove = async (classId: Id<"classes">) => {
    try {
      await approveClass({ classId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve class");
    }
  };

  const handleReject = async (classId: Id<"classes">) => {
    const reason = prompt(t("Reason for rejection:", "เหตุผลในการปฏิเสธ:"));
    if (!reason) return;

    try {
      await rejectClass({ classId, reason, reasonTh: reason });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject class");
    }
  };

  const handleRequestCancellation = async (classId: Id<"classes">, reason: string, reasonTh: string) => {
    try {
      await requestCancellation({
        classId,
        teacherId: userId,
        reason,
        reasonTh,
      });
      alert(t("Cancellation request submitted", "ส่งคำขอยกเลิกแล้ว"));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit cancellation request");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {userRole === "moderator" || userRole === "admin"
            ? t("Class Bookings", "การจองชั้นเรียน")
            : t("Class Requests", "คำขอชั้นเรียน")}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          {userRole === "moderator" || userRole === "admin"
            ? t("Book Class", "จองชั้นเรียน")
            : t("Request Class", "ขอชั้นเรียน")}
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {userRole === "moderator" || userRole === "admin"
              ? t("Book a New Class", "จองชั้นเรียนใหม่")
              : t("Request a New Class", "ขอชั้นเรียนใหม่")}
          </h3>

          <form onSubmit={handleBookClass} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="student" className="block text-sm font-medium mb-2">
                  {t("Student Name", "ชื่อนักเรียน")}
                </label>
                <select
                  id="student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value as Id<"students"> | "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  required
                  disabled={loading}
                >
                  <option value="">{t("Select a student", "เลือกนักเรียน")}</option>
                  {students?.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="school" className="block text-sm font-medium mb-2">
                  {t("School", "โรงเรียน")}
                </label>
                <select
                  id="school"
                  value={schoolId}
                  onChange={(e) => {
                    setSchoolId(e.target.value as Id<"schools"> | "");
                    setLocationId(""); // Reset location when school changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  required
                  disabled={loading}
                >
                  <option value="">{t("Select a school", "เลือกโรงเรียน")}</option>
                  {schools?.map((school) => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  {t("Location", "สถานที่")}
                </label>
                <select
                  id="location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value as Id<"locations"> | "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  required
                  disabled={loading || !schoolId}
                >
                  <option value="">
                    {schoolId
                      ? t("Select a location", "เลือกสถานที่")
                      : t("Select a school first", "เลือกโรงเรียนก่อน")
                    }
                  </option>
                  {locations?.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  {t("Scheduled Date", "วันที่กำหนด")}
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
              >
                {loading
                  ? userRole === "moderator" || userRole === "admin"
                    ? t("Booking...", "กำลังจอง...")
                    : t("Requesting...", "กำลังขอ...")
                  : userRole === "moderator" || userRole === "admin"
                    ? t("Book Class", "จองชั้นเรียน")
                    : t("Request Class", "ขอชั้นเรียน")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
              onAcknowledge={handleAcknowledge}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestCancellation={handleRequestCancellation}
            />
          );
        })}

        {classes && classes.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {userRole === "moderator" || userRole === "admin"
              ? t("No classes found", "ไม่พบชั้นเรียน")
              : t("No class requests found", "ไม่พบคำขอชั้นเรียน")}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component to display individual class items with related data
function ClassItemDisplay({
  classItem,
  userRole,
  onAcknowledge,
  onApprove,
  onReject,
  onRequestCancellation,
}: {
  classItem: {
    _id: Id<"classes">;
    studentId: Id<"students">;
    locationId: Id<"locations">;
    scheduledDate: number;
    status: "pending" | "acknowledged" | "approved" | "rejected";
  };
  userRole: UserRole;
  onAcknowledge: (id: Id<"classes">) => void;
  onApprove: (id: Id<"classes">) => void;
  onReject: (id: Id<"classes">) => void;
  onRequestCancellation: (id: Id<"classes">, reason: string, reasonTh: string) => void;
}) {
  const { t } = useLanguage();
  const student = useQuery(api.students.getById, { id: classItem.studentId });
  const location = useQuery(api.locations.getById, { id: classItem.locationId });
  const hasPendingRequest = useQuery(api.cancellationRequests.hasPendingRequest, {
    classId: classItem._id,
  });

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonTh, setCancelReasonTh] = useState("");

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

  if (!student || !location) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold">
            {student.firstName} {student.lastName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("Location:", "สถานที่:")} {location.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t("Scheduled:", "กำหนดการ:")} {new Date(classItem.scheduledDate).toLocaleString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(classItem.status)}`}>
          {getStatusText(classItem.status)}
        </span>
      </div>

      {userRole === "moderator" && classItem.status === "pending" && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAcknowledge(classItem._id)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Check className="w-4 h-4" />
            {t("Acknowledge", "รับทราบ")}
          </button>
          <button
            onClick={() => onApprove(classItem._id)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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

      {userRole === "moderator" && classItem.status === "acknowledged" && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onApprove(classItem._id)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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
                      if (!cancelReason.trim() || !cancelReasonTh.trim()) {
                        alert(t("Please provide reason in both languages", "กรุณาระบุเหตุผลทั้งสองภาษา"));
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
    </div>
  );
}
