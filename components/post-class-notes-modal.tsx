"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ClassWithStudent extends Partial<Doc<"classes">> {
  _id: Id<"classes">;
  scheduledDate: number;
  additionalStudentIds?: Id<"students">[];
  student?: Doc<"students"> | null;
  currentStudentId?: Id<"students">; // For merged classes - which student is this entry for
}

interface PostClassNotesModalProps {
  classes: ClassWithStudent[];
  currentUserId: Id<"users">;
  onClose: () => void;
  onComplete: () => void;
}

export function PostClassNotesModal({
  classes,
  currentUserId,
  onClose,
  onComplete,
}: PostClassNotesModalProps) {
  const { t } = useLanguage();
  const createNotes = useMutation(api.postClassNotes.create);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [notesTh, setNotesTh] = useState("");
  const [attendance, setAttendance] = useState<"present" | "absent" | "late">(
    "present",
  );
  const [behavior, setBehavior] = useState<
    "excellent" | "good" | "fair" | "needs_improvement" | ""
  >("");
  const [participation, setParticipation] = useState<
    "excellent" | "good" | "fair" | "needs_improvement" | ""
  >("");
  const [homework, setHomework] = useState("");
  const [homeworkTh, setHomeworkTh] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Accordion state for optional sections
  const [showNotes, setShowNotes] = useState(false);
  const [showHomework, setShowHomework] = useState(false);

  const currentClass = classes[currentIndex];

  const resetForm = () => {
    setNotes("");
    setNotesTh("");
    setAttendance("present");
    setBehavior("");
    setParticipation("");
    setHomework("");
    setHomeworkTh("");
    setError("");
    setShowNotes(false);
    setShowHomework(false);
  };

  const handleSubmit = async () => {
    // Prevent double-submission
    if (loading) return;

    // Notes are now optional - no validation needed
    setLoading(true);
    setError("");

    try {
      await createNotes({
        classId: currentClass._id,
        teacherId: currentUserId,
        studentId: currentClass.currentStudentId, // Pass specific student ID for merged classes
        notes: notes || undefined,
        notesTh: notesTh || undefined,
        attendance,
        behavior: behavior || undefined,
        participation: participation || undefined,
        homework: homework || undefined,
        homeworkTh: homeworkTh || undefined,
        skipped: false,
      });

      // Move to next class or complete
      if (currentIndex < classes.length - 1) {
        setCurrentIndex(currentIndex + 1);
        resetForm();
      } else {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Prevent double-submission
    if (loading) return;

    setLoading(true);
    try {
      // Mark as skipped
      await createNotes({
        classId: currentClass._id,
        teacherId: currentUserId,
        studentId: currentClass.currentStudentId, // Pass specific student ID for merged classes
        notes: "Skipped",
        notesTh: "ข้าม",
        attendance: "present",
        skipped: true,
      });

      // Move to next or complete
      if (currentIndex < classes.length - 1) {
        setCurrentIndex(currentIndex + 1);
        resetForm();
      } else {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAll = async () => {
    // Prevent double-submission
    if (loading) return;

    setLoading(true);
    try {
      // Skip all remaining classes (with proper student IDs for merged classes)
      for (let i = currentIndex; i < classes.length; i++) {
        await createNotes({
          classId: classes[i]._id,
          teacherId: currentUserId,
          studentId: classes[i].currentStudentId, // Pass specific student ID for merged classes
          notes: "Skipped",
          notesTh: "ข้าม",
          attendance: "present",
          skipped: true,
        });
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip all");
    } finally {
      setLoading(false);
    }
  };

  if (classes.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        {/* Header - Sticky */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              {t("Post-Class Feedback", "ข้อเสนอแนะหลังเรียน")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / classes.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {currentIndex + 1} / {classes.length}
            </span>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-3 md:space-y-4 overflow-y-auto flex-grow">
          {/* Class info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">
              {t("Feedback for", "ข้อเสนอแนะสำหรับ")}{" "}
              {currentClass.student?.firstName} {currentClass.student?.lastName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(currentClass.scheduledDate).toLocaleString()}
            </p>
            {/* Show if this is a merged class */}
            {currentClass.additionalStudentIds &&
              currentClass.additionalStudentIds.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {t(
                    `Group class (${currentClass.additionalStudentIds.length + 1} students) - Individual feedback`,
                    `คลาสกลุ่ม (${currentClass.additionalStudentIds.length + 1} คน) - ข้อเสนอแนะรายบุคคล`,
                  )}
                </p>
              )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Attendance */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Attendance", "การเข้าเรียน")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  value: "present",
                  label: t("Present", "มาเรียน"),
                  icon: CheckCircle2,
                  color: "green",
                },
                {
                  value: "absent",
                  label: t("Absent", "ขาดเรียน"),
                  icon: XCircle,
                  color: "red",
                },
                {
                  value: "late",
                  label: t("Late", "สาย"),
                  icon: Clock,
                  color: "orange",
                },
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAttendance(value as typeof attendance)}
                  className={`
                    p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                    ${
                      attendance === value
                        ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${attendance === value ? `text-${color}-600` : "text-gray-400"}`}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Behavior (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Behavior", "พฤติกรรม")}{" "}
              <span className="text-gray-400 text-xs">
                ({t("Optional", "ไม่บังคับ")})
              </span>
            </label>
            <select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value as typeof behavior)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            >
              <option value="">{t("Not specified", "ไม่ระบุ")}</option>
              <option value="excellent">{t("Excellent", "ยอดเยี่ยม")}</option>
              <option value="good">{t("Good", "ดี")}</option>
              <option value="fair">{t("Fair", "พอใช้")}</option>
              <option value="needs_improvement">
                {t("Needs Improvement", "ต้องปรับปรุง")}
              </option>
            </select>
          </div>

          {/* Participation (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Participation", "การมีส่วนร่วม")}{" "}
              <span className="text-gray-400 text-xs">
                ({t("Optional", "ไม่บังคับ")})
              </span>
            </label>
            <select
              value={participation}
              onChange={(e) =>
                setParticipation(e.target.value as typeof participation)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            >
              <option value="">{t("Not specified", "ไม่ระบุ")}</option>
              <option value="excellent">{t("Excellent", "ยอดเยี่ยม")}</option>
              <option value="good">{t("Good", "ดี")}</option>
              <option value="fair">{t("Fair", "พอใช้")}</option>
              <option value="needs_improvement">
                {t("Needs Improvement", "ต้องปรับปรุง")}
              </option>
            </select>
          </div>

          {/* Accordion: Notes (Optional) */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <span className="font-medium flex items-center gap-2">
                {t("Notes (Optional)", "บันทึก (ไม่บังคับ)")}
                <span className="text-xs text-gray-500">
                  {t("Click to expand", "คลิกเพื่อขยาย")}
                </span>
              </span>
              {showNotes ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showNotes && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("Notes (English)", "บันทึก (ภาษาอังกฤษ)")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder={t(
                      "What happened during the class?",
                      "เกิดอะไรขึ้นในคลาส?",
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("Notes (Thai)", "บันทึก (ภาษาไทย)")}
                  </label>
                  <textarea
                    value={notesTh}
                    onChange={(e) => setNotesTh(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder={t(
                      "What happened during the class?",
                      "เกิดอะไรขึ้นในคลาส?",
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accordion: Homework (Optional) */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHomework(!showHomework)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <span className="font-medium flex items-center gap-2">
                {t("Homework (Optional)", "การบ้าน (ไม่บังคับ)")}
                <span className="text-xs text-gray-500">
                  {t("Click to expand", "คลิกเพื่อขยาย")}
                </span>
              </span>
              {showHomework ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showHomework && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("Homework (English)", "การบ้าน (ภาษาอังกฤษ)")}
                  </label>
                  <input
                    type="text"
                    value={homework}
                    onChange={(e) => setHomework(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder={t("Homework assigned", "การบ้านที่มอบหมาย")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("Homework (Thai)", "การบ้าน (ภาษาไทย)")}
                  </label>
                  <input
                    type="text"
                    value={homeworkTh}
                    onChange={(e) => setHomeworkTh(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder={t("Homework assigned", "การบ้านที่มอบหมาย")}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSkipAll}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("Skip All", "ข้ามทั้งหมด")}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("Skip This", "ข้ามอันนี้")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading
                ? t("Saving...", "กำลังบันทึก...")
                : currentIndex < classes.length - 1
                  ? t("Submit & Next", "ส่งและถัดไป")
                  : t("Submit & Finish", "ส่งและเสร็จสิ้น")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
