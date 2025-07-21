// Enhanced Editor functionality with importer
// Check for required dependency
if (typeof BubbleShooterLevelGenerator === 'undefined') {
    console.error('BubbleShooterLevelGenerator not found! Please include bubble_shooter_generator.js');
    document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Error: Missing dependency</h1><p>Please include bubble_shooter_generator.js</p></div>';
}

const generator = new BubbleShooterLevelGenerator();
let currentLevel = null;

// Update range displays
document.getElementById('width').addEventListener('input', (e) => {
    document.getElementById('widthValue').textContent = e.target.value;
});
document.getElementById('height').addEventListener('input', (e) => {
    document.getElementById('heightValue').textContent = e.target.value;
});
document.getElementById('colors').addEventListener('input', (e) => {
    document.getElementById('colorsValue').textContent = e.target.value;
});
document.getElementById('emptySpaces').addEventListener('input', (e) => {
    document.getElementById('emptySpacesValue').textContent = e.target.value + '%';
});
document.getElementById('colorDensity').addEventListener('input', (e) => {
    document.getElementById('colorDensityValue').textContent = e.target.value + '%';
});
document.getElementById('batchCount').addEventListener('input', (e) => {
    document.getElementById('batchCountValue').textContent = e.target.value;
});

// Special bubble controls
document.getElementById('birdCount').addEventListener('input', (e) => {
    document.getElementById('birdCountValue').textContent = e.target.value;
});
document.getElementById('lockedChance').addEventListener('input', (e) => {
    document.getElementById('lockedChanceValue').textContent = e.target.value + '%';
});
document.getElementById('bombChance').addEventListener('input', (e) => {
    document.getElementById('bombChanceValue').textContent = e.target.value + '%';
});
document.getElementById('transparentChance').addEventListener('input', (e) => {
    document.getElementById('transparentChanceValue').textContent = e.target.value + '%';
});
document.getElementById('stoneChance').addEventListener('input', (e) => {
    document.getElementById('stoneChanceValue').textContent = e.target.value + '%';
});

function getSettings() {
    return {
        width: Math.max(4, parseInt(document.getElementById('width').value) || 12),
        height: Math.max(4, parseInt(document.getElementById('height').value) || 8),
        colors: Math.max(1, parseInt(document.getElementById('colors').value) || 4),
        emptySpaces: Math.max(0, Math.min(100, parseFloat(document.getElementById('emptySpaces').value) || 0)) / 100,
        colorDensity: Math.max(0, Math.min(100, parseFloat(document.getElementById('colorDensity').value) || 50)) / 100,
        // Special bubble settings
        birdCount: Math.max(0, parseInt(document.getElementById('birdCount').value) || 0),
        lockedChance: Math.max(0, Math.min(100, parseFloat(document.getElementById('lockedChance').value) || 0)) / 100,
        bombChance: Math.max(0, Math.min(100, parseFloat(document.getElementById('bombChance').value) || 0)) / 100,
        transparentChance: Math.max(0, Math.min(100, parseFloat(document.getElementById('transparentChance').value) || 0)) / 100,
        stoneChance: Math.max(0, Math.min(100, parseFloat(document.getElementById('stoneChance').value) || 0)) / 100
    };
}

function generateLevel() {
    try {
        const settings = getSettings();
        currentLevel = generator.generateLevel(settings);
        displayLevel(currentLevel);
        updateExportData();
    } catch (error) {
        showNotification('Generation failed: ' + error.message, 'error');
    }
}

function generateMultiple() {
    try {
        const settings = getSettings();
        const count = Math.max(1, Math.min(100, parseInt(document.getElementById('batchCount').value) || 5));
        const levels = [];
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
    if (config.width) {
        document.getElementById('width').value = config.width;
        document.getElementById('widthValue').textContent = config.width;
    }
    if (config.height) {
        const height = Math.min(config.height, 50); // Limit for performance
        document.getElementById('height').value = height;
        document.getElementById('heightValue').textContent = height;
    }
    if (config.colors) {
        document.getElementById('colors').value = config.colors;
        document.getElementById('colorsValue').textContent = config.colors;
    }
    if (config.emptySpaces !== undefined) {
        const value = Math.round(config.emptySpaces * 100);
        document.getElementById('emptySpaces').value = value;
        document.getElementById('emptySpacesValue').textContent = value + '%';
    }
    if (config.colorDensity !== undefined) {
        const value = Math.round(config.colorDensity * 100);
        document.getElementById('colorDensity').value = value;
        document.getElementById('colorDensityValue').textContent = value + '%';
    }
    if (config.birdCount !== undefined) {
        document.getElementById('birdCount').value = config.birdCount;
        document.getElementById('birdCountValue').textContent = config.birdCount;
    }
    if (config.lockedChance !== undefined) {
        const value = Math.round(config.lockedChance * 100);
        document.getElementById('lockedChance').value = value;
        document.getElementById('lockedChanceValue').textContent = value + '%';
    }
    if (config.bombChance !== undefined) {
        const value = Math.round(config.bombChance * 100);
        document.getElementById('bombChance').value = value;
        document.getElementById('bombChanceValue').textContent = value + '%';
    }
    if (config.transparentChance !== undefined) {
        const value = Math.round(config.transparentChance * 100);
        document.getElementById('transparentChance').value = value;
        document.getElementById('transparentChanceValue').textContent = value + '%';
    }
    if (config.stoneChance !== undefined) {
        const value = Math.round(config.stoneChance * 100);
        document.getElementById('stoneChance').value = value;
        document.getElementById('stoneChanceValue').textContent = value + '%';
    }
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
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            display: none;
            max-width: 300px;
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

    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Generate initial level on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        generateLevel();
    } catch (error) {
        showNotification('Failed to generate initial level: ' + error.message, 'error');
    }
});