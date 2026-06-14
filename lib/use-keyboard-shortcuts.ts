/**
 * Keyboard Shortcuts Hook
 * Provides global and context-aware keyboard shortcuts
 */

import { useEffect, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Command key on Mac
  callback: (event: KeyboardEvent) => void;
  description: string;
  descriptionTh: string;
  disabled?: boolean;
}

export interface KeyboardShortcutOptions {
  /**
   * Enable shortcuts only when element is focused
   */
  scoped?: boolean;
  /**
   * Prevent default browser behavior
   */
  preventDefault?: boolean;
  /**
   * Stop event propagation
   */
  stopPropagation?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutOptions = {},
) {
  const {
    scoped = false,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in input/textarea/contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check scope
      if (
        scoped &&
        elementRef.current &&
        !elementRef.current.contains(target)
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          shortcut.callback(event);
          break;
        }
      }
    };

    const target = scoped && elementRef.current ? elementRef.current : window;
    target.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      target.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [shortcuts, scoped, preventDefault, stopPropagation]);

  return elementRef;
}

/**
 * Common keyboard shortcuts
 */
export const COMMON_SHORTCUTS = {
  NEW: {
    key: "n",
    ctrl: true,
    description: "Create new item",
    descriptionTh: "สร้างรายการใหม่",
  },
  SAVE: {
    key: "s",
    ctrl: true,
    description: "Save",
    descriptionTh: "บันทึก",
  },
  SEARCH: {
    key: "k",
    ctrl: true,
    description: "Search/Filter",
    descriptionTh: "ค้นหา/กรอง",
  },
  CLOSE: {
    key: "Escape",
    description: "Close modal/form",
    descriptionTh: "ปิดหน้าต่าง/แบบฟอร์ม",
  },
  HELP: {
    key: "?",
    shift: true,
    description: "Show keyboard shortcuts",
    descriptionTh: "แสดงทางลัด",
  },
  DELETE: {
    key: "Delete",
    description: "Delete selected item",
    descriptionTh: "ลบรายการที่เลือก",
  },
  EDIT: {
    key: "e",
    ctrl: true,
    description: "Edit selected item",
    descriptionTh: "แก้ไขรายการที่เลือก",
  },
  REFRESH: {
    key: "r",
    ctrl: true,
    description: "Refresh data",
    descriptionTh: "รีเฟรชข้อมูล",
  },
};

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");

  // Capitalize key
  const keyDisplay =
    shortcut.key === " " ? "Space" : shortcut.key.toUpperCase();
  parts.push(keyDisplay);

  return parts.join(" + ");
}

/**
 * Get all registered shortcuts for help modal
 */
export function getShortcutsList(
  shortcuts: KeyboardShortcut[],
): Array<{ keys: string; description: string; descriptionTh: string }> {
  return shortcuts
    .filter((s) => !s.disabled)
    .map((s) => ({
      keys: formatShortcut(s),
      description: s.description,
      descriptionTh: s.descriptionTh,
    }));
}
