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
     * @param {Image} sprite - The pre-loaded image/sprite for the player
     * @param {object} p - the p5 instance
     * @param {EventBus} eventBus - the event bus for communication
     */
    constructor(x, y, w, h, sprite, p, eventBus) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.sprite = sprite; // Store the sprite
        this.p = p;                // ← store the p5 instance
        this.eventBus = eventBus || (gameSettings.eventBus ? gameSettings.eventBus : null);
    }

    /**
     * Moves the player left/right based on arrow keys or A/D keys.
     * Uses the global gameSettings.currentPlayerSpeed for velocity.
     */
    handleInput() {
        let move = 0;
        if (this.p.keyIsDown(this.p.LEFT_ARROW) || this.p.keyIsDown(65)) move -= 1;  // 'A'
        if (this.p.keyIsDown(this.p.RIGHT_ARROW) || this.p.keyIsDown(68)) move += 1; // 'D'

        // apply speed
        this.x += move * gameSettings.currentPlayerSpeed;

        // constrain within canvas bounds
        this.x = constrain(
            this.x,
            this.w / 2,
            this.p.width - this.w / 2
        );

        // Emit events for movement only if eventBus exists
        if (this.eventBus) {
            this.eventBus.emit('playerMoved', { x: this.x, y: this.y });
        }
    }

    /**
     * Draws the player sprite.
     */
    display() {
        if (this.sprite) {
            this.p.push(); // Use push/pop to isolate imageMode setting
            this.p.imageMode(this.p.CENTER);
            this.p.image(this.sprite, this.x, this.y, this.w, this.h);
            this.p.pop();
        } else {
            // Fallback if sprite hasn't loaded (optional)
            this.p.fill(200, 80, 90); // Default color
            this.p.noStroke();
            this.p.rect(this.x, this.y, this.w, this.h, 5);
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
        
        // Emit position update event if eventBus exists
        if (this.eventBus) {
            this.eventBus.emit('playerMoved', { x: this.x, y: this.y });
        }
    }
}
