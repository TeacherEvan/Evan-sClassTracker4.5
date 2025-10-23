"use client";

import { useEffect, useState } from "react";

/**
 * Rolling Da Vinci Masterpieces System
 * - Uses REAL Da Vinci artwork images from the web
 * - Two large ones continuously roll across screen (65% opacity)
 * - One small one (50% size) rolls to logo, pauses 5 sec, continues (once per minute)
 */

// Real Da Vinci artwork URLs (high quality, transparent backgrounds where possible)
const DA_VINCI_IMAGES = [
    // Vitruvian Man - THE ICONIC ONE
    "https://upload.wikimedia.org/wikipedia/commons/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg",
    // Mona Lisa
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1200px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
    // The Last Supper
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/%C3%9Altima_Cena_-_Da_Vinci_5.jpg/1920px-%C3%9Altima_Cena_-_Da_Vinci_5.jpg",
];

export function RollingVitruvianMen({ isLoggedIn }: { isLoggedIn?: boolean }) {
    const [man1Position, setMan1Position] = useState(-30); // Start off-screen left
    const [man2Position, setMan2Position] = useState(-30);
    const [smallManPosition, setSmallManPosition] = useState(-30);
    const [smallManPaused, setSmallManPaused] = useState(false);

    // Randomly select different Da Vinci images for variety
    const [man1Image] = useState(DA_VINCI_IMAGES[0]); // Always Vitruvian Man
    const [man2Image] = useState(DA_VINCI_IMAGES[Math.floor(Math.random() * DA_VINCI_IMAGES.length)]);
    const [smallManImage] = useState(DA_VINCI_IMAGES[0]); // Small one is always Vitruvian Man

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
            {/* Large Da Vinci #1 - MASSIVE - STAYS CENTERED AT BACK */}
            <div
                className="fixed pointer-events-none"
                style={{
                    left: "50%", // ALWAYS CENTERED
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "auto",
                    height: "95vh", // HUGE - almost touching top/bottom
                    zIndex: 1, // BACK - behind everything except fish
                    opacity: 0.45, // More transparent to hide paper border
                }}
            >
                <img
                    src={man1Image}
                    alt="Da Vinci Vitruvian Man"
                    className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]"
                    style={{
                        filter: "sepia(0.5) brightness(1.2) contrast(1.15) saturate(0.8)",
                        mixBlendMode: "lighten" // Better blend to hide paper
                    }}
                />
            </div>

            {/* Large Da Vinci #2 - ALSO CENTERED AT BACK (slightly offset timing) */}
            <div
                className="fixed pointer-events-none"
                style={{
                    left: "50%", // ALWAYS CENTERED
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "auto",
                    height: "95vh", // HUGE
                    zIndex: 1, // BACK
                    opacity: 0.60, // Even more transparent (layered effect)
                }}
            >
                <img
                    src={man2Image}
                    alt="Da Vinci Artwork"
                    className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]"
                    style={{
                        filter: "sepia(0.5) brightness(1.2) contrast(1.15) saturate(0.8)",
                        mixBlendMode: "lighten"
                    }}
                />
            </div>

            {/* Small Da Vinci - rolls BEHIND "Class Tracker" title */}
            {isLoggedIn && (
                <div
                    className="fixed pointer-events-none transition-none"
                    style={{
                        left: `${smallManPosition}%`,
                        top: "80px", // Behind Class Tracker title
                        transform: "translate(-50%, -50%)",
                        width: "auto",
                        height: "180px", // Smaller for title area
                        zIndex: 2, // BEHIND title (header is probably z-10+)
                        opacity: 0.5, // MORE VISIBLE
                    }}
                >
                    <img
                        src={smallManImage}
                        alt="Da Vinci Vitruvian Man"
                        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.7)]"
                        style={{
                            filter: "sepia(0.4) brightness(1.3) contrast(1.2) saturate(0.9)",
                            mixBlendMode: "lighten"
                        }}
                    />
                </div>
            )}
        </>
    );
}
