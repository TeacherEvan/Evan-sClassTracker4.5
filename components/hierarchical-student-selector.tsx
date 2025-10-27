"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useEffect, useState } from "react";

interface HierarchicalStudentSelectorProps {
    students: Doc<"students">[] | undefined;
    value: Id<"students"> | "";
    onChange: (studentId: Id<"students"> | "") => void;
    disabled?: boolean;
    required?: boolean;
    schoolId?: Id<"schools"> | "";
    placeholder?: string;
    placeholderTh?: string;
}

export function HierarchicalStudentSelector({
    students,
    value,
    onChange,
    disabled = false,
    required = false,
    schoolId,
    placeholder = "Select a student",
    placeholderTh = "เลือกนักเรียน",
}: HierarchicalStudentSelectorProps) {
    const { t } = useLanguage();

    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");

    // Extract unique grades from students
    const availableGrades = students
        ? Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort()
        : [];

    // Extract unique classes for selected grade
    const availableClasses = students && selectedGrade
        ? Array.from(
            new Set(
                students
                    .filter(s => s.grade === selectedGrade)
                    .map(s => s.class)
                    .filter(Boolean)
            )
        ).sort()
        : [];

    // Filter students by grade and class
    const filteredStudents = students && selectedGrade && selectedClass
        ? students.filter(s => s.grade === selectedGrade && s.class === selectedClass)
        : [];

    // Reset selections when students change or when school changes
    useEffect(() => {
        // If current value doesn't exist in students list, reset everything
        if (value && students && !students.find(s => s._id === value)) {
            setSelectedGrade("");
            setSelectedClass("");
            onChange("");
        }
    }, [students, value, onChange]);

    // Find selected student to pre-populate dropdowns
    useEffect(() => {
        if (value && students) {
            const student = students.find(s => s._id === value);
            if (student) {
                setSelectedGrade(student.grade || "");
                setSelectedClass(student.class || "");
            }
        }
    }, [value, students]);

    // Reset class and student when grade changes
    const handleGradeChange = (grade: string) => {
        setSelectedGrade(grade);
        setSelectedClass("");
        onChange("");
    };

    // Reset student when class changes
    const handleClassChange = (classValue: string) => {
        setSelectedClass(classValue);
        onChange("");
    };

    const baseSelectClass = "w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 touch-manipulation transition-all";

    return (
        <div className="space-y-3">
            {/* Grade Selection */}
            <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-400">
                    {t("1. Select Grade", "1. เลือกระดับชั้น")}
                </label>
                <select
                    value={selectedGrade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className={baseSelectClass}
                    disabled={disabled || !schoolId || !students || students.length === 0}
                    required={required}
                >
                    <option value="">
                        {!schoolId
                            ? t("Select school first", "เลือกโรงเรียนก่อน")
                            : students === undefined
                                ? t("Loading...", "กำลังโหลด...")
                                : students.length === 0
                                    ? t("No students found", "ไม่พบนักเรียน")
                                    : t("-- Select Grade --", "-- เลือกระดับชั้น --")
                        }
                    </option>
                    {availableGrades.map((grade) => (
                        <option key={grade} value={grade}>
                            {grade}
                        </option>
                    ))}
                </select>
            </div>

            {/* Class Selection - Only show if grade selected */}
            {selectedGrade && (
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-400">
                        {t("2. Select Class", "2. เลือกห้องเรียน")}
                    </label>
                    <select
                        value={selectedClass}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className={baseSelectClass}
                        disabled={disabled}
                        required={required}
                    >
                        <option value="">{t("-- Select Class --", "-- เลือกห้องเรียน --")}</option>
                        {availableClasses.map((classValue) => (
                            <option key={classValue} value={classValue}>
                                {classValue}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Student Selection - Only show if both grade and class selected */}
            {selectedGrade && selectedClass && (
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-400">
                        {t("3. Select Student", "3. เลือกนักเรียน")}
                    </label>
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value as Id<"students"> | "")}
                        className={baseSelectClass}
                        disabled={disabled}
                        required={required}
                    >
                        <option value="">
                            {filteredStudents.length === 0
                                ? t("No students in this class", "ไม่มีนักเรียนในห้องนี้")
                                : t(placeholder, placeholderTh)
                            }
                        </option>
                        {filteredStudents.map((student) => (
                            <option key={student._id} value={student._id}>
                                {student.firstName} {student.lastName}
                            </option>
                        ))}
                    </select>
                    {filteredStudents.length > 0 && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {t(
                                `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} in ${selectedGrade}${selectedClass}`,
                                `มีนักเรียน ${filteredStudents.length} คนใน ${selectedGrade}${selectedClass}`
                            )}
                        </p>
                    )}
                </div>
            )}

            {/* Helper text when no selection made */}
            {!selectedGrade && students && students.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t(
                        `${students.length} total student${students.length !== 1 ? 's' : ''} available - select grade to filter`,
                        `มีนักเรียน ${students.length} คนทั้งหมด - เลือกระดับชั้นเพื่อกรอง`
                    )}
                </p>
            )}
        </div>
    );
}
