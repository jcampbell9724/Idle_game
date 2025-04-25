import {
    blockBaseValue,
    baseShootIntervalSeconds,
    baseBlockDespawnTime,
    basePlayerSpeed,
    baseMaxBlocks
} from './config.js';

/**
 * Central mutable settings for gameplay.
 * currentCannonInterval is in seconds (we'll multiply by p.frameRate() when shooting).
 */
export const gameSettings = {
    currentBlockValue: blockBaseValue,
    currentCannonInterval: baseShootIntervalSeconds,   // seconds between shots
    currentBlockDespawnTime: baseBlockDespawnTime,     // seconds until blocks despawn
    currentPlayerSpeed: basePlayerSpeed,
    currentMaxBlocks: baseMaxBlocks,
    coins: 0,
    score: 0,
    musicVolume: 1.0,    // for background music  
    sfxVolume: 1.0,      // for coin & other effects
    isMuted: false,      // master mute toggle
    previousMusicVolume: 1.0, // store music volume for un-muting
    previousSfxVolume: 1.0,   // store sfx volume for un-muting
    soundEnabled: true,  // whether sound is available at all

    eventBus: null,

    /**
     * Updates the coin amount and emits an event if needed
     * @param {number} amount - Amount to add (or subtract if negative)
     * @param {boolean} silent - Whether to skip event emission
     * @returns {number} - The new coin amount
     */
    updateCoins(amount, silent = false) {
        this.coins += amount;
        
        if (!silent && this.eventBus) {
            this.eventBus.safeEmit('coinsChanged', this.coins);
        }
        
        return this.coins;
    },

    // Toggle mute state for all sounds
    toggleMute() {
        if (this.isMuted) {
            // Unmute - restore previous volumes
            this.musicVolume = this.previousMusicVolume;
            this.sfxVolume = this.previousSfxVolume;
            this.isMuted = false;
        } else {
            // Mute - save current volumes first
            this.previousMusicVolume = this.musicVolume;
            this.previousSfxVolume = this.sfxVolume;
            this.musicVolume = 0;
            this.sfxVolume = 0;
            this.isMuted = true;
        }

        // Apply changes to current tracks
        if (this.musicTrack && typeof this.musicTrack.setVolume === 'function') {
            this.musicTrack.setVolume(this.musicVolume);
        }
        
        if (this.coinSfx && typeof this.coinSfx.setVolume === 'function') {
            this.coinSfx.setVolume(this.sfxVolume);
        }

        // Emit volume changed event using safeEmit
        this.eventBus?.safeEmit('volumeChanged', {
            music: this.musicVolume,
            sfx: this.sfxVolume,
            isMuted: this.isMuted
        });

        return this.isMuted; // Return current mute state
    },

    // Add methods for serialization
    toJSON() {
        return {
            currentBlockValue: this.currentBlockValue,
            currentCannonInterval: this.currentCannonInterval,
            currentBlockDespawnTime: this.currentBlockDespawnTime,
            currentPlayerSpeed: this.currentPlayerSpeed,
            currentMaxBlocks: this.currentMaxBlocks,
            coins: this.coins,
            score: this.score || 0,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted,
            previousMusicVolume: this.previousMusicVolume,
            previousSfxVolume: this.previousSfxVolume
        };
    },

    fromJSON(data) {
        if (!data) return;
        
        try {
            // Validate required properties
            const requiredProperties = [
                'currentBlockValue',
                'currentCannonInterval',
                'currentBlockDespawnTime',
                'currentPlayerSpeed',
                'currentMaxBlocks'
            ];
            
            // Check if all required properties exist
            const missingProps = requiredProperties.filter(prop => typeof data[prop] === 'undefined');
            if (missingProps.length > 0) {
                console.warn(`Missing required properties in saved data: ${missingProps.join(', ')}`);
            }
            
            // Apply data, with defaults for missing properties
            this.currentBlockValue = data.currentBlockValue || blockBaseValue;
            this.currentCannonInterval = data.currentCannonInterval || baseShootIntervalSeconds;
            this.currentBlockDespawnTime = data.currentBlockDespawnTime || baseBlockDespawnTime;
            this.currentPlayerSpeed = data.currentPlayerSpeed || basePlayerSpeed;
            this.currentMaxBlocks = data.currentMaxBlocks || baseMaxBlocks;
            this.coins = typeof data.coins === 'number' ? data.coins : 0;
            this.score = typeof data.score === 'number' ? data.score : 0;
            
            // Load volume settings if they exist
            this.musicVolume = typeof data.musicVolume === 'number' ? data.musicVolume : 1.0;
            this.sfxVolume = typeof data.sfxVolume === 'number' ? data.sfxVolume : 1.0;
            this.isMuted = data.isMuted || false;
            this.previousMusicVolume = data.previousMusicVolume || 1.0;
            this.previousSfxVolume = data.previousSfxVolume || 1.0;
            
            // Apply derived properties
            this.currentCannonIntervalFrames = Math.round(this.currentCannonInterval * 60);
        } catch (e) {
            console.error('Error applying saved game data:', e);
        }
    }
};

/**
 * Reset all upgradeable settings back to their base values.
 */
export function initUpgrades() {
    gameSettings.currentBlockValue = blockBaseValue;
    gameSettings.currentCannonInterval = baseShootIntervalSeconds;
    gameSettings.currentBlockDespawnTime = baseBlockDespawnTime;
    gameSettings.currentPlayerSpeed = basePlayerSpeed;
    gameSettings.currentMaxBlocks = baseMaxBlocks;
    gameSettings.coins = 0;
    gameSettings.score = 0;
    // Keep sound settings as they are
}