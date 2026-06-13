"use client";

import { useId } from "react";
import { Label } from "./Label";
import { Input } from "./Input";
import { I18nString, Language, useI18nInput } from "@/lib/hooks/useI18n";

export interface I18nInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: I18nString;
  value: I18nString | null | undefined;
  onChange: (val: I18nString) => void;
  language: Language;
}

export function I18nInput({
  label,
  value,
  onChange,
  language,
  className,
  id: providedId,
  ...props
}: I18nInputProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  const { value: localValue, onChange: handleChange } = useI18nInput(
    value || { en: "", th: "" },
    onChange,
    language
  );

  return (
    <div className={`space-y-1 ${className || ""}`}>
      <Label htmlFor={id}>{label[language]}</Label>
      <Input
        id={id}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        {...props}
      />
    </div>
  );
}