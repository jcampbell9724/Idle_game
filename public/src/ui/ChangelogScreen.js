import { UI } from './helpers/UIHelper.js';

/**
 * Draws the changelog panel and back button.
 * @param {object} p     	6 p5 instance
 * @param {string[]} lines 	6 array of changelog lines
 */
export function drawChangelogScreen(p, lines) {
    // Draw overlay and panel
    const panel = UI.drawPanel(p, {
        widthPercent: 0.6,
        heightPercent: 0.7,
        background: '#222',
        border: '#fff'
    });

    // Title
    UI.drawTitle(
        p,
        'Changelog',
        null,
        panel.centerX,
        panel.y + 30,
        { titleColor: '#fff', titleSize: 28 }
    );

    // Body text
    p.push();
    p.fill('#fff');
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    const startX = panel.x + 20;
    let y = panel.y + 60;
    const lineHeight = 18;
    lines.forEach(line => {
        p.text(line, startX, y);
        y += lineHeight;
    });
    p.pop();

    // Back button
    const btnW = 100;
    const btnH = 40;
    const btnX = panel.centerX - btnW / 2;
    const btnY = panel.y + panel.height - 60;
    UI.drawButton(p, btnX, btnY, btnW, btnH, 'Back', {
        background: '#444',
        textSize: 16
    });

    return {
        backButton: { x: btnX, y: btnY, w: btnW, h: btnH }
    };
}
