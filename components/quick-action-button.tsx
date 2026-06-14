"use client";

import { type LucideIcon } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface QuickActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "edit" | "delete" | "duplicate" | "view" | "default";
  size?: "sm" | "md" | "lg";
}

/**
 * Quick Action Button Component
 *
 * Following UX Best Practices:
 * - 44x44px minimum touch target (WCAG 2.1 AA)
 * - Pulsating hover effect on desktop (respects prefers-reduced-motion)
 * - Touch-friendly tap feedback on mobile
 * - Clear visual states for all interactions
 * - Keyboard accessible with focus-visible
 *
 * Usage:
 *   <QuickActionButton
 *     icon={Pencil}
 *     label="Edit"
 *     variant="edit"
 *     onClick={handleEdit}
 *   />
 */
export const QuickActionButton = forwardRef<
  HTMLButtonElement,
  QuickActionButtonProps
>(
  (
    {
      icon: Icon,
      label,
      variant = "default",
      size = "md",
      className = "",
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      edit: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20",
      delete:
        "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
      duplicate:
        "text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20",
      view: "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20",
      default:
        "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700",
    };

    const sizeClasses = {
      sm: "p-1.5",
      md: "p-2",
      lg: "p-3",
    };

    const iconSizes = {
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <button
        ref={ref}
        type="button"
        className={`
          quick-action-btn
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        title={label}
        aria-label={label}
        {...props}
      >
        <Icon className={iconSizes[size]} />
      </button>
    );
  },
);

QuickActionButton.displayName = "QuickActionButton";
