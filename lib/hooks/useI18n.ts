"use client";

import { useState, useEffect, useCallback } from "react";

export type I18nString = { en: string; th: string };
export type Language = "en" | "th";

/**
 * Returns the current language value from an i18n object.
 * Use this for reading/displaying i18n values.
 */
export function useI18n(value: I18nString, language: Language): string {
  return language === "th" ? value.th : value.en;
}

/**
 * Returns a setter function that updates only the current language's value in an i18n object.
 * Use this for controlled input components.
 */
export function useSetI18n(
  setValue: (val: I18nString | ((prev: I18nString) => I18nString)) => void,
  language: Language,
): (text: string) => void {
  return useCallback(
    (text: string) => {
      setValue((prev: I18nString) => ({
        ...prev,
        [language]: text,
      }));
    },
    [setValue, language],
  );
}

/**
 * Combined hook for controlled i18n input components.
 * Handles local state synchronization with the parent value.
 */
export function useI18nInput(
  value: I18nString,
  onChange: (val: I18nString) => void,
  language: Language,
) {
  const [localValue, setLocalValue] = useState(() => value[language] || "");

  // Sync local value when parent value or language changes
  useEffect(() => {
    setLocalValue(value[language] || "");
  }, [value, language]);

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);
      onChange({ ...value, [language]: text });
    },
    [onChange, value, language],
  );

  return { value: localValue, onChange: handleChange };
}
