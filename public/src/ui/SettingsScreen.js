import { gameSettings } from '../gameSettings.js';

export function drawSettingsScreen(p) {
    p.push();
    
    p.rectMode(p.CORNER);

    // 1. Full-screen dark overlay
    p.fill(0, 160);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    // 2. Compute panel size (60%×60% of canvas)
    const panelW = p.width * 0.6;
    const panelH = p.height * 0.6;

    // 3. Translate origin so (0,0) is top-left of the centered panel
    p.translate((p.width - panelW) / 2, (p.height - panelH) / 2);

    // 4. Draw panel background
    p.fill('#222');
    p.stroke('#fff');
    p.strokeWeight(2);
    p.rect(0, 0, panelW, panelH, 20);

    // 5. Title
    p.textSize(24);
    p.fill('#ccc'); // Lighter color for less boldness
    p.noStroke(); // Ensure no stroke is applied
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Pixelify Sans');
    p.text('Settings', panelW / 2, 30);

    // 6. Draw a back button
    const btnW = 120;
    const btnH = 40;
    const btnX = panelW / 2 - btnW / 2;
    const btnY = panelH - 80; // Move button higher to avoid overlap
    
    // 6.1 Draw a reset button (in red)
    const resetBtnW = 120;
    const resetBtnH = 40;
    const resetBtnX = panelW / 2 - resetBtnW / 2;
    const resetBtnY = panelH - 130; // Position above the back button
    
    p.fill('#a00'); // Red background for reset button
    p.stroke('#c00');
    p.rect(resetBtnX, resetBtnY, resetBtnW, resetBtnH, 10);
    
    p.noStroke();
    p.fill('#fff');
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Pixelify Sans');
    p.textSize(14); // Smaller text for button
    p.text('Reset Game', resetBtnX + resetBtnW/2, resetBtnY + resetBtnH/2);
    
    // Back button
    p.fill('#444');
    p.stroke('#888');
    p.rect(btnX, btnY, btnW, btnH, 10);

    p.noStroke();
    p.fill('#fff');
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Pixelify Sans');
    p.textSize(14); // Smaller text for button
    p.text('Back to Game', btnX + btnW/2, btnY + btnH/2); // Centered properly

    // 7. Bottom instructions
    p.fill('#fff');
    p.textSize(14); // Slightly smaller text
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textFont('Pixelify Sans');
    p.text("Press 'ESC' to return to game", panelW / 2, panelH - 15); // Move text up a bit

    p.pop();
}