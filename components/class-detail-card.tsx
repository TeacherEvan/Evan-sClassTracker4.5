"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  MapPin,
  School,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

interface ClassDetailCardProps {
  classData: {
    classId: Id<"classes">;
    primaryStudentName: string;
    additionalStudentNames: string[];
    scheduledDate: number;
    duration: number;
    schoolName?: string;
    schoolNameTh?: string;
    providerName?: string;
    providerNameTh?: string;
    providerId?: Id<"providers">;
    locationName: string;
    locationNameTh: string;
    classCount: number;
    studentCount: number;
    acknowledgedBy: string;
  };
}

export function ClassDetailCard({ classData }: ClassDetailCardProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Lazy-load ALL post-class notes for this class (could be multiple for multi-student classes)
  // Using getByTeacher and filtering client-side since getByClass only returns first()
  const allNotesForClass = useQuery(
    api.postClassNotes.getByClass,
    isExpanded ? { classId: classData.classId } : "skip",
  );

  // Convert single note to array for consistent rendering
  const postClassNotes = allNotesForClass ? [allNotesForClass] : [];

  const isProvider = !!classData.providerId;
  const entityName = isProvider
    ? language === "th"
      ? classData.providerNameTh
      : classData.providerName
    : language === "th"
      ? classData.schoolNameTh
      : classData.schoolName;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      {/* Main Card Content - Always Visible */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {classData.primaryStudentName}
              </span>
              {classData.additionalStudentNames.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  +{classData.additionalStudentNames.length}{" "}
                  {t("more", "เพิ่มเติม")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(classData.scheduledDate).toLocaleDateString(
                    language === "th" ? "th-TH" : "en-US",
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{classData.duration} min</span>
              </div>
              {/* Entity Badge - Provider or School */}
              {isProvider ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{entityName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5" />
                  <span>{entityName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {language === "th"
                    ? classData.locationNameTh
                    : classData.locationName}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
              {classData.classCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {classData.studentCount}{" "}
              {classData.studentCount === 1
                ? t("student", "นักเรียน")
                : t("students", "นักเรียน")}
            </div>
          </div>
        </div>

        {/* Acknowledged By */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {t("Acknowledged by", "ยอมรับโดย")} {classData.acknowledgedBy}
          </span>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t("Hide Details", "ซ่อนรายละเอียด")}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t("Show Details", "แสดงรายละเอียด")}
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 space-y-4">
          {/* All Students List */}
          {classData.additionalStudentNames.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {t(
                    "All Students in This Class",
                    "นักเรียนทั้งหมดในชั้นเรียนนี้",
                  )}
                </h4>
              </div>
              <ul className="space-y-1 ml-6">
                <li className="text-sm text-gray-700 dark:text-gray-300">
                  • {classData.primaryStudentName}{" "}
                  <span className="text-xs text-gray-500">
                    ({t("Primary", "หลัก")})
                  </span>
                </li>
                {classData.additionalStudentNames.map((name, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    • {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Post-Class Notes */}
          {allNotesForClass === undefined ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-1" />
            </div>
          ) : postClassNotes.length > 0 ? (
            <div className="space-y-3">
              {postClassNotes.map((note) => (
                <div
                  key={note._id}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                      {t("Post-Class Notes", "บันทึกหลังเรียน")}
                    </h4>
                  </div>

                  {/* Attendance */}
                  {note.attendance && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("Attendance:", "การเข้าเรียน:")}
                      </span>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          note.attendance === "present"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : note.attendance === "late"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {note.attendance === "present"
                          ? t("Present", "เข้าเรียน")
                          : note.attendance === "late"
                            ? t("Late", "สาย")
                            : t("Absent", "ขาด")}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {(note.notes || note.notesTh) && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("Notes:", "บันทึก:")}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {language === "th"
                          ? note.notesTh || note.notes
                          : note.notes}
                      </p>
                    </div>
                  )}

                  {/* Homework */}
                  {(note.homework || note.homeworkTh) && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("Homework:", "การบ้าน:")}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {language === "th"
                          ? note.homeworkTh || note.homework
                          : note.homework}
                      </p>
                    </div>
                  )}

                  {/* Behavior */}
                  {note.behavior && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("Behavior:", "พฤติกรรม:")}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {note.behavior}
                      </p>
                    </div>
                  )}

                  {/* Participation */}
                  {note.participation && (
                    <div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("Participation:", "การมีส่วนร่วม:")}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {note.participation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
              {t("No post-class notes submitted", "ยังไม่มีบันทึกหลังเรียน")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
