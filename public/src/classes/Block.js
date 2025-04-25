// src/classes/Block.js
import { BLOCK_SIZE } from '../config.js';
import { gameSettings } from '../gameSettings.js';
import { constrain } from '../utils.js';
import { Physics } from '../physics/PhysicsHelper.js';

/**
 * Represents a falling block fired by the cannon.
 * Handles movement, bounce, landing, despawn timing, and collision detection.
 */
export class Block {
    /**
     * @param {number} x – initial x position
     * @param {number} y – initial y position
     * @param {object} p – the p5 instance
     * @param {EventBus} eventBus – the event bus for communication
     */
    constructor(x, y, p, eventBus) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.size = BLOCK_SIZE;
        this.color = p.color(p.random(360), 90, 90);
        this.hasBounced = false;
        this.landed = false;
        this.landingTime = null;
        this.eventBus = eventBus || (gameSettings.eventBus ? gameSettings.eventBus : null);

        // Compute despawn based on current setting
        this.updateDespawnDuration();

        // Initialize with zero velocity - will be set by cannon
        this.vel = p.createVector(0, 0);

        // VFX state
        this.effectStart = null;
        this.effectDuration = 300;     // ms
    }

    /** Compute despawn time in ms from the current global setting */
    updateDespawnDuration() {
        const seconds = gameSettings.currentBlockDespawnTime;
        this.despawnDurationMillis = seconds * 1000;
    }

    /** Physics update each frame */
    update() {
        if (this.landed) return;

        // Apply reduced gravity for longer trajectories
        if (window.gravity) {
            // Use Physics helper to apply gravity with reduced effect (75%)
            Physics.applyGravity(this.vel, window.gravity, 0.75);
        } else {
            // Reduced default gravity
            this.vel.add(0, 0.15);
        }
        
        // Update position
        this.pos.add(this.vel);

        if (!this.hasBounced) {
            // Use Physics helper to check for and apply wall bounces
            const bounced = Physics.bounce(
                this.pos, 
                this.vel, 
                this.size, 
                this.p.width, 
                this.p.height, 
                0.6 // bounce multiplier
            );
            
            if (bounced) this.hasBounced = true;
        }

        // landing check:
        // --- landing logic + trigger VFX ---
        const groundY = gameSettings.groundY || (this.p.height - this.size / 2);
        const blockBottom = this.pos.y + this.size / 2;

        if (blockBottom >= groundY) {
            this.pos.y = groundY - this.size / 2;
            this.vel.set(0, 0);
            this.landed = true;
            this.landingTime = this.p.millis();
            this.effectStart = this.p.millis();  // start the puff
        }


        // Emit events for block movement/despawn
        if (this.isDespawned()) {
            this.eventBus?.safeEmit('blockDespawned', this);
        }
    }

    /** Draw the block and fade it out once landed */
    display() {
        const p = this.p;
        const groundY = gameSettings.groundY || (p.height - this.size / 2);

        // --- draw landing puff if active ---
        if (this.effectStart !== null) {
            const t = (p.millis() - this.effectStart) / this.effectDuration;
            if (t < 1) {
                const radius = p.lerp(this.size, this.size * 3, t);
                const alpha = p.lerp(80, 0, t);

                p.push();
                p.noFill();
                p.stroke(0, 0, 100, alpha);
                p.strokeWeight(2);
                // ellipse at the block's feet
                p.ellipse(this.pos.x, groundY, radius, radius / 2);
                p.pop();
            } else {
                // end the effect
                this.effectStart = null;
            }
        }

        p.push();
        p.fill(this.color);
        p.noStroke();
        p.square(this.pos.x, this.pos.y, this.size);

        if (this.landed && this.landingTime !== null) {
            const elapsed = p.millis() - this.landingTime;
            const fadeStart = this.despawnDurationMillis * 0.5;

            if (elapsed > fadeStart) {
                const alpha = p.map(elapsed, fadeStart, this.despawnDurationMillis, 100, 0);
                p.fill(0, 0, 100, 100 - constrain(alpha, 0, 100));
                p.square(this.pos.x, this.pos.y, this.size);
            }
        }

        p.pop();
    }

    /** True once it's been on the ground longer than its despawn duration */
    isDespawned() {
        return (
            this.landed &&
            this.landingTime !== null &&
            this.p.millis() - this.landingTime > this.despawnDurationMillis
        );
    }

    /**
     * AABB collision against the player.
     * @param {{ x:number, y:number, w:number, h:number }} pBounds
     */
    collidesWith(pBounds) {
        return Physics.checkCollision(
            { x: this.pos.x, y: this.pos.y, size: this.size },
            pBounds
        );
    }

    static onCollect() {
        // Update coins using the standardized method
        gameSettings.updateCoins(Math.round(gameSettings.currentBlockValue));
        
        // Play coin sound using the sound manager if available
        if (gameSettings.soundEnabled && gameSettings.soundManager) {
            gameSettings.soundManager.playSound('coinSound');
        }
    }
}
