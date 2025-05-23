import { BaseState } from './BaseState.js';
import { drawUpgradeScreen } from '../../ui/UpgradeScreen.js';
import { upgradeSystem } from '../../upgrades.js';
import { gameSettings } from '../../gameSettings.js';

export class UpgradeState extends BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        super(p, eventBus, saveManager, assetManager);
        this.upgradeHitboxes = [];
    }

    onUpdate() {
        // Update hitboxes based on current layout
        this.updateHitboxes();
    }

    updateHitboxes() {
        this.upgradeHitboxes = [];
        
        // Use the same panel dimensions as in the UI
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.6;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;

        // Grid setup - must match UpgradeScreen.js
        const cols = 3;
        const gap = 16;
        const btnW = (panelW - gap * (cols + 1)) / cols;
        const btnH = 80; // Match the height in UpgradeScreen
        const startY = panelY + 100; // Match the startY in UpgradeScreen

        // Get upgrades from upgradeSystem
        const upgrades = upgradeSystem.getAllUpgrades();
        
        // Create hitboxes for each upgrade
        upgrades.forEach((upg, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const bx = panelX + gap + col * (btnW + gap);
            const by = startY + row * (btnH + gap);

            this.upgradeHitboxes.push({
                x: bx,
                y: by,
                w: btnW,
                h: btnH,
                upgrade: upg
            });
        });
    }

    onRender() {
        if (!gameSettings.upgradesUnlocked) {
            // Draw locked panel
            const p = this.p;
            const panel = {
                width: p.width * 0.6,
                height: p.height * 0.3,
                x: (p.width - p.width * 0.6) / 2,
                y: (p.height - p.height * 0.3) / 2,
                centerX: p.width / 2,
                centerY: p.height / 2
            };
            p.push();
            p.fill('#222');
            p.stroke('#fff');
            p.strokeWeight(2);
            p.rect(panel.x, panel.y, panel.width, panel.height, 20);
            p.noStroke();
            p.fill('#fff');
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(28);
            p.text('Upgrade Shop Locked', panel.centerX, panel.y + 50);
            p.textSize(18);
            p.fill('#ccc');
            p.text('Unlock it in the Store!', panel.centerX, panel.y + 95);
            p.pop();
            return;
        }
        drawUpgradeScreen(this.p);
    }

    handleMousePress(x, y) {
        // Check each hitbox for click
        for (const hitbox of this.upgradeHitboxes) {
            if (x >= hitbox.x && x <= hitbox.x + hitbox.w &&
                y >= hitbox.y && y <= hitbox.y + hitbox.h) {
                // Check if player can afford the upgrade
                if (gameSettings.coins >= hitbox.upgrade.cost) {
                    if (upgradeSystem.tryBuy(hitbox.upgrade.key)) {
                        // Save game after purchase
                        if (this.saveManager) {
                            this.saveManager.save(gameSettings);
                        }
                    }
                }
                break; // Only handle one click
            }
        }
    }
}