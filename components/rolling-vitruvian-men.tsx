"use client";

import { useEffect, useState } from "react";

/**
 * Rotating Space/Galaxy Background System
 * - Spins 360° over 10 minutes (continuous rotation)
 * - Alternates between 2 space images every 40 minutes
 * - One small one rolls behind title once per minute
 * - Images are semi-transparent to allow UI visibility
 */

// Space/Galaxy images with math formulas - Using only 2 images
const SPACE_IMAGES = [
    "/images/space-galaxy-blue.jpg",   // Blue/teal galaxy with formulas
    "/images/space-galaxy-pink.jpg",   // Pink/purple galaxy with formulas  
];

export function RollingVitruvianMen({ isLoggedIn }: { isLoggedIn?: boolean }) {
    const [smallManPosition, setSmallManPosition] = useState(-30);
    const [smallManPaused, setSmallManPaused] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [rotationDegrees, setRotationDegrees] = useState(0);

    // ALTERNATING: Switch images every 40 minutes
    useEffect(() => {
        const alternateInterval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % SPACE_IMAGES.length);
        }, 40 * 60 * 1000); // 40 minutes in milliseconds

        return () => clearInterval(alternateInterval);
    }, []);

    // ROTATION: Spin 360° over 10 minutes (continuous)
    useEffect(() => {
        const rotationInterval = setInterval(() => {
            setRotationDegrees((prev) => (prev + 0.6) % 360); // 0.6° every 100ms = 360° in 10 min
        }, 100); // Update every 100ms for smooth rotation

        return () => clearInterval(rotationInterval);
    }, []);

    // Small image rolls once per minute when logged in
    useEffect(() => {
        if (!isLoggedIn) return;

        const rollSmallMan = () => {
            setSmallManPosition(-30); // Start from left
            setSmallManPaused(false);

            // Animate to title position (around 48% across)
            const animationInterval = setInterval(() => {
                setSmallManPosition((prev) => {
                    if (prev >= 48 && !smallManPaused) {
                        setSmallManPaused(true);
                        clearInterval(animationInterval);

                        // Pause for 5 seconds at title
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
            {/* Large Space/Galaxy Background - SPINS 360° in 10min + alternates every 40min */}
            <div
                className="fixed pointer-events-none"
                style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${rotationDegrees}deg)`,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 1, // BACK - behind everything except fish
                    opacity: 0.25, // Reduced opacity for better UI visibility
                }}
            >
                <img
                    key={currentImageIndex} // Force re-render on image change
                    src={SPACE_IMAGES[currentImageIndex]}
                    alt="Space Galaxy with Math Formulas"
                    className="w-full h-full object-cover drop-shadow-[0_0_50px_rgba(100,200,255,0.5)]"
                    style={{
                        filter: "brightness(1.1) contrast(1.1) saturate(1.2)",
                        mixBlendMode: "lighten",
                        transition: "opacity 2s ease-in-out" // Smooth image transition
                    }}
                />
            </div>

            {/* Small Space Image - rolls BEHIND "Class Tracker" title */}
            {isLoggedIn && (
                <div
                    className="fixed pointer-events-none transition-none"
                    style={{
                        left: `${smallManPosition}%`,
                        top: "80px",
                        transform: "translate(-50%, -50%)",
                        width: "auto",
                        height: "180px",
                        zIndex: 2, // BEHIND title
                        opacity: 0.35, // Reduced opacity for better UI visibility
                    }}
                >
                    <img
                        src={SPACE_IMAGES[currentImageIndex]}
                        alt="Space Galaxy"
                        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(100,200,255,0.6)]"
                        style={{
                            filter: "brightness(1.2) contrast(1.15) saturate(1.3)",
                            mixBlendMode: "lighten"
                        }}
                    />
                </div>
            )}
        </>
    );
}
