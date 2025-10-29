"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Bug,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

interface AdminContactRequestsProps {
  currentUserId: Id<"users">;
}

type RequestStatus = "pending" | "in_progress" | "resolved" | "dismissed";

export function AdminContactRequests({
  currentUserId,
}: AdminContactRequestsProps) {
  const { t, language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("pending");
  const [selectedRequest, setSelectedRequest] = useState<{ _id: Id<"adminContactRequests">;[key: string]: unknown } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminNotesTh, setAdminNotesTh] = useState("");

  const requests = useQuery(api.adminContactRequests.list, {
    userId: currentUserId,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const getAttachmentUrl = useQuery(
    api.adminContactRequests.getAttachmentUrl,
    selectedRequest?.attachmentStorageId
      ? { storageId: selectedRequest.attachmentStorageId as Id<"_storage"> }
      : "skip"
  );

  const updateStatus = useMutation(api.adminContactRequests.updateStatus);
  const deleteRequest = useMutation(api.adminContactRequests.remove);

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "feature_suggestion":
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case "bug_report":
        return <Bug className="w-5 h-5 text-red-600" />;
      case "help_request":
        return <HelpCircle className="w-5 h-5 text-blue-600" />;
      case "notification_window_request":
        return <Bell className="w-5 h-5 text-indigo-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "dismissed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatus = async (status: RequestStatus) => {
    if (!selectedRequest) return;

    try {
      await updateStatus({
        adminId: currentUserId,
        requestId: selectedRequest._id,
        status,
        adminNotes: adminNotes.trim() || undefined,
        adminNotesTh: adminNotesTh.trim() || undefined,
      });

      toast.success(
        "Request status updated successfully",
        "อัปเดตสถานะคำขอสำเร็จ"
      );

      setSelectedRequest(null);
      setAdminNotes("");
      setAdminNotesTh("");
    } catch (error) {
      console.error("Failed to update request status:", error);
      toast.error(
        "Failed to update request status",
        "อัปเดตสถานะคำขอล้มเหลว"
      );
    }
  };

  const handleDelete = async (requestId: Id<"adminContactRequests">) => {
    try {
      await deleteRequest({
        adminId: currentUserId,
        requestId,
      });

      toast.success(
        "Request deleted successfully",
        "ลบคำขอสำเร็จ"
      );
    } catch (error) {
      console.error("Failed to delete request:", error);
      toast.error(
        "Failed to delete request",
        "ลบคำขอล้มเหลว"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("Contact Requests", "คำขอติดต่อ")}
        </h2>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {["all", "pending", "in_progress", "resolved", "dismissed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as RequestStatus | "all")}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${statusFilter === status
                ? "bg-orange-500 text-white shadow-md"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
            >
              {t(
                status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
                status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {requests === undefined ? (
          <div className="text-center py-12 text-gray-500">
            {t("Loading...", "กำลังโหลด...")}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t("No requests found", "ไม่พบคำขอ")}
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getRequestTypeIcon(request.requestType)}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString(
                        language === "en" ? "en-US" : "th-TH",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {language === "en" ? request.subject : request.subjectTh || request.subject}
                  </h3>

                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {language === "en" ? request.message : request.messageTh || request.message}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {t("From", "จาก")}: <strong>{request.username}</strong> ({request.userRole})
                    </span>
                    <span>
                      {t("Type", "ประเภท")}: {request.requestType.replace(/_/g, " ")}
                    </span>
                  </div>

                  {request.adminNotes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        {t("Admin Notes", "หมายเหตุผู้จัดการ")}:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        {language === "en" ? request.adminNotes : request.adminNotesTh || request.adminNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setAdminNotes(request.adminNotes || "");
                      setAdminNotesTh(request.adminNotesTh || "");
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    title={t("Manage", "จัดการ")}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(request._id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title={t("Delete", "ลบ")}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Management Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("Manage Request", "จัดการคำขอ")}
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {(selectedRequest.attachmentStorageId as Id<"_storage"> | undefined) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("Attached Screenshot", "ภาพหน้าจอที่แนบมา")}
                  </label>
                  {getAttachmentUrl ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAttachmentUrl}
                        alt={(selectedRequest.attachmentName as string) || "Screenshot"}
                        className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                      />
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400">
                        {selectedRequest.attachmentName as string} ({((selectedRequest.attachmentSize as number) / 1024).toFixed(1)} KB)
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-xl" />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Admin Notes (English)", "หมายเหตุผู้จัดการ (อังกฤษ)")}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Admin Notes (Thai)", "หมายเหตุผู้จัดการ (ไทย)")}
                </label>
                <textarea
                  value={adminNotesTh}
                  onChange={(e) => setAdminNotesTh(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(["in_progress", "resolved", "dismissed", "pending"] as RequestStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${status === "resolved"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : status === "dismissed"
                        ? "bg-gray-500 hover:bg-gray-600 text-white"
                        : status === "in_progress"
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      }`}
                  >
                    {t(
                      `Mark as ${status.replace("_", " ")}`,
                      `ทำเครื่องหมายเป็น ${status.replace("_", " ")}`
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
