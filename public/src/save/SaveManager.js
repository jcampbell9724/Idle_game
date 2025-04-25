import { updateGlobalVariable, upgradeSystem } from '../upgrades.js';
import { storeSystem } from '../store.js';

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
            // Get store items for saving
            const storeItems = storeSystem.getItems().map(item => ({
                key: item.key,
                purchased: item.purchased
            }));
            
            const saveData = {
                gameSettings: gameSettings.toJSON(),
                coins: gameSettings.coins,
                upgrades: upgradeSystem.getAllUpgrades().map(upg => ({
                    key: upg.key,
                    level: upg.level,
                    cost: upg.cost
                })),
                storeItems: storeItems // Add store items to save data
            };
            
            localStorage.setItem('idleGameSave', JSON.stringify(saveData));
            console.log('Game saved successfully with', storeItems.length, 'store items');
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
            console.log('Applying saved game data...');
            
            // Apply saved game settings
            if (saveData.gameSettings) {
                gameSettings.fromJSON(saveData.gameSettings);
                console.log('Game settings restored');
                
                // Sync sound settings to the sound manager if available
                if (gameSettings.soundManager) {
                    // Set values directly to avoid triggering additional events
                    gameSettings.soundManager.settings.musicVolume = gameSettings.musicVolume || 1.0;
                    gameSettings.soundManager.settings.sfxVolume = gameSettings.sfxVolume || 1.0;
                    gameSettings.soundManager.settings.isMuted = gameSettings.isMuted || false;
                    gameSettings.soundManager.settings.previousMusicVolume = gameSettings.previousMusicVolume || 1.0;
                    gameSettings.soundManager.settings.previousSfxVolume = gameSettings.previousSfxVolume || 1.0;
                    console.log('Sound settings restored');
                }
            }

            // Restore coins explicitly to ensure it's set
            if (typeof saveData.coins === 'number') {
                gameSettings.coins = saveData.coins;
                console.log(`Restored ${saveData.coins} coins`);
                
                // Emit event if eventBus exists
                if (gameSettings.eventBus) {
                    gameSettings.eventBus.emit('coinsChanged', gameSettings.coins);
                }
            }

            // Restore upgrade levels and costs
            if (Array.isArray(saveData.upgrades)) {
                console.log(`Restoring ${saveData.upgrades.length} upgrades`);
                saveData.upgrades.forEach(savedUpg => {
                    const upgrade = upgradeSystem.getUpgrade(savedUpg.key);
                    if (upgrade) {
                        upgrade.level = savedUpg.level;
                        upgrade.cost = savedUpg.cost;
                        upgradeSystem._syncUpgradeWithGameSettings(savedUpg.key);
                        console.log(`Restored upgrade: ${savedUpg.key} (level ${savedUpg.level})`);
                    }
                });
            }
            
            // Restore store items' purchased status
            if (Array.isArray(saveData.storeItems)) {
                console.log(`Restoring ${saveData.storeItems.length} store items`);
                // Use the loadSavedState method we added to StoreSystem
                storeSystem.loadSavedState(saveData.storeItems);
            } else {
                console.log('No store items found in save data');
            }
            
            console.log('Save data applied successfully');
        } catch (e) {
            console.error('Error applying save data:', e);
        }
    }
}