"use client";

import { useEffect, useRef } from "react";

interface Fish {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    pulsePhase: number;
    pulseSpeed: number;
    hue: number; // 0-360 for color
}

interface FishSchoolBackgroundProps {
    isLoggedIn?: boolean;
    className?: string;
}

export function FishSchoolBackground({ isLoggedIn = false, className = "" }: FishSchoolBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fishRef = useRef<Fish[]>([]);
    const animationRef = useRef<number | undefined>(undefined);
    const isLoggedInRef = useRef(isLoggedIn);

    // Update login status ref
    useEffect(() => {
        isLoggedInRef.current = isLoggedIn;
        // Update existing fish colors when login status changes
        fishRef.current = fishRef.current.map(f => ({
            ...f,
            hue: isLoggedIn ? Math.random() * 360 : 45,
        }));
    }, [isLoggedIn]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Initialize fish school on first mount
        if (fishRef.current.length === 0) {
            const fishCount = 30;
            const newFish: Fish[] = [];

            for (let i = 0; i < fishCount; i++) {
                newFish.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: 8 + Math.random() * 12,
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.02 + Math.random() * 0.03,
                    hue: isLoggedInRef.current ? Math.random() * 360 : 45,
                });
            }

            fishRef.current = newFish;
        }

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update fish positions using ref
            const updatedFish = fishRef.current.map(f => {
                // Update position
                let newX = f.x + f.vx;
                let newY = f.y + f.vy;
                let newVx = f.vx;
                let newVy = f.vy;

                // Wrap around edges
                if (newX < -20) newX = canvas.width + 20;
                if (newX > canvas.width + 20) newX = -20;
                if (newY < -20) newY = canvas.height + 20;
                if (newY > canvas.height + 20) newY = -20;

                // Flocking behavior - stay near neighbors
                let centerX = 0;
                let centerY = 0;
                let neighbors = 0;
                const neighborRadius = 100;

                fishRef.current.forEach(other => {
                    const dx = other.x - f.x;
                    const dy = other.y - f.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 0 && dist < neighborRadius) {
                        centerX += other.x;
                        centerY += other.y;
                        neighbors++;

                        // Separation - avoid crowding
                        if (dist < 30) {
                            newVx -= dx / dist * 0.05;
                            newVy -= dy / dist * 0.05;
                        }
                    }
                });

                // Cohesion - move toward center of neighbors
                if (neighbors > 0) {
                    centerX /= neighbors;
                    centerY /= neighbors;
                    newVx += (centerX - f.x) * 0.0005;
                    newVy += (centerY - f.y) * 0.0005;
                }

                // Limit speed
                const speed = Math.sqrt(newVx * newVx + newVy * newVy);
                const maxSpeed = 2.5;
                if (speed > maxSpeed) {
                    newVx = (newVx / speed) * maxSpeed;
                    newVy = (newVy / speed) * maxSpeed;
                }

                // Update pulse
                const newPulsePhase = f.pulsePhase + f.pulseSpeed;

                return {
                    ...f,
                    x: newX,
                    y: newY,
                    vx: newVx,
                    vy: newVy,
                    pulsePhase: newPulsePhase,
                };
            });

            // Update the ref with new fish positions
            fishRef.current = updatedFish;

            // Draw fish
            updatedFish.forEach(f => {
                const pulse = Math.sin(f.pulsePhase) * 0.3 + 0.7;
                const alpha = isLoggedInRef.current ? 0.8 : 0.6;
                const saturation = isLoggedInRef.current ? 80 : 60;
                const lightness = 50 + Math.sin(f.pulsePhase) * 10;

                ctx.save();
                ctx.translate(f.x, f.y);

                // Rotate fish in direction of movement
                const angle = Math.atan2(f.vy, f.vx);
                ctx.rotate(angle);

                // Draw fish body (simple triangle)
                ctx.beginPath();
                ctx.moveTo(f.size * pulse, 0);
                ctx.lineTo(-f.size * 0.6 * pulse, -f.size * 0.4 * pulse);
                ctx.lineTo(-f.size * 0.6 * pulse, f.size * 0.4 * pulse);
                ctx.closePath();

                ctx.fillStyle = `hsla(${f.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                ctx.fill();

                // Add glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = `hsla(${f.hue}, ${saturation}%, ${lightness}%, 0.5)`;
                ctx.fill();

                // Draw tail
                ctx.beginPath();
                ctx.moveTo(-f.size * 0.6 * pulse, 0);
                ctx.lineTo(-f.size * pulse, -f.size * 0.3);
                ctx.lineTo(-f.size * pulse, f.size * 0.3);
                ctx.closePath();
                ctx.fillStyle = `hsla(${f.hue}, ${saturation}%, ${lightness - 10}%, ${alpha * 0.8})`;
                ctx.fill();

                ctx.restore();
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
    }, []); // Run once on mount

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
