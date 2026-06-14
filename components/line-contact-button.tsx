"use client";

import { useLanguage } from "@/lib/language-context";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

interface LineContactButtonProps {
  className?: string;
  variant?: "floating" | "inline" | "sidebar";
  showLabel?: boolean;
}

/**
 * LINE Official Account Contact Button
 *
 * Integrates LINE Add Friend functionality with three display variants:
 * - floating: Fixed bottom-right floating action button (mobile-friendly)
 * - inline: Inline button for navigation/footer areas
 * - sidebar: Compact button for sidebar integration
 *
 * LINE Account: https://lin.ee/oaXgLED
 */
export function LineContactButton({
  className = "",
  variant = "floating",
  showLabel = true,
}: LineContactButtonProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const lineUrl = "https://lin.ee/oaXgLED";

  // Variant-specific styles
  const variantClasses = {
    floating: `
      fixed bottom-6 right-6 z-50
      shadow-lg hover:shadow-xl
      transition-all duration-300
      ${isExpanded ? "w-auto" : "w-14 h-14"}
    `,
    inline: `
      inline-flex items-center gap-2
      px-4 py-2 rounded-lg
      shadow-md hover:shadow-lg
      transition-all duration-200
    `,
    sidebar: `
      w-full flex items-center gap-3
      px-3 py-2.5 rounded-lg
      hover:bg-green-50 dark:hover:bg-green-900/20
      transition-all duration-200
    `,
  };

  // LINE brand color
  const lineGreen = "bg-[#06C755] hover:bg-[#05B34B] text-white";

  if (variant === "floating") {
    return (
      <div className={`${variantClasses.floating} ${className}`}>
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            flex items-center justify-center gap-2
            ${lineGreen}
            rounded-full
            touch-target
            interactive-hover
            interactive-touch
            overflow-hidden
            ${isExpanded ? "px-4 py-3" : "w-14 h-14"}
          `}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          aria-label={t("Contact us on LINE", "ติดต่อเราผ่าน LINE")}
        >
          {/* LINE Icon (custom or MessageCircle as fallback) */}
          <div className="flex-shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>

          {/* Expanding label */}
          {isExpanded && showLabel && (
            <span className="whitespace-nowrap font-medium text-sm animate-fadeIn">
              {t("Contact on LINE", "ติดต่อผ่าน LINE")}
            </span>
          )}
        </a>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          ${variantClasses.inline}
          ${lineGreen}
          ${className}
          touch-target
          interactive-hover
          interactive-touch
        `}
        aria-label={t("Contact us on LINE", "ติดต่อเราผ่าน LINE")}
      >
        <MessageCircle className="w-5 h-5" />
        {showLabel && (
          <span className="font-medium">
            {t("Contact on LINE", "ติดต่อผ่าน LINE")}
          </span>
        )}
      </a>
    );
  }

  // sidebar variant
  return (
    <a
      href={lineUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        ${variantClasses.sidebar}
        ${className}
        text-[#06C755] dark:text-[#06C755]
        border border-[#06C755]/20
        hover:border-[#06C755]/40
      `}
      aria-label={t("Contact us on LINE", "ติดต่อเราผ่าน LINE")}
    >
      <MessageCircle className="w-5 h-5 flex-shrink-0" />
      {showLabel && (
        <span className="font-medium text-sm">
          {t("LINE Support", "สนับสนุนผ่าน LINE")}
        </span>
      )}
    </a>
  );
}

/**
 * LINE Official "Add Friend" Banner Component
 *
 * Uses the official LINE Add Friend button image
 * Best for footer or prominent placement
 */
export function LineAddFriendBanner({
  className = "",
}: {
  className?: string;
}) {
  const { language } = useLanguage();
  const lineUrl = "https://lin.ee/oaXgLED";

  return (
    <div className={`inline-flex ${className}`}>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="interactive-hover interactive-touch inline-block"
      >
        <img
          src={
            language === "th"
              ? "https://scdn.line-apps.com/n/line_add_friends/btn/th.png"
              : "https://scdn.line-apps.com/n/line_add_friends/btn/en.png"
          }
          alt={language === "th" ? "เพิ่มเพื่อน" : "Add Friend"}
          height="36"
          className="h-9 w-auto"
        />
      </a>
    </div>
  );
}
