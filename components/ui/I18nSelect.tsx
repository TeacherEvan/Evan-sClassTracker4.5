"use client";

import { useId } from "react";
import { Label } from "./Label";
import { Select, SelectProps } from "./Select";
import { I18nString, Language, useI18nInput } from "@/lib/hooks/useI18n";

export interface I18nSelectProps
  extends Omit<SelectProps, "value" | "onChange" | "options"> {
  label: I18nString;
  value: I18nString | null | undefined;
  onChange: (val: I18nString) => void;
  language: Language;
  options: { value: string; label: I18nString }[];
}

export function I18nSelect({
  label,
  value,
  onChange,
  language,
  className,
  id: providedId,
  options,
  placeholder,
  ...props
}: I18nSelectProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  const { value: localValue, onChange: handleChange } = useI18nInput(
    value || { en: "", th: "" },
    onChange,
    language,
  );

  return (
    <div className={`space-y-1 ${className || ""}`}>
      <Label htmlFor={id}>{label[language]}</Label>
      <Select
        id={id}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        options={options.map((opt) => ({
          value: opt.value,
          label: opt.label[language],
        }))}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
