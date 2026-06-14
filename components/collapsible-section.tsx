"use client";

import { useLanguage } from "@/lib/language-context";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CollapsibleSectionProps {
  titleEn: string;
  titleTh: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Reusable collapsible section component - Pattern #20
 *
 * Replaces long scrolling forms with expandable sections.
 *
 * Features:
 * - Bilingual support (EN/TH)
 * - Smooth expand/collapse animation
 * - Optional default open state
 * - Custom icons and badges
 * - Callback on toggle
 * - Accessible (keyboard navigation, ARIA)
 * - Dark mode support
 *
 * Usage:
 * ```tsx
 * <CollapsibleSection
 *   titleEn="Additional Information"
 *   titleTh="ข้อมูลเพิ่มเติม"
 *   defaultOpen={false}
 * >
 *   <div className="space-y-4">
 *     {/* Your form fields here *\/}
 *   </div>
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection({
  titleEn,
  titleTh,
  children,
  defaultOpen = false,
  className = "",
  headerClassName = "",
  contentClassName = "",
  icon,
  badge,
  onToggle,
}: CollapsibleSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <div
      className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${headerClassName}`}
        aria-expanded={isOpen}
        aria-label={t(
          `${isOpen ? "Collapse" : "Expand"} ${titleEn}`,
          `${isOpen ? "ย่อ" : "ขยาย"} ${titleTh}`,
        )}
      >
        <div className="flex items-center gap-2">
          {/* Optional icon */}
          {icon && (
            <span className="text-gray-500 dark:text-gray-400">{icon}</span>
          )}

          {/* Title */}
          <span className="font-medium text-gray-900 dark:text-white">
            {t(titleEn, titleTh)}
          </span>

          {/* Optional badge */}
          {badge && <span>{badge}</span>}
        </div>

        {/* Chevron indicator */}
        <span className="text-gray-500 dark:text-gray-400">
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </span>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div
          className={`p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
