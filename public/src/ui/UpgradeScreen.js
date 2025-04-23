import { upgrades } from '../upgrades.js';
import { gameSettings } from '../gameSettings.js';

export function drawUpgradeScreen(p) {
    p.push();

    p.rectMode(p.CORNER);

    // 1. Full‑screen dark overlay
    p.fill(0, 160);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    // 2. Compute panel size (60%×60% of canvas)
    const panelW = p.width * 0.6;
    const panelH = p.height * 0.6;

    // 3. Translate origin so (0,0) is top‑left of the centered panel
    p.translate((p.width - panelW) / 2, (p.height - panelH) / 2);

    // 4. Draw panel background
    p.fill('#222');
    p.stroke('#fff');
    p.strokeWeight(2);
    p.rect(0, 0, panelW, panelH, 20);

    // 5. Title and Coins
    p.textSize(24);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Upgrade Shop', panelW / 2, 30);
    p.textSize(18);
    p.text(`Coins: ${gameSettings.coins.toFixed(0)}`, panelW / 2, 60);

    // 6. Grid setup
    const cols = 3;
    const gap = 16;
    const btnW = (panelW - gap * (cols + 1)) / cols;
    const btnH = 80; // Increased height to accommodate more text
    const startY = 100; // space under title and coins

    // 7. Draw each upgrade button
    upgrades.forEach((upg, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = gap + col * (btnW + gap);
        const by = startY + row * (btnH + gap);

        const canAfford = gameSettings.coins >= upg.cost;
        const currentValue = upg.getValue(upg.level);
        const nextValue = upg.getValue(upg.level + 1);
        const valueIncrease = nextValue - currentValue;

        // 7a. Button bg
        p.fill(canAfford ? '#555' : '#333');
        p.stroke(canAfford ? '#888' : '#666');
        p.rect(bx, by, btnW, btnH, 10);

        // 7b. Button text
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
    });

    // 8. Instructions
    p.fill('#fff');
    p.textSize(16);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Click an upgrade to purchase | Press 'ESC' to return to game", panelW / 2, panelH - 20);

    p.pop();
}
