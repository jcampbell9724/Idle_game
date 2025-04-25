/**
 * UI helper module that provides standard UI drawing functions
 * to ensure consistent styling and reduce code duplication.
 */
export const UI = {
    /**
     * Draws a standard panel with consistent styling
     * @param {Object} p - p5 instance
     * @param {Object} options - Panel options
     * @returns {Object} Panel dimensions and position
     */
    drawPanel(p, options = {}) {
        const {
            widthPercent = 0.6,
            heightPercent = 0.6,
            background = '#222',
            border = '#fff',
            borderWeight = 2,
            cornerRadius = 20,
        } = options;
        
        // Save original rectMode
        const originalRectMode = p._renderer._rectMode;
        
        // Set to CORNER mode for panel drawing
        p.rectMode(p.CORNER);
        
        // Calculate panel dimensions
        const panelW = p.width * widthPercent;
        const panelH = p.height * heightPercent;
        const panelX = (p.width - panelW) / 2;
        const panelY = (p.height - panelH) / 2;
        
        // Draw full-screen dark overlay
        p.fill(0, 160);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);
        
        // Draw panel
        p.push();
        p.translate(panelX, panelY);
        p.fill(background);
        p.stroke(border);
        p.strokeWeight(borderWeight);
        p.rect(0, 0, panelW, panelH, cornerRadius);
        p.pop();
        
        // Restore original rectMode
        p.rectMode(originalRectMode);
        
        // Return information about the panel for content positioning
        return {
            width: panelW,
            height: panelH,
            x: panelX,
            y: panelY,
            contentX: panelX,
            contentY: panelY,
            centerX: panelX + panelW / 2,
            centerY: panelY + panelH / 2
        };
    },
    
    /**
     * Draws a button with consistent styling
     * @param {Object} p - p5 instance
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Button width
     * @param {number} height - Button height
     * @param {string} label - Button text
     * @param {Object} options - Button options
     * @returns {Object} Button information including hitbox check
     */
    drawButton(p, x, y, width, height, label, options = {}) {
        const {
            background = '#444',
            hoverBackground = '#555',
            textColor = '#fff',
            disabledColor = '#333',
            disabledTextColor = '#999',
            cornerRadius = 10,
            textSize = 16,
            isHovered = false,
            isDisabled = false
        } = options;
        
        // Save original rectMode
        const originalRectMode = p._renderer._rectMode;
        
        // Set to CORNER mode for consistent button drawing
        p.rectMode(p.CORNER);
        
        p.push();
        
        // Button background
        p.fill(isDisabled ? disabledColor : (isHovered ? hoverBackground : background));
        p.stroke(isDisabled ? '#666' : '#888');
        p.rect(x, y, width, height, cornerRadius);
        
        // Button text
        p.noStroke();
        p.fill(isDisabled ? disabledTextColor : textColor);
        p.textSize(textSize);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(label, x + width / 2, y + height / 2);
        
        p.pop();
        
        // Restore original rectMode
        p.rectMode(originalRectMode);
        
        // Return hitbox information and helper method
        return {
            x: x,
            y: y,
            width: width,
            height: height,
            contains: function(px, py) {
                return (px >= x && px <= x + width && py >= y && py <= y + height);
            }
        };
    },
    
    /**
     * Draws a title and subtitle with standard styling
     * @param {Object} p - p5 instance
     * @param {string} title - Main title text
     * @param {string} subtitle - Subtitle text
     * @param {number} x - X position (center)
     * @param {number} startY - Y position for title
     * @param {Object} options - Text options
     */
    drawTitle(p, title, subtitle, x, startY, options = {}) {
        const {
            titleSize = 24,
            subtitleSize = 18,
            titleColor = '#fff',
            subtitleColor = '#ccc',
            spacing = 10
        } = options;
        
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        
        // Draw title
        p.textSize(titleSize);
        p.fill(titleColor);
        p.text(title, x, startY);
        
        // Draw subtitle if provided
        if (subtitle) {
            p.textSize(subtitleSize);
            p.fill(subtitleColor);
            p.text(subtitle, x, startY + titleSize + spacing);
        }
        
        p.pop();
    },
    
    /**
     * Creates a grid layout for positioning UI elements
     * @param {number} totalWidth - Total available width
     * @param {number} totalHeight - Total available height
     * @param {number} cols - Number of columns
     * @param {number} rows - Number of rows
     * @param {Object} options - Grid options
     * @returns {Function} Function to get cell position and size
     */
    createGrid(totalWidth, totalHeight, cols, rows, options = {}) {
        const {
            gapX = 10,
            gapY = 10,
            paddingX = 20,
            paddingY = 20
        } = options;
        
        const availableWidth = totalWidth - paddingX * 2 - gapX * (cols - 1);
        const availableHeight = totalHeight - paddingY * 2 - gapY * (rows - 1);
        
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        
        // Return a function to get cell position and dimensions
        return function(col, row) {
            if (col < 0 || col >= cols || row < 0 || row >= rows) {
                console.warn(`Cell (${col}, ${row}) is outside grid bounds`);
                return null;
            }
            
            const x = paddingX + col * (cellWidth + gapX);
            const y = paddingY + row * (cellHeight + gapY);
            
            return {
                x: x,
                y: y,
                width: cellWidth,
                height: cellHeight,
                centerX: x + cellWidth / 2,
                centerY: y + cellHeight / 2
            };
        };
    }
};
