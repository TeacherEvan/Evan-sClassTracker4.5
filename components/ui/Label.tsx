"use client";

import { LabelHTMLAttributes, forwardRef, ReactNode } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className || ""}`}
        {...props}
      >
        {children}
      </label>
    );
  },
);
Label.displayName = "Label";
