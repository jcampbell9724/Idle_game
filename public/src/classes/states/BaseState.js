export class BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        this.p = p;
        this.eventBus = eventBus;
        this.saveManager = saveManager;
        this.assetManager = assetManager;
    }

    enter() {}
    exit() {}
    update() {}
    render() {}
}