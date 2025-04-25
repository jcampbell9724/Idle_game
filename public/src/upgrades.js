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

// Move the upgrade definitions to a separate array
const upgradeDefinitions = [
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

/**
 * Central upgrade management system that handles all upgrade operations
 */
export class UpgradeSystem {
    /**
     * @param {EventBus} eventBus - Event bus for sending notifications
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.upgrades = new Map();
        this._initializeFromDefinitions(upgradeDefinitions);
        
        // Listen for upgrade events to keep in sync
        if (this.eventBus) {
            this.eventBus.on('upgradePurchased', (upgrade) => {
                this._syncUpgradeWithGameSettings(upgrade.key);
            });
        }
    }
    
    /**
     * Initialize upgrades from definitions
     * @private
     */
    _initializeFromDefinitions(definitions) {
        definitions.forEach(def => {
            // Create a deep copy of the definition to avoid reference issues
            const upgrade = JSON.parse(JSON.stringify(def));
            
            // Add any non-serializable properties (like functions)
            upgrade.getValue = def.getValue;
            upgrade.formatValue = def.formatValue;
            upgrade.applyUpdate = def.applyUpdate;
            upgrade.costGrowth = def.costGrowth;
            
            this.upgrades.set(upgrade.key, upgrade);
        });
    }
    
    /**
     * Sync an upgrade with game settings
     * @private
     */
    _syncUpgradeWithGameSettings(upgradeKey) {
        const upgrade = this.upgrades.get(upgradeKey);
        if (!upgrade) return;
        
        if (typeof upgrade.applyUpdate === 'function') {
            upgrade.applyUpdate(upgrade);
        } else if (upgrade.targetVariable) {
            gameSettings[upgrade.targetVariable] = upgrade.getValue(upgrade.level);
        }
    }
    
    /**
     * Get all upgrades as an array
     * @returns {Array} Array of upgrade objects
     */
    getAllUpgrades() {
        return Array.from(this.upgrades.values());
    }
    
    /**
     * Get a specific upgrade by key
     * @param {string} key - Upgrade key
     * @returns {Object|undefined} The upgrade object or undefined
     */
    getUpgrade(key) {
        return this.upgrades.get(key);
    }
    
    /**
     * Attempt to purchase an upgrade
     * @param {string} upgradeKey - Key of the upgrade to purchase
     * @returns {boolean} Whether the purchase was successful
     */
    tryBuy(upgradeKey) {
        const upgrade = this.upgrades.get(upgradeKey);
        if (!upgrade) return false;
        
        if (gameSettings.coins < upgrade.cost) return false;
        
        // Deduct cost and update level
        gameSettings.updateCoins(-upgrade.cost, true); // Silent update, we'll emit later
        upgrade.level += 1;
        upgrade.cost = upgrade.costGrowth(upgrade.cost);
        
        // Apply the upgrade effect
        this._syncUpgradeWithGameSettings(upgradeKey);
        
        // Emit events
        if (this.eventBus) {
            this.eventBus.safeEmit('upgradePurchased', { ...upgrade });
            this.eventBus.safeEmit('coinsChanged', gameSettings.coins);
        }
        
        return true;
    }
    
    /**
     * Reset all upgrades to their initial values
     */
    resetAllUpgrades() {
        this._initializeFromDefinitions(upgradeDefinitions);
        
        // Apply all upgrades to game settings
        this.upgrades.forEach((upgrade, key) => {
            upgrade.level = 0;
            upgrade.cost = INITIAL_UPGRADE_COST;
            this._syncUpgradeWithGameSettings(key);
        });
        
        // Reset game settings
        gameSettings.coins = 0;
        gameSettings.score = 0;
        
        // Notify about the reset
        if (this.eventBus) {
            this.eventBus.emit('upgradesReset');
            this.eventBus.emit('coinsChanged', gameSettings.coins);
        }
    }
}

// Create a singleton instance
export const upgradeSystem = new UpgradeSystem();

// Export an array of upgrades for backward compatibility
export const upgrades = upgradeSystem.getAllUpgrades();

// Export these functions for backward compatibility but mark as deprecated
/**
 * @deprecated Use upgradeSystem.tryBuy() instead
 */
export function tryBuy(upg) {
    console.warn('tryBuy() is deprecated. Use upgradeSystem.tryBuy() instead');
    return upgradeSystem.tryBuy(upg.key);
}

/**
 * @deprecated Use upgradeSystem._syncUpgradeWithGameSettings() instead
 */
export function updateGlobalVariable(upg) {
    console.warn('updateGlobalVariable() is deprecated. Use upgradeSystem directly instead.');
    if (typeof upg.applyUpdate === 'function') {
        upg.applyUpdate(upg);
    } else if (upg.targetVariable) {
        gameSettings[upg.targetVariable] = upg.getValue(upg.level);
    } else {
        console.warn('Upgrade key not handled:', upg.key);
    }
}

/**
 * @deprecated Use upgradeSystem.resetAllUpgrades() instead
 */
export function initUpgrades() {
    console.warn('initUpgrades() is deprecated. Use upgradeSystem.resetAllUpgrades() instead');
    upgradeSystem.resetAllUpgrades();
}

// Make upgraded system and deprecated functions available globally for transition
window.upgradeSystem = upgradeSystem;
window.upgrades = upgrades;
window.initUpgrades = initUpgrades;
