"use client";

import { useLanguage } from "@/lib/language-context";

interface LogoProps {
    size?: "sm" | "md" | "lg";
    showSlogan?: boolean;
}

export function Logo({ size = "md", showSlogan = true }: LogoProps) {
    const { t } = useLanguage();

    const sizeClasses = {
        sm: {
            title: "text-xl md:text-2xl",
            slogan: "text-xs md:text-sm",
        },
        md: {
            title: "text-3xl md:text-4xl",
            slogan: "text-sm md:text-base",
        },
        lg: {
            title: "text-4xl md:text-5xl",
            slogan: "text-base md:text-lg",
        },
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            {/* Main Title - Stoic and Intellectual */}
            <h1
                className={`font-serif ${sizeClasses[size].title} font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center`}
                style={{
                    fontFamily: "'Playfair Display', 'Georgia', serif",
                    letterSpacing: "0.02em",
                }}
            >
                {t("Evan's ClassTracker", "Evan's ClassTracker")}
            </h1>

            {/* Slogan - Pulsating Gold */}
            {showSlogan && (
                <p
                    className={`${sizeClasses[size].slogan} font-medium text-center animate-pulse-gold`}
                    style={{
                        color: "#D4AF37", // Gold color
                        textShadow: "0 0 10px rgba(212, 175, 55, 0.3)",
                    }}
                >
                    {t("Built by teachers - for Teachers", "สร้างโดยครู - เพื่อครู")}
                </p>
            )}

            <style jsx>{`
        @keyframes pulse-gold {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.02);
          }
        }

        .animate-pulse-gold {
          animation: pulse-gold 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
