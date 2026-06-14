"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const DEFAULT_LINE_HEIGHT = 16;

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = [
    "bg-gradient-to-r",
    "from-gray-200 via-gray-100 to-gray-200",
    "dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
    "bg-[length:200%_100%]",
    "animate-shimmer",
  ].join(" ");

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  const style = {
    width: width
      ? typeof width === "number"
        ? `${width}px`
        : width
      : undefined,
    height: height
      ? typeof height === "number"
        ? `${height}px`
        : height
      : undefined,
  };

  if (lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses.text,
              i === lines - 1 ? "w-3/4" : "w-full",
            )}
            style={{ height: height || DEFAULT_LINE_HEIGHT }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

// Pre-built skeleton patterns for common use cases
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton
            variant="text"
            width={i === 0 ? 40 : i === columns - 1 ? 80 : "100%"}
          />
        </td>
      ))}
    </tr>
  );
}

export function StudentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={16} className="mb-2" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="50%" />
      </div>
    </div>
  );
}

export function ClassCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton
          variant="rectangular"
          width={60}
          height={24}
          className="rounded-full"
        />
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width="70%" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="text" width={60} height={24} />
      </div>
      <Skeleton variant="text" width="40%" height={14} className="mb-2" />
      <Skeleton variant="text" width="60%" height={28} />
    </div>
  );
}

export function StudentListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-3 py-3">
                <Skeleton width={16} height={16} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={80} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={60} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={50} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={50} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={100} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={80} />
              </th>
              <th className="px-6 py-3">
                <Skeleton variant="text" width={60} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={8} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
