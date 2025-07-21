class BubbleShooterLevelGenerator {
    constructor() {
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];
    }

    // Create bubble object
    createBubble(type, color = null, properties = {}) {
        if (type === 'empty') return null;

        return {
            type: type || 'normal',
            color: color,
            ...properties
        };
    }

    // Generate a complete level
    generateLevel(options = {}) {
        const config = {
            width: options.width || 12,
            height: options.height || 8,
            colors: options.colors || 4,
            emptySpaces: options.emptySpaces !== undefined ? options.emptySpaces : 0.1,
            colorDensity: options.colorDensity || 0.5,
            // Special bubble settings - explicitly check for undefined to handle 0 values
            birdCount: options.birdCount !== undefined ? options.birdCount : 1,
            lockedChance: options.lockedChance !== undefined ? options.lockedChance : 0,
            bombChance: options.bombChance !== undefined ? options.bombChance : 0,
            transparentChance: options.transparentChance !== undefined ? options.transparentChance : 0,
            stoneChance: options.stoneChance !== undefined ? options.stoneChance : 0
        };

        const level = this.createLevel(config);
        return {
            grid: level,
            config: config,
            metadata: this.generateMetadata(level, config)
        };
    }

    // Create the level grid
    createLevel(config) {
        // Step 1: Generate basic mirrored grid
        const grid = this.generateBasicGrid(config);

        // Step 2: Replace bubbles with special types
        this.placeSpecialBubbles(grid, config);

        // Step 3: Fix stones at top rows to ensure level is winnable
        this.fixTopStones(grid, config);

        // Step 4: Ensure level is solvable
        return this.ensureSolvable(grid, this.colors.slice(0, config.colors), config);
    }

    // Generate basic mirrored grid with only normal bubbles
    generateBasicGrid(config) {
        const grid = [];
        const availableColors = this.colors.slice(0, config.colors);

        for (let row = 0; row < config.height; row++) {
            const rowData = [];
            const isEvenRow = row % 2 === 0;
            const bubbleCount = isEvenRow ? config.width : config.width - 1;
            const halfWidth = Math.ceil(bubbleCount / 2);

            // Generate left half (including center if odd width)
            const leftHalf = [];
            for (let col = 0; col < halfWidth; col++) {
                let bubble = null;
                if (Math.random() < config.emptySpaces) {
                    bubble = null;
                } else {
                    let color;
                    if (col > 0 && leftHalf[col - 1] && leftHalf[col - 1].color && Math.random() < config.colorDensity) {
                        color = leftHalf[col - 1].color;
                    } else {
                        color = availableColors[Math.floor(Math.random() * availableColors.length)];
                    }
                    bubble = this.createBubble('normal', color);
                }
                leftHalf.push(bubble);
            }

            // Build full row by mirroring
            for (let col = 0; col < bubbleCount; col++) {
                if (col < halfWidth) {
                    rowData.push(leftHalf[col]);
                } else {
                    const mirrorIndex = bubbleCount - 1 - col;
                    const originalBubble = leftHalf[mirrorIndex];
                    rowData.push(originalBubble ? { ...originalBubble } : null);
                }
            }

            grid.push(rowData);
        }

        return grid;
    }

    // Place special bubbles by replacing existing normal bubbles
    placeSpecialBubbles(grid, config) {
        // Step 1: Place birds (exact count)
        if (config.birdCount > 0) {
            this.placeBirds(grid, config);
        }

        // Step 2: Replace bubbles with other special types (percentage based)
        this.replaceWithSpecialTypes(grid, config);
    }

    // Place exact number of birds
    placeBirds(grid, config) {
        let birdsPlaced = 0;
        const maxAttempts = 200;

        for (let attempt = 0; attempt < maxAttempts && birdsPlaced < config.birdCount; attempt++) {
            // Weighted row selection - bias toward bottom rows
            const row = this.selectWeightedRow(grid);
            const col = Math.floor(Math.random() * grid[row].length);

            if (grid[row][col] && grid[row][col].type === 'normal') {
                const originalColor = grid[row][col].color;
                const mirrorCol = grid[row].length - 1 - col;
                const canMirror = mirrorCol !== col && grid[row][mirrorCol] && grid[row][mirrorCol].type === 'normal';

                // Check if we can place exactly what we need
                const remainingBirds = config.birdCount - birdsPlaced;

                if (canMirror && remainingBirds >= 2) {
                    // Place mirrored pair
                    grid[row][col] = this.createBubble('bird', originalColor, { isTarget: true });
                    grid[row][mirrorCol] = this.createBubble('bird', originalColor, { isTarget: true });
                    birdsPlaced += 2;
                } else if (remainingBirds === 1) {
                    // Place single bird (prefer center when possible)
                    grid[row][col] = this.createBubble('bird', originalColor, { isTarget: true });
                    birdsPlaced += 1;
                } else if (!canMirror) {
                    // Can only place single bird here
                    grid[row][col] = this.createBubble('bird', originalColor, { isTarget: true });
                    birdsPlaced += 1;
                }
            }
        }
    }

    // Replace normal bubbles with special types based on percentages
    replaceWithSpecialTypes(grid, config) {
        // Skip top rows to avoid placing stones there
        const skipTopRows = Math.min(2, grid.length);

        for (let row = skipTopRows; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col] && grid[row][col].type === 'normal') {
                    const originalColor = grid[row][col].color;
                    let replaced = false;

                    // Check each special type (only if chance > 0)
                    if (!replaced && config.lockedChance > 0 && Math.random() < config.lockedChance) {
                        grid[row][col] = this.createBubble('locked', originalColor, { lockLevel: 2 });
                        this.mirrorSpecialBubble(grid, row, col, 'locked', originalColor, { lockLevel: 2 });
                        replaced = true;
                    }

                    if (!replaced && config.bombChance > 0 && Math.random() < config.bombChance) {
                        grid[row][col] = this.createBubble('bomb');
                        this.mirrorSpecialBubble(grid, row, col, 'bomb');
                        replaced = true;
                    }

                    if (!replaced && config.transparentChance > 0 && Math.random() < config.transparentChance) {
                        grid[row][col] = this.createBubble('transparent');
                        this.mirrorSpecialBubble(grid, row, col, 'transparent');
                        replaced = true;
                    }

                    if (!replaced && config.stoneChance > 0 && Math.random() < config.stoneChance) {
                        grid[row][col] = this.createBubble('stone');
                        this.mirrorSpecialBubble(grid, row, col, 'stone');
                        replaced = true;
                    }
                }
            }
        }
    }

    // Select row with weight bias toward bottom
    selectWeightedRow(grid) {
        // Avoid first and last rows
        const availableRows = Math.max(1, grid.length - 2);
        const startRow = 1;

        // Create weights - higher for bottom rows
        const weights = [];
        for (let i = 0; i < availableRows; i++) {
            // Linear weight increase toward bottom (2x weight for last available row)
            const weight = 1 + (i / (availableRows - 1));
            weights.push(weight);
        }

        // Random weighted selection
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const random = Math.random() * totalWeight;

        let currentWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            currentWeight += weights[i];
            if (random <= currentWeight) {
                return startRow + i;
            }
        }

        // Fallback
        return startRow + availableRows - 1;
    }
    mirrorSpecialBubble(grid, row, col, type, color = null, properties = {}) {
        const mirrorCol = grid[row].length - 1 - col;
        if (mirrorCol !== col && grid[row][mirrorCol] && grid[row][mirrorCol].type === 'normal') {
            grid[row][mirrorCol] = this.createBubble(type, color, properties);
        }
    }

    // Fix stones at top rows (end of level) to ensure level is winnable
    fixTopStones(grid, config) {
        if (grid.length < 2) return;

        const availableColors = this.colors.slice(0, config.colors);
        const topRowsToCheck = Math.min(2, grid.length); // Check first 1-2 rows (top = end)

        for (let row = 0; row < topRowsToCheck; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col] && grid[row][col].type === 'stone') {
                    // Convert stone to regular bubble with random color
                    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                    grid[row][col] = this.createBubble('normal', randomColor);

                    // Mirror the change to maintain symmetry
                    const mirrorCol = grid[row].length - 1 - col;
                    if (mirrorCol !== col && grid[row][mirrorCol] && grid[row][mirrorCol].type === 'stone') {
                        grid[row][mirrorCol] = this.createBubble('normal', randomColor);
                    }
                }
            }
        }
    }

    // Ensure the level has valid clusters and is solvable
    ensureSolvable(grid, colors, config) {
        const clusterCount = this.countClusters(grid);

        if (clusterCount === 0) {
            this.createGuaranteedClusters(grid, colors);
        }

        return grid;
    }

    // Count existing clusters of 3+ bubbles
    countClusters(grid) {
        const visited = grid.map(row => row.map(() => false));
        let clusterCount = 0;

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (!visited[row][col] && grid[row][col] && grid[row][col].color) {
                    const clusterSize = this.floodFind(grid, visited, row, col, grid[row][col].color);
                    if (clusterSize >= 3) clusterCount++;
                }
            }
        }

        return clusterCount;
    }

    // Flood fill to find cluster size
    floodFind(grid, visited, row, col, color) {
        if (row < 0 || row >= grid.length || col < 0 || col >= grid[row].length ||
            visited[row][col] || !grid[row][col] || grid[row][col].color !== color) {
            return 0;
        }

        visited[row][col] = true;
        let count = 1;

        const directions = this.getNeighborDirections(row);
        directions.forEach(([dr, dc]) => {
            count += this.floodFind(grid, visited, row + dr, col + dc, color);
        });

        return count;
    }

    // Get neighbor directions based on row parity (hexagonal grid)
    getNeighborDirections(row) {
        const isEvenRow = row % 2 === 0;
        return isEvenRow ?
            [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] :
            [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    }

    // Create guaranteed clusters for solvability (mirrored)
    createGuaranteedClusters(grid, colors) {
        const clustersToCreate = Math.max(2, Math.floor(grid.length / 3));

        for (let i = 0; i < clustersToCreate; i++) {
            const row = Math.floor(Math.random() * (grid.length - 1));
            const maxCol = Math.min(3, Math.floor(grid[row].length / 2));
            const col = Math.floor(Math.random() * maxCol);
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Create cluster on left side
            for (let j = 0; j < 3 && col + j < grid[row].length; j++) {
                if (grid[row][col + j]) {
                    grid[row][col + j] = this.createBubble('normal', color);

                    // Mirror to right side
                    const mirrorCol = grid[row].length - 1 - (col + j);
                    if (mirrorCol >= 0 && mirrorCol < grid[row].length && mirrorCol !== col + j) {
                        if (grid[row][mirrorCol]) {
                            grid[row][mirrorCol] = this.createBubble('normal', color);
                        }
                    }
                }
            }
        }
    }

    // Generate level metadata
    generateMetadata(grid, config) {
        const bubbleCount = grid.reduce((total, row) =>
            total + row.filter(bubble => bubble !== null).length, 0
        );

        const colorDistribution = {};
        const typeDistribution = { normal: 0, bird: 0, locked: 0, bomb: 0, transparent: 0, stone: 0 };

        this.colors.forEach(color => colorDistribution[color] = 0);

        grid.forEach(row => {
            row.forEach(bubble => {
                if (bubble) {
                    if (bubble.color) colorDistribution[bubble.color]++;
                    typeDistribution[bubble.type]++;
                }
            });
        });

        return {
            totalBubbles: bubbleCount,
            emptySpaces: grid.reduce((total, row) =>
                total + row.filter(bubble => bubble === null).length, 0
            ),
            colorDistribution,
            typeDistribution,
            estimatedMoves: Math.floor(bubbleCount / 3),
            targetBirds: typeDistribution.bird || 0
        };
    }

    // Import level from JSON data
    importLevel(jsonData) {
        try {
            const levelData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Handle both single level and array of levels
            if (Array.isArray(levelData)) {
                return levelData[0]; // Take first level from array
            }

            // Validate required structure
            if (!levelData.grid || !Array.isArray(levelData.grid)) {
                throw new Error('Invalid level format: missing grid array');
            }

            // Regenerate metadata if missing
            if (!levelData.metadata) {
                levelData.metadata = this.generateMetadata(levelData.grid, levelData.config || {});
            }

            return levelData;
        } catch (error) {
            throw new Error(`Failed to import level: ${error.message}`);
        }
    }

    // Export level to different formats
    exportLevel(level, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(level, null, 2);
            case 'array':
                return level.grid;
            case 'string':
                return level.grid.map(row =>
                    row.map(bubble => {
                        if (!bubble) return '.';
                        if (bubble.type === 'bird') return 'B';
                        if (bubble.type === 'locked') return 'L';
                        if (bubble.type === 'bomb') return '*';
                        if (bubble.type === 'transparent') return 'T';
                        if (bubble.type === 'stone') return 'S';
                        return bubble.color ? bubble.color.charAt(0).toUpperCase() : '.';
                    }).join(' ')
                ).join('\n');
            default:
                return level;
        }
    }
}