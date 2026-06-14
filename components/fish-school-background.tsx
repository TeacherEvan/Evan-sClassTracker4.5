"use client";

import { useEffect, useRef } from "react";

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulsePhase: number;
  neighborhoodRadius: number;
  maxSpeed: number;
  maxForce: number;
  size: number;
  trail: { x: number; y: number }[]; // Trail for motion blur effect
}

interface FishSchoolBackgroundProps {
  className?: string;
}

export function FishSchoolBackground({
  className = "",
}: FishSchoolBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fishRef = useRef<Fish[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const spatialGridRef = useRef<Map<string, Fish[]>>(new Map());
  const gridCellSize = 100; // For spatial partitioning

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize 50 snails spread across canvas
    const fish: Fish[] = [];

    for (let i = 0; i < 50; i++) {
      // SNAILS - SUPER SPREAD OUT, slow speed
      fish.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5, // SLOW like snails
        vy: (Math.random() - 0.5) * 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
        neighborhoodRadius: 600, // EVEN MORE SPREAD OUT (was 400)
        maxSpeed: 1, // SNAIL PACE
        maxForce: 0.1, // SUPER GENTLE - they barely react to each other
        size: 3,
        trail: [], // Slime trail
      });
    }
    fishRef.current = fish;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Spatial partitioning helper functions
    const getGridKey = (x: number, y: number): string => {
      const gridX = Math.floor(x / gridCellSize);
      const gridY = Math.floor(y / gridCellSize);
      return `${gridX},${gridY}`;
    };

    const updateSpatialGrid = () => {
      spatialGridRef.current.clear();
      fishRef.current.forEach((fish) => {
        const key = getGridKey(fish.x, fish.y);
        if (!spatialGridRef.current.has(key)) {
          spatialGridRef.current.set(key, []);
        }
        spatialGridRef.current.get(key)!.push(fish);
      });
    };

    const getNeighborFish = (fish: Fish): Fish[] => {
      const neighbors: Fish[] = [];
      const gridX = Math.floor(fish.x / gridCellSize);
      const gridY = Math.floor(fish.y / gridCellSize);

      // Check 3x3 grid around the fish
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${gridX + dx},${gridY + dy}`;
          const cellFish = spatialGridRef.current.get(key);
          if (cellFish) {
            neighbors.push(...cellFish);
          }
        }
      }
      return neighbors;
    };

    // Boids/Flocking algorithm for fish-like movement (optimized with spatial partitioning)
    const applyFlockingBehavior = (fish: Fish) => {
      const separation = { x: 0, y: 0 };
      const alignment = { x: 0, y: 0 };
      const cohesion = { x: 0, y: 0 };
      let neighborCount = 0;

      // Get neighbors using spatial partitioning for better performance
      const nearbyFish = getNeighborFish(fish);

      // Check neighbors (only nearby fish now, huge performance improvement)
      for (const other of nearbyFish) {
        if (other === fish) continue;

        const dx = other.x - fish.x;
        const dy = other.y - fish.y;
        const distSq = dx * dx + dy * dy; // Use squared distance to avoid sqrt
        const maxDistSq = fish.neighborhoodRadius * fish.neighborhoodRadius;

        if (distSq < maxDistSq && distSq > 0) {
          neighborCount++;

          const dist = Math.sqrt(distSq);

          // Separation: steer away from neighbors - INCREASED DISTANCE
          if (dist < 80) {
            // Was 25, now they avoid each other from much further away
            separation.x -= dx / dist;
            separation.y -= dy / dist;
          }

          // Alignment: steer towards average heading of neighbors
          alignment.x += other.vx;
          alignment.y += other.vy;

          // Cohesion: steer towards average position of neighbors
          cohesion.x += other.x;
          cohesion.y += other.y;
        }
      }

      if (neighborCount > 0) {
        // Average the alignment
        alignment.x /= neighborCount;
        alignment.y /= neighborCount;

        // Calculate cohesion center
        cohesion.x = cohesion.x / neighborCount - fish.x;
        cohesion.y = cohesion.y / neighborCount - fish.y;
      }

      // Apply forces with different weights
      const separationWeight = 1.5;
      const alignmentWeight = 1.0;
      const cohesionWeight = 1.0;

      fish.vx += separation.x * separationWeight * fish.maxForce;
      fish.vy += separation.y * separationWeight * fish.maxForce;
      fish.vx += alignment.x * alignmentWeight * fish.maxForce * 0.1;
      fish.vy += alignment.y * alignmentWeight * fish.maxForce * 0.1;
      fish.vx += cohesion.x * cohesionWeight * fish.maxForce * 0.01;
      fish.vy += cohesion.y * cohesionWeight * fish.maxForce * 0.01;

      // Limit speed
      const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
      if (speed > fish.maxSpeed) {
        fish.vx = (fish.vx / speed) * fish.maxSpeed;
        fish.vy = (fish.vy / speed) * fish.maxSpeed;
      }
    };

    const animate = () => {
      // Semi-transparent clear for trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update spatial grid for efficient neighbor lookups
      updateSpatialGrid();

      // Update each fish with flocking behavior
      fishRef.current.forEach((fish) => {
        // Store current position in trail
        fish.trail.push({ x: fish.x, y: fish.y });

        // LONGER SLIME TRAILS (20 points instead of 8)
        if (fish.trail.length > 20) {
          fish.trail.shift();
        }

        // Apply flocking behavior
        applyFlockingBehavior(fish);

        // Update position
        fish.x += fish.vx;
        fish.y += fish.vy;

        // Wrap around edges
        if (fish.x < 0) fish.x = canvas.width;
        if (fish.x > canvas.width) fish.x = 0;
        if (fish.y < 0) fish.y = canvas.height;
        if (fish.y > canvas.height) fish.y = 0;
      });

      // Draw all fish with motion blur trails
      fishRef.current.forEach((fish) => {
        // Draw trail as fading SLIME line
        if (fish.trail.length > 1) {
          for (let i = 0; i < fish.trail.length - 1; i++) {
            const alpha = (i / fish.trail.length) * 0.24; // 20% MORE TRANSPARENT (was 0.3)
            const width = (i / fish.trail.length) * fish.size * 2.5; // Wider slime trail

            ctx.beginPath();
            ctx.moveTo(fish.trail[i].x, fish.trail[i].y);
            ctx.lineTo(fish.trail[i + 1].x, fish.trail[i + 1].y);
            ctx.strokeStyle = `hsla(45, 100%, 50%, ${alpha})`;
            ctx.lineWidth = width;
            ctx.lineCap = "round";
            ctx.stroke();
          }
        }

        // Draw snail body - 20% MORE TRANSPARENT
        ctx.beginPath();
        ctx.arc(fish.x, fish.y, fish.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(45, 100%, 50%, 0.56)`; // Was 0.7, now 0.56 (20% less)
        ctx.fill();

        // Subtle slime glow - also more transparent
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(45, 100%, 50%, 0.32)`; // Was 0.4, now 0.32
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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
