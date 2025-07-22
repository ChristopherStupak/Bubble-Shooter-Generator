// Enhanced Editor functionality with number inputs
// Check for required dependency
if (typeof BubbleShooterLevelGenerator === 'undefined') {
    console.error('BubbleShooterLevelGenerator not found! Please include bubble_shooter_generator.js');
    document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Error: Missing dependency</h1><p>Please include bubble_shooter_generator.js</p></div>';
}

const generator = new BubbleShooterLevelGenerator();
let currentLevel = null;

// Input validation and real-time feedback
function validateInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    
    if (isNaN(value) || value < min || value > max) {
        input.classList.add('invalid');
        showInputError(input, `Value must be between ${min} and ${max}`);
        return false;
    } else {
        input.classList.remove('invalid');
        hideInputError(input);
        return true;
    }
}

function showInputError(input, message) {
    let errorDiv = input.parentNode.querySelector('.error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function hideInputError(input) {
    const errorDiv = input.parentNode.querySelector('.error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Add event listeners for all number inputs
function setupInputValidation() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        // Real-time validation on input
        input.addEventListener('input', () => {
            validateInput(input);
        });
        
        // Validate on blur (when user leaves field)
        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.value = input.getAttribute('data-default') || input.min || 0;
            }
            validateInput(input);
        });
        
        // Store default values for reset functionality
        input.setAttribute('data-default', input.value);
    });
}

function getSettings() {
    const settings = {
        width: Math.max(4, parseInt(document.getElementById('width').value) || 12),
        height: Math.max(4, parseInt(document.getElementById('height').value) || 8),
        colors: Math.max(1, parseInt(document.getElementById('colors').value) || 4),
        emptySpaces: Math.max(0, Math.min(30, parseFloat(document.getElementById('emptySpaces').value) || 0)) / 100,
        colorDensity: Math.max(0, Math.min(100, parseFloat(document.getElementById('colorDensity').value) || 50)) / 100,
        targetMoves: Math.max(1, parseInt(document.getElementById('targetMoves').value) || 20),
        // Special bubble settings
        birdCount: Math.max(0, parseInt(document.getElementById('birdCount').value) || 0),
        lockedChance: Math.max(0, Math.min(50, parseFloat(document.getElementById('lockedChance').value) || 0)) / 100,
        bombChance: Math.max(0, Math.min(30, parseFloat(document.getElementById('bombChance').value) || 0)) / 100,
        transparentChance: Math.max(0, Math.min(40, parseFloat(document.getElementById('transparentChance').value) || 0)) / 100,
        stoneChance: Math.max(0, Math.min(40, parseFloat(document.getElementById('stoneChance').value) || 0)) / 100
    };
    
    // Validate all settings are within bounds
    settings.width = Math.min(settings.width, 30);
    settings.height = Math.min(settings.height, 300);
    settings.colors = Math.min(settings.colors, 7);
    settings.targetMoves = Math.min(settings.targetMoves, 999);
    
    return settings;
}

function generateLevel() {
    // Validate all inputs before generating
    const inputs = document.querySelectorAll('input[type="number"]');
    let allValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            allValid = false;
        }
    });
    
    if (!allValid) {
        showNotification('Please fix input validation errors before generating!', 'error');
        return;
    }
    
    try {
        const settings = getSettings();
        currentLevel = generator.generateLevel(settings);
        displayLevel(currentLevel);
        updateExportData();
        showNotification('Level generated successfully!', 'success');
    } catch (error) {
        showNotification('Generation failed: ' + error.message, 'error');
    }
}

function generateMultiple() {
    // Validate all inputs first
    const inputs = document.querySelectorAll('input[type="number"]');
    let allValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            allValid = false;
        }
    });
    
    if (!allValid) {
        showNotification('Please fix input validation errors before generating!', 'error');
        return;
    }
    
    try {
        const settings = getSettings();
        const count = Math.max(1, Math.min(100, parseInt(document.getElementById('batchCount').value) || 5));
        const levels = [];
        
        // Show progress for large batches
        if (count > 10) {
            showNotification(`Generating ${count} levels...`, 'info');
        }
        
        for (let i = 0; i < count; i++) {
            levels.push(generator.generateLevel(settings));
        }
        
        document.getElementById('exportData').value = JSON.stringify(levels, null, 2);
        showNotification(`Generated ${count} levels! Check the export area.`, 'success');
    } catch (error) {
        showNotification('Batch generation failed: ' + error.message, 'error');
    }
}

function importLevel() {
    const importData = document.getElementById('importData').value.trim();

    if (!importData) {
        showNotification('Please paste level JSON data in the import area first!', 'warning');
        return;
    }

    try {
        currentLevel = generator.importLevel(importData);
        displayLevel(currentLevel);
        updateExportData();

        // Update controls to match imported level config
        if (currentLevel.config) {
            updateControlsFromConfig(currentLevel.config);
        }

        showNotification('Level imported successfully!', 'success');

        // Clear import area
        document.getElementById('importData').value = '';
    } catch (error) {
        showNotification(`Import failed: ${error.message}`, 'error');
    }
}

