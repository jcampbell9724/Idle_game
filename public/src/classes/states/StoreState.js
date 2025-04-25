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
        
        // Match grid layout from StoreScreen.js
        const cols = 3;
        const gap = 16;
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.6;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;
        const btnW = (panelW - gap * (cols + 1)) / cols;
        const btnH = 80;
        const startY = panelY + 100;

        items.forEach((item, idx) => {
            if (item.purchased) return;
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const bx = panelX + gap + col * (btnW + gap);
            const by = startY + row * (btnH + gap);
            // Check if click is inside the card/button area
            if (
                x >= bx && x <= bx + btnW &&
                y >= by && y <= by + btnH
            ) {
                // Try to buy
                if (storeSystem.tryBuy(item.key, gameSettings.coins)) {
                    gameSettings.updateCoins(-item.cost);
                    if (item.key === 'unlockUpgrades') {
                        gameSettings.upgradesUnlocked = true;
                        if (this.saveManager) this.saveManager.save(gameSettings);
                    }
                    if (this.saveManager) this.saveManager.save(gameSettings);
                    if (this.eventBus) this.eventBus.safeEmit('coinsChanged', gameSettings.coins);
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
