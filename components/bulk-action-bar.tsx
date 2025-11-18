"use client";

import { useLanguage } from "@/lib/language-context";
import { ACCESSIBLE_BUTTON } from "@/lib/accessibility-utils";
import { Check, X } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface BulkActionBarProps {
  selectedIds: Set<Id<"classes">>;
  onApprove: (ids: Id<"classes">[]) => Promise<void>;
  onReject: (ids: Id<"classes">[]) => Promise<void>;
  onClearSelection: () => void;
  entityType?: "class" | "student";
}

export function BulkActionBar({
  selectedIds,
  onApprove,
  onReject,
  onClearSelection,
  entityType = "class",
}: BulkActionBarProps) {
  const { language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);

  if (selectedIds.size === 0) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(Array.from(selectedIds));
      onClearSelection();
      setShowConfirmApprove(false);
    } catch (error) {
      console.error("Bulk approve failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(Array.from(selectedIds));
      onClearSelection();
      setShowConfirmReject(false);
    } catch (error) {
      console.error("Bulk reject failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const countText = language === "en"
    ? `${selectedIds.size} ${entityType}${selectedIds.size === 1 ? "" : "es"} selected`
    : `เลือก ${selectedIds.size} รายการ`;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-4 z-40 flex items-center gap-4">
        {/* Selection count */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {countText}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {entityType === "class" && (
            <>
              <button
                onClick={() => setShowConfirmApprove(true)}
                disabled={isProcessing}
                className={`${ACCESSIBLE_BUTTON} bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white`}
                aria-label={language === "en" ? "Approve selected" : "อนุมัติรายการที่เลือก"}
              >
                <Check className="w-4 h-4 mr-1.5" />
                {language === "en" ? "Approve" : "อนุมัติ"}
              </button>

              <button
                onClick={() => setShowConfirmReject(true)}
                disabled={isProcessing}
                className={`${ACCESSIBLE_BUTTON} bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white`}
                aria-label={language === "en" ? "Reject selected" : "ปฏิเสธรายการที่เลือก"}
              >
                <X className="w-4 h-4 mr-1.5" />
                {language === "en" ? "Reject" : "ปฏิเสธ"}
              </button>
            </>
          )}

          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className={`${ACCESSIBLE_BUTTON} bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`}
            aria-label={language === "en" ? "Clear selection" : "ล้างการเลือก"}
          >
            {language === "en" ? "Clear" : "ล้าง"}
          </button>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showConfirmApprove && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmApprove(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-title"
          >
            <h3 id="approve-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === "en"
                ? `Approve ${selectedIds.size} ${entityType}${selectedIds.size === 1 ? "" : "es"}?`
                : `อนุมัติ ${selectedIds.size} รายการ?`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {language === "en"
                ? "This action cannot be undone."
                : "การดำเนินการนี้ไม่สามารถยกเลิกได้"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmApprove(false)}
                disabled={isProcessing}
                className={`${ACCESSIBLE_BUTTON} bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`}
              >
                {language === "en" ? "Cancel" : "ยกเลิก"}
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className={`${ACCESSIBLE_BUTTON} bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white`}
              >
                {isProcessing
                  ? (language === "en" ? "Processing..." : "กำลังดำเนินการ...")
                  : (language === "en" ? "Approve" : "อนุมัติ")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showConfirmReject && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmReject(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
          >
            <h3 id="reject-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === "en"
                ? `Reject ${selectedIds.size} ${entityType}${selectedIds.size === 1 ? "" : "es"}?`
                : `ปฏิเสธ ${selectedIds.size} รายการ?`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {language === "en"
                ? "This action cannot be undone."
                : "การดำเนินการนี้ไม่สามารถยกเลิกได้"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmReject(false)}
                disabled={isProcessing}
                className={`${ACCESSIBLE_BUTTON} bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`}
              >
                {language === "en" ? "Cancel" : "ยกเลิก"}
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className={`${ACCESSIBLE_BUTTON} bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white`}
              >
                {isProcessing
                  ? (language === "en" ? "Processing..." : "กำลังดำเนินการ...")
                  : (language === "en" ? "Reject" : "ปฏิเสธ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
