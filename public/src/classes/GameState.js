import { PlayingState } from './states/PlayingState.js';
import { UpgradeState } from './states/UpgradeState.js';
import { MenuState } from './states/MenuState.js';
import { gameSettings } from '../gameSettings.js';
import { SettingsState } from './states/SettingsState.js';
import { StoreState } from './states/StoreState.js';

export class GameState {
    constructor(p, eventBus, saveManager, assetManager, playerSprite, playerLeftSprite, playerRightSprite) {
        this.p = p;
        this.eventBus = eventBus;
        this.saveManager = saveManager;
        this.assetManager = assetManager;
        
        this.states = {
            playing: new PlayingState(p, eventBus, saveManager, assetManager, playerSprite, playerLeftSprite, playerRightSprite),
            upgrade: new UpgradeState(p, eventBus, saveManager, assetManager, gameSettings.upgradeSystem),
            menu: new MenuState(p, eventBus, saveManager, assetManager),
            settings: new SettingsState(p, eventBus, saveManager, assetManager, gameSettings.soundManager),
            store: new StoreState(p, eventBus, saveManager, assetManager)
        };
        
        // Listen for state change events
        if (this.eventBus) {
            this.eventBus.on('changeState', (newState) => {
                this.changeState(newState);
            });
        }
        
        this.currentState = 'menu';
        // Use the enter method which will call onEnter()
        this.states[this.currentState].enter();
    }

    changeState(newState) {
        if (this.states[newState]) {
            // First call the exit method of the current state
            if (this.states[this.currentState] && typeof this.states[this.currentState].exit === 'function') {
                this.states[this.currentState].exit();
            }
            
            // Then switch to the new state
            this.currentState = newState;
            
            // Finally call the enter method of the new state
            if (typeof this.states[this.currentState].enter === 'function') {
                this.states[this.currentState].enter();
            }
        }
    }

    update() {
        this.states[this.currentState].update();
    }

    render() {
        this.states[this.currentState].render();
    }

    getState() {
        return {
            currentState: this.currentState,
            gameSettings: gameSettings.toJSON()
        };
    }

    loadState(savedState) {
        if (savedState) {
            this.changeState(savedState.currentState);
            gameSettings.fromJSON(savedState.gameSettings);
        }
    }
}