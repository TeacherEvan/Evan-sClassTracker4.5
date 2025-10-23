  // Boids/Flocking algorithm for fish-like movement (optimized with spatial partitioning)
    applyFlockingBehavior(dot) {
        let separation = { x: 0, y: 0 };
        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let neighborCount = 0;
        
        // Get neighbors using spatial partitioning for better performance
        const nearbyDots = this.getNeighborDots(dot);
        
        // Check neighbors (only nearby dots now, huge performance improvement)
        for (let other of nearbyDots) {
            if (other === dot) continue;
            
            const dx = other.x - dot.x;
            const dy = other.y - dot.y;
            const distSq = dx * dx + dy * dy; // Use squared distance to avoid sqrt
            const maxDistSq = dot.neighborhoodRadius * dot.neighborhoodRadius;
            
            if (distSq < maxDistSq && distSq > 0) {
                neighborCount++;
                
                const dist = Math.sqrt(distSq);
                
                // Separation: steer away from neighbors
                if (dist < 25) {
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
            cohesion.x = cohesion.x / neighborCount - dot.x;
            cohesion.y = cohesion.y / neighborCount - dot.y;
        }
        
        // Apply forces with different weights
        const separationWeight = 1.5;
        const alignmentWeight = 1.0;
        const cohesionWeight = 1.0;
        
        dot.vx += separation.x * separationWeight * dot.maxForce;
        dot.vy += separation.y * separationWeight * dot.maxForce;
        dot.vx += alignment.x * alignmentWeight * dot.maxForce * 0.1;
        dot.vy += alignment.y * alignmentWeight * dot.maxForce * 0.1;
        dot.vx += cohesion.x * cohesionWeight * dot.maxForce * 0.01;
        dot.vy += cohesion.y * cohesionWeight * dot.maxForce * 0.01;
        
        // Limit speed
        const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
        if (speed > dot.maxSpeed) {
            dot.vx = (dot.vx / speed) * dot.maxSpeed;
            dot.vy = (dot.vy / speed) * dot.maxSpeed;
        }
    }
    
    updateDots() {
        // Update spatial grid for efficient neighbor lookups
        this.updateSpatialGrid();
        
        for (let dot of this.dots) {
            // Apply flocking behavior
            this.applyFlockingBehavior(dot);
            
            // Update position
            dot.x += dot.vx;
            dot.y += dot.vy;
            
            // Wrap around edges
            if (dot.x < 0) dot.x = this.canvas.width;
            if (dot.x > this.canvas.width) dot.x = 0;
            if (dot.y < 0) dot.y = this.canvas.height;
            if (dot.y > this.canvas.height) dot.y = 0;
        }
    }
    
    draw() {
        // Clear with slight fade for trail effect (dimmed in game mode)
        const fadeAlpha = this.isDimmed ? 0.15 : 0.1;
        const bgColor = this.isDimmed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw dots (dimmed in game mode)
        const dotAlpha = this.isDimmed ? 0.3 : 1.0;
        for (let dot of this.dots) {
            this.ctx.beginPath();
            this.ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
            
            if (this.isDimmed) {
                // Convert hex to rgba with reduced opacity
                const r = parseInt(dot.color.slice(1, 3), 16);
                const g = parseInt(dot.color.slice(3, 5), 16);
                const b = parseInt(dot.color.slice(5, 7), 16);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dotAlpha})`;
            } else {
                this.ctx.fillStyle = dot.color;
            }
            this.ctx.fill();
        }
    }
    
    animate() {
        this.updateDots();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}