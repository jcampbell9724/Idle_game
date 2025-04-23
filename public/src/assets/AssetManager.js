import { gameSettings } from '../gameSettings.js';

export class AssetManager {
    constructor(p) {
        this.assets = new Map();
        this.p = p;
        this.loadingErrors = [];
    }

    // Preload method to be called from p5's preload
    preload() {
        console.log("🌀 AssetManager preload starting...");
        
        try {
            // Load player image with error handling
            this.loadImage('player', 'assets/player.png');
            
            // Load background with error handling
            this.loadImage('background', 'assets/background.png');
            
            // Load sounds with error handling
            this.loadSound('coinSound', 'assets/coin.wav');
            this.loadSound('mainTheme', 'assets/main.wav');
        } catch (error) {
            console.error("❌ Error in AssetManager preload:", error);
            this.loadingErrors.push(error);
        }
        
        console.log("🌀 AssetManager preload finished.");
    }
    
    // Helper method to load images with error handling
    loadImage(name, path) {
        try {
            const img = this.p.loadImage(
                path,
                () => console.log(`✅ Image "${name}" loaded successfully`),
                (err) => {
                    console.error(`❌ Failed to load image "${name}":`, err);
                    this.loadingErrors.push(`Failed to load ${name}`);
                }
            );
            this.assets.set(name, img);
        } catch (error) {
            console.error(`❌ Error loading image "${name}":`, error);
            this.loadingErrors.push(`Error loading ${name}`);
            // Set a placeholder to prevent null references
            this.assets.set(name, null);
        }
    }

    // Helper method to load sounds with error handling
    loadSound(name, path) {
        try {
            // Check if p5.sound is available
            if (!this.p.loadSound) {
                console.warn(`⚠️ p5.sound not available, cannot load "${name}"`);
                this.loadingErrors.push(`p5.sound not available for ${name}`);
                // Set a placeholder to prevent null references
                this.assets.set(name, {
                    isLoaded: () => false,
                    play: () => console.warn("Sound not available"),
                    setVolume: () => {},
                    isPlaying: () => false,
                    loop: () => {}
                });
                return;
            }
            
            const sound = this.p.loadSound(
                path,
                () => {
                    console.log(`✅ Sound "${name}" loaded from ${path}`);

                    // Cache coin SFX immediately if it's the coin sound
                    if (name === 'coinSound') {
                        gameSettings.coinSfx = sound;
                    }

                    // Store main theme but don't try to auto-start it
                    if (name === 'mainTheme') {
                        gameSettings.musicTrack = sound;
                    }
                },
                (err) => {
                    console.error(`❌ Failed to load sound "${name}":`, err);
                    this.loadingErrors.push(`Failed to load ${name}`);
                }
            );

            this.assets.set(name, sound);
        } catch (error) {
            console.error(`❌ Error loading sound "${name}":`, error);
            this.loadingErrors.push(`Error loading ${name}`);
            // Set a placeholder sound object to prevent null references
            this.assets.set(name, {
                isLoaded: () => false,
                play: () => console.warn("Sound not available"),
                setVolume: () => {},
                isPlaying: () => false,
                loop: () => {}
            });
        }
    }

    // Get an asset with fallback for missing assets
    getAsset(name) {
        const asset = this.assets.get(name);
        if (!asset) {
            console.warn(`⚠️ Asset "${name}" not found in AssetManager`);
            
            // For sounds, return a dummy object that won't cause errors
            if (name === 'coinSound' || name === 'mainTheme') {
                return {
                    isLoaded: () => false,
                    play: () => console.warn(`Sound "${name}" not available`),
                    setVolume: () => {},
                    isPlaying: () => false,
                    loop: () => {}
                };
            }
        }
        return asset;
    }
    
    // Check if there were any loading errors
    hasLoadingErrors() {
        return this.loadingErrors.length > 0;
    }
    
    // Get list of loading errors
    getLoadingErrors() {
        return this.loadingErrors;
    }
}