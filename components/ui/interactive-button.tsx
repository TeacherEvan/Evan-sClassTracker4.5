"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

/**
 * InteractiveButton Component
 * 
 * A production-grade button component with:
 * - Smooth transitions and micro-interactions
 * - Loading states with spinner
 * - Hover effects and visual feedback
 * - Multiple variants and sizes
 * - Accessibility support
 * 
 * Follows latest UX best practices for 2024
 */

export interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "relative inline-flex items-center justify-center gap-2 font-medium",
      "transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "touch-manipulation",
      "active:scale-[0.98]",
      "overflow-hidden group",
    ].join(" ");

    const variantClasses = {
      primary: [
        "bg-gradient-to-r from-blue-600 to-blue-700",
        "text-white shadow-lg shadow-blue-500/20",
        "hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/30",
        "focus:ring-blue-500",
        "hover:scale-[1.02]",
      ].join(" "),
      secondary: [
        "bg-gradient-to-r from-gray-600 to-gray-700",
        "text-white shadow-md shadow-gray-500/10",
        "hover:from-gray-700 hover:to-gray-800",
        "focus:ring-gray-500",
        "hover:scale-[1.02]",
      ].join(" "),
      success: [
        "bg-gradient-to-r from-green-600 to-green-700",
        "text-white shadow-lg shadow-green-500/20",
        "hover:from-green-700 hover:to-green-800",
        "focus:ring-green-500",
        "hover:scale-[1.02]",
      ].join(" "),
      danger: [
        "bg-gradient-to-r from-red-600 to-red-700",
        "text-white shadow-lg shadow-red-500/20",
        "hover:from-red-700 hover:to-red-800",
        "focus:ring-red-500",
        "hover:scale-[1.02]",
      ].join(" "),
      ghost: [
        "bg-transparent text-gray-700 dark:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:ring-gray-300",
      ].join(" "),
      outline: [
        "bg-transparent border-2 border-gray-300 dark:border-gray-600",
        "text-gray-700 dark:text-gray-300",
        "hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400",
        "focus:ring-gray-300",
      ].join(" "),
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-4 py-2.5 text-base rounded-lg",
      lg: "px-6 py-3 text-lg rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shimmer effect on hover (except ghost) */}
        {variant !== "ghost" && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {/* Content */}
        <span className="relative flex items-center justify-center gap-2">
          {/* Loading spinner or left icon */}
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
          )}

          {/* Button text */}
          <span className={cn(isLoading && loadingText && "opacity-0 absolute")}>
            {children}
          </span>
          {isLoading && loadingText && (
            <span className="flex items-center gap-2">{loadingText}</span>
          )}

          {/* Right icon */}
          {!isLoading && rightIcon && (
            <span className="flex-shrink-0">{rightIcon}</span>
          )}
        </span>
      </button>
    );
  }
);

InteractiveButton.displayName = "InteractiveButton";

/**
 * IconButton Component
 * 
 * Specialized button for icon-only actions
 */
interface IconButtonProps extends Omit<InteractiveButtonProps, "leftIcon" | "rightIcon"> {
  icon: React.ReactNode;
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = "md", variant = "ghost", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    return (
      <InteractiveButton
        ref={ref}
        variant={variant}
        size={size}
        className={cn("p-0", sizeClasses[size], className)}
        {...props}
      >
        {icon}
      </InteractiveButton>
    );
  }
);

IconButton.displayName = "IconButton";
