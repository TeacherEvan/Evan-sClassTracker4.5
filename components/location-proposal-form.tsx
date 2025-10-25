"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Clock, MapPin, X, XCircle } from "lucide-react";
import { useState } from "react";

interface LocationProposalFormProps {
  userId: Id<"users">;
  onClose: () => void;
}

export default function LocationProposalForm({
  userId,
  onClose,
}: LocationProposalFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
  const [type, setType] = useState<"school" | "guardian">("school");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const schools = useQuery(api.schools.list);
  const proposeLocation = useMutation(api.locationProposals.proposeLocation);
  const myProposals = useQuery(api.locationProposals.myProposals, { userId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name.trim() && !nameTh.trim()) {
        throw new Error(
          t("Please fill in at least one location name", "กรุณากรอกชื่อสถานที่อย่างน้อยหนึ่งภาษา")
        );
      }

      if (!schoolId) {
        throw new Error(t("Please select a school", "กรุณาเลือกโรงเรียน"));
      }

      await proposeLocation({
        userId,
        name: name.trim(),
        nameTh: nameTh.trim(),
        schoolId: schoolId as Id<"schools">,
        type,
      });

      setSuccess(true);
      setName("");
      setNameTh("");
      setSchoolId("");
      setType("school");

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  type Proposal = {
    pendingApproval?: boolean;
    approved?: boolean;
  };

  const getStatusColor = (proposal: Proposal) => {
    if (proposal.pendingApproval) return "text-yellow-600";
    if (proposal.approved) return "text-green-600";
    return "text-red-600";
  };

  const getStatusIcon = (proposal: Proposal) => {
    if (proposal.pendingApproval) return <Clock className="w-4 h-4" />;
    if (proposal.approved) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getStatusText = (proposal: Proposal) => {
    if (proposal.pendingApproval) return t("Pending Approval", "รอการอนุมัติ");
    if (proposal.approved) return t("Approved", "อนุมัติแล้ว");
    return t("Rejected", "ปฏิเสธแล้ว");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">
              {t("Propose New Location", "เสนอสถานที่ใหม่")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">
                {t(
                  "Location proposed successfully! Waiting for moderator approval.",
                  "เสนอสถานที่สำเร็จ! รอการอนุมัติจากผู้ดูแล"
                )}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="school" className="block text-sm font-medium mb-2">
              {t("School", "โรงเรียน")} *
            </label>
            <select
              id="school"
              value={schoolId}
              onChange={(e) =>
                setSchoolId(e.target.value as Id<"schools"> | "")
              }
              className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={loading}
            >
              <option value="">
                {t("Select a school", "เลือกโรงเรียน")}
              </option>
              {schools?.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.name} / {school.nameTh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">
              {t("Location Type", "ประเภทสถานที่")} *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "school" | "guardian")}
              className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={loading}
            >
              <option value="school">{t("School Location", "สถานที่โรงเรียน")}</option>
              <option value="guardian">{t("Guardian Home", "บ้านผู้ปกครอง")}</option>
            </select>
            {type === "guardian" && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {t(
                  "Guardian locations are auto-approved when booking classes",
                  "สถานที่ผู้ปกครองจะได้รับการอนุมัติอัตโนมัติเมื่อจองคลาส"
                )}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              {t("Location Name (English)", "ชื่อสถานที่ (อังกฤษ)")} *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g., Building A Room 201", "เช่น อาคาร A ห้อง 201")}
              className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="nameTh" className="block text-sm font-medium mb-2">
              {t("Location Name (Thai)", "ชื่อสถานที่ (ไทย)")} *
            </label>
            <input
              type="text"
              id="nameTh"
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              placeholder={t("e.g., อาคาร A ห้อง 201", "เช่น Building A Room 201")}
              className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              {t("Cancel", "ยกเลิก")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 md:py-2 text-base md:text-sm bg-blue-500 text-white rounded-xl md:rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? t("Proposing...", "กำลังเสนอ...") : t("Propose Location", "เสนอสถานที่")}
            </button>
          </div>
        </form>

        {/* My Proposals List */}
        {myProposals && myProposals.length > 0 && (
          <div className="border-t dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("My Proposed Locations", "สถานที่ที่ฉันเสนอ")}
            </h3>
            <div className="space-y-3">
              {myProposals.map((proposal) => (
                <div
                  key={proposal._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {proposal.name} / {proposal.nameTh}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {proposal.schoolName} / {proposal.schoolNameTh}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("Type", "ประเภท")}: {proposal.type === "guardian" ? t("Guardian", "ผู้ปกครอง") : t("School", "โรงเรียน")}
                      </p>
                      {!proposal.approved && proposal.rejectionReason && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          {t("Rejection reason", "เหตุผลที่ปฏิเสธ")}: {proposal.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(proposal)}`}>
                      {getStatusIcon(proposal)}
                      <span className="text-sm font-medium">
                        {getStatusText(proposal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
