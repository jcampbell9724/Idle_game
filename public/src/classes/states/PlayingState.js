import { BaseState } from './BaseState.js';
import { Player } from '../Player.js';
import { Cannon } from '../Cannon.js';
import { Block } from '../Block.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, CANNON_X_OFFSET, GROUND_OFFSET } from '../../config.js';
import { gameSettings } from '../../gameSettings.js';

export class PlayingState extends BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        super(p, eventBus, saveManager, assetManager);

        // 1) compute the ground Y
        const groundY = p.height - GROUND_OFFSET;
        gameSettings.groundY = groundY;

        // 2) compute the player's center Y so its bottom edge = groundY
        const playerCenterY = groundY - PLAYER_HEIGHT / 2;

        // 3) create the player at that Y
        const playerSprite = this.assetManager.getAsset('player');
        this.player = new Player(
            p.width / 2,
            playerCenterY,
            PLAYER_WIDTH,
            PLAYER_HEIGHT,
            playerSprite,
            p,
            eventBus
        );

        // 4) instantiate your cannon and block array
        this.cannon = new Cannon(p.width - CANNON_X_OFFSET, p.height / 2, p, eventBus);
        this.blocks = [];
        
        // Add max blocks notification
        this.maxBlocksNotification = {
            active: false,
            fadeStartTime: 0,
            duration: 2000, // 2 seconds
            x: p.width / 2,
            y: p.height / 2
        };
        
        // Set up event listeners
        if (eventBus) {
            eventBus.on('maxBlocksReached', (data) => {
                this.showMaxBlocksNotification();
            });
        }
    }

    update() {
        this.player.handleInput();
        this.cannon.tryShoot(this.blocks);

        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const b = this.blocks[i];
            b.update();
            if (b.collidesWith(this.player)) {
                Block.onCollect();
                this.blocks.splice(i, 1);
                continue;
            }
            if (b.isDespawned()) {
                this.blocks.splice(i, 1);
            }
        }
        
        // Update max blocks notification
        if (this.maxBlocksNotification.active) {
            const elapsed = this.p.millis() - this.maxBlocksNotification.fadeStartTime;
            if (elapsed > this.maxBlocksNotification.duration) {
                this.maxBlocksNotification.active = false;
            }
        }
    }

    render() {
        const bg = this.assetManager.getAsset('background');
        if (bg) {
            this.p.image(bg, 0, 0, this.p.width, this.p.height);
        } else {
            this.p.background('#ffe7de'); // fallback color
        }
    
        this.player.display();
        this.cannon.display();
        this.blocks.forEach(block => block.display());
        
        // Display blocks count
        const p = this.p;
        p.push();
        p.fill(0, 0, 0, 70);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.text(`Blocks: ${this.blocks.length}/${gameSettings.currentMaxBlocks}`, 10, 80);
        p.pop();
        
        // Display max blocks notification if active
        if (this.maxBlocksNotification.active) {
            const elapsed = p.millis() - this.maxBlocksNotification.fadeStartTime;
            const alpha = p.map(elapsed, 0, this.maxBlocksNotification.duration, 255, 0);
            
            p.push();
            p.fill(200, 80, 80, alpha);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(24);
            p.text(`Maximum Blocks Reached (${gameSettings.currentMaxBlocks})`, 
                   this.maxBlocksNotification.x, 
                   this.maxBlocksNotification.y);
            
            // Draw upgrade hint
            p.textSize(16);
            p.text("Press 'U' to upgrade Max Blocks", 
                   this.maxBlocksNotification.x,
                   this.maxBlocksNotification.y + 30);
            p.pop();
        }
    }
    
    // Show notification when max blocks is reached
    showMaxBlocksNotification() {
        this.maxBlocksNotification.active = true;
        this.maxBlocksNotification.fadeStartTime = this.p.millis();
        this.maxBlocksNotification.x = this.p.width / 2;
        this.maxBlocksNotification.y = 100;
    }
}