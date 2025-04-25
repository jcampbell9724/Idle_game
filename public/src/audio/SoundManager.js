import { safeExecute } from '../utils.js';

/**
 * Centralized sound management for the game.
 * Handles loading, playing, and volume control for all sounds.
 */
export class SoundManager {
    /**
     * @param {Object} p - The p5 instance
     * @param {Object} eventBus - The event bus for communication
     */
    constructor(p, eventBus) {
        this.p = p;
        this.eventBus = eventBus;
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.currentMusic = null;
        this.loadingErrors = [];
        
        this.settings = {
            musicVolume: 1.0,
            sfxVolume: 1.0,
            isMuted: false,
            previousMusicVolume: 1.0,
            previousSfxVolume: 1.0
        };
        
        // Listen for volume change events if eventBus exists
        if (this.eventBus) {
            this.eventBus.on('volumeChanged', this.handleVolumeChange.bind(this));
        }
    }
    
    /**
     * Loads a sound effect
     * @param {string} id - Sound identifier
     * @param {string} path - File path
     * @returns {Object|null} - The loaded sound or null
     */
    loadSound(id, path) {
        return safeExecute(
            () => {
                // Check if p5.sound is available
                if (!this.p.loadSound) {
                    console.warn(`⚠️ p5.sound not available, cannot load "${id}"`);
                    this.loadingErrors.push(`p5.sound not available for ${id}`);
                    
                    // Create a dummy sound object
                    const dummySound = this._createDummySound(id);
                    this.sounds.set(id, dummySound);
                    return dummySound;
                }
                
                // Load the sound using p5
                const sound = this.p.loadSound(
                    path,
                    () => console.log(`✅ Sound "${id}" loaded successfully`),
                    (err) => {
                        console.error(`❌ Failed to load sound "${id}":`, err);
                        this.loadingErrors.push(`Failed to load ${id}`);
                    }
                );
                
                this.sounds.set(id, sound);
                return sound;
            },
            (error) => {
                console.error(`❌ Error loading sound "${id}":`, error);
                this.loadingErrors.push(`Error loading ${id}`);
                
                // Return a dummy sound object on error
                const dummySound = this._createDummySound(id);
                this.sounds.set(id, dummySound);
                return dummySound;
            }
        );
    }
    
    /**
     * Loads a music track
     * @param {string} id - Track identifier
     * @param {string} path - File path
     * @returns {Object|null} - The loaded music track or null
     */
    loadMusic(id, path) {
        const music = this.loadSound(id, path);
        
        if (music && music !== this._createDummySound(id)) {
            this.musicTracks.set(id, music);
        }
        
        return music;
    }
    
    /**
     * Plays a sound effect with current volume settings
     * @param {string} id - Sound identifier
     */
    playSound(id) {
        if (this.settings.isMuted) return;
        
        const sound = this.sounds.get(id);
        if (sound && typeof sound.play === 'function') {
            // Set volume before playing
            if (typeof sound.setVolume === 'function') {
                sound.setVolume(this.settings.sfxVolume);
            }
            
            // Play the sound
            sound.play();
        }
    }
    
    /**
     * Starts playing a music track, stopping any current music
     * @param {string} id - Track identifier
     * @param {boolean} loop - Whether to loop the track
     */
    playMusic(id, loop = true) {
        // If this track is already playing, don't restart it
        if (this.currentMusic === id) {
            const music = this.musicTracks.get(id);
            if (music && typeof music.isPlaying === 'function' && music.isPlaying()) {
                // Just make sure volume is correct
                if (typeof music.setVolume === 'function') {
                    music.setVolume(this.settings.isMuted ? 0 : this.settings.musicVolume);
                }
                return; // Already playing, don't restart
            }
        }
        
        // Stop current music if any
        this.stopMusic();
        
        // Get the requested music track
        const music = this.musicTracks.get(id);
        if (!music || typeof music.play !== 'function') return;
        
        // Set volume based on mute state
        if (typeof music.setVolume === 'function') {
            music.setVolume(this.settings.isMuted ? 0 : this.settings.musicVolume);
        }
        
        // Start playing
        if (loop && typeof music.loop === 'function') {
            music.loop();
        } else if (typeof music.play === 'function') {
            music.play();
        }
        
        // Store as current music
        this.currentMusic = id;
    }
    
