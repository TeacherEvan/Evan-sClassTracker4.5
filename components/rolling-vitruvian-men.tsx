"use client";

import { useEffect, useState } from "react";

const SPACE_IMAGES = [
    "/images/mathematical-physical-formulas-against-background-galaxy-universe-space-background.1600x0.webp",
    "/images/Gemini_Generated_Image_cy50ktcy50ktcy50.png",
];

export function RollingVitruvianMen() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const alternateInterval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % SPACE_IMAGES.length);
        }, 40 * 60 * 1000);

        return () => clearInterval(alternateInterval);
    }, []);

    return (
        <div
            className="fixed pointer-events-none"
            style={{
                left: 0,
                top: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 1,
                opacity: 0.25,
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                key={currentImageIndex}
                src={SPACE_IMAGES[currentImageIndex]}
                alt="Space Galaxy with Math Formulas"
                className="w-full h-full object-cover"
                style={{
                    filter: "brightness(1.1) contrast(1.1) saturate(1.2)",
                    mixBlendMode: "lighten",
                    transition: "opacity 2s ease-in-out"
                }}
            />
        </div>
    );
}
