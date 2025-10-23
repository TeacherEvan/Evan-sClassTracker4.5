"use client";

import { useEffect, useRef } from "react";

interface Fish {
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
    const fishRef = useRef<Fish[]>([]);
    const animationRef = useRef<number | undefined>(undefined);

    // Schooling behavior parameters
    const PERCEPTION_RADIUS = 100; // How far fish can see
    const SEPARATION_RADIUS = 30; // Minimum distance from neighbors
    const MAX_SPEED = 2.5;
    const MAX_FORCE = 0.1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Initialize 50 fish in a cluster
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const fish: Fish[] = [];

        for (let i = 0; i < 50; i++) {
            // Start fish clustered in center with similar velocities
            const angle = Math.random() * Math.PI * 2;
            const spread = 200;
            fish.push({
                x: centerX + (Math.random() - 0.5) * spread,
                y: centerY + (Math.random() - 0.5) * spread,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.5,
                pulsePhase: Math.random() * Math.PI * 2,
            });
        }
        fishRef.current = fish;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Schooling behavior: cohesion, alignment, separation
        const applySchooling = (fish: Fish, neighbors: Fish[]) => {
            if (neighbors.length === 0) return { x: 0, y: 0 };

            // Cohesion: steer towards average position of neighbors
            let avgX = 0, avgY = 0;
            let alignX = 0, alignY = 0;
            let separateX = 0, separateY = 0;
            let separateCount = 0;

            neighbors.forEach(other => {
                const dx = other.x - fish.x;
                const dy = other.y - fish.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Cohesion
                avgX += other.x;
                avgY += other.y;

                // Alignment: match velocity
                alignX += other.vx;
                alignY += other.vy;

                // Separation: avoid crowding
                if (dist < SEPARATION_RADIUS && dist > 0) {
                    separateX -= dx / dist;
                    separateY -= dy / dist;
                    separateCount++;
                }
            });

            // Cohesion force
            avgX /= neighbors.length;
            avgY /= neighbors.length;
            const cohesionX = avgX - fish.x;
            const cohesionY = avgY - fish.y;

            // Alignment force
            alignX /= neighbors.length;
            alignY /= neighbors.length;

            // Separation force
            if (separateCount > 0) {
                separateX /= separateCount;
                separateY /= separateCount;
            }

            // Combine forces with weights
            const forceX = cohesionX * 0.001 + alignX * 0.05 + separateX * 0.05;
            const forceY = cohesionY * 0.001 + alignY * 0.05 + separateY * 0.05;

            return { x: forceX, y: forceY };
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update each fish with schooling behavior
            fishRef.current.forEach(fish => {
                // Find neighbors within perception radius
                const neighbors = fishRef.current.filter(other => {
                    if (other === fish) return false;
                    const dx = other.x - fish.x;
                    const dy = other.y - fish.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return dist < PERCEPTION_RADIUS;
                });

                // Apply schooling forces
                const force = applySchooling(fish, neighbors);
                fish.vx += force.x;
                fish.vy += force.y;

                // Limit speed
                const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
                if (speed > MAX_SPEED) {
                    fish.vx = (fish.vx / speed) * MAX_SPEED;
                    fish.vy = (fish.vy / speed) * MAX_SPEED;
                }

                // Update position
                fish.x += fish.vx;
                fish.y += fish.vy;

                // Wrap around edges (with smooth transition)
                if (fish.x < -20) fish.x = canvas.width + 20;
                if (fish.x > canvas.width + 20) fish.x = -20;
                if (fish.y < -20) fish.y = canvas.height + 20;
                if (fish.y > canvas.height + 20) fish.y = -20;

                // Update pulse
                fish.pulsePhase += 0.1; // Faster swimming motion

                // Calculate motion direction for tail (reuse speed from above)
                const angle = Math.atan2(fish.vy, fish.vx); // Direction fish is facing
                const swimWiggle = Math.sin(fish.pulsePhase * 2) * 0.15; // Side-to-side swim motion

                // Draw swimming tail that wiggles (5 segments for smooth motion)
                const tailLength = 30;
                const segments = 5;
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    // Tail curves based on swim wiggle
                    const wiggleAmount = swimWiggle * t * 15;
                    const tailAngle = angle + wiggleAmount;
                    const tailX = fish.x - Math.cos(tailAngle) * tailLength * t;
                    const tailY = fish.y - Math.sin(tailAngle) * tailLength * t;
                    const tailAlpha = (1 - t) * 0.5;
                    const tailRadius = 7 * (1 - t * 0.6);

                    ctx.beginPath();
                    ctx.arc(tailX, tailY, tailRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(45, 100%, 50%, ${tailAlpha})`;
                    ctx.fill();
                }

                // Draw main gold pulsating fish body with slight size change for swimming
                const pulse = Math.sin(fish.pulsePhase) * 0.2 + 0.8;
                const radius = 9 * pulse;

                ctx.beginPath();
                ctx.arc(fish.x, fish.y, radius, 0, Math.PI * 2);

                ctx.fillStyle = `hsla(45, 100%, 50%, ${0.7 * pulse})`;
                ctx.fill();

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
