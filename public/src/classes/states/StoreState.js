// src/classes/states/StoreState.js
import { drawStoreScreen } from '../../ui/StoreScreen.js';
import { storeSystem } from '../../store.js';
import { gameSettings } from '../../gameSettings.js';

export class StoreState {
    constructor(p, eventBus, saveManager, assetManager) {
        this.p = p;
        this.eventBus = eventBus;
        this.saveManager = saveManager;
        this.assetManager = assetManager;
    }

    enter() {
        // Called when entering store state
        console.log('Entered store state');
    }

    exit() {
        // Called when leaving store state
        console.log('Exited store state');
    }

    update() {
        // No-op for now
    }

    render() {
        // Clear the canvas before drawing
        this.p.background(0, 0, 10, 100); // Dark background with slight transparency
        drawStoreScreen(this.p);
    }

    handleMousePress(x, y) {
        // Handle buy button clicks
        const items = storeSystem.getItems();
        
        // IMPORTANT: These constants must match those in StoreScreen.js
        const boxW = 440, boxH = 70;
        const boxSpacing = 18; // vertical space between item boxes
        const startX = this.p.width / 2 - boxW / 2;
        let startY = this.p.height / 2 - (items.length * (boxH + boxSpacing)) / 2;
        
        // Button dimensions (must match StoreScreen.js)
        const buttonW = 64, buttonH = 36;
        const buttonRightPadding = 48;
        
        items.forEach((item, idx) => {
            if (item.purchased) return;
            
            // Calculate button position exactly as in StoreScreen.js
            const itemY = startY + idx * (boxH + boxSpacing);
            const btnX = startX + boxW - buttonRightPadding - buttonW;
            const btnY = itemY + (boxH - buttonH) / 2;
            
            console.log(`Button ${idx}: (${btnX},${btnY}) to (${btnX+buttonW},${btnY+buttonH}). Click at (${x},${y})`);
            
            // Check if click is within button
            if (
                x >= btnX && x <= btnX + buttonW &&
                y >= btnY && y <= btnY + buttonH
            ) {
                console.log(`Clicked buy button for ${item.name}`);
                // Try to buy
                if (storeSystem.tryBuy(item.key, gameSettings.coins)) {
                    gameSettings.updateCoins(-item.cost);
                    console.log(`Purchased ${item.name} for ${item.cost} coins`);
                    if (this.eventBus) this.eventBus.safeEmit('coinsChanged', gameSettings.coins);
                } else {
                    console.log(`Failed to purchase ${item.name} - insufficient funds or already purchased`);
                }
            }
        });
    }

    handleKeyPress(key) {
        // ESC to exit store
        if (key === 'Escape' || key === 'Esc') {
            console.log('ESC pressed in store state, returning to playing state');
            if (this.eventBus) this.eventBus.safeEmit('changeState', 'playing');
        }
    }
}
