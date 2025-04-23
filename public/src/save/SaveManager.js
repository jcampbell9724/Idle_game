import { updateGlobalVariable } from '../upgrades.js';

export class SaveManager {
    constructor() {
        this.saveKey = 'idle_farm_cannon_save';
        this.isStorageAvailable = this.checkStorageAvailability();
    }
    
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage is not available. Game progress will not be saved.', e);
            return false;
        }
    }

    save(gameSettings) {
        if (!this.isStorageAvailable) return;

        try {
            const saveData = {
                gameSettings: gameSettings.toJSON(),
                coins: gameSettings.coins,
                upgrades: window.upgrades.map(upg => ({
                    key: upg.key,
                    level: upg.level,
                    cost: upg.cost
                }))
            };
            localStorage.setItem('idleGameSave', JSON.stringify(saveData));
            console.log('Game saved successfully');
        } catch (e) {
            console.error('Failed to save game:', e);
            // Try to clean up storage if it's full
            if (e.name === 'QuotaExceededError') {
                this.clearOldSaves();
            }
        }
    }
    
    clearOldSaves() {
        try {
            // Clear only our game data, not all localStorage
            localStorage.removeItem('idleGameSave');
            console.log('Cleared old save data due to storage limits');
        } catch (e) {
            console.error('Failed to clear old saves:', e);
        }
    }

    load() {
        if (!this.isStorageAvailable) return null;

        try {
            const saveData = localStorage.getItem('idleGameSave');
            if (!saveData) return null;

            const parsed = JSON.parse(saveData);
            if (!parsed.gameSettings || typeof parsed.coins !== 'number') {
                console.error('Invalid save data structure');
                return null;
            }

            return parsed;
        } catch (e) {
            console.error('Failed to load save:', e);
            // If there's an error with the save data, try to clean it up
            this.clearOldSaves();
            return null;
        }
    }

    applySave(gameSettings, saveData) {
        if (!saveData) return;
        
        try {
            // Apply saved game settings
            if (saveData.gameSettings) {
                gameSettings.fromJSON(saveData.gameSettings);
            }

            // Restore coins explicitly to ensure it's set
            if (typeof saveData.coins === 'number') {
                gameSettings.coins = saveData.coins;
                
                // Emit event if eventBus exists
                if (gameSettings.eventBus) {
                    gameSettings.eventBus.emit('coinsChanged', gameSettings.coins);
                }
            }

            // Restore upgrade levels and costs
            if (Array.isArray(saveData.upgrades)) {
                saveData.upgrades.forEach(savedUpg => {
                    const upgrade = window.upgrades.find(u => u.key === savedUpg.key);
                    if (upgrade) {
                        upgrade.level = savedUpg.level;
                        upgrade.cost = savedUpg.cost;
                        updateGlobalVariable(upgrade);
                    }
                });
            }
        } catch (e) {
            console.error('Error applying save data:', e);
        }
    }
}