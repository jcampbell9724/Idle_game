import { gameSettings } from '../gameSettings.js';
import { UI } from './helpers/UIHelper.js';

export function drawSettingsScreen(p) {
    // Draw the panel using the UI helper
    const panel = UI.drawPanel(p, {
        widthPercent: 0.6,
        heightPercent: 0.6,
        background: '#222',
        border: '#fff'
    });
    
    // Draw title
    UI.drawTitle(
        p, 
        'Settings', 
        null,
        panel.centerX,
        panel.y + 30,
        { titleColor: '#fff', titleSize: 28 }
    );
    
    // Draw a back button
    const btnW = 120;
    const btnH = 40;
    const btnX = panel.centerX - btnW / 2;
    const btnY = panel.y + panel.height - 80; // Move button higher to avoid overlap
    
    // Draw a reset button (in red)
    const resetBtnW = 120;
    const resetBtnH = 40;
    const resetBtnX = panel.centerX - resetBtnW / 2;
    const resetBtnY = panel.y + panel.height - 130; // Position above the back button
    
    // Draw reset button
    UI.drawButton(
        p,
        resetBtnX,
        resetBtnY,
        resetBtnW,
        resetBtnH,
        'Reset Game',
        {
            background: '#a00',
            hoverBackground: '#c00',
            textSize: 14
        }
    );
    
    // Draw back button
    UI.drawButton(
        p,
        btnX,
        btnY,
        btnW,
        btnH,
        'Back to Game',
        {
            background: '#444',
            textSize: 14
        }
    );

    // Draw bottom instructions
    p.push();
    p.fill('#fff');
    p.textSize(14); // Slightly smaller text
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textFont('Pixelify Sans');
    p.text("Press 'ESC' to return to game", panel.centerX, panel.y + panel.height - 15); // Move text up a bit
    p.pop();
}