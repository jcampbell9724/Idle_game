import { gameSettings } from '../gameSettings.js';
import { safeExecute } from '../utils.js';

export class AssetManager {
    constructor(p) {
        this.assets = new Map();
        this.p = p;
        this.loadingErrors = [];
    }

    // Preload method to be called from p5's preload
    preload() {
        console.log("🌀 AssetManager preload starting...");
        
        safeExecute(
            () => {
                // Load player images with error handling
                this.loadImage('player', 'assets/player.png');
                this.loadImage('player_left', 'assets/player_left.png');
                this.loadImage('player_right', 'assets/player_right.png');
                
                // Load background with error handling
                this.loadImage('background', 'assets/background.png');
                
                // Load sounds with error handling
                this.loadSound('coinSound', 'assets/coin.wav');
                this.loadSound('mainTheme', 'assets/main.wav');
            },
            (error) => {
                console.error("❌ Error in AssetManager preload:", error);
                this.loadingErrors.push(error);
            }
        );
        
        console.log("🌀 AssetManager preload finished.");
    }
    
    // Helper method to load images with error handling
    loadImage(name, path) {
        safeExecute(
            () => {
                const img = this.p.loadImage(
                    path,
                    () => console.log(`✅ Image "${name}" loaded successfully`),
                    (err) => {
                        console.error(`❌ Failed to load image "${name}":`, err);
                        this.loadingErrors.push(`Failed to load ${name}`);
                    }
                );
                this.assets.set(name, img);
                return img;
            },
            (error) => {
                console.error(`❌ Error loading image "${name}":`, error);
                this.loadingErrors.push(`Error loading ${name}`);
                // Set a placeholder to prevent null references
                this.assets.set(name, null);
                return null;
            }
        );
    }

    // Helper method to load sounds with error handling
    loadSound(name, path) {
        safeExecute(
            () => {
                // Check if p5.sound is available
                if (!this.p.loadSound) {
                    console.warn(`⚠️ p5.sound not available, cannot load "${name}"`);
                    this.loadingErrors.push(`p5.sound not available for ${name}`);
                    // Set a placeholder to prevent null references
                    const dummySound = {
                        isLoaded: () => false,
                        play: () => console.warn("Sound not available"),
                        setVolume: () => {},
                        isPlaying: () => false,
                        loop: () => {}
                    };
                    this.assets.set(name, dummySound);
                    return dummySound;
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
                return sound;
            },
            (error) => {
                console.error(`❌ Error loading sound "${name}":`, error);
                this.loadingErrors.push(`Error loading ${name}`);
                // Set a placeholder sound object to prevent null references
                const dummySound = {
                    isLoaded: () => false,
                    play: () => console.warn("Sound not available"),
                    setVolume: () => {},
                    isPlaying: () => false,
                    loop: () => {}
                };
                this.assets.set(name, dummySound);
                return dummySound;
            }
        );
    }

    // Get an asset with fallback for missing assets
    getAsset(name) {
        return safeExecute(
            () => {
                const asset = this.assets.get(name);
                if (!asset) {
                    console.warn(`⚠️ Asset "${name}" not found in AssetManager`);
                    throw new Error(`Asset "${name}" not found`);
                }
                return asset;
            },
            () => {
                // Fallback based on asset type
                if (name === 'coinSound' || name === 'mainTheme') {
                    return {
                        isLoaded: () => false,
                        play: () => console.warn(`Sound "${name}" not available`),
                        setVolume: () => {},
                        isPlaying: () => false,
                        loop: () => {}
                    };
                }
                return null; // Default fallback for other assets
            }
        );
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