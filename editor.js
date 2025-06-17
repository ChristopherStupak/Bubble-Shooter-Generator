// Enhanced Editor functionality
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
        width: parseInt(document.getElementById('width').value),
        height: parseInt(document.getElementById('height').value),
        colors: parseInt(document.getElementById('colors').value),
        emptySpaces: parseFloat(document.getElementById('emptySpaces').value) / 100,
        colorDensity: parseFloat(document.getElementById('colorDensity').value) / 100,
        // Special bubble settings
        birdCount: parseInt(document.getElementById('birdCount').value),
        lockedChance: parseFloat(document.getElementById('lockedChance').value) / 100,
        bombChance: parseFloat(document.getElementById('bombChance').value) / 100,
        transparentChance: parseFloat(document.getElementById('transparentChance').value) / 100,
        stoneChance: parseFloat(document.getElementById('stoneChance').value) / 100
    };
}

function generateLevel() {
    const settings = getSettings();
    currentLevel = generator.generateLevel(settings);
    displayLevel(currentLevel);
    updateExportData();
}

function generateMultiple() {
    const settings = getSettings();
    const levels = [];
    for (let i = 0; i < 5; i++) {
        levels.push(generator.generateLevel(settings));
    }
    document.getElementById('exportData').value = JSON.stringify(levels, null, 2);
    alert('Generated 5 levels! Check the export area.');
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
        alert('Please generate a level first!');
        return;
    }
    document.getElementById('exportData').value = generator.exportLevel(currentLevel, format);
}

function copyToClipboard() {
    const exportData = document.getElementById('exportData');
    exportData.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
}

// Generate initial level on page load
document.addEventListener('DOMContentLoaded', generateLevel);