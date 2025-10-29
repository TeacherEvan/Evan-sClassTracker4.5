"use client";

import { useLanguage } from "@/lib/language-context";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface PaginatedListProps<T> {
    items: T[];
    itemsPerPage?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    emptyMessageEn?: string;
    emptyMessageTh?: string;
    showPageInfo?: boolean;
    showJumpButtons?: boolean;
    className?: string;
    onPageChange?: (page: number) => void;
}

/**
 * Reusable pagination component - Pattern #19
 * 
 * Replaces vertical scrolling with horizontal pagination for large datasets.
 * 
 * Features:
 * - Bilingual support (EN/TH)
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Accessibility (ARIA labels, focus management)
 * - Responsive design (mobile/desktop)
 * - Performance optimized (renders only visible items)
 * - Customizable items per page
 * - Optional jump-to-first/last buttons
 * 
 * Usage:
 * ```tsx
 * <PaginatedList
 *   items={students}
 *   itemsPerPage={10}
 *   renderItem={(student) => <StudentCard student={student} />}
 *   emptyMessageEn="No students found"
 *   emptyMessageTh="ไม่พบนักเรียน"
 * />
 * ```
 */
export function PaginatedList<T>({
    items,
    itemsPerPage = 10,
    renderItem,
    emptyMessageEn = "No items found",
    emptyMessageTh = "ไม่พบรายการ",
    showPageInfo = true,
    showJumpButtons = true,
    className = "",
    onPageChange,
}: PaginatedListProps<T>) {
    const { t } = useLanguage();
    const [currentPage, setCurrentPage] = useState(0);

    // Calculate pagination values
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const visibleItems = useMemo(
        () => items.slice(startIndex, endIndex),
        [items, startIndex, endIndex]
    );

    // Reset to first page if items change and current page is out of bounds
    useEffect(() => {
        if (currentPage >= totalPages && totalPages > 0) {
            setCurrentPage(0);
        }
    }, [items.length, currentPage, totalPages]);

    // Navigation handlers
    const goToPage = (page: number) => {
        const newPage = Math.max(0, Math.min(page, totalPages - 1));
        setCurrentPage(newPage);
        onPageChange?.(newPage);
    };

    const goToFirstPage = () => goToPage(0);
    const goToPrevPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);
    const goToLastPage = () => goToPage(totalPages - 1);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if not typing in input/textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (e.key) {
                case "ArrowLeft":
                    if (currentPage > 0) {
                        e.preventDefault();
                        setCurrentPage(p => Math.max(0, p - 1));
                    }
                    break;
                case "ArrowRight":
                    if (currentPage < totalPages - 1) {
                        e.preventDefault();
                        setCurrentPage(p => Math.min(totalPages - 1, p + 1));
                    }
                    break;
                case "Home":
                    if (currentPage > 0) {
                        e.preventDefault();
                        setCurrentPage(0);
                    }
                    break;
                case "End":
                    if (currentPage < totalPages - 1) {
                        e.preventDefault();
                        setCurrentPage(totalPages - 1);
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentPage, totalPages]);

    // Empty state
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg">{t(emptyMessageEn, emptyMessageTh)}</p>
            </div>
        );
    }

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Items list - NO SCROLL, fixed height based on itemsPerPage */}
            <div className="space-y-2">
                {visibleItems.map((item, index) => (
                    <div key={startIndex + index}>
                        {renderItem(item, startIndex + index)}
                    </div>
                ))}
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Page info */}
                {showPageInfo && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t(
                            `Showing ${startIndex + 1}-${endIndex} of ${items.length}`,
                            `แสดง ${startIndex + 1}-${endIndex} จาก ${items.length}`
                        )}
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center gap-2">
                    {/* Jump to first */}
                    {showJumpButtons && (
                        <button
                            onClick={goToFirstPage}
                            disabled={isFirstPage}
                            aria-label={t("First page", "หน้าแรก")}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={t("First page (Home)", "หน้าแรก (Home)")}
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                    )}

                    {/* Previous */}
                    <button
                        onClick={goToPrevPage}
                        disabled={isFirstPage}
                        aria-label={t("Previous page", "หน้าก่อนหน้า")}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        title={t("Previous page (←)", "หน้าก่อนหน้า (←)")}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{t("Previous", "ก่อนหน้า")}</span>
                    </button>

                    {/* Page indicator */}
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t(
                            `Page ${currentPage + 1} of ${totalPages}`,
                            `หน้า ${currentPage + 1} จาก ${totalPages}`
                        )}
                    </div>

                    {/* Next */}
                    <button
                        onClick={goToNextPage}
                        disabled={isLastPage}
                        aria-label={t("Next page", "หน้าถัดไป")}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        title={t("Next page (→)", "หน้าถัดไป (→)")}
                    >
                        <span className="hidden sm:inline">{t("Next", "ถัดไป")}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Jump to last */}
                    {showJumpButtons && (
                        <button
                            onClick={goToLastPage}
                            disabled={isLastPage}
                            aria-label={t("Last page", "หน้าสุดท้าย")}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={t("Last page (End)", "หน้าสุดท้าย (End)")}
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
