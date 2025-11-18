"use client";

import { useLanguage } from "@/lib/language-context";
import { formatShortcut, type KeyboardShortcut } from "@/lib/use-keyboard-shortcuts";
import { X, Keyboard } from "lucide-react";
import { useEffect } from "react";
import { FOCUS_RING } from "@/lib/accessibility-utils";

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const { language } = useLanguage();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeShortcuts = shortcuts.filter((s) => !s.disabled);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2
              id="shortcuts-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {language === "en" ? "Keyboard Shortcuts" : "ทางลัดแป้นพิมพ์"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${FOCUS_RING}`}
            aria-label={language === "en" ? "Close" : "ปิด"}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeShortcuts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {language === "en"
                ? "No keyboard shortcuts available on this page."
                : "ไม่มีทางลัดแป้นพิมพ์สำหรับหน้านี้"}
            </p>
          ) : (
            <div className="space-y-3">
              {activeShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {language === "en"
                      ? shortcut.description
                      : shortcut.descriptionTh}
                  </span>
                  <kbd className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-800 dark:text-gray-200 min-h-[32px]">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {language === "en" ? (
              <>
                Press <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">?</kbd> to
                show this help anytime
              </>
            ) : (
              <>
                กด <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">?</kbd>{" "}
                เพื่อแสดงความช่วยเหลือนี้ได้ทุกเมื่อ
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
