// src/upgrades.js

import {
    blockBaseValue,
    baseShootIntervalSeconds,
    baseBlockDespawnTime,
    baseMaxBlocks,
    basePlayerSpeed
} from './config.js';
import { gameSettings, initUpgrades as resetGameSettings } from './gameSettings.js';

const INITIAL_UPGRADE_COST = 1;
const upgradeCostGrowth = c => Math.ceil(c * 1.25);

export const upgrades = [
    {
        key: 'blockValue',
        name: 'Block Value',
        level: 0,
        base: blockBaseValue,
        cost: INITIAL_UPGRADE_COST,
        costGrowth: upgradeCostGrowth,
        targetVariable: 'currentBlockValue',
        getValue(lvl) {
            return this.base * Math.pow(1.2, lvl);
        },
        formatValue(val) {
            return val.toFixed(2);
        }
    },
    {
        key: 'cannonInterval',
        name: 'Cannon Speed',
        level: 0,
        base: baseShootIntervalSeconds,
        cost: INITIAL_UPGRADE_COST,
        costGrowth: upgradeCostGrowth,
        targetVariable: 'currentCannonInterval',
        getValue(lvl) {
            return Math.max(0.05, this.base * Math.pow(0.9, lvl));
        },
        formatValue(val) {
            return `${val.toFixed(2)}s`;
        },
        applyUpdate(upg) {
            gameSettings.currentCannonInterval = upg.getValue(upg.level);
            // Convert seconds to frames for the game
            gameSettings.currentCannonIntervalFrames = Math.round(gameSettings.currentCannonInterval * 60);
        }
    },
    {
        key: 'maxBlocks',
        name: 'Max Blocks',
        level: 0,
        base: baseMaxBlocks,
        cost: INITIAL_UPGRADE_COST,
        costGrowth: upgradeCostGrowth,
        targetVariable: 'currentMaxBlocks',
        getValue(lvl) {
            return Math.min(20, this.base + lvl);
        },
        formatValue(val) {
            return Math.floor(val).toString();
        }
    },
    {
        key: 'playerSpeed',
        name: 'Player Speed',
        level: 0,
        base: basePlayerSpeed,
        cost: INITIAL_UPGRADE_COST,
        costGrowth: upgradeCostGrowth,
        targetVariable: 'currentPlayerSpeed',
        getValue(lvl) {
            return Math.min(10, this.base * Math.pow(1.15, lvl));
        },
        formatValue(val) {
            return val.toFixed(1);
        }
    },
    {
        key: 'blockDespawnTime',
        name: 'Block Despawn Time',
        level: 0,
        base: baseBlockDespawnTime,
        cost: INITIAL_UPGRADE_COST,
        costGrowth: upgradeCostGrowth,
        targetVariable: 'currentBlockDespawnTime',
        getValue(lvl) {
            return Math.min(6, this.base + 0.5 * lvl);
        },
        formatValue(val) {
            return `${val.toFixed(1)}s`;
        },
        applyUpdate(upg) {
            gameSettings.currentBlockDespawnTime = upg.getValue(upg.level);
            // Only emit event if eventBus exists
            if (gameSettings.eventBus) {
                gameSettings.eventBus.emit('updateBlockDespawnTime', gameSettings.currentBlockDespawnTime);
            }
        }
    }
];

// Make upgrades available globally
window.upgrades = upgrades;
window.initUpgrades = initUpgrades;

export function updateGlobalVariable(upg) {
    if (typeof upg.applyUpdate === 'function') {
        upg.applyUpdate(upg);
    } else if (upg.targetVariable) {
        gameSettings[upg.targetVariable] = upg.getValue(upg.level);
    } else {
        console.warn('Upgrade key not handled:', upg.key);
    }
}

export function tryBuy(upg) {
    if (gameSettings.coins < upg.cost) return false;
    
    gameSettings.coins -= upg.cost;
    upg.level += 1;
    upg.cost = upg.costGrowth(upg.cost);
    updateGlobalVariable(upg);
    
    // Emit event if eventBus exists
    if (gameSettings.eventBus) {
        gameSettings.eventBus.emit('upgradePurchased', { ...upg });
        gameSettings.eventBus.emit('coinsChanged', gameSettings.coins);
    }
    
    return true;
}

export function initUpgrades() {
    resetGameSettings();
    upgrades.forEach(upg => {
        upg.level = 0;
        upg.cost = INITIAL_UPGRADE_COST;
        updateGlobalVariable(upg);
    });
}

export class UpgradeSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.upgrades = new Map();
        this.loadUpgrades();
        
        // Listen for upgrade events to keep in sync
        if (this.eventBus) {
            this.eventBus.on('upgradePurchased', (upgrade) => {
                this.syncWithGlobal();
            });
        }
    }

    loadUpgrades() {
        // Use references to the original upgrades to maintain sync
        upgrades.forEach(upg => {
            this.upgrades.set(upg.key, upg);
        });
    }
    
    syncWithGlobal() {
        // Update local map with global upgrades
        upgrades.forEach(upg => {
            this.upgrades.set(upg.key, upg);
        });
    }

    tryBuy(upgradeKey) {
        // Find the upgrade in the global array instead of local map
        const upgradeIndex = upgrades.findIndex(u => u.key === upgradeKey);
        
        if (upgradeIndex === -1) return false;
        
        const upgrade = upgrades[upgradeIndex];
        
        if (tryBuy(upgrade)) {
            // Update our local map after purchase
            this.syncWithGlobal();
            return true;
        }
        return false;
    }
    
    // Helper method to get all upgrades as an array
    getAllUpgrades() {
        return Array.from(this.upgrades.values());
    }
    
    // Get a specific upgrade by key
    getUpgrade(key) {
        return this.upgrades.get(key);
    }
}
