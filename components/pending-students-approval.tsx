"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { Check, GraduationCap, UserCheck, X } from "lucide-react";
import { useState } from "react";

interface PendingStudentsApprovalProps {
  schoolId: Id<"schools">;
  moderatorId: Id<"users">;
}

export function PendingStudentsApproval({ schoolId, moderatorId }: PendingStudentsApprovalProps) {
  const { t } = useLanguage();
  const pendingStudents = useQuery(api.students.getPendingBySchool, { schoolId });
  const approveStudent = useMutation(api.students.approveStudent);
  const rejectStudent = useMutation(api.students.rejectStudent);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleApprove = async (studentId: Id<"students">, studentName: string) => {
    if (!confirm(t(
      `Approve student "${studentName}"?`,
      `อนุมัตินักเรียน "${studentName}"?`
    ))) {
      return;
    }

    setLoading(studentId);
    setError("");

    try {
      await approveStudent({ studentId, moderatorId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve student");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (studentId: Id<"students">, studentName: string) => {
    const reason = prompt(t(
      "Reason for rejection:",
      "เหตุผลในการปฏิเสธ:"
    ));

    if (!reason) return;

    setLoading(studentId);
    setError("");

    try {
      await rejectStudent({ 
        studentId, 
        moderatorId, 
        reason, 
        reasonTh: reason // Using same reason for both languages for simplicity
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject student");
    } finally {
      setLoading(null);
    }
  };

  if (!pendingStudents || pendingStudents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <UserCheck className="w-12 h-12 mx-auto mb-3 text-green-500 dark:text-green-400" />
        <p className="text-gray-600 dark:text-gray-400">
          {t("No pending student approvals", "ไม่มีนักเรียนที่รอการอนุมัติ")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("Pending Student Approvals", "นักเรียนรอการอนุมัติ")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(
              `${pendingStudents.length} student(s) waiting for approval`,
              `มีนักเรียน ${pendingStudents.length} คนรอการอนุมัติ`
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {pendingStudents.map((student) => (
          <div
            key={student._id}
            className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {student.firstName} {student.lastName}
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-medium">{t("Student ID:", "รหัสนักเรียน:")}</span>{" "}
                    <span className="font-mono">{student.studentId}</span>
                  </p>
                  <p>
                    <span className="font-medium">{t("Grade:", "ชั้น:")}</span> {student.grade}
                  </p>
                  {student.guardianName && (
                    <p>
                      <span className="font-medium">{t("Guardian:", "ผู้ปกครอง:")}</span>{" "}
                      {student.guardianName}
                    </p>
                  )}
                  {student.guardianPhone && (
                    <p>
                      <span className="font-medium">{t("Phone:", "เบอร์โทร:")}</span>{" "}
                      {student.guardianPhone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {t("Requested:", "ขอโดย:")} {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(student._id, `${student.firstName} ${student.lastName}`)}
                  disabled={loading === student._id}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t("Approve", "อนุมัติ")}
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">
                    {t("Approve", "อนุมัติ")}
                  </span>
                </button>

                <button
                  onClick={() => handleReject(student._id, `${student.firstName} ${student.lastName}`)}
                  disabled={loading === student._id}
                  className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t("Reject", "ปฏิเสธ")}
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">
                    {t("Reject", "ปฏิเสธ")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
