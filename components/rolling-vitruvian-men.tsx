"use client";

import { useEffect, useState } from "react";

/**
 * Rolling Vitruvian Men System
 * - Two large ones continuously roll across screen (65% opacity)
 * - One small one (50% size) rolls to logo, pauses 5 sec, continues (once per minute)
 */
export function RollingVitruvianMen({ isLoggedIn }: { isLoggedIn?: boolean }) {
    const [man1Position, setMan1Position] = useState(-30); // Start off-screen left
    const [man2Position, setMan2Position] = useState(-30);
    const [smallManPosition, setSmallManPosition] = useState(-30);
    const [smallManPaused, setSmallManPaused] = useState(false);

    // Two large men continuously roll
    useEffect(() => {
        const interval1 = setInterval(() => {
            setMan1Position((prev) => {
                if (prev >= 130) return -30; // Reset to left
                return prev + 0.15; // Slow scroll
            });
        }, 50);

        // Offset the second one
        const interval2 = setInterval(() => {
            setMan2Position((prev) => {
                if (prev >= 130) return -30;
                return prev + 0.15;
            });
        }, 50);

        return () => {
            clearInterval(interval1);
            clearInterval(interval2);
        };
    }, []);

    // Small man rolls once per minute when logged in
    useEffect(() => {
        if (!isLoggedIn) return;

        const rollSmallMan = () => {
            setSmallManPosition(-30); // Start from left
            setSmallManPaused(false);

            // Animate to logo position (around 48% across)
            const animationInterval = setInterval(() => {
                setSmallManPosition((prev) => {
                    if (prev >= 48 && !smallManPaused) {
                        setSmallManPaused(true);
                        clearInterval(animationInterval);

                        // Pause for 5 seconds at logo
                        setTimeout(() => {
                            setSmallManPaused(false);
                            // Continue rolling off screen
                            const continueInterval = setInterval(() => {
                                setSmallManPosition((prev) => {
                                    if (prev >= 130) {
                                        clearInterval(continueInterval);
                                        return 130;
                                    }
                                    return prev + 0.15;
                                });
                            }, 50);
                        }, 5000);

                        return prev;
                    }
                    if (!smallManPaused && prev < 48) {
                        return prev + 0.15;
                    }
                    return prev;
                });
            }, 50);
        };

        // First roll immediately
        rollSmallMan();

        // Then every minute
        const minuteInterval = setInterval(rollSmallMan, 60000);

        return () => clearInterval(minuteInterval);
    }, [isLoggedIn, smallManPaused]);

    return (
        <>
            {/* Large Vitruvian Man #1 - rolls continuously */}
            <div
                className="fixed pointer-events-none transition-none"
                style={{
                    left: `${man1Position}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(40vw, 350px)",
                    height: "min(40vw, 350px)",
                    zIndex: 1000, // FRONT of all layers
                    opacity: 0.65,
                }}
            >
                <VitruvianManSVG />
            </div>

            {/* Large Vitruvian Man #2 - offset roll */}
            <div
                className="fixed pointer-events-none transition-none"
                style={{
                    left: `${man2Position}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(40vw, 350px)",
                    height: "min(40vw, 350px)",
                    zIndex: 1000,
                    opacity: 0.65,
                }}
            >
                <VitruvianManSVG />
            </div>

            {/* Small Vitruvian Man - rolls to logo once per minute when logged in */}
            {isLoggedIn && (
                <div
                    className="fixed pointer-events-none transition-none"
                    style={{
                        left: `${smallManPosition}%`,
                        top: "15%", // Near logo position
                        transform: "translate(-50%, -50%)",
                        width: "min(20vw, 175px)", // 50% smaller
                        height: "min(20vw, 175px)",
                        zIndex: 999, // Behind logo but in front of content
                        opacity: 0.65,
                    }}
                >
                    <VitruvianManSVG />
                </div>
            )}
        </>
    );
}

/**
 * Vitruvian Man SVG - Reusable component
 */
function VitruvianManSVG() {
    return (
        <svg
            viewBox="0 0 400 400"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]"
        >
            <defs>
                <linearGradient id="vitruvianGoldRoll" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                    <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
                </linearGradient>

                <filter id="glowRoll">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Perfect circle */}
            <circle
                cx="200"
                cy="200"
                r="150"
                fill="none"
                stroke="url(#vitruvianGoldRoll)"
                strokeWidth="3"
                filter="url(#glowRoll)"
            />

            {/* Perfect square */}
            <rect
                x="50"
                y="50"
                width="300"
                height="300"
                fill="none"
                stroke="url(#vitruvianGoldRoll)"
                strokeWidth="3"
                filter="url(#glowRoll)"
                opacity="0.7"
            />

            {/* Human figure - simplified Vitruvian Man */}
            <g stroke="url(#vitruvianGoldRoll)" strokeWidth="2.5" fill="none" filter="url(#glowRoll)">
                {/* Head */}
                <circle cx="200" cy="120" r="25" />

                {/* Body */}
                <line x1="200" y1="145" x2="200" y2="240" />

                {/* Arms spread (circle pose) */}
                <line x1="200" y1="160" x2="120" y2="160" />
                <line x1="200" y1="160" x2="280" y2="160" />

                {/* Arms raised (square pose) - slightly transparent */}
                <line x1="200" y1="160" x2="140" y2="100" opacity="0.6" />
                <line x1="200" y1="160" x2="260" y2="100" opacity="0.6" />

                {/* Legs spread (circle pose) */}
                <line x1="200" y1="240" x2="140" y2="320" />
                <line x1="200" y1="240" x2="260" y2="320" />

                {/* Legs together (square pose) - slightly transparent */}
                <line x1="200" y1="240" x2="185" y2="340" opacity="0.6" />
                <line x1="200" y1="240" x2="215" y2="340" opacity="0.6" />

                {/* Navel point (center of circle) */}
                <circle cx="200" cy="200" r="3" fill="url(#vitruvianGoldRoll)" />
            </g>

            {/* Phi ratio markers */}
            <g stroke="url(#vitruvianGoldRoll)" strokeWidth="1" opacity="0.5" strokeDasharray="4,4">
                <line x1="50" y1="200" x2="350" y2="200" />
                <line x1="200" y1="50" x2="200" y2="350" />
            </g>
        </svg>
    );
}
