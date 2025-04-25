import { upgradeSystem } from '../upgrades.js';
import { gameSettings } from '../gameSettings.js';
import { UI } from './helpers/UIHelper.js';

// Get upgrades from the upgradeSystem
const upgrades = upgradeSystem.getAllUpgrades();

export function drawUpgradeScreen(p) {
    // Draw the panel using the UI helper
    const panel = UI.drawPanel(p, {
        widthPercent: 0.6,
        heightPercent: 0.6,
        background: '#222',
        border: '#fff'
    });
    
    // Draw title and coins
    UI.drawTitle(
        p, 
        'Upgrade Shop', 
        `Coins: ${gameSettings.coins.toFixed(0)}`,
        panel.centerX,
        panel.y + 30,
        { titleColor: '#fff', subtitleColor: '#fff' }
    );

    // Get upgrades
    const upgrades = upgradeSystem.getAllUpgrades();
    
    // Grid setup
    const cols = 3;
    const gap = 16;
    const btnW = (panel.width - gap * (cols + 1)) / cols;
    const btnH = 80; // Increased height to accommodate more text
    const startY = panel.y + 100; // space under title and coins

    // Draw each upgrade button
    upgrades.forEach((upg, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = panel.x + gap + col * (btnW + gap);
        const by = startY + row * (btnH + gap);

        const canAfford = gameSettings.coins >= upg.cost;
        const currentValue = upg.getValue(upg.level);
        const nextValue = upg.getValue(upg.level + 1);
        const valueIncrease = nextValue - currentValue;

        // Draw button background
        UI.drawButton(
            p, 
            bx, 
            by, 
            btnW, 
            btnH, 
            '', // No label - we'll draw it separately
            {
                background: canAfford ? '#555' : '#333',
                cornerRadius: 10
            }
        );

        // Draw button text
        p.push();
        p.noStroke();
        p.fill('#fff');
        p.textSize(16);
        p.textAlign(p.CENTER, p.TOP);

        // Draw upgrade name and current level
        p.text(
            `${upg.name} (Lv ${upg.level})`,
            bx + btnW / 2,
            by + 10
        );

        // Draw current and next values
        p.textSize(14);
        p.text(
            `Current: ${upg.formatValue(currentValue)}`,
            bx + btnW / 2,
            by + 30
        );

        if (canAfford) {
            p.fill('#0f0');
            p.text(
                `Next: ${upg.formatValue(nextValue)} (+${upg.formatValue(valueIncrease)})`,
                bx + btnW / 2,
                by + 50
            );
        }

        // Draw cost
        p.fill(canAfford ? '#fff' : '#f00');
        p.textSize(16);
        p.text(
            `Cost: ${upg.cost}`,
            bx + btnW / 2,
            by + 65
        );
        p.pop();
    });

    // Draw instructions at the bottom
    p.push();
    p.fill('#fff');
    p.textSize(16);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Click an upgrade to purchase | Press 'ESC' to return to game", panel.centerX, panel.y + panel.height - 20);
    p.pop();
}
