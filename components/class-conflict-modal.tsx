"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { AlertTriangle, Check, Users } from "lucide-react";
import { useState } from "react";

interface ClassConflictModalProps {
  userId: Id<"users">;
  conflicts: Array<{
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
  }>;
  newClassData: {
    studentId: Id<"students">;
    studentName: string;
    scheduledDate: number;
    locationId?: Id<"locations">;
    locationName: string;
  };
  onMerge: () => Promise<void>;
  onCreateSeparate: () => Promise<void>;
  onCancel: () => void;
}

export function ClassConflictModal({
  conflicts,
  newClassData,
  onMerge,
  onCreateSeparate,
  onCancel,
}: ClassConflictModalProps) {
  const { t, language } = useLanguage();

  const [selectedAction, setSelectedAction] = useState<"merge" | "separate" | null>(null);
  const [selectedTargetClass, setSelectedTargetClass] = useState<Id<"classes"> | "">(
    conflicts.length > 0 ? conflicts[0]._id : ""
  );
  const [loading, setLoading] = useState(false);

  const handleMerge = async () => {
    if (!selectedTargetClass) {
      toast.error("Please select a class to merge into", "กรุณาเลือกคลาสที่จะรวม");
      return;
    }

    setLoading(true);
    try {
      await onMerge();
      toast.success("Classes will be merged", "คลาสจะถูกรวม");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to merge classes",
        err instanceof Error ? err.message : "ไม่สามารถรวมคลาสได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeparate = async () => {
    setLoading(true);
    try {
      await onCreateSeparate();
      toast.success("Class created separately", "สร้างคลาสแยกกัน");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create class",
        err instanceof Error ? err.message : "ไม่สามารถสร้างคลาสได้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {t("Time Conflict Detected", "พบความขัดแย้งของเวลา")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  "A class is already scheduled at this time",
                  "มีคลาสที่กำหนดไว้ในเวลานี้แล้ว"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* New Class Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              {t("New Class You're Trying to Book:", "คลาสใหม่ที่คุณกำลังจะจอง:")}
            </h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>{t("Student:", "นักเรียน:")}</strong> {newClassData.studentName}
              </p>
              <p>
                <strong>{t("Location:", "สถานที่:")}</strong> {newClassData.locationName}
              </p>
              <p>
                <strong>{t("Date/Time:", "วัน/เวลา:")}</strong>{" "}
                {new Date(newClassData.scheduledDate).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Existing Conflicts */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              {t("Existing Classes at This Time:", "คลาสที่มีอยู่ในเวลานี้:")}
            </h3>
            <div className="space-y-2">
              {conflicts.map((conflict) => {
                const student = conflict.student;
                const location = conflict.location;
                const totalStudents = 1 + (conflict.additionalStudentIds?.length || 0);

                return (
                  <div
                    key={conflict._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {student?.firstName} {student?.lastName}
                          {totalStudents > 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                              <Users className="w-3 h-3" />
                              {totalStudents}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {t("Location:", "สถานที่:")}{" "}
                          {language === "en" ? location?.name : location?.nameTh}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {new Date(conflict.scheduledDate).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
                        {conflict.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Selection */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-semibold mb-4">
              {t("What would you like to do?", "คุณต้องการทำอย่างไร?")}
            </h3>
            <div className="space-y-3">
              {/* Option 1: Merge */}
              <label
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedAction === "merge"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="merge"
                  checked={selectedAction === "merge"}
                  onChange={() => setSelectedAction("merge")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    {t("Merge into existing class", "รวมเข้ากับคลาสที่มีอยู่")}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t(
                      "Add the new student to one of the existing classes. This is recommended when students can be taught together.",
                      "เพิ่มนักเรียนใหม่เข้าไปในคลาสที่มีอยู่แล้ว แนะนำเมื่อสามารถสอนนักเรียนร่วมกันได้"
                    )}
                  </p>
                  {selectedAction === "merge" && conflicts.length > 1 && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">
                        {t("Select class to merge into:", "เลือกคลาสที่จะรวม:")}
                      </label>
                      <select
                        value={selectedTargetClass}
                        onChange={(e) => setSelectedTargetClass(e.target.value as Id<"classes">)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                      >
                        {conflicts.map((conflict) => (
                          <option key={conflict._id} value={conflict._id}>
                            {conflict.student?.firstName} {conflict.student?.lastName} -{" "}
                            {conflict.location?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: Create Separate */}
              <label
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedAction === "separate"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="separate"
                  checked={selectedAction === "separate"}
                  onChange={() => setSelectedAction("separate")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Check className="w-5 h-5 text-blue-600" />
                    {t("Create as separate class", "สร้างเป็นคลาสแยก")}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t(
                      "Keep both classes separate. Use this when students need individual attention or are at different levels.",
                      "เก็บทั้งสองคลาสแยกกัน ใช้เมื่อนักเรียนต้องการความสนใจเป็นรายบุคคลหรืออยู่ในระดับที่แตกต่างกัน"
                    )}
                  </p>
                  <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {t(
                      "Warning: You will have multiple classes at the same time",
                      "คำเตือน: คุณจะมีหลายคลาสในเวลาเดียวกัน"
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {selectedAction === "merge" ? (
              <button
                onClick={handleMerge}
                disabled={loading || !selectedTargetClass}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Users className="w-5 h-5" />
                {loading ? t("Merging...", "กำลังรวม...") : t("Merge Classes", "รวมคลาส")}
              </button>
            ) : selectedAction === "separate" ? (
              <button
                onClick={handleCreateSeparate}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Check className="w-5 h-5" />
                {loading ? t("Creating...", "กำลังสร้าง...") : t("Create Separate", "สร้างแยก")}
              </button>
            ) : (
              <button
                disabled
                className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-medium"
              >
                {t("Select an option above", "เลือกตัวเลือกด้านบน")}
              </button>
            )}
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              {t("Cancel", "ยกเลิก")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
