// src/classes/Block.js
import { BLOCK_SIZE } from '../config.js';
import { gameSettings } from '../gameSettings.js';
import { constrain } from '../utils.js';

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
            // Apply 75% of the original gravity for longer flight
            const reducedGravity = this.p.createVector(window.gravity.x, window.gravity.y * 0.75);
            this.vel.add(reducedGravity);
        } else {
            // Reduced default gravity
            this.vel.add(0, 0.15);
        }
        
        // Update position
        this.pos.add(this.vel);

        if (!this.hasBounced) {
            let bounced = false;

            // ceiling
            if (this.pos.y < this.size / 2) {
                this.pos.y = this.size / 2;
                this.vel.y *= -0.6;
                bounced = true;
            }
            // left wall
            if (this.pos.x < this.size / 2) {
                this.pos.x = this.size / 2;
                this.vel.x *= -0.6;
                bounced = true;
            }
            // right wall
            if (this.pos.x > this.p.width - this.size / 2) {
                this.pos.x = this.p.width - this.size / 2;
                this.vel.x *= -0.6;
                bounced = true;
            }

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
        if (this.isDespawned() && this.eventBus) {
            this.eventBus.emit('blockDespawned', this);
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
        return (
            this.pos.x + this.size / 2 > pBounds.x - pBounds.w / 2 &&
            this.pos.x - this.size / 2 < pBounds.x + pBounds.w / 2 &&
            this.pos.y + this.size / 2 > pBounds.y - pBounds.h / 2 &&
            this.pos.y - this.size / 2 < pBounds.y + pBounds.h / 2
        );
    }

    static onCollect() {
        gameSettings.coins += Math.round(gameSettings.currentBlockValue);

        if (gameSettings.soundEnabled && gameSettings.assetManager) {
            const coin = gameSettings.assetManager.getAsset('coinSound');
            if (coin && coin.isLoaded()) {
                // Make sure we use the current SFX volume setting
                const volume = typeof gameSettings.sfxVolume === 'number' ? gameSettings.sfxVolume : 1.0;
                coin.setVolume(volume);
                coin.play();
            }
        }

        if (gameSettings.eventBus) {
            gameSettings.eventBus.emit('coinsChanged', gameSettings.coins);
        }
    }
}
