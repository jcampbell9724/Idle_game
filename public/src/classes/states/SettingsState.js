import { BaseState } from './BaseState.js';
import { drawSettingsScreen } from '../../ui/SettingsScreen.js';
import { gameSettings } from '../../gameSettings.js';

export class SettingsState extends BaseState {
    constructor(p, eventBus, saveManager, assetManager) {
        super(p, eventBus, saveManager, assetManager);
        this.backButtonHitbox = null;  // Will be set in updateHitboxes()
        this.resetButtonHitbox = null; // For the reset button
    }

    onEnter() {
        console.log("⚙️ Entering settings menu...");
        
        // Update the HTML slider elements to match current settings from soundManager
        const musicSlider = document.getElementById('music-slider');
        if (musicSlider) {
            musicSlider.value = gameSettings.soundManager?.settings.musicVolume || 0;
            musicSlider.style.display = 'block';
        }
        
        const sfxSlider = document.getElementById('sfx-slider');
        if (sfxSlider) {
            sfxSlider.value = gameSettings.soundManager?.settings.sfxVolume || 0;
            sfxSlider.style.display = 'block';
        }
        
        // Show slider labels
        const musicLabel = document.getElementById('music-label');
        if (musicLabel) musicLabel.style.display = 'block';
        
        const sfxLabel = document.getElementById('sfx-label');
        if (sfxLabel) sfxLabel.style.display = 'block';
        
        // Position sliders in a better place
        this.positionSliders();
    }
    
    positionSliders() {
        const musicLabel = document.getElementById('music-label');
        const sfxLabel = document.getElementById('sfx-label');
        
        // Calculate panel dimensions - must match SettingsScreen.js
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.6;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;
        
        // Position sliders with proper spacing
        if (musicLabel) {
            musicLabel.style.position = 'absolute';
            musicLabel.style.left = (panelX + 50) + 'px'; // Left side of panel + margin
            musicLabel.style.top = (panelY + 100) + 'px';
            musicLabel.style.zIndex = '1001';
            musicLabel.style.fontFamily = "'Pixelify Sans', sans-serif";
            musicLabel.style.color = 'white'; // Ensure text is visible
        }
        
        if (sfxLabel) {
            sfxLabel.style.position = 'absolute';
            sfxLabel.style.left = (panelX + 50) + 'px'; // Left side of panel + margin
            sfxLabel.style.top = (panelY + 180) + 'px';
            sfxLabel.style.zIndex = '1001';
            sfxLabel.style.fontFamily = "'Pixelify Sans', sans-serif";
            sfxLabel.style.color = 'white'; // Ensure text is visible
        }
        
        // Ensure sliders are visible
        const musicSlider = document.getElementById('music-slider');
        const sfxSlider = document.getElementById('sfx-slider');
        
        if (musicSlider) {
            musicSlider.style.zIndex = '1001';
        }
        
        if (sfxSlider) {
            sfxSlider.style.zIndex = '1001';
        }
    }

    onExit() {
        console.log("⚙️ Exiting settings menu...");
        
        // Hide all sliders and labels
        const elements = [
            'music-label',
            'music-slider',
            'sfx-label',
            'sfx-slider'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Save settings when exiting
        if (this.saveManager) {
            this.saveManager.save(gameSettings);
        }
    }

    onUpdate() {
        // Update the back button hitbox
        this.updateHitboxes();
    }

    updateHitboxes() {
        // Calculate the panel dimensions - must match SettingsScreen.js
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.6;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;
        
        // Define back button dimensions - must match SettingsScreen.js
        const btnW = 120;
        const btnH = 40;
        const btnX = panelX + (panelW / 2) - (btnW / 2);
        const btnY = panelY + panelH - 80;
        
        // Update the back button hitbox
        this.backButtonHitbox = {
            x: btnX,
            y: btnY,
            w: btnW,
            h: btnH
        };
        
        // Define reset button dimensions - must match SettingsScreen.js
        const resetBtnW = 120;
        const resetBtnH = 40;
        const resetBtnX = panelX + (panelW / 2) - (resetBtnW / 2);
        const resetBtnY = panelY + panelH - 130;
        
        // Update the reset button hitbox
        this.resetButtonHitbox = {
            x: resetBtnX,
            y: resetBtnY,
            w: resetBtnW,
            h: resetBtnH
        };
    }

    onRender() {
        drawSettingsScreen(this.p);
    }

    handleKeyPress(key) {
        if (key === 'Escape') {
            // Exit settings and return to game
            if (this.saveManager) {
                this.saveManager.save(gameSettings);
            }
            
            if (typeof window.gameStateManager !== 'undefined') {
                window.gameStateManager.changeState('playing');
            } else {
                // Fallback if global reference isn't available
                this.eventBus.emit('changeState', 'playing');
            }
            return true;
        }
        return false;
    }
    
    // Handle mouse clicks in the settings screen
    handleMousePress(x, y) {
        // First check if reset button was clicked
        if (this.resetButtonHitbox && 
            x >= this.resetButtonHitbox.x && 
            x <= this.resetButtonHitbox.x + this.resetButtonHitbox.w &&
            y >= this.resetButtonHitbox.y && 
            y <= this.resetButtonHitbox.y + this.resetButtonHitbox.h) {
            
            // Ask for confirmation
            if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
                // Use the upgradeSystem to reset all upgrades
                if (window.upgradeSystem) {
                    window.upgradeSystem.resetAllUpgrades();
                }
                
                // Clear saved data
                if (this.saveManager) {
                    this.saveManager.clearOldSaves();
                }
                
                // Emit coins changed event
                if (this.eventBus) {
                    this.eventBus.emit('coinsChanged', gameSettings.coins);
                }
                
                // Return to game
                if (typeof window.gameStateManager !== 'undefined') {
                    window.gameStateManager.changeState('playing');
                } else {
                    this.eventBus.emit('changeState', 'playing');
                }
            }
            return true;
        }
        
        // Check if back button was clicked
        if (this.backButtonHitbox && 
            x >= this.backButtonHitbox.x && 
            x <= this.backButtonHitbox.x + this.backButtonHitbox.w &&
            y >= this.backButtonHitbox.y && 
            y <= this.backButtonHitbox.y + this.backButtonHitbox.h) {
            
            // Save settings
            if (this.saveManager) {
                this.saveManager.save(gameSettings);
            }
            
            // Return to game
            if (typeof window.gameStateManager !== 'undefined') {
                window.gameStateManager.changeState('playing');
            } else {
                this.eventBus.emit('changeState', 'playing');
            }
            return true;
        }
        
        // Check if click was outside the panel (to exit)
        const panelW = this.p.width * 0.6;
        const panelH = this.p.height * 0.6;
        const panelX = (this.p.width - panelW) / 2;
        const panelY = (this.p.height - panelH) / 2;
        
        if (x < panelX || x > panelX + panelW || 
            y < panelY || y > panelY + panelH) {
            
            // Save settings
            if (this.saveManager) {
                this.saveManager.save(gameSettings);
            }
            
            // Return to game
            if (typeof window.gameStateManager !== 'undefined') {
                window.gameStateManager.changeState('playing');
            } else {
                this.eventBus.emit('changeState', 'playing');
            }
            return true;
        }
        
        return false;
    }
}