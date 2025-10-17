"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Clock,
  GraduationCap,
  User,
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

interface ModeratorStudentApprovalsProps {
  moderatorId: Id<"users">;
  schoolId: Id<"schools">;
}

export function ModeratorStudentApprovals({
  moderatorId,
  schoolId,
}: ModeratorStudentApprovalsProps) {
  const { t, language } = useLanguage();
  const users = useQuery(api.users.list, {});
  const approveRequest = useMutation(api.studentRequests.approve);
  const rejectRequest = useMutation(api.studentRequests.reject);

  const pendingRequests = useQuery(api.studentRequests.list, {
    schoolId,
    status: "pending",
  }) as StudentRequest[] | undefined;

  const resolvedRequests = useQuery(api.studentRequests.list, {
    schoolId,
  }) as StudentRequest[] | undefined;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] =
    useState<Id<"studentRequests"> | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionReasonTh, setRejectionReasonTh] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const handleApprove = async (requestId: Id<"studentRequests">) => {
    setError("");
    setSuccess("");

    try {
      await approveRequest({
        requestId,
        moderatorId,
      });
      setSuccess(
        t(
          "Student request approved successfully!",
          "อนุมัติคำขอเพิ่มนักเรียนสำเร็จแล้ว!"
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
    }
  };

  const handleRejectClick = (requestId: Id<"studentRequests">) => {
    setRejectingRequestId(requestId);
    setShowRejectModal(true);
    setError("");
    setSuccess("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;

    if (!rejectionReason.trim() || !rejectionReasonTh.trim()) {
      setError(
        t(
          "Please provide rejection reason in both languages",
          "กรุณาใส่เหตุผลการปฏิเสธทั้งสองภาษา"
        )
      );
      return;
    }

    try {
      await rejectRequest({
        requestId: rejectingRequestId,
        moderatorId,
        reason: rejectionReason,
        reasonTh: rejectionReasonTh,
      });
      setSuccess(
        t(
          "Student request rejected successfully!",
          "ปฏิเสธคำขอเพิ่มนักเรียนสำเร็จแล้ว!"
        )
      );
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectionReasonTh("");
      setRejectingRequestId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    }
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectionReasonTh("");
    setRejectingRequestId(null);
    setError("");
  };

  const getTeacherName = (teacherId: Id<"users">) => {
    const teacher = users?.find((u) => u._id === teacherId);
    return teacher?.username || "Unknown";
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

  const requestsToDisplay =
    activeTab === "pending"
      ? pendingRequests
      : resolvedRequests?.filter(
          (r) => r.status === "approved" || r.status === "rejected"
        );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("Student Request Approvals", "อนุมัติคำขอเพิ่มนักเรียน")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(
              "Review and approve teacher requests to add students",
              "ตรวจสอบและอนุมัติคำขอของครูที่ต้องการเพิ่มนักเรียน"
            )}
          </p>
        </div>
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          {t("Pending", "รอดำเนินการ")}
          {pendingRequests && pendingRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          {t("All Requests", "คำขอทั้งหมด")}
        </button>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("Reject Student Request", "ปฏิเสธคำขอเพิ่มนักเรียน")}
              </h3>
              <button
                onClick={cancelReject}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Rejection Reason (English)", "เหตุผลที่ปฏิเสธ (ภาษาอังกฤษ)")} *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={t(
                    "Explain why this request is rejected",
                    "อธิบายว่าทำไมคำขอนี้ถูกปฏิเสธ"
                  )}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Rejection Reason (Thai)", "เหตุผลที่ปฏิเสธ (ภาษาไทย)")} *
                </label>
                <textarea
                  value={rejectionReasonTh}
                  onChange={(e) => setRejectionReasonTh(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={t(
                    "Explain why this request is rejected",
                    "อธิบายว่าทำไมคำขอนี้ถูกปฏิเสธ"
                  )}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelReject}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("Cancel", "ยกเลิก")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t("Reject Request", "ปฏิเสธคำขอ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requestsToDisplay === undefined ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : requestsToDisplay.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === "pending"
                ? t("No pending requests", "ไม่มีคำขอที่รอดำเนินการ")
                : t("No requests yet", "ยังไม่มีคำขอ")}
            </p>
          </div>
        ) : (
          requestsToDisplay.map((request) => (
            <div
              key={request._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {request.firstName} {request.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" />
                    {t("Requested by", "ขอโดย")}: {getTeacherName(request.teacherId)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("Grade", "ชั้น")}: {request.grade}
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
                  {t("Notes from teacher:", "หมายเหตุจากครู:")}
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

              {request.status === "pending" && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApprove(request._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {t("Approve", "อนุมัติ")}
                  </button>
                  <button
                    onClick={() => handleRejectClick(request._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    {t("Reject", "ปฏิเสธ")}
                  </button>
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
