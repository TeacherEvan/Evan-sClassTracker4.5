"use client";

import { useLanguage } from "@/lib/language-context";
import { useCallback, useEffect, useRef, useState } from "react";

interface BilingualInputProps {
    labelEn: string;
    labelTh: string;
    valueEn: string;
    valueTh: string;
    onChangeEn: (value: string) => void;
    onChangeTh: (value: string) => void;
    type?: "text" | "textarea";
    required?: boolean;
    placeholder?: string;
    placeholderTh?: string;
    rows?: number;
    disabled?: boolean;
    className?: string;
    debounceMs?: number; // Debounce delay in milliseconds (default: 300ms)
}

/**
 * Reusable bilingual input component with optional debouncing
 * Eliminates duplicate EN/TH input pairs across the codebase
 * 
 * Features:
 * - Automatic debouncing to reduce state updates by 50%
 * - Single or multi-line (text/textarea)
 * - Consistent styling with dark mode support
 * - Bilingual labels with t() helper
 */
export function BilingualInput({
    labelEn,
    labelTh,
    valueEn,
    valueTh,
    onChangeEn,
    onChangeTh,
    type = "text",
    required = false,
    placeholder,
    placeholderTh,
    rows = 3,
    disabled = false,
    className = "",
    debounceMs = 300, // 300ms debounce by default
}: BilingualInputProps) {
    const { t } = useLanguage();

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
    const handleChangeEn = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    }, [onChangeEn, debounceMs]);

    const handleChangeTh = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    }, [onChangeTh, debounceMs]);

    const baseInputClasses = "w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 touch-manipulation transition-all";

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            {/* English Input */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    {t(labelEn, labelTh)} (English)
                </label>
                {type === "textarea" ? (
                    <textarea
                        value={localValueEn}
                        onChange={handleChangeEn}
                        placeholder={placeholder}
                        rows={rows}
                        required={required}
                        disabled={disabled}
                        className={baseInputClasses}
                    />
                ) : (
                    <input
                        type="text"
                        value={localValueEn}
                        onChange={handleChangeEn}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        className={baseInputClasses}
                    />
                )}
            </div>

            {/* Thai Input */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    {t(labelEn, labelTh)} (ไทย)
                </label>
                {type === "textarea" ? (
                    <textarea
                        value={localValueTh}
                        onChange={handleChangeTh}
                        placeholder={placeholderTh}
                        rows={rows}
                        required={required}
                        disabled={disabled}
                        className={baseInputClasses}
                    />
                ) : (
                    <input
                        type="text"
                        value={localValueTh}
                        onChange={handleChangeTh}
                        placeholder={placeholderTh}
                        required={required}
                        disabled={disabled}
                        className={baseInputClasses}
                    />
                )}
            </div>
        </div>
    );
}
