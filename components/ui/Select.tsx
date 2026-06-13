"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disabled, required, options, placeholder, value, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
          placeholder:text-muted-foreground
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? "border-destructive focus-visible:ring-destructive" : "border-input"}
          ${disabled ? "bg-muted" : ""}
          ${className || ""}
        `}
        disabled={disabled}
        required={required}
        value={value}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = "Select";
