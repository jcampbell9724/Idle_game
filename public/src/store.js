// src/store.js

/**
 * Store system for one-time purchases.
 * Each item can only be bought once.
 */
export const storeItems = [
    {
        key: 'unlockUpgrades',
        name: 'Unlock Upgrades',
        cost: 100,
        description: 'Unlocks the Upgrade Shop.',
        purchased: false
    },
    {
        key: 'goldenCannon',
        name: 'Golden Cannon',
        cost: 250,
        description: 'Unlocks a special golden cannon skin.',
        purchased: false
    },
    {
        key: 'unlockJump',
        name: 'Unlock Jump',
        cost: 200,
        description: 'Unlocks the ability to jump! Press SPACE to jump.',
        purchased: false
    },
    // Add more items as needed
];

export class StoreSystem {
    constructor(eventBus = null) {
        console.log('StoreSystem initialized');
        this.eventBus = eventBus;
        this.items = storeItems.map(item => ({ ...item }));
        console.log(`StoreSystem loaded ${this.items.length} items`);
    }

    setEventBus(eventBus) {
        console.log('Setting EventBus in StoreSystem');
        this.eventBus = eventBus;
    }

    getItems() {
        return this.items;
    }

    isPurchased(key) {
        const item = this.items.find(i => i.key === key);
        return item ? item.purchased : false;
    }

    tryBuy(key, coins) {
        console.log(`Attempting to buy item: ${key} with ${coins} coins`);
        const item = this.items.find(i => i.key === key);
        
        if (!item) {
            console.log(`Item with key ${key} not found`);
            return false;
        }
        
        if (item.purchased) {
            console.log(`Item ${key} already purchased`);
            return false;
        }
        
        if (coins < item.cost) {
            console.log(`Not enough coins to buy ${key}. Have: ${coins}, Need: ${item.cost}`);
            return false;
        }
        
        // All checks passed, buy the item
        item.purchased = true;
        console.log(`Successfully purchased ${key}`);
        
        if (this.eventBus) {
            console.log(`Emitting storeItemPurchased event for ${key}`);
            this.eventBus.safeEmit('storeItemPurchased', { ...item });
        } else {
            console.warn('No eventBus available to emit purchase event');
        }
        
        return true;
    }

    resetStore() {
        console.log('Resetting store');
        this.items.forEach(item => item.purchased = false);
        if (this.eventBus) {
            this.eventBus.safeEmit('storeReset');
        } else {
            console.warn('No eventBus available to emit reset event');
        }
    }
    
    loadSavedState(savedItems) {
        if (!savedItems || !Array.isArray(savedItems)) {
            console.log('No valid saved store items to load');
            return;
        }
        
        console.log(`Loading ${savedItems.length} saved store items`);
        savedItems.forEach(savedItem => {
            const item = this.items.find(i => i.key === savedItem.key);
            if (item) {
                item.purchased = savedItem.purchased || false;
                console.log(`Loaded item ${item.key}, purchased: ${item.purchased}`);
            }
        });
    }
}

// Singleton instance
export const storeSystem = new StoreSystem();

// Make it globally accessible for debugging
window.storeSystem = storeSystem;
console.log('Store system initialized and attached to window');