    /**
     * Stops the currently playing music
     */
    stopMusic() {
        if (!this.currentMusic) return;
        
        const music = this.musicTracks.get(this.currentMusic);
        if (music && typeof music.stop === 'function') {
            music.stop();
        }
        
        this.currentMusic = null;
    }
    
    /**
     * Sets the music volume
     * @param {number} volume - Volume between 0.0 and 1.0
     */
    setMusicVolume(volume) {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Apply to current music
        if (this.currentMusic && !this.settings.isMuted) {
            const music = this.musicTracks.get(this.currentMusic);
            if (music && typeof music.setVolume === 'function') {
                music.setVolume(this.settings.musicVolume);
            }
        }
        
        // Emit volume changed event
        this._emitVolumeChanged();
    }
    
    /**
     * Sets the sound effects volume
     * @param {number} volume - Volume between 0.0 and 1.0
     */
    setSfxVolume(volume) {
        this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        
        // Emit volume changed event
        this._emitVolumeChanged();
    }
    
    /**
     * Toggles mute state for all audio
     * @returns {boolean} - The new mute state
     */
    toggleMute() {
        if (this.settings.isMuted) {
            // Unmute - restore previous volumes
            this.settings.musicVolume = this.settings.previousMusicVolume;
            this.settings.sfxVolume = this.settings.previousSfxVolume;
            this.settings.isMuted = false;
        } else {
            // Mute - save current volumes
            this.settings.previousMusicVolume = this.settings.musicVolume;
            this.settings.previousSfxVolume = this.settings.sfxVolume;
            this.settings.musicVolume = 0;
            this.settings.sfxVolume = 0;
            this.settings.isMuted = true;
        }
        
        // Apply to current music
        if (this.currentMusic) {
            const music = this.musicTracks.get(this.currentMusic);
            if (music && typeof music.setVolume === 'function') {
                music.setVolume(this.settings.isMuted ? 0 : this.settings.musicVolume);
            }
        }
        
        // Emit volume changed event
        this._emitVolumeChanged();
        
        return this.settings.isMuted;
    }
    
    /**
     * Handle volume change events from external sources
     * @param {Object} data - Volume data
     */
    handleVolumeChange(data) {
        if (data.hasOwnProperty('music')) {
            this.settings.musicVolume = data.music;
        }
        
        if (data.hasOwnProperty('sfx')) {
            this.settings.sfxVolume = data.sfx;
        }
        
        if (data.hasOwnProperty('isMuted')) {
            this.settings.isMuted = data.isMuted;
        }
        
        // Apply changes to current music
        if (this.currentMusic) {
            const music = this.musicTracks.get(this.currentMusic);
            if (music && typeof music.setVolume === 'function') {
                music.setVolume(this.settings.isMuted ? 0 : this.settings.musicVolume);
            }
        }
    }
    
    /**
     * Initializes the audio context
     * @returns {Promise<boolean>} - Resolves when audio context is running
     */
    async initAudioContext() {
        if (!this.p || !this.p.getAudioContext) {
            return false;
        }
        
        try {
            const audioContext = this.p.getAudioContext();
            if (audioContext.state !== 'running') {
                await audioContext.resume();
                console.log('Audio context resumed successfully');
            }
            return true;
        } catch (error) {
            console.warn('Could not initialize audio context:', error);
            return false;
        }
    }
    
    /**
     * Creates a dummy sound object for fallbacks
     * @private
     * @param {string} id - Sound id for logging
     * @returns {Object} - Dummy sound object
     */
    _createDummySound(id) {
        return {
            isLoaded: () => false,
            play: () => console.warn(`Sound "${id}" not available`),
            setVolume: () => {},
            isPlaying: () => false,
            loop: () => {},
            stop: () => {}
        };
    }
    
    /**
     * Emits volume changed event
     * @private
     */
    _emitVolumeChanged() {
        if (this.eventBus) {
            this.eventBus.safeEmit('volumeChanged', {
                music: this.settings.musicVolume,
                sfx: this.settings.sfxVolume,
                isMuted: this.settings.isMuted
            });
        }
    }
}
