// src/ui/StoreScreen.js
import { storeSystem } from '../store.js';
import { gameSettings } from '../gameSettings.js';

/**
 * Draws the store screen UI for one-time purchases.
 * @param {object} p - p5 instance
 * @param {function} onBuy - callback when an item is bought
 */
export function drawStoreScreen(p) {
    const items = storeSystem.getItems();
    const boxW = 440, boxH = 70;
    const boxSpacing = 18; // vertical space between item boxes
    const startX = p.width / 2 - boxW / 2;
    let startY = p.height / 2 - (items.length * (boxH + boxSpacing)) / 2;
    const padding = 20;
    const nameY = 22;
    const descY = 44;
    const costRightPadding = 135;
    const buttonW = 64, buttonH = 36;
    const buttonRightPadding = 48;
    const buttonRadius = 8;

    // Log the dimensions for debugging
    console.log(`Drawing store UI: Start position (${startX}, ${startY}), box size ${boxW}x${boxH}`);

    p.push();
    // Draw store title
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(28);
    p.fill(0, 0, 100); // White in HSB (0, 0, 100)
    p.text('Store: One-Time Purchases', p.width / 2, startY - 70);
    // Draw coin count
    p.textSize(18);
    p.fill(50, 100, 100); // Gold color for coins
    p.text(`Your Coins: ${gameSettings.coins}`, p.width / 2, startY - 40);
    p.textAlign(p.LEFT, p.CENTER);

    items.forEach((item, idx) => {
        const y = startY + idx * (boxH + boxSpacing);
        // Draw box background
        if (item.purchased) {
            p.fill(180, 30, 80, 80); // Muted color for purchased (fixed values)
        } else {
            p.fill(200, 80, 90, 80); // Blue for available (fixed values)
        }
        p.strokeWeight(2);
        p.stroke(item.purchased ? p.color(120, 80, 80) : p.color(210, 80, 90));
        p.rect(startX, y, boxW, boxH, 16);
        p.noStroke();

        // Draw item name
        p.textSize(20);
        p.fill(0, 0, 10); // Almost black in HSB
        p.text(item.name, startX + padding, y + nameY);
        // Draw item description
        p.textSize(15);
        p.fill(0, 0, 20); // Dark gray in HSB
        p.text(item.description, startX + padding, y + descY);

        // Log button position for debugging
        console.log(`Item ${idx}: ${item.name} at Y=${y}`);

        // Draw cost and buy button or purchased label
        if (item.purchased) {
            // Purchased label centered right
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(18);
            p.fill(120, 80, 80); // Green in HSB for purchased label
            p.text('Purchased', startX + boxW - padding, y + boxH / 2);
            p.textAlign(p.LEFT, p.CENTER);
        } else {
            // Cost label (yellow, right-aligned, close to button)
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(16);
            p.fill(50, 100, 90); // Gold in HSB
            
            // Calculate cost label position
            const costX = startX + boxW - costRightPadding;
            p.text(`Cost: ${item.cost} coins`, costX, y + boxH / 2);
            
            // Draw buy button (green, right edge)
            const btnX = startX + boxW - buttonRightPadding - buttonW;
            const btnY = y + (boxH - buttonH) / 2;
            
            // Log button position for debugging
            console.log(`Button for ${item.name}: (${btnX}, ${btnY}) to (${btnX + buttonW}, ${btnY + buttonH})`);
            
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(120, 80, 80); // Green in HSB for button
            p.stroke(120, 90, 50); // Darker green for button outline
            p.strokeWeight(2);
            p.rect(btnX, btnY, buttonW, buttonH, buttonRadius);
            p.noStroke();
            p.fill(0, 0, 100); // White text
            p.textSize(17);
            p.text('Buy', btnX + buttonW / 2, btnY + buttonH / 2);
            p.textAlign(p.LEFT, p.CENTER);
        }
    });
    p.pop();
}


