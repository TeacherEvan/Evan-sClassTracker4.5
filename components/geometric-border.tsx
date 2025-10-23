"use client";

/**
 * Geometric/Henna-inspired border component
 * Creates an intricate 0.5cm golden border with Islamic/Da Vinci geometric patterns
 */
export function GeometricBorder({ className = "" }: { className?: string }) {
    return (
        <svg
            className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                {/* Golden gradient */}
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                    <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
                </linearGradient>

                {/* Repeating geometric pattern for corners */}
                <pattern id="cornerPattern" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.3" fill="url(#goldGradient)" opacity="0.8" />
                    <path d="M 0,1 L 1,0 M 1,2 L 2,1" stroke="url(#goldGradient)" strokeWidth="0.1" opacity="0.6" />
                </pattern>

                {/* Intricate mandala-style corner decoration */}
                <g id="cornerMandala">
                    {/* Outer petals */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                        <path
                            key={`petal-${i}`}
                            d="M 0,0 Q 0.5,-0.3 1,0 Q 0.5,0.3 0,0"
                            fill="url(#goldGradient)"
                            opacity="0.7"
                            transform={`rotate(${angle})`}
                        />
                    ))}
                    {/* Inner circle */}
                    <circle cx="0" cy="0" r="0.5" fill="none" stroke="url(#goldGradient)" strokeWidth="0.15" />
                    {/* Center dot */}
                    <circle cx="0" cy="0" r="0.2" fill="url(#goldGradient)" />
                </g>

                {/* Fibonacci spiral decoration */}
                <g id="fibonacciSpiral">
                    <path
                        d="M 0,0 Q 0.5,0 0.5,0.5 Q 0.5,1 1,1 Q 1.5,1 1.5,1.5 Q 1.5,2.5 2.5,2.5"
                        fill="none"
                        stroke="url(#goldGradient)"
                        strokeWidth="0.08"
                        opacity="0.8"
                    />
                </g>
            </defs>

            {/* Top border with interlocking geometric pattern */}
            <path
                d="M 2,2 L 8,2 L 9,1 L 11,1 L 12,2 L 18,2 L 19,1 L 21,1 L 22,2 L 28,2 L 29,1 L 31,1 L 32,2 L 38,2 L 39,1 L 41,1 L 42,2 L 48,2 L 49,1 L 51,1 L 52,2 L 58,2 L 59,1 L 61,1 L 62,2 L 68,2 L 69,1 L 71,1 L 72,2 L 78,2 L 79,1 L 81,1 L 82,2 L 88,2 L 89,1 L 91,1 L 92,2 L 98,2"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="0.3"
            />

            {/* Right border */}
            <path
                d="M 98,2 L 98,8 L 99,9 L 99,11 L 98,12 L 98,18 L 99,19 L 99,21 L 98,22 L 98,28 L 99,29 L 99,31 L 98,32 L 98,38 L 99,39 L 99,41 L 98,42 L 98,48 L 99,49 L 99,51 L 98,52 L 98,58 L 99,59 L 99,61 L 98,62 L 98,68 L 99,69 L 99,71 L 98,72 L 98,78 L 99,79 L 99,81 L 98,82 L 98,88 L 99,89 L 99,91 L 98,92 L 98,98"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="0.3"
            />

            {/* Bottom border */}
            <path
                d="M 98,98 L 92,98 L 91,99 L 89,99 L 88,98 L 82,98 L 81,99 L 79,99 L 78,98 L 72,98 L 71,99 L 69,99 L 68,98 L 62,98 L 61,99 L 59,99 L 58,98 L 52,98 L 51,99 L 49,99 L 48,98 L 42,98 L 41,99 L 39,99 L 38,98 L 32,98 L 31,99 L 29,99 L 28,98 L 22,98 L 21,99 L 19,99 L 18,98 L 12,98 L 11,99 L 9,99 L 8,98 L 2,98"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="0.3"
            />

            {/* Left border */}
            <path
                d="M 2,98 L 2,92 L 1,91 L 1,89 L 2,88 L 2,82 L 1,81 L 1,79 L 2,78 L 2,72 L 1,71 L 1,69 L 2,68 L 2,62 L 1,61 L 1,59 L 2,58 L 2,52 L 1,51 L 1,49 L 2,48 L 2,42 L 1,41 L 1,39 L 2,38 L 2,32 L 1,31 L 1,29 L 2,28 L 2,22 L 1,21 L 1,19 L 2,18 L 2,12 L 1,11 L 1,9 L 2,8 L 2,2"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="0.3"
            />

            {/* Corner decorations - Top Left */}
            <g transform="translate(3, 3) scale(2.5)">
                <use href="#cornerMandala" />
            </g>

            {/* Corner decorations - Top Right */}
            <g transform="translate(97, 3) scale(2.5) rotate(90)">
                <use href="#cornerMandala" />
            </g>

            {/* Corner decorations - Bottom Right */}
            <g transform="translate(97, 97) scale(2.5) rotate(180)">
                <use href="#cornerMandala" />
            </g>

            {/* Corner decorations - Bottom Left */}
            <g transform="translate(3, 97) scale(2.5) rotate(270)">
                <use href="#cornerMandala" />
            </g>

            {/* Fibonacci spirals at midpoints */}
            <g transform="translate(50, 1) scale(0.8)">
                <use href="#fibonacciSpiral" />
            </g>
            <g transform="translate(99, 50) rotate(90) scale(0.8)">
                <use href="#fibonacciSpiral" />
            </g>
            <g transform="translate(50, 99) rotate(180) scale(0.8)">
                <use href="#fibonacciSpiral" />
            </g>
            <g transform="translate(1, 50) rotate(270) scale(0.8)">
                <use href="#fibonacciSpiral" />
            </g>

            {/* Inner decorative lines */}
            <rect
                x="1.5"
                y="1.5"
                width="97"
                height="97"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="0.15"
                opacity="0.5"
            />
            <rect
                x="1.2"
                y="1.2"
                width="97.6"
                height="97.6"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="0.1"
                opacity="0.3"
            />
        </svg>
    );
}
