"use client";

import { useEffect, useRef } from "react";

interface Dot {
    x: number;
    y: number;
    vx: number;
    vy: number;
    pulsePhase: number;
}

interface FishSchoolBackgroundProps {
    className?: string;
}

export function FishSchoolBackground({ className = "" }: FishSchoolBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dotsRef = useRef<Dot[]>([]);
    const animationRef = useRef<number | undefined>(undefined);

    // Animation loop - simple dots swimming around
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Initialize 50 dots
        const dots: Dot[] = [];
        for (let i = 0; i < 50; i++) {
            dots.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                pulsePhase: Math.random() * Math.PI * 2,
            });
        }
        dotsRef.current = dots;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw each dot
            dotsRef.current.forEach(dot => {
                // Update position
                dot.x += dot.vx;
                dot.y += dot.vy;

                // Wrap around edges
                if (dot.x < 0) dot.x = canvas.width;
                if (dot.x > canvas.width) dot.x = 0;
                if (dot.y < 0) dot.y = canvas.height;
                if (dot.y > canvas.height) dot.y = 0;

                // Update pulse
                dot.pulsePhase += 0.05;

                // Draw gold pulsating dot (cursor size ~16px diameter)
                const pulse = Math.sin(dot.pulsePhase) * 0.4 + 0.6; // 0.6 to 1.0
                const radius = 8 * pulse; // ~6-8px radius (12-16px diameter)

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);

                // Gold color (hue 45)
                ctx.fillStyle = `hsla(45, 100%, 50%, ${0.7 * pulse})`;
                ctx.fill();

                // Add glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsla(45, 100%, 50%, ${0.8 * pulse})`;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className={`fixed inset-0 pointer-events-none ${className}`}>
            {/* Fish animation canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
}
