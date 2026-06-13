"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface I18nTextareaProps {
  labelEn: string;
  labelTh: string;
  valueEn: string;
  valueTh: string;
  onChangeEn: (value: string) => void;
  onChangeTh: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  placeholderTh?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
}

/**
 * Bilingual textarea component with label + textarea for each language
 * Follows the same props pattern as BilingualInput but dedicated to textarea
 *
 * Features:
 * - Automatic debouncing to reduce state updates
 * - Consistent styling with dark mode support
 * - Bilingual labels
 * - Controlled component pattern with sync from parent
 */
export function I18nTextarea({
  labelEn,
  labelTh,
  valueEn,
  valueTh,
  onChangeEn,
  onChangeTh,
  required = false,
  placeholder,
  placeholderTh,
  rows = 4,
  disabled = false,
  className = "",
  debounceMs = 300,
}: I18nTextareaProps) {
  // Internal state for immediate display (debounced output)
  const [localValueEn, setLocalValueEn] = useState(valueEn);
  const [localValueTh, setLocalValueTh] = useState(valueTh);

  // Sync props to local state when parent changes value
  useEffect(() => {
    setLocalValueEn(valueEn);
  }, [valueEn]);

  useEffect(() => {
    setLocalValueTh(valueTh);
  }, [valueTh]);

  // Debounce timers
  const timerEnRef = useRef<NodeJS.Timeout | null>(null);
  const timerThRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerEnRef.current) clearTimeout(timerEnRef.current);
      if (timerThRef.current) clearTimeout(timerThRef.current);
    };
  }, []);

  // Debounced change handlers
  const handleChangeEn = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValueEn(newValue);

      // Clear existing timer
      if (timerEnRef.current) {
        clearTimeout(timerEnRef.current);
      }

      // Set new timer
      timerEnRef.current = setTimeout(() => {
        onChangeEn(newValue);
      }, debounceMs);
    },
    [onChangeEn, debounceMs]
  );

  const handleChangeTh = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValueTh(newValue);

      // Clear existing timer
      if (timerThRef.current) {
        clearTimeout(timerThRef.current);
      }

      // Set new timer
      timerThRef.current = setTimeout(() => {
        onChangeTh(newValue);
      }, debounceMs);
    },
    [onChangeTh, debounceMs]
  );

  const baseTextareaClasses =
    "w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 touch-manipulation transition-all resize-y min-h-[80px]";

  const labelClasses = "block text-sm font-medium mb-2";

  return (
    <div data-testid="i18n-textarea-container" className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* English Textarea */}
      <div>
        <label htmlFor={`i18n-textarea-en-${labelEn.replace(/\s+/g, "-").toLowerCase()}`} className={labelClasses}>{labelEn} (English)</label>
        <textarea
          id={`i18n-textarea-en-${labelEn.replace(/\s+/g, "-").toLowerCase()}`}
          value={localValueEn}
          onChange={handleChangeEn}
          placeholder={placeholder}
          rows={rows}
          required={required}
          disabled={disabled}
          className={baseTextareaClasses}
        />
      </div>

      {/* Thai Textarea */}
      <div>
        <label htmlFor={`i18n-textarea-th-${labelTh.replace(/\s+/g, "-").toLowerCase()}`} className={labelClasses}>{labelTh} (ไทย)</label>
        <textarea
          id={`i18n-textarea-th-${labelTh.replace(/\s+/g, "-").toLowerCase()}`}
          value={localValueTh}
          onChange={handleChangeTh}
          placeholder={placeholderTh}
          rows={rows}
          required={required}
          disabled={disabled}
          className={baseTextareaClasses}
        />
      </div>
    </div>
  );
}