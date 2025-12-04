"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EnhancedLoadingProps {
  variant?: "default" | "minimal" | "card" | "fullscreen";
  message?: string;
  className?: string;
}

/**
 * EnhancedLoading Component
 * 
 * Premium loading component with smooth animations and modern design.
 * Provides better user feedback during async operations.
 * 
 * @param variant - Loading style (default, minimal, card, fullscreen)
 * @param message - Optional loading message
 * @param className - Additional CSS classes
 */
export function EnhancedLoading({
  variant = "default",
  message,
  className
}: EnhancedLoadingProps) {
  const baseClasses = "flex items-center justify-center";
  
  const variantClasses = {
    default: "h-full min-h-[200px]",
    minimal: "h-12",
    card: "h-full min-h-[300px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm",
    fullscreen: "fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50"
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex flex-col items-center gap-3">
        {/* Animated spinner with gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse" />
          <Loader2 
            className={cn(
              "relative animate-spin text-blue-600 dark:text-blue-400",
              variant === "minimal" ? "w-6 h-6" : "w-12 h-12"
            )} 
          />
        </div>
        
        {/* Optional loading message */}
        {message && (
          <p className={cn(
            "text-center text-gray-600 dark:text-gray-400 font-medium animate-pulse",
            variant === "minimal" ? "text-sm" : "text-base"
          )}>
            {message}
          </p>
        )}
        
        {/* Subtle progress indicator */}
        {variant !== "minimal" && (
          <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" 
                 style={{ width: '40%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay for critical operations.
 * Prevents user interaction during important processes.
 */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
        <EnhancedLoading variant="minimal" message={message} />
      </div>
    </div>
  );
}

/**
 * SpinnerButton Component
 * 
 * Button with integrated loading state.
 * Shows spinner when loading, maintains button size.
 */
interface SpinnerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export function SpinnerButton({ 
  isLoading, 
  children, 
  className,
  disabled,
  ...props 
}: SpinnerButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium",
        "transition-all duration-200 ease-in-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        isLoading && "cursor-not-allowed opacity-75",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      <span className={cn(isLoading && "opacity-70")}>
        {children}
      </span>
    </button>
  );
}

/**
 * ProgressBar Component
 * 
 * Determinate or indeterminate progress indicator.
 */
interface ProgressBarProps {
  progress?: number; // 0-100, undefined for indeterminate
  className?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export function ProgressBar({ progress, className, variant = "default" }: ProgressBarProps) {
  const colorClasses = {
    default: "from-blue-500 to-purple-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    error: "from-red-500 to-pink-500"
  };

  const isIndeterminate = progress === undefined;

  return (
    <div className={cn("w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", className)}>
      <div 
        className={cn(
          "h-full bg-gradient-to-r rounded-full transition-all duration-300",
          colorClasses[variant],
          isIndeterminate && "animate-[shimmer_1.5s_ease-in-out_infinite]"
        )}
        style={{ 
          width: isIndeterminate ? '40%' : `${progress}%`
        }}
      />
    </div>
  );
}
