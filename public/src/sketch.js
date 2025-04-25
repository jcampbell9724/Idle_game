// src/sketch.js
import { PLAYER_WIDTH, PLAYER_HEIGHT, CANNON_X_OFFSET, GROUND_OFFSET } from './config.js';
import { upgradeSystem } from './upgrades.js';
import { Block } from './classes/Block.js';
import { Player } from './classes/Player.js';
import { Cannon } from './classes/Cannon.js';
import { drawUpgradeScreen } from './ui/UpgradeScreen.js';
import { drawStoreScreen } from './ui/StoreScreen.js';
import { storeSystem } from './store.js';
import { constrain } from './utils.js';
import { gameSettings } from './gameSettings.js';
import { GameState } from './classes/GameState.js';
import { EventBus } from './events/EventBus.js';
import { SaveManager } from './save/SaveManager.js';
import { AssetManager } from './assets/AssetManager.js';
import { SoundManager } from './audio/SoundManager.js';

// expose for your cheat button
window.gameSettings = gameSettings;

const sketch = (p) => {
    let player, cannon, blocks = [];
    let gameStateManager;
    let eventBus;
    let saveManager;
    let assetManager; // Define here, instantiate in preload
    let soundManager; // Define sound manager
    let coinsEl;
    let muteIndicator; // Element to show mute status
    // Using window-level property instead of local variable for resize debounce

    // p.preload runs before setup() - ensures assets are loaded
    p.preload = () => {
        console.log('🌀 p5 instance preload() running');
        
        // Create asset manager and sound manager
        assetManager = new AssetManager(p);
        assetManager.preload();
        
        // Create sound manager (we'll connect it to eventBus in setup)
        soundManager = new SoundManager(p, null);
        
        console.log('🌀 p5 instance preload() finished.');
    };

    p.setup = () => { // Remove async
        p.pixelDensity(window.devicePixelRatio || 1);  // avoid retina/high‑DPI blur
        p.noSmooth();       // disable image interpolation

        console.log('🌱 p5 instance setup() running'); // sanity check
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
        cnv.position(0, 0);
        cnv.style('display', 'block');

        p.drawingContext.imageSmoothingEnabled = false;

        // prevent default arrow‐key behavior (caret movement, scrolling, etc)
        window.addEventListener('keydown', e => {
            if (e.key.startsWith('Arrow')) e.preventDefault();
            // Add M key for mute toggle
            if (e.key.toLowerCase() === 'm') {
                toggleMute();
                e.preventDefault();
            }
        });

        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(18);

        // Initialize managers first
        eventBus = new EventBus();
        saveManager = new SaveManager();
        
        // Connect managers to eventBus
        gameSettings.eventBus = eventBus;
        soundManager.eventBus = eventBus;
        upgradeSystem.eventBus = eventBus;
        storeSystem.setEventBus(eventBus); // Set EventBus on store system
        gameSettings.soundManager = soundManager;
        gameSettings.assetManager = assetManager;
        gameSettings.soundEnabled = true;
        
        console.log('All managers connected to EventBus');
        
        window.gravity = p.createVector(0, 0.2 * (p.height / 600));
        upgradeSystem.resetAllUpgrades();
        
        // Load sounds using SoundManager
        soundManager.loadSound('coinSound', 'assets/coin.wav');
        soundManager.loadSound('cannonSound', 'assets/cannon.wav');
        soundManager.loadMusic('mainTheme', 'assets/main.wav');
        
        // Set up UI elements
        setupUI();
        
        // Get all player sprites with fallback
        let playerSprite = null;
        let playerLeftSprite = null;
        let playerRightSprite = null;
        
        if (assetManager) {
            // Make sure we load all player sprites
            playerSprite = assetManager.getAsset('player');
            playerLeftSprite = assetManager.getAsset('player_left');
            playerRightSprite = assetManager.getAsset('player_right');
            
            // Log sprite status to debug
            console.log('Player sprites loaded:', {
                default: playerSprite ? 'OK' : 'MISSING',
                left: playerLeftSprite ? 'OK' : 'MISSING',
                right: playerRightSprite ? 'OK' : 'MISSING'
            });
        }
        
        // Sanity check the loaded sprite
        if (!playerSprite || !playerSprite.width) {
            console.warn("⚠️ Player sprite not available, using fallback color");
            // We'll handle the missing sprite in the Player class
        } else {
            console.log("✅ Player sprite loaded successfully");
        }
        
        // Load saved game if exists
        const savedGame = saveManager.load();
        if (savedGame) {
            saveManager.applySave(gameSettings, savedGame);
            eventBus.emit('coinsChanged', gameSettings.coins);
            
            // Update mute UI after loading saved settings
            updateMuteUI();
        }
        
        // Initialize game objects after loading save data
        player = new Player(
            p.width / 2, 
            p.height - PLAYER_HEIGHT / 2 - 10,
            PLAYER_WIDTH,
            PLAYER_HEIGHT,
            playerSprite,
            p,
            eventBus,
            playerLeftSprite,  // Pass left sprite explicitly
            playerRightSprite  // Pass right sprite explicitly
        );
        
        cannon = new Cannon(p.width - CANNON_X_OFFSET, p.height / 2, p, eventBus);
        
        // Instantiate GameStateManager after UI and Player Sprites are ready
        // GameState now handles internal state creation
        gameStateManager = new GameState(
            p,
            eventBus,
            saveManager,
            assetManager,
            playerSprite,      // Pass default sprite
            playerLeftSprite,  // Pass left sprite
            playerRightSprite // Pass right sprite
        );

        // Make gameStateManager globally accessible for state transitions
        window.gameStateManager = gameStateManager;
        
        // Try to start music (might not work until user interaction)
        startMusic();
    };
    
    // Function to toggle mute state
    const toggleMute = () => {
        // Use soundManager to handle mute logic
        const isMuted = soundManager.toggleMute();
        
        // Update UI
        updateMuteUI();
        
        // Save settings
        if (saveManager) {
            saveManager.save(gameSettings);
        }
        
        console.log(`Game ${isMuted ? 'muted' : 'unmuted'}`);
    };
    
    // Update the mute indicator UI
    const updateMuteUI = () => {
        if (muteIndicator) {
            muteIndicator.style.display = 'block';
            
            if (soundManager.settings.isMuted) {
                muteIndicator.textContent = '🔇';
                muteIndicator.title = 'Sound is muted (Press M to unmute)';
                
                // Update sliders to show 0
                if (window.musicSlider) window.musicSlider.value = 0;
                if (window.sfxSlider) window.sfxSlider.value = 0;
            } else {
                muteIndicator.textContent = '🔊';
                muteIndicator.title = 'Sound is on (Press M to mute)';
                
                // Update sliders to show current volumes
                if (window.musicSlider) window.musicSlider.value = soundManager.settings.musicVolume;
                if (window.sfxSlider) window.sfxSlider.value = soundManager.settings.sfxVolume;
            }
        }
    };
    
    const setupUI = () => {
        // Add CSS for sliders and UI elements
        const uiCSS = document.createElement('style');
        uiCSS.textContent = `
            input[type=range] {
                -webkit-appearance: none;
                appearance: none;
                height: 15px;
                background: #333;
                border-radius: 5px;
                outline: none;
            }
            
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: #0f0;
                border-radius: 50%;
                cursor: pointer;
                transition: background 0.15s ease;
            }
            
            input[type=range]::-webkit-slider-thumb:hover {
                background: #0c0;
            }
            
            input[type=range]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #0f0;
                border-radius: 50%;
                cursor: pointer;
                transition: background 0.15s ease;
                border: none;
            }
            
            input[type=range]::-moz-range-thumb:hover {
                background: #0c0;
            }
            
            .game-button {
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 15px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 8px;
                font-family: 'Pixelify Sans', sans-serif;
                transition: all 0.2s ease;
                outline: none;
            }
            
            .game-button:hover {
                background-color: #45a049;
                transform: scale(1.05);
            }
            
            .game-button:active {
                background-color: #3e8e41;
                transform: scale(0.98);
            }
            
            .mute-indicator {
                position: fixed;
                bottom: 10px;
                right: 10px;
                font-size: 24px;
                cursor: pointer;
                z-index: 1000;
                background-color: rgba(0, 0, 0, 0.5);
                padding: 5px 10px;
                border-radius: 5px;
                color: white;
                transition: all 0.2s ease;
            }
            
            .mute-indicator:hover {
                transform: scale(1.1);
                background-color: rgba(0, 0, 0, 0.7);
            }
            
            .key-hint {
                position: fixed;
                bottom: 10px;
                left: 10px;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                background-color: rgba(0, 0, 0, 0.5);
                padding: 5px 10px;
                border-radius: 5px;
                font-family: 'Pixelify Sans', sans-serif;
                z-index: 1000;
            }
        `;
        document.head.appendChild(uiCSS);
        
        // Coins display only (score display removed - unused)

        coinsEl = document.getElementById('coins-display');
        if (coinsEl) {
            coinsEl.textContent = `Coins: ${gameSettings.coins || 0}`;
            // Style coins display
            coinsEl.style.fontSize = '18px';
            coinsEl.style.fontWeight = 'bold';
        }

        // Add mute indicator
        muteIndicator = document.createElement('div');
        muteIndicator.className = 'mute-indicator';
        muteIndicator.textContent = soundManager.settings.isMuted ? '🔇' : '🔊';
        muteIndicator.title = soundManager.settings.isMuted ? 
            'Sound is muted (Press M to unmute)' : 
            'Sound is on (Press M to mute)';
        muteIndicator.addEventListener('click', toggleMute);
        document.body.appendChild(muteIndicator);
        
        // Add key hints
        const keyHint = document.createElement('div');
        keyHint.className = 'key-hint';
        keyHint.innerHTML = 'Keys: [U] Upgrades | [T] Store | [S] Settings | [M] Mute | [←→] Move | [ESC] Back';
        keyHint.style.padding = '8px 12px';
        keyHint.style.fontSize = '16px';
        document.body.appendChild(keyHint);

        // Update cheat button
        const cheatBtn = document.getElementById('cheat-btn');
        if (cheatBtn) {
            cheatBtn.className = 'game-button';
            cheatBtn.addEventListener('click', () => {
                // Try to start music on button click
                startMusic();
                
                // Add coins using the updateCoins method
                gameSettings.updateCoins(1000);
            });
        }

        // Update settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.className = 'game-button';
            settingsBtn.addEventListener('click', () => {
                // Try to start music on button click
                startMusic();
                
                if (gameStateManager) {
                    gameStateManager.changeState('settings');
                }
            });
        }
        
        // Add store button
        const storeBtn = document.createElement('button');
        storeBtn.id = 'store-btn';
        storeBtn.className = 'game-button';
        storeBtn.textContent = 'Store';
        storeBtn.style.position = 'fixed';
        storeBtn.style.top = '10px';
        storeBtn.style.right = '140px';
        storeBtn.addEventListener('click', () => {
            // Try to start music on button click
            startMusic();
            
            if (gameStateManager) {
                console.log('Store button clicked');
                gameStateManager.changeState('store');
            }
        });
        document.body.appendChild(storeBtn);

        // Music slider
        const musicLabel = document.createElement('label');
        musicLabel.id = 'music-label';
        musicLabel.textContent = 'Music Volume:';
        musicLabel.style.display = 'none';
        musicLabel.style.color = 'white';
        musicLabel.style.padding = '5px';
        musicLabel.style.backgroundColor = 'transparent'; // Removed dark background
        musicLabel.style.fontFamily = "'Pixelify Sans', sans-serif";

        const musicSlider = document.createElement('input');
        musicSlider.type = 'range';
        musicSlider.id = 'music-slider';
        musicSlider.min = '0';
        musicSlider.max = '1';
        musicSlider.step = '0.01';
        musicSlider.value = soundManager.settings.isMuted ? 0 : soundManager.settings.musicVolume;
        musicSlider.style.display = 'block';
        musicSlider.style.margin = '5px 0';
        musicSlider.style.width = '200px';

        musicSlider.addEventListener('input', (e) => {
            const newVolume = parseFloat(e.target.value);
            
            // If volume is being changed from 0, unmute
            if (soundManager.settings.isMuted && newVolume > 0) {
                soundManager.settings.isMuted = false;
                updateMuteUI();
            }
            
            // Set music volume
            soundManager.setMusicVolume(newVolume);
        });

        musicLabel.appendChild(musicSlider);
        document.body.appendChild(musicLabel);

        // SFX slider
        const sfxLabel = document.createElement('label');
        sfxLabel.id = 'sfx-label';
        sfxLabel.textContent = 'SFX Volume:';
        sfxLabel.style.display = 'none';
        sfxLabel.style.color = 'white';
        sfxLabel.style.padding = '5px';
        sfxLabel.style.backgroundColor = 'transparent'; // Removed dark background
        sfxLabel.style.fontFamily = "'Pixelify Sans', sans-serif";

        const sfxSlider = document.createElement('input');
        sfxSlider.type = 'range';
        sfxSlider.id = 'sfx-slider';
        sfxSlider.min = '0';
        sfxSlider.max = '1';
        sfxSlider.step = '0.01';
        sfxSlider.value = soundManager.settings.isMuted ? 0 : soundManager.settings.sfxVolume;
        sfxSlider.style.display = 'block';
        sfxSlider.style.margin = '5px 0';
        sfxSlider.style.width = '200px';

        sfxSlider.addEventListener('input', (e) => {
            const newVolume = parseFloat(e.target.value);
            
            // If volume is being changed from 0, unmute
            if (soundManager.settings.isMuted && newVolume > 0) {
                soundManager.settings.isMuted = false;
                updateMuteUI();
            }
            
            // Set SFX volume
            soundManager.setSfxVolume(newVolume);
        });

        sfxLabel.appendChild(sfxSlider);
        document.body.appendChild(sfxLabel);

        // ——— Store references for later ———
        window.musicLabel = musicLabel;
        window.musicSlider = musicSlider;
        window.sfxLabel = sfxLabel;
        window.sfxSlider = sfxSlider;

        // Set up coins change listener
        if (eventBus) {
            eventBus.on('coinsChanged', (newCoins) => {
                if (coinsEl) coinsEl.textContent = `Coins: ${newCoins}`;
                saveManager.save(gameSettings);    // ← add this
            });
            
            // Set up volume change listener
            eventBus.on('volumeChanged', (data) => {
                updateMuteUI();
                saveManager.save(gameSettings);
            });
        }
    };

    p.draw = () => {
        // Always clear the background with each frame
        p.background('#1a1a2e'); // Dark blue background
        
        if (gameStateManager) {
            gameStateManager.update();
            gameStateManager.render();
        }
    };

    const startMusic = async () => {
        // Initialize audio context and play music using SoundManager
        if (await soundManager.initAudioContext()) {
            soundManager.playMusic('mainTheme', true);
        }
    };

    p.keyPressed = () => {
        if (!gameStateManager) return;

        // Handle mute toggle (moved to window event listener to ensure it works in all contexts)
        
        // Ensure audio context is running after user interaction
        startMusic();

        const currentState = gameStateManager.currentState; // Get current state
        console.log(`Key pressed: '${p.key}' (code: ${p.keyCode}) in state: ${currentState}`);

        if (p.keyCode === p.ESCAPE) { // Handle Escape first
            if (currentState === 'upgrade' || currentState === 'settings' || currentState === 'store') {
                console.log('ESC pressed, returning to playing state');
                // Let the exit() method of the state handle cleanup
                gameStateManager.changeState('playing'); 
                return; // Don't process other keys
            }
            // No 'else' needed - Escape does nothing in 'playing' or 'menu' here
        } else if (p.key.toLowerCase() === 'u') {
            // Toggle between playing and upgrade
            const newState = currentState === 'playing' ? 'upgrade' : 'playing';
            console.log(`U key pressed, changing state to: ${newState}`);
            gameStateManager.changeState(newState);
            return; // Don't process other keys
        } else if (p.key === ' ' && currentState === 'menu') {
            // Start game from menu
            console.log('Space pressed in menu, starting game');
            gameStateManager.changeState('playing');
            return; // Don't process other keys
        } else if (p.key.toLowerCase() === 's') {
            // Toggle between playing/menu and settings
            if (currentState === 'playing' || currentState === 'menu') {
                console.log('S key pressed, going to settings');
                gameStateManager.changeState('settings');
                return; // Don't process other keys
            } else if (currentState === 'settings') {
                console.log('S key pressed in settings, returning to playing');
                gameStateManager.changeState('playing');
                return; // Don't process other keys
            }
        } else if (p.key.toLowerCase() === 't') {
            // Toggle between playing/menu and store
            if (currentState === 'playing' || currentState === 'menu') {
                console.log('T key pressed, going to store');
                gameStateManager.changeState('store');
                return;
            } else if (currentState === 'store') {
                console.log('T key pressed in store, returning to playing');
                gameStateManager.changeState('playing');
                return;
            }
        }
        
        // Key wasn't handled above, pass to current state
        console.log(`Delegating key press to current state handler: ${currentState}`)

        // Allow current state to handle other keys if needed (e.g., player movement)
        if (gameStateManager.states[currentState] && 
            typeof gameStateManager.states[currentState].handleKeyPress === 'function') {
            gameStateManager.states[currentState].handleKeyPress(p.key);
        }
    };

    p.mousePressed = () => {
        if (!gameStateManager) return;
        
        // Ensure audio context is running after user interaction
        startMusic();
        
        const currentState = gameStateManager.currentState;
        
        // Pass mouse events to the appropriate state if it has a mouse handler
        if (currentState === 'upgrade' && 
            gameStateManager.states.upgrade && 
            typeof gameStateManager.states.upgrade.handleMousePress === 'function') {
            gameStateManager.states.upgrade.handleMousePress(p.mouseX, p.mouseY);
        } else if (currentState === 'settings' && 
                  gameStateManager.states.settings && 
                  typeof gameStateManager.states.settings.handleMousePress === 'function') {
            gameStateManager.states.settings.handleMousePress(p.mouseX, p.mouseY);
        } else if (currentState === 'store' &&
                  gameStateManager.states.store &&
                  typeof gameStateManager.states.store.handleMousePress === 'function') {
            gameStateManager.states.store.handleMousePress(p.mouseX, p.mouseY);
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);

        if (gameStateManager && gameStateManager.states.playing) {
            const ps = gameStateManager.states.playing;

            // 1) recompute groundY
            const groundY = p.height - GROUND_OFFSET;
            gameSettings.groundY = groundY;

            // 2) position player so its bottom = groundY
            const newPlayerY = groundY - PLAYER_HEIGHT / 2;
            ps.player.setPosition(
                constrain(ps.player.x, ps.player.w / 2, p.width - ps.player.w / 2),
                newPlayerY
            );

            // 3) update cannon as before
            ps.cannon.setPosition(p.width - CANNON_X_OFFSET, p.height / 2);
        }

        
        window.gravity = p.createVector(0, 0.2 * (p.height / 600));
        
        // Debounce save operation to prevent excessive saves during resize
        clearTimeout(window.idleGameResizeTimer);
        window.idleGameResizeTimer = setTimeout(() => {
            if (saveManager) {
                saveManager.save(gameSettings);
            }
        }, 500); // Wait 500ms after last resize before saving
    };
};

// Kick it off
new window.p5(sketch);
