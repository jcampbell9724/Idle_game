import { BaseState } from './BaseState.js';
import { drawUpgradeScreen } from '../../ui/UpgradeScreen.js';
import { upgrades, tryBuy } from '../../upgrades.js';
import { gameSettings } from '../../gameSettings.js';

export class UpgradeState extends BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        super(p, eventBus, saveManager, assetManager);
        this.upgradeHitboxes = [];
    }

    update() {
        // Update hitboxes based on current layout
        this.updateHitboxes();
    }

    updateHitboxes() {
        this.upgradeHitboxes = [];
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.6;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;

        // Grid setup
        const cols = 3;
        const gap = 16;
        const btnW = (panelW - gap * (cols + 1)) / cols;
        const btnH = 80; // Match the height in UpgradeScreen
        const startY = panelY + 100; // Match the startY in UpgradeScreen

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

    render() {
        drawUpgradeScreen(this.p);
    }

    handleMousePress(x, y) {
        // Check each hitbox for click
        for (const hitbox of this.upgradeHitboxes) {
            if (x >= hitbox.x && x <= hitbox.x + hitbox.w &&
                y >= hitbox.y && y <= hitbox.y + hitbox.h) {
                // Check if player can afford the upgrade
                if (gameSettings.coins >= hitbox.upgrade.cost) {
                    if (tryBuy(hitbox.upgrade)) {
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