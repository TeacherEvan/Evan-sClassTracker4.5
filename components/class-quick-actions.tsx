"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { Edit2, Eye, FileText, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ClassQuickActionsProps {
    classItem: Doc<"classes">;
    currentUser: Doc<"users">;
    onViewDetails: (cls: Doc<"classes">) => void;
    onEditClass: (cls: Doc<"classes">) => void;
    onDeleteClass: (cls: Doc<"classes">) => void;
    onAddNotes: (cls: Doc<"classes">) => void;
}

export function ClassQuickActions({
    classItem,
    currentUser,
    onViewDetails,
    onEditClass,
    onDeleteClass,
    onAddNotes,
}: ClassQuickActionsProps) {
    const { t } = useLanguage();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Permission checks
    const canEdit = currentUser.role === "admin" ||
        currentUser.role === "moderator" ||
        (currentUser.role === "teacher" && classItem.teacherId === currentUser._id);

    const canAddNotes = currentUser.role === "teacher" && classItem.teacherId === currentUser._id;
    const canDelete = canEdit;

    // Close menu when clicking outside
    const handleClickOutside = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setShowMenu(false);
        }
    };

    // Keyboard navigation support
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showMenu) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            window.addEventListener("keydown", handleEscape);
            return () => window.removeEventListener("keydown", handleEscape);
        }
    }, [showMenu]);

    // Auto-focus first menu item when opened
    useEffect(() => {
        if (showMenu && menuRef.current) {
            const firstButton = menuRef.current.querySelector("button");
            firstButton?.focus();
        }
    }, [showMenu]);

    return (
        <div className="relative">
            {/* Dropdown trigger button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="p-1.5 bg-gray-700/80 text-white rounded hover:bg-gray-600 transition-colors"
                title={t("Actions", "การดำเนินการ")}
                aria-label={t("Actions", "การดำเนินการ")}
                aria-expanded={showMenu}
                aria-haspopup="menu"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
                <>
                    {/* Backdrop to close menu (z-40) */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handleClickOutside}
                        aria-hidden="true"
                    />

                    {/* Menu items (z-50) */}
                    <div
                        ref={menuRef}
                        role="menu"
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1 animate-fadeIn"
                    >
                        <button
                            role="menuitem"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(false);
                                onViewDetails(classItem);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            {t("View Details", "ดูรายละเอียด")}
                        </button>

                        {canAddNotes && (
                            <button
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onAddNotes(classItem);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                {t("Add/Edit Notes", "เพิ่ม/แก้ไขบันทึก")}
                            </button>
                        )}

                        {canEdit && (
                            <button
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onEditClass(classItem);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                {t("Edit Class", "แก้ไขคลาส")}
                            </button>
                        )}

                        {canDelete && (
                            <button
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onDeleteClass(classItem);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t("Delete Class", "ลบคลาส")}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
