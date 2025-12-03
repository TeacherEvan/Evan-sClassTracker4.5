"use client";

import { useLanguage } from "@/lib/language-context";
import { 
  GraduationCap, 
  Calendar, 
  Search,
  type LucideIcon 
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  titleEn: string;
  titleTh: string;
  descriptionEn?: string;
  descriptionTh?: string;
  actionLabel?: string;
  actionLabelTh?: string;
  onAction?: () => void;
  variant?: "default" | "search" | "filter";
}

export function EmptyState({
  icon: Icon = GraduationCap,
  titleEn,
  titleTh,
  descriptionEn,
  descriptionTh,
  actionLabel,
  actionLabelTh,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  const { t } = useLanguage();

  const variantStyles = {
    default: {
      background: "bg-blue-100 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400"
    },
    search: {
      background: "bg-yellow-100 dark:bg-yellow-900/20",
      icon: "text-yellow-600 dark:text-yellow-400"
    },
    filter: {
      background: "bg-purple-100 dark:bg-purple-900/20",
      icon: "text-purple-600 dark:text-purple-400"
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${styles.background}`}>
        <Icon className={`w-10 h-10 ${styles.icon}`} />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {t(titleEn, titleTh)}
      </h3>
      
      {descriptionEn && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
          {t(descriptionEn, descriptionTh || descriptionEn)}
        </p>
      )}
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {t(actionLabel, actionLabelTh || actionLabel)}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoStudentsFound({ onAddStudent }: { onAddStudent?: () => void }) {
  return (
    <EmptyState
      icon={GraduationCap}
      titleEn="No students found"
      titleTh="ไม่พบข้อมูลนักเรียน"
      descriptionEn="Add your first student to get started"
      descriptionTh="เพิ่มนักเรียนคนแรกเพื่อเริ่มต้น"
      actionLabel={onAddStudent ? "Add Student" : undefined}
      actionLabelTh={onAddStudent ? "เพิ่มนักเรียน" : undefined}
      onAction={onAddStudent}
    />
  );
}

export function NoClassesFound({ onBookClass }: { onBookClass?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      titleEn="No classes scheduled"
      titleTh="ไม่มีคลาสที่นัดหมาย"
      descriptionEn="Book your first class to get started"
      descriptionTh="จองคลาสแรกเพื่อเริ่มต้น"
      actionLabel={onBookClass ? "Book Class" : undefined}
      actionLabelTh={onBookClass ? "จองคลาส" : undefined}
      onAction={onBookClass}
    />
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      icon={Search}
      titleEn="No results found"
      titleTh="ไม่พบผลลัพธ์"
      descriptionEn="Try adjusting your search or filter criteria"
      descriptionTh="ลองปรับการค้นหาหรือเกณฑ์การกรอง"
      variant="search"
    />
  );
}

export function NoFilterResults() {
  return (
    <EmptyState
      icon={Search}
      titleEn="No matches for current filters"
      titleTh="ไม่มีรายการที่ตรงกับตัวกรอง"
      descriptionEn="Try changing your filter settings"
      descriptionTh="ลองเปลี่ยนการตั้งค่าตัวกรอง"
      variant="filter"
    />
  );
}
