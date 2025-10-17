"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Clock,
  GraduationCap,
  Plus,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type StudentRequest = {
  _id: Id<"studentRequests">;
  teacherId: Id<"users">;
  schoolId: Id<"schools">;
  firstName: string;
  lastName: string;
  grade: string;
  notes: string;
  notesTh: string;
  status: "pending" | "approved" | "rejected";
  createdStudentId?: Id<"students">;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: Id<"users">;
  rejectionReason?: string;
  rejectionReasonTh?: string;
};

interface TeacherStudentRequestsProps {
  teacherId: Id<"users">;
  teacherSchoolId?: Id<"schools">;
}

export function TeacherStudentRequests({
  teacherId,
  teacherSchoolId,
}: TeacherStudentRequestsProps) {
  const { t, language } = useLanguage();
  const schools = useQuery(api.schools.list, {});
  const createRequest = useMutation(api.studentRequests.create);

  const requests = useQuery(
    api.studentRequests.list,
    { teacherId }
  ) as StudentRequest[] | undefined;

  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [notesTh, setNotesTh] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">(
    teacherSchoolId || ""
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim() || !grade.trim()) {
      setError(
        t("Please fill in all required fields", "กรุณากรอกข้อมูลที่จำเป็น")
      );
      return;
    }

    if (!selectedSchoolId) {
      setError(t("Please select a school", "กรุณาเลือกโรงเรียน"));
      return;
    }

    if (!notes.trim() || !notesTh.trim()) {
      setError(
        t(
          "Please provide notes in both languages",
          "กรุณาใส่หมายเหตุทั้งสองภาษา"
        )
      );
      return;
    }

    try {
      await createRequest({
        teacherId,
        schoolId: selectedSchoolId,
        firstName,
        lastName,
        grade,
        notes,
        notesTh,
      });

      setSuccess(
        t(
          "Student request submitted successfully!",
          "ส่งคำขอเพิ่มนักเรียนสำเร็จแล้ว!"
        )
      );
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setGrade("");
    setNotes("");
    setNotesTh("");
    if (!teacherSchoolId) {
      setSelectedSchoolId("");
    }
    setShowForm(false);
  };

  const cancelForm = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "approved":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "rejected":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getSchoolName = (schoolId: Id<"schools">) => {
    const school = schools?.find((s) => s._id === schoolId);
    return school ? (language === "en" ? school.name : school.nameTh) : "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("Student Requests", "คำขอเพิ่มนักเรียน")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                "Request to add students - awaiting moderator approval",
                "ขอเพิ่มนักเรียน - รอการอนุมัติจากผู้ดูแล"
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t("Request Student", "ขอเพิ่มนักเรียน")}
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("Request New Student", "ขอเพิ่มนักเรียนใหม่")}
              </h3>
              <button
                onClick={cancelForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* School Selection */}
              {!teacherSchoolId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("School", "โรงเรียน")} *
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) =>
                      setSelectedSchoolId(e.target.value as Id<"schools">)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">
                      {t("Select a school", "เลือกโรงเรียน")}
                    </option>
                    {schools?.map((school) => (
                      <option key={school._id} value={school._id}>
                        {language === "en" ? school.name : school.nameTh}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t("Student Information", "ข้อมูลนักเรียน")}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("First Name", "ชื่อ")} *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Last Name", "นามสกุล")} *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Grade", "ชั้น")} *
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Notes (Bilingual) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t("Additional Notes", "หมายเหตุเพิ่มเติม")}
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Notes (English)", "หมายเหตุ (ภาษาอังกฤษ)")} *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t(
                      "Why do you need to add this student?",
                      "ทำไมคุณต้องการเพิ่มนักเรียนคนนี้?"
                    )}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Notes (Thai)", "หมายเหตุ (ภาษาไทย)")} *
                  </label>
                  <textarea
                    value={notesTh}
                    onChange={(e) => setNotesTh(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t(
                      "Why do you need to add this student?",
                      "ทำไมคุณต้องการเพิ่มนักเรียนคนนี้?"
                    )}
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("Cancel", "ยกเลิก")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("Submit Request", "ส่งคำขอ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests === undefined ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {t("No student requests yet", "ยังไม่มีคำขอเพิ่มนักเรียน")}
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {request.firstName} {request.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Grade", "ชั้น")}: {request.grade} •{" "}
                    {getSchoolName(request.schoolId)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(request.status)}`}
                >
                  {getStatusIcon(request.status)}
                  <span className="text-sm font-medium capitalize">
                    {t(
                      request.status,
                      request.status === "pending"
                        ? "รอดำเนินการ"
                        : request.status === "approved"
                          ? "อนุมัติแล้ว"
                          : "ปฏิเสธแล้ว"
                    )}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("Notes:", "หมายเหตุ:")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === "en" ? request.notes : request.notesTh}
                </p>
              </div>

              {request.status === "rejected" && request.rejectionReason && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                    {t("Rejection Reason:", "เหตุผลที่ปฏิเสธ:")}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {language === "en"
                      ? request.rejectionReason
                      : request.rejectionReasonTh}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("Submitted", "ส่งเมื่อ")}:{" "}
                  {new Date(request.createdAt).toLocaleString(
                    language === "en" ? "en-US" : "th-TH"
                  )}
                  {request.resolvedAt && (
                    <>
                      {" • "}
                      {t("Resolved", "ดำเนินการเมื่อ")}:{" "}
                      {new Date(request.resolvedAt).toLocaleString(
                        language === "en" ? "en-US" : "th-TH"
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
