/**
 * Physics helper module that provides common physics calculations and utilities.
 */
export const Physics = {
    /**
     * Checks for AABB collision between two objects
     * @param {Object} objA - First object with x, y, width/w, height/h properties
     * @param {Object} objB - Second object with x, y, width/w, height/h properties
     * @returns {boolean} Whether the objects are colliding
     */
    checkCollision(objA, objB) {
        // Convert to standard format if needed
        const a = {
            x: objA.x || objA.pos?.x || 0,
            y: objA.y || objA.pos?.y || 0,
            width: objA.width || objA.w || objA.size || 0,
            height: objA.height || objA.h || objA.size || 0
        };
        
        const b = {
            x: objB.x || objB.pos?.x || 0,
            y: objB.y || objB.pos?.y || 0,
            width: objB.width || objB.w || objB.size || 0,
            height: objB.height || objB.h || objB.size || 0
        };
        
        // AABB collision check
        return (
            a.x + a.width / 2 > b.x - b.width / 2 &&
            a.x - a.width / 2 < b.x + b.width / 2 &&
            a.y + a.height / 2 > b.y - b.height / 2 &&
            a.y - a.height / 2 < b.y + b.height / 2
        );
    },
    
    /**
     * Apply gravity to a velocity vector
     * @param {Object} vel - Velocity vector to modify
     * @param {Object} gravity - Gravity vector
     * @param {number} scale - Optional scale factor (default: 1.0)
     * @returns {Object} The modified velocity vector
     */
    applyGravity(vel, gravity, scale = 1.0) {
        if (!vel || !gravity) return vel;
        
        vel.x += gravity.x * scale;
        vel.y += gravity.y * scale;
        return vel;
    },
    
    /**
     * Calculate parabolic trajectory points
     * @param {number} startX - Starting X position
     * @param {number} startY - Starting Y position 
     * @param {number} velocityX - Initial X velocity
     * @param {number} velocityY - Initial Y velocity
     * @param {Object} gravity - Gravity vector {x, y}
     * @param {number} steps - Number of points to calculate
     * @param {number} scale - Scale factor for gravity
     * @returns {Array} Array of {x, y} points
     */
    calculateTrajectory(startX, startY, velocityX, velocityY, gravity, steps = 100, scale = 1.0) {
        const points = [];
        let x = startX;
        let y = startY;
        let vx = velocityX;
        let vy = velocityY;
        
        for (let i = 0; i < steps; i++) {
            x += vx;
            y += vy;
            
            // Apply gravity
            if (gravity) {
                vx += gravity.x * scale;
                vy += gravity.y * scale;
            }
            
            points.push({x, y});
        }
        
        return points;
    },
    
    /**
     * Calculate bounce against walls
     * @param {Object} pos - Position vector {x, y}
     * @param {Object} vel - Velocity vector {x, y}
     * @param {number} size - Object size 
     * @param {number} bounceMultiplier - Velocity multiplier after bounce (default: 0.6)
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {boolean} Whether a bounce occurred
     */
    bounce(pos, vel, size, width, height, bounceMultiplier = 0.6) {
        let bounced = false;
        
        // ceiling
        if (pos.y < size / 2) {
            pos.y = size / 2;
            vel.y *= -bounceMultiplier;
            bounced = true;
        }
        
        // floor
        if (pos.y > height - size / 2) {
            pos.y = height - size / 2;
            vel.y *= -bounceMultiplier;
            bounced = true;
        }
        
        // left wall
        if (pos.x < size / 2) {
            pos.x = size / 2;
            vel.x *= -bounceMultiplier;
            bounced = true;
        }
        
        // right wall
        if (pos.x > width - size / 2) {
            pos.x = width - size / 2;
            vel.x *= -bounceMultiplier;
            bounced = true;
        }
        
        return bounced;
    }
};
