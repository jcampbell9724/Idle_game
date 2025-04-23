import { BaseState } from './BaseState.js';

export class MenuState extends BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        super(p, eventBus, saveManager, assetManager);
    }

    render() {
        this.p.background('#ffe7de');
        this.p.fill(0);
        this.p.textSize(32);
        this.p.text('Idle Farm Cannon Tycoon', this.p.width / 2, this.p.height / 3);
        this.p.textSize(24);
        this.p.text('Press SPACE to start', this.p.width / 2, this.p.height / 2);
    }
}