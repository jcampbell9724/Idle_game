import { gameSettings } from '../gameSettings.js';
import { constrain } from '../utils.js';

/**
 * Represents the player avatar moving along the bottom of the screen.
 * Handles input-driven movement and rendering.
 */
export class Player {
    /**
     * @param {number} x - initial x position
     * @param {number} y - initial y position
     * @param {number} w - width of the player rectangle
     * @param {number} h - height of the player rectangle
     * @param {Image} sprite - The pre-loaded default image/sprite for the player
     * @param {Image} spriteLeft - The pre-loaded left walking sprite
     * @param {Image} spriteRight - The pre-loaded right walking sprite
     * @param {object} p - the p5 instance
     * @param {EventBus} eventBus - the event bus for communication
     */
    constructor(x, y, w, h, sprite, p, eventBus, spriteLeft, spriteRight) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.sprite = sprite; // Default sprite
        this.p = p;                // ← store the p5 instance
        this.eventBus = eventBus || (gameSettings.eventBus ? gameSettings.eventBus : null);
        
        // Animation properties
        this.spriteLeft = spriteLeft;  // Use explicitly passed sprite
        this.spriteRight = spriteRight;  // Use explicitly passed sprite
        this.currentSprite = this.sprite; // Current displayed sprite
        this.isMoving = false;
        this.moveDirection = 0; // -1 for left, 0 for stationary, 1 for right
        this.animationFrame = 0;
        this.animationDelay = 8; // Increased frames to wait before changing sprites
        
        // Debug log to verify sprites are loaded
        console.log('Player sprites initialized:', {
            default: this.sprite ? 'loaded' : 'missing',
            left: this.spriteLeft ? 'loaded' : 'missing',
            right: this.spriteRight ? 'loaded' : 'missing'
        });
    }

    /**
     * Moves the player left/right based on arrow keys or A/D keys.
     * Uses the global gameSettings.currentPlayerSpeed for velocity.
     */
    /**
     * Updates the player's state - called every frame
     */
    update() {
        // Handle keyboard input
        this.handleInput();
        
        // Update animation frames if the player is moving
        if (this.isMoving) {
            this.animationFrame = (this.animationFrame + 1) % (this.animationDelay * 2);
        } else {
            this.animationFrame = 0;
        }
    }
    
    handleInput() {
        let move = 0;
        if (this.p.keyIsDown(this.p.LEFT_ARROW) || this.p.keyIsDown(65)) move -= 1;  // 'A'
        if (this.p.keyIsDown(this.p.RIGHT_ARROW) || this.p.keyIsDown(68)) move += 1; // 'D'
        
        // Update movement state
        if (move !== 0) {
            this.isMoving = true;
            this.moveDirection = move;
        } else {
            this.isMoving = false;
        }

        // apply speed
        this.x += move * gameSettings.currentPlayerSpeed;

        // constrain within canvas bounds
        this.x = constrain(
            this.x,
            this.w / 2,
            this.p.width - this.w / 2
        );

        // Emit events for movement using safeEmit
        this.eventBus?.safeEmit('playerMoved', { x: this.x, y: this.y });
    }

    /**
     * Draws the player sprite.
     */
    display() {
        // Default to standard sprite when not moving
        let spriteToUse = this.sprite;
        
        // When moving, alternate between left and right sprites
        if (this.isMoving) {
            // Simple alternating pattern based on animation frame
            if (this.animationFrame < this.animationDelay) {
                spriteToUse = this.spriteLeft || this.sprite;
            } else {
                spriteToUse = this.spriteRight || this.sprite;
            }
        }
        
        // Draw the selected sprite
        if (spriteToUse) {
            this.p.push(); // Use push/pop to isolate imageMode setting
            this.p.imageMode(this.p.CENTER);
            this.p.image(spriteToUse, this.x, this.y, this.w, this.h);
            this.p.pop();
        } else {
            // Fallback if no sprite is available
            this.p.push();
            this.p.fill(200, 80, 90); // Default color
            this.p.noStroke();
            this.p.rect(this.x, this.y, this.w, this.h, 5);
            this.p.pop();
        }
    }

    /**
     * Updates the player's position, used on window resize.
     * @param {number} x - new x position
     * @param {number} y - new y position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        // Emit position update event using safeEmit
        this.eventBus?.safeEmit('playerMoved', { x: this.x, y: this.y });
    }
}
