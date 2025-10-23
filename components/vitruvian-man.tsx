"use client";

import { useEffect, useState } from "react";

/**
 * Da Vinci's Vitruvian Man - Animated entrance
 * Rolls in from the side and settles behind the logo
 */
export function VitruvianMan({ className = "" }: { className?: string }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => setIsVisible(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-[2000ms] ease-out pointer-events-none ${isVisible ? "opacity-30 translate-x-0" : "opacity-0 -translate-x-full"
                } ${className}`}
            style={{
                width: "min(50vw, 400px)",
                height: "min(50vw, 400px)",
                zIndex: 0,
            }}
        >
            <svg
                viewBox="0 0 400 400"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            >
                <defs>
                    {/* Golden gradient for the figure */}
                    <linearGradient id="vitruvianGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                        <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
                        <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
                    </linearGradient>

                    {/* Subtle glow effect */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Perfect Circle (Da Vinci's sacred geometry) */}
                <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="none"
                    stroke="url(#vitruvianGold)"
                    strokeWidth="2"
                    opacity="0.8"
                    filter="url(#glow)"
                />

                {/* Perfect Square */}
                <rect
                    x="65"
                    y="65"
                    width="270"
                    height="270"
                    fill="none"
                    stroke="url(#vitruvianGold)"
                    strokeWidth="2"
                    opacity="0.6"
                />

                {/* Human Figure - Arms spread (inscribed in circle) */}
                <g transform="translate(200, 200)" filter="url(#glow)">
                    {/* Head */}
                    <circle cx="0" cy="-80" r="25" fill="none" stroke="url(#vitruvianGold)" strokeWidth="2.5" />

                    {/* Torso */}
                    <line x1="0" y1="-55" x2="0" y2="40" stroke="url(#vitruvianGold)" strokeWidth="3" strokeLinecap="round" />

                    {/* Shoulders */}
                    <line x1="-30" y1="-40" x2="30" y2="-40" stroke="url(#vitruvianGold)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Arms spread (touching circle) */}
                    <line x1="-30" y1="-40" x2="-140" y2="-10" stroke="url(#vitruvianGold)" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="30" y1="-40" x2="140" y2="-10" stroke="url(#vitruvianGold)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Arms down (fitting square) */}
                    <line x1="-30" y1="-40" x2="-90" y2="60" stroke="url(#vitruvianGold)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                    <line x1="30" y1="-40" x2="90" y2="60" stroke="url(#vitruvianGold)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

                    {/* Pelvis/Hips */}
                    <line x1="-20" y1="40" x2="20" y2="40" stroke="url(#vitruvianGold)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Legs spread (touching circle) */}
                    <line x1="-20" y1="40" x2="-80" y2="140" stroke="url(#vitruvianGold)" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="20" y1="40" x2="80" y2="140" stroke="url(#vitruvianGold)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Legs together (fitting square) */}
                    <line x1="-20" y1="40" x2="-20" y2="135" stroke="url(#vitruvianGold)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                    <line x1="20" y1="40" x2="20" y2="135" stroke="url(#vitruvianGold)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

                    {/* Hands (circle position) */}
                    <circle cx="-140" cy="-10" r="5" fill="url(#vitruvianGold)" />
                    <circle cx="140" cy="-10" r="5" fill="url(#vitruvianGold)" />

                    {/* Hands (square position) */}
                    <circle cx="-90" cy="60" r="4" fill="url(#vitruvianGold)" opacity="0.7" />
                    <circle cx="90" cy="60" r="4" fill="url(#vitruvianGold)" opacity="0.7" />

                    {/* Feet (circle position) */}
                    <circle cx="-80" cy="140" r="5" fill="url(#vitruvianGold)" />
                    <circle cx="80" cy="140" r="5" fill="url(#vitruvianGold)" />

                    {/* Feet (square position) */}
                    <circle cx="-20" cy="135" r="4" fill="url(#vitruvianGold)" opacity="0.7" />
                    <circle cx="20" cy="135" r="4" fill="url(#vitruvianGold)" opacity="0.7" />

                    {/* Navel (center of the universe according to Da Vinci) */}
                    <circle cx="0" cy="0" r="3" fill="url(#vitruvianGold)" />

                    {/* Golden ratio spiral from navel */}
                    <path
                        d="M 0,0 Q 5,0 5,5 Q 5,13 13,13 Q 21,13 21,21 Q 21,34 34,34"
                        fill="none"
                        stroke="url(#vitruvianGold)"
                        strokeWidth="0.5"
                        opacity="0.5"
                    />
                </g>

                {/* Proportional guide lines (Da Vinci's notes) */}
                <line x1="200" y1="0" x2="200" y2="400" stroke="url(#vitruvianGold)" strokeWidth="0.5" opacity="0.3" strokeDasharray="5,5" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="url(#vitruvianGold)" strokeWidth="0.5" opacity="0.3" strokeDasharray="5,5" />

                {/* Divine proportion marks (phi ratio) */}
                <circle cx="200" cy="76" r="2" fill="url(#vitruvianGold)" opacity="0.6" />
                <circle cx="200" cy="324" r="2" fill="url(#vitruvianGold)" opacity="0.6" />
                <circle cx="76" cy="200" r="2" fill="url(#vitruvianGold)" opacity="0.6" />
                <circle cx="324" cy="200" r="2" fill="url(#vitruvianGold)" opacity="0.6" />
            </svg>
        </div>
    );
}
