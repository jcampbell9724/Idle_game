// src/classes/Cannon.js
import { Block } from './Block.js';
import { gameSettings } from '../gameSettings.js';
import { Physics } from '../physics/PhysicsHelper.js';

export class Cannon {
    /**
     * @param {number} x – horizontal position of the cannon
     * @param {number} y – vertical position of the cannon
     * @param {object} p – the p5 instance
     * @param {EventBus} eventBus – the event bus for communication
     */
    constructor(x, y, p, eventBus) {
        this.x = x;
        this.y = y;
        this.p = p;
        this.lastShotFrame = p.frameCount;
        this.eventBus = eventBus || (gameSettings.eventBus ? gameSettings.eventBus : null);
        
        // New properties for cannon movement
        this.targetX = x - 100;     // Target X position where cannon will aim
        this.targetY = y - 100;     // Default target Y above cannon
        this.rotationAngle = -Math.PI/4; // Current rotation angle (start aiming upward-left)
        this.rotationSpeed = 0.02;  // Speed of rotation
        this.nextTargetTimer = 60;  // Timer for next target change (in frames)
        this.predictionLine = true; // Display trajectory line
        
        // Power settings - adjusted per request
        this.minPower = 5;          // Minimum launch velocity
        this.maxPower = 34;         // Maximum launch velocity
        this.currentPower = this.minPower + Math.random() * (this.maxPower - this.minPower);
    }

    /**
     * Update cannon rotation toward the target position
     */
    updateTarget() {
        // Update timer
        this.nextTargetTimer--;
        
        // Time to pick a new target
        if (this.nextTargetTimer <= 0) {
            // Pick random target position on screen
            this.targetX = this.p.random(this.p.width * 0.1, this.p.width * 0.9);
            this.targetY = this.p.random(this.p.height * 0.1, this.p.height * 0.6);
            
            // Reset timer (between 3-6 seconds at 60fps)
            this.nextTargetTimer = this.p.random(180, 360);
            
            // Randomize power for each new target
            this.currentPower = this.minPower + Math.random() * (this.maxPower - this.minPower);
        }
        
        // Calculate angle to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Gradually rotate towards target angle
        const angleDiff = targetAngle - this.rotationAngle;
        
        // Handle angle wrapping
        if (angleDiff > Math.PI) {
            this.rotationAngle += (angleDiff - 2 * Math.PI) * this.rotationSpeed;
        } else if (angleDiff < -Math.PI) {
            this.rotationAngle += (angleDiff + 2 * Math.PI) * this.rotationSpeed;
        } else {
            this.rotationAngle += angleDiff * this.rotationSpeed;
        }
    }

    /**
     * Shoots a block every currentCannonInterval seconds.
     * Blocks now spawn at the cannon's position with velocity based on angle.
     */
    tryShoot(blocks) {
        const framesBetweenShots = Math.round(
            gameSettings.currentCannonInterval * this.p.frameRate()
        );

        if (this.p.frameCount - this.lastShotFrame >= framesBetweenShots) {
            // Check max blocks limit before creating a new block
            if (blocks.length >= gameSettings.currentMaxBlocks) {
                // Emit max blocks reached event
                this.eventBus?.safeEmit('maxBlocksReached', {
                    current: blocks.length,
                    max: gameSettings.currentMaxBlocks
                });
                return; // Don't spawn a new block
            }
            
            // Calculate spawn position based on rotation
            const spawnDistance = 30; // Distance from cannon center
            const spawnX = this.x + Math.cos(this.rotationAngle) * spawnDistance;
            const spawnY = this.y + Math.sin(this.rotationAngle) * spawnDistance;
            
            // Create new block
            const newBlock = new Block(spawnX, spawnY, this.p, this.eventBus);
            
            // Calculate initial velocity based on angle and power
            const velocityX = Math.cos(this.rotationAngle) * this.currentPower;
            const velocityY = Math.sin(this.rotationAngle) * this.currentPower;
            
            // Set initial velocity
            newBlock.vel.set(velocityX, velocityY);
            
            // Add to blocks array
            blocks.push(newBlock);
            this.lastShotFrame = this.p.frameCount;
            
            // Play cannon sound
            if (gameSettings.soundEnabled && gameSettings.soundManager) {
                gameSettings.soundManager.playSound('cannonSound');
            }
            
            // Emit event
            this.eventBus?.safeEmit('cannonFired', { 
                x: spawnX, 
                y: spawnY,
                angle: this.rotationAngle,
                power: this.currentPower
            });
        }
    }

    /**
     * Draw trajectory prediction line
     */
    drawTrajectoryLine() {
        if (!this.predictionLine) return;
        
        this.p.push();
        this.p.noFill();
        
        // Calculate trajectory using Physics helper
        const vx = Math.cos(this.rotationAngle) * this.currentPower;
        const vy = Math.sin(this.rotationAngle) * this.currentPower;
        
        // Get trajectory points
        const trajectoryPoints = Physics.calculateTrajectory(
            this.x,
            this.y,
            vx,
            vy,
            window.gravity || { x: 0, y: 0.15 },
            100, // total points
            0.75  // gravity scale
        );
        
        // Only draw a portion of the trajectory (25%)
        const visiblePoints = Math.floor(trajectoryPoints.length * 0.25);
        const visibleTrajectory = trajectoryPoints.slice(0, visiblePoints);
        
        if (visibleTrajectory.length > 0) {
            this.p.beginShape();
            
            // Start at cannon position
            this.p.vertex(this.x, this.y);
            
            // Draw trajectory with fading opacity - using pure white
            for (let i = 0; i < visibleTrajectory.length; i++) {
                const point = visibleTrajectory[i];
                // Opacity goes from 255 to 50
                const alpha = this.p.map(i, 0, visibleTrajectory.length - 1, 255, 50);
                this.p.stroke(255, 255, 255, alpha);
                this.p.vertex(point.x, point.y);
            }
            
            this.p.endShape();
        }
        
        this.p.pop();
    }

    /**
     * Draws the cannon with rotation.
     */
    display() {
        // First update target and angle
        this.updateTarget();
        
        // Draw trajectory prediction
        this.drawTrajectoryLine();
        
        // Draw cannon with rotation
        this.p.push();
        this.p.translate(this.x, this.y);
        this.p.rotate(this.rotationAngle);
        
        // Cannon base (circle)
        this.p.fill(40, 70, 80);
        this.p.ellipse(0, 0, 25, 25);
        
        // Cannon barrel
        this.p.fill(50, 80, 90);
        this.p.rect(20, 0, 40, 15);
        
        // Power indicator
        const powerIndicator = this.p.map(this.currentPower, this.minPower, this.maxPower, 0, 1);
        this.p.fill(powerIndicator * 120, 80, 90);
        this.p.rect(20, -10, 5, 5);
        
        this.p.pop();
    }

    /**
     * Updates the cannon's position (used on window resize).
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        // Reset target position relative to new position
        this.targetX = x - 100;
        this.targetY = y - 100;
        
        // Emit position update event using safeEmit
        this.eventBus?.safeEmit('cannonMoved', { x: this.x, y: this.y });
    }
}