function updateControlsFromConfig(config) {
    const updates = [
        { id: 'width', value: config.width },
        { id: 'height', value: Math.min(config.height, 300) }, // Limit for performance
        { id: 'colors', value: config.colors },
        { id: 'emptySpaces', value: config.emptySpaces !== undefined ? Math.round(config.emptySpaces * 100) : undefined },
        { id: 'colorDensity', value: config.colorDensity !== undefined ? Math.round(config.colorDensity * 100) : undefined },
        { id: 'targetMoves', value: config.targetMoves },
        { id: 'birdCount', value: config.birdCount },
        { id: 'lockedChance', value: config.lockedChance !== undefined ? Math.round(config.lockedChance * 100) : undefined },
        { id: 'bombChance', value: config.bombChance !== undefined ? Math.round(config.bombChance * 100) : undefined },
        { id: 'transparentChance', value: config.transparentChance !== undefined ? Math.round(config.transparentChance * 100) : undefined },
        { id: 'stoneChance', value: config.stoneChance !== undefined ? Math.round(config.stoneChance * 100) : undefined }
    ];
    
    updates.forEach(update => {
        if (update.value !== undefined) {
            const element = document.getElementById(update.id);
            if (element) {
                element.value = update.value;
                validateInput(element);
            }
        }
    });
}

function displayLevel(level) {
    const preview = document.getElementById('levelPreview');
    const metadata = document.getElementById('metadata');

    // Display grid
    let gridHTML = '<div class="bubble-grid">';
    level.grid.forEach((row, rowIndex) => {
        gridHTML += `<div class="bubble-row ${rowIndex % 2 ? 'odd' : ''}">`;
        row.forEach(bubble => {
            if (!bubble) {
                gridHTML += `<div class="bubble empty"></div>`;
            } else {
                let bubbleClass = `bubble ${bubble.type}`;
                if (bubble.color) {
                    bubbleClass += ` ${bubble.color}`;
                }

                let content = '';
                switch (bubble.type) {
                    case 'bird':
                        content = '🐦';
                        break;
                    case 'locked':
                        content = '🔒';
                        break;
                    case 'bomb':
                        content = '💣';
                        break;
                    case 'transparent':
                        content = '⚪';
                        break;
                    case 'stone':
                        content = '🪨';
                        break;
                }

                gridHTML += `<div class="${bubbleClass}">${content}</div>`;
            }
        });
        gridHTML += '</div>';
    });
    gridHTML += '</div>';
    preview.innerHTML = gridHTML;

    // Display metadata
    const meta = level.metadata;
    const types = meta.typeDistribution;

    metadata.innerHTML = `
        <div class="stat">
            <div class="stat-value">${meta.totalBubbles}</div>
            <div>Total Bubbles</div>
        </div>
        <div class="stat">
            <div class="stat-value">${meta.emptySpaces}</div>
            <div>Empty Spaces</div>
        </div>
        <div class="stat">
            <div class="stat-value">${meta.estimatedMoves}</div>
            <div>Est. Moves</div>
        </div>
        <div class="stat">
            <div class="stat-value">${meta.targetBirds}</div>
            <div>Target Birds</div>
        </div>
        <div class="stat">
            <div class="stat-value">${meta.targetMoves || 'N/A'}</div>
            <div>Target Moves</div>
        </div>
        <div class="stat">
            <div class="stat-value">${types.locked || 0}</div>
            <div>Locked</div>
        </div>
        <div class="stat">
            <div class="stat-value">${types.bomb || 0}</div>
            <div>Bombs</div>
        </div>
        <div class="stat">
            <div class="stat-value">${types.transparent || 0}</div>
            <div>Transparent</div>
        </div>
        <div class="stat">
            <div class="stat-value">${types.stone || 0}</div>
            <div>Stones</div>
        </div>
    `;
}

function updateExportData() {
    if (currentLevel) {
        document.getElementById('exportData').value = generator.exportLevel(currentLevel, 'json');
    }
}

function exportLevel(format) {
    if (!currentLevel) {
        showNotification('Please generate a level first!', 'warning');
        return;
    }
    document.getElementById('exportData').value = generator.exportLevel(currentLevel, format);
    showNotification(`Exported as ${format.toUpperCase()}!`, 'success');
}

async function copyToClipboard() {
    const exportData = document.getElementById('exportData');
    const text = exportData.value;

    if (!text) {
        showNotification('No data to copy!', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        try {
            exportData.select();
            document.execCommand('copy');
            showNotification('Copied to clipboard!', 'success');
        } catch (fallbackErr) {
            showNotification('Failed to copy to clipboard', 'error');
        }
    }
}

function downloadLevel(format) {
    if (!currentLevel) {
        showNotification('Please generate a level first!', 'warning');
        return;
    }

    try {
        const data = generator.exportLevel(currentLevel, format);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `level.${format === 'json' ? 'json' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Download started!', 'success');
    } catch (error) {
        showNotification('Download failed: ' + error.message, 'error');
    }
}

function downloadBatch() {
    const batchData = document.getElementById('exportData').value;
    if (!batchData) {
        showNotification('No batch data to download!', 'warning');
        return;
    }

    try {
        const blob = new Blob([batchData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'levels_batch.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Batch download started!', 'success');
    } catch (error) {
        showNotification('Download failed: ' + error.message, 'error');
    }
}

// Reset all inputs to default values
function resetToDefaults() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        const defaultValue = input.getAttribute('data-default');
        if (defaultValue) {
            input.value = defaultValue;
            validateInput(input);
        }
    });
    showNotification('Reset to default values!', 'info');
}

// Simple notification system
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            display: none;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }

    // Set color based on type
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Auto hide after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 4000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Set up input validation
        setupInputValidation();
        
        // Generate initial level
        generateLevel();
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'g':
                        e.preventDefault();
                        generateLevel();
                        break;
                    case 'b':
                        e.preventDefault();
                        generateMultiple();
                        break;
                    case 'r':
                        e.preventDefault();
                        resetToDefaults();
                        break;
                }
            }
        });
        
        showNotification('Level editor loaded successfully! Use Ctrl+G to generate, Ctrl+B for batch, Ctrl+R to reset.', 'info');
    } catch (error) {
        showNotification('Failed to initialize editor: ' + error.message, 'error');
    }
});