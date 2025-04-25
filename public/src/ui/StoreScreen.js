// src/ui/StoreScreen.js
import { storeSystem } from '../store.js';
import { gameSettings } from '../gameSettings.js';
import { UI } from './helpers/UIHelper.js';

/**
 * Draws the store screen UI for one-time purchases.
 * @param {object} p - p5 instance
 * @param {function} onBuy - callback when an item is bought
 */
export function drawStoreScreen(p) {
    const items = storeSystem.getItems();
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
        'Store: One-Time Purchases',
        `Coins: ${gameSettings.coins.toFixed(0)}`,
        panel.centerX,
        panel.y + 30,
        { titleColor: '#fff', subtitleColor: '#fff' }
    );

    // Layout: grid like upgrades
    const cols = 3;
    const gap = 16;
    const btnW = (panel.width - gap * (cols + 1)) / cols;
    const btnH = 80;
    const startY = panel.y + 100;

    items.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = panel.x + gap + col * (btnW + gap);
        const by = startY + row * (btnH + gap);

        // Button background color
        const canAfford = gameSettings.coins >= item.cost;
        const isDisabled = item.purchased || !canAfford;
        let btnBg = item.purchased ? '#333' : (canAfford ? '#555' : '#333');

        // Draw button background
        UI.drawButton(
            p,
            bx,
            by,
            btnW,
            btnH,
            '', // No label, custom content
            {
                background: btnBg,
                cornerRadius: 10,
                isDisabled: item.purchased
            }
        );

        // Draw button text
        p.push();
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(16);
        p.fill('#fff');
        // Name
        p.text(item.name, bx + btnW / 2, by + 10);
        // Description
        p.textSize(13);
        p.fill('#ccc');
        p.text(item.description, bx + btnW / 2, by + 32);

        // Cost or Purchased
        p.textSize(15);
        if (item.purchased) {
            p.fill('#0f0');
            p.text('Purchased', bx + btnW / 2, by + 55);
        } else {
            p.fill(canAfford ? '#fff' : '#f00');
            p.text(`Cost: ${item.cost}`, bx + btnW / 2, by + 55);
            // Buy label (not interactive here, but for visual parity)
            p.textSize(14);
            p.fill(canAfford ? '#fff' : '#888');
            p.text('Buy', bx + btnW / 2, by + 67);
        }
        p.pop();
    });

    // Draw instructions at the bottom
    p.push();
    p.fill('#fff');
    p.textSize(16);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Click an item to purchase | Press 'ESC' to return to game", panel.centerX, panel.y + panel.height - 20);
    p.pop();
}

