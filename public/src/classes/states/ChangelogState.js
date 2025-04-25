import { BaseState } from './BaseState.js';
import { drawChangelogScreen } from '../../ui/ChangelogScreen.js';

export class ChangelogState extends BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        super(p, eventBus, saveManager, assetManager);
        this.backButtonHitbox = null;
        this.lines = ['Loading...'];
    }

    onEnter() {
        console.log('📜 Entering changelog…');
        fetch('changelog.txt')
            .then(r => r.text())
            .then(txt => { this.lines = txt.split('\n'); })
            .catch(() => { this.lines = ['Failed to load changelog.']; });
    }

    onUpdate() {
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.7;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;
        const btnW = 100;
        const btnH = 40;
        const btnX = panelX + (panelW - btnW) / 2;
        const btnY = panelY + panelH - 60;
        this.backButtonHitbox = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    onRender() {
        drawChangelogScreen(this.p, this.lines);
    }

    handleKeyPress(key) {
        if (key === 'Escape') {
            this.eventBus.emit('changeState', 'playing');
            return true;
        }
        return false;
    }

    handleMousePress(x, y) {
        const b = this.backButtonHitbox;
        if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            this.eventBus.emit('changeState', 'playing');
            return true;
        }
        return false;
    }
}
