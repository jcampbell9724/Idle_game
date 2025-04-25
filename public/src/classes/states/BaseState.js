export class BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        this.p = p;
        this.eventBus = eventBus;
        this.saveManager = saveManager;
        this.assetManager = assetManager;
        
        // Set a name for debugging
        this.stateName = this.constructor.name;
    }

    // Base implementations that handle common logic and call hooks
    enter() { 
        console.log(`Entering state: ${this.stateName}`);
        
        // Common enter logic for all states
        // For example, emit an event
        if (this.eventBus) {
            this.eventBus.emit('stateEntered', this.stateName);
        }
        
        // Call the hook that subclasses can override
        this.onEnter();
    }
    
    exit() { 
        console.log(`Exiting state: ${this.stateName}`);
        
        // Common exit logic for all states
        if (this.eventBus) {
            this.eventBus.emit('stateExited', this.stateName);
        }
        
        // Call the hook that subclasses can override
        this.onExit();
    }
    
    update() {
        // Common update logic (if any)
        this.onUpdate();
    }
    
    render() {
        // Common render logic (if any)
        this.onRender();
    }
    
    // Optional hooks for subclasses to override
    onEnter() { /* Hook for subclasses */ }
    onExit() { /* Hook for subclasses */ }
    onUpdate() { /* Hook for subclasses */ }
    onRender() { /* Hook for subclasses */ }
    
    // Helper methods that all states can use
    changeState(newState) {
        if (this.eventBus) {
            this.eventBus.emit('changeState', newState);
        } else if (window.gameStateManager) {
            window.gameStateManager.changeState(newState);
        }
    }
}