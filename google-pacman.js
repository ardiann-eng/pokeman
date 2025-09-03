class GooglePacman {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Enhanced performance optimization
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.actualFPS = 60;
        this.fpsCounter = 0;
        this.fpsTime = 0;
        this.renderCache = new Map();
        this.lastRenderState = null;
        this.skipFrames = 0;
        this.maxSkipFrames = 2;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // Adaptive canvas sizing
        this.setupCanvas();
        
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Mobile detection and touch controls
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchThreshold = 30;
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Animation variables with performance optimization
        this.animationTime = 0;
        this.mouthAnimation = 0;
        this.animationSpeed = this.isMobile ? 0.8 : 1.0; // Slower on mobile for better performance
        
        // Adaptive grid settings
        this.setupGameGrid();
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        
        // Player (Pacman)
        this.player = {
            x: 1,
            y: 9,
            direction: 'right',
            nextDirection: null
        };
        
        // Ghosts with different enemy images
        this.ghosts = [
            { x: 14, y: 9, direction: 'left', imageKey: 'enemy1', speed: 1, name: 'Blinky' },
            { x: 15, y: 9, direction: 'up', imageKey: 'enemy2', speed: 1, name: 'Pinky' },
            { x: 14, y: 10, direction: 'right', imageKey: 'enemy3', speed: 1, name: 'Inky' },
            { x: 15, y: 10, direction: 'down', imageKey: 'enemy1', speed: 1, name: 'Clyde' }
        ];
        
        // Game map (0 = wall, 1 = dot, 2 = empty, 3 = power pellet)
        this.createGoogleMaze();
        
        // Load images
        this.images = {};
        this.loadImages();
        
        // Audio system
        this.sounds = {};
        this.audioEnabled = true;
        this.loadSounds();
        
        // Input handling
        this.setupControls();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        // Setup additional mobile features
        this.setupTouchControls();
        this.setupResizeHandler();
        
        // Start the game
        this.startGame();
    }
    
    setupCanvas() {
        // Enhanced platform detection
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isPC = !this.isMobile;
        const isTablet = this.isMobile && (window.innerWidth > 768 || window.innerHeight > 768);
        
        // Get actual screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
        
        // Platform-specific sizing
        let maxWidth, maxHeight, aspectRatio;
        
        if (isPC) {
            // PC: Larger canvas with standard aspect ratio
            maxWidth = Math.min(screenWidth * 0.9, 1400);
            maxHeight = Math.min(screenHeight * 0.85, 900);
            aspectRatio = 1.4; // 1400/900
        } else if (isAndroid && orientation === 'landscape') {
            // Android landscape: Use more screen space
            maxWidth = Math.min(screenWidth * 0.95, screenHeight * 1.6);
            maxHeight = Math.min(screenHeight * 0.9, screenWidth * 0.6);
            aspectRatio = 1.6;
        } else {
            // Mobile portrait: Optimized for vertical screens
            maxWidth = Math.min(screenWidth * 0.95, 600);
            maxHeight = Math.min(screenHeight * 0.7, 800);
            aspectRatio = 0.75; // Portrait ratio
        }
        
        // Calculate optimal canvas size maintaining aspect ratio
        let canvasWidth = maxWidth;
        let canvasHeight = maxWidth / aspectRatio;
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = maxHeight * aspectRatio;
        }
        
        // Set logical canvas size
        this.logicalWidth = canvasWidth;
        this.logicalHeight = canvasHeight;
        
        // Apply device pixel ratio for crisp rendering
        this.canvas.width = canvasWidth * this.devicePixelRatio;
        this.canvas.height = canvasHeight * this.devicePixelRatio;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // Scale context for high DPI
        this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        
        // Store platform info for other methods
        this.platform = { isPC, isAndroid, isTablet, orientation };
    }
    
    setupGameGrid() {
        // Platform-specific grid sizing
        const { isPC, isAndroid, orientation } = this.platform || {};
        
        let baseGridSize, minGridSize, maxGridSize;
        
        if (isPC) {
            // PC: Larger grid for better visibility
            baseGridSize = Math.min(this.logicalWidth / 28, this.logicalHeight / 20);
            minGridSize = 35;
            maxGridSize = 60;
        } else if (isAndroid && orientation === 'landscape') {
            // Android landscape: Medium grid size
            baseGridSize = Math.min(this.logicalWidth / 32, this.logicalHeight / 18);
            minGridSize = 25;
            maxGridSize = 45;
        } else {
            // Mobile portrait: Smaller grid to fit more content
            baseGridSize = Math.min(this.logicalWidth / 20, this.logicalHeight / 28);
            minGridSize = 20;
            maxGridSize = 35;
        }
        
        this.gridSize = Math.max(minGridSize, Math.min(maxGridSize, baseGridSize));
        
        // Calculate grid dimensions
        this.cols = Math.floor(this.logicalWidth / this.gridSize);
        this.rows = Math.floor(this.logicalHeight / this.gridSize);
        
        // Ensure minimum playable area
        this.cols = Math.max(20, this.cols);
        this.rows = Math.max(15, this.rows);
        
        // Center the game area
        this.offsetX = (this.logicalWidth - (this.cols * this.gridSize)) / 2;
        this.offsetY = (this.logicalHeight - (this.rows * this.gridSize)) / 2;
    }
    
    setupTouchControls() {
        if (!this.isMobile) return;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            
            // Determine swipe direction
            if (Math.abs(deltaX) > this.touchThreshold || Math.abs(deltaY) > this.touchThreshold) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    this.player.nextDirection = deltaX > 0 ? 'right' : 'left';
                } else {
                    // Vertical swipe
                    this.player.nextDirection = deltaY > 0 ? 'down' : 'up';
                }
            }
        }, { passive: false });
        
        // Prevent scrolling on canvas
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                this.setupGameGrid();
                this.createGoogleMaze();
            }, 250);
        });
    }
    
    createGoogleMaze() {
        // Create a maze that spells "GOOGLE" creatively
        this.map = [];
        
        // Initialize with walls
        for (let y = 0; y < this.rows; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.map[y][x] = 0; // wall
            }
        }
        
        // Create the GOOGLE maze pattern
        const mazePattern = [
            "##############################",
            "#............##............#",
            "#.####.####..##..####.####.#",
            "#o......................o#",
            "#.####.##.######.##.####.#",
            "#......##....##....##......#",
            "######.#####.##.#####.######",
            "     #.##..........##.#     ",
            "     #.##.###--###.##.#     ",
            "######.##.#      #.##.######",
            "#........#  GGGG  #........#",
            "######.##.#      #.##.######",
            "     #.##.########.##.#     ",
            "     #.##..........##.#     ",
            "######.##.########.##.######",
            "#............##............#",
            "#.####.####..##..####.####.#",
            "#o..##................##..o#",
            "###.##.##.######.##.##.###",
            "#......##....##....##......#",
            "#.##########.##.##########.#",
            "#..........................#",
            "##############################"
        ];
        
        // Convert pattern to map
        for (let y = 0; y < Math.min(mazePattern.length, this.rows); y++) {
            for (let x = 0; x < Math.min(mazePattern[y].length, this.cols); x++) {
                const char = mazePattern[y][x];
                switch (char) {
                    case '#':
                        this.map[y][x] = 0; // wall
                        break;
                    case '.':
                        this.map[y][x] = 1; // dot
                        break;
                    case 'o':
                        this.map[y][x] = 3; // power pellet
                        break;
                    case ' ':
                    case '-':
                    case 'G':
                        this.map[y][x] = 2; // empty space
                        break;
                    default:
                        this.map[y][x] = 2; // empty space
                }
            }
        }
    }
    
    loadImages() {
        this.images = {
            pikachu: new Image(),
            enemy1: new Image(),
            enemy2: new Image(),
            enemy3: new Image(),
            ball: new Image()
        };
        
        this.images.pikachu.src = 'pikachu.png';
        this.images.enemy1.src = 'enemy.png';
        this.images.enemy2.src = 'enemy2.png';
        this.images.enemy3.src = 'enemy3.png';
        this.images.ball.src = 'ball.png';
        
        // Wait for images to load
        let loadedImages = 0;
        const totalImages = Object.keys(this.images).length;
        
        Object.values(this.images).forEach(img => {
            img.onload = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    console.log('All images loaded successfully');
                }
            };
        });
    }
    
    loadSounds() {
        // Create Pacman-themed sound effects using Web Audio API
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioEnabled = false;
            return;
        }
        
        // Define sound frequencies for Pacman-style effects
        this.soundFrequencies = {
            chomp: [800, 600], // Pacman eating sound
            powerPellet: [400, 500, 600, 700, 800], // Power pellet sound
            death: [800, 700, 600, 500, 400, 300, 200], // Death sound
            ghost: [300, 250], // Ghost movement
            extraLife: [523, 659, 784, 1047], // Extra life sound
            gameStart: [392, 523, 659, 784] // Game start sound
        };
    }
    
    playSound(soundType, duration = 0.2) {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const frequencies = this.soundFrequencies[soundType];
            if (!frequencies) return;
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = soundType === 'death' ? 'sawtooth' : 'square';
                
                const startTime = this.audioContext.currentTime + (index * 0.05);
                const endTime = startTime + duration;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
                
                oscillator.start(startTime);
                oscillator.stop(endTime);
            });
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch (e.key) {
                case 'ArrowUp':
                    this.player.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.player.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.player.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.player.nextDirection = 'right';
                    e.preventDefault();
                    break;
            }
        });
        
        this.restartBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    canMove(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false;
        }
        return this.map[y][x] !== 0; // Can move if not a wall
    }
    
    movePlayer() {
        // Try to change direction if requested
        if (this.player.nextDirection) {
            const directions = {
                'up': { x: 0, y: -1 },
                'down': { x: 0, y: 1 },
                'left': { x: -1, y: 0 },
                'right': { x: 1, y: 0 }
            };
            
            const nextDir = directions[this.player.nextDirection];
            const nextX = this.player.x + nextDir.x;
            const nextY = this.player.y + nextDir.y;
            
            if (this.canMove(nextX, nextY)) {
                this.player.direction = this.player.nextDirection;
                this.player.nextDirection = null;
            }
        }
        
        // Move in current direction
        const directions = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        
        const dir = directions[this.player.direction];
        const newX = this.player.x + dir.x;
        const newY = this.player.y + dir.y;
        
        // Tunnel effect (wrap around)
        let finalX = newX;
        if (newX < 0) finalX = this.cols - 1;
        if (newX >= this.cols) finalX = 0;
        
        if (this.canMove(finalX, newY)) {
            this.player.x = finalX;
            this.player.y = newY;
            
            // Handle item collection
            const terrain = this.map[newY][finalX];
            
            if (terrain === 1) {
                // Collect dot
                this.map[newY][finalX] = 2;
                this.score += 10;
                this.playSound('chomp', 0.1);
                this.updateUI();
                
            } else if (terrain === 3) {
                // Collect power pellet
                this.map[newY][finalX] = 2;
                this.score += 50;
                this.playSound('powerPellet', 0.5);
                this.updateUI();
                
                // Make ghosts vulnerable (simplified)
                this.ghosts.forEach(ghost => {
                    ghost.vulnerable = true;
                    setTimeout(() => {
                        ghost.vulnerable = false;
                    }, 5000);
                });
            }
        }
    }
    
    moveGhosts() {
        this.ghosts.forEach(ghost => {
            const directions = [
                { x: 0, y: -1, name: 'up' },
                { x: 0, y: 1, name: 'down' },
                { x: -1, y: 0, name: 'left' },
                { x: 1, y: 0, name: 'right' }
            ];
            
            // Simple AI: try to move towards player or random direction
            let possibleMoves = directions.filter(dir => {
                const newX = ghost.x + dir.x;
                const newY = ghost.y + dir.y;
                return this.canMove(newX, newY);
            });
            
            if (possibleMoves.length > 0) {
                // Choose direction towards player 70% of the time
                let chosenDir;
                if (Math.random() < 0.7) {
                    // Move towards player
                    const dx = this.player.x - ghost.x;
                    const dy = this.player.y - ghost.y;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        chosenDir = possibleMoves.find(dir => 
                            (dx > 0 && dir.name === 'right') || 
                            (dx < 0 && dir.name === 'left')
                        );
                    } else {
                        chosenDir = possibleMoves.find(dir => 
                            (dy > 0 && dir.name === 'down') || 
                            (dy < 0 && dir.name === 'up')
                        );
                    }
                }
                
                // If no direction towards player or random choice
                if (!chosenDir) {
                    chosenDir = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                }
                
                ghost.x += chosenDir.x;
                ghost.y += chosenDir.y;
                ghost.direction = chosenDir.name;
            }
        });
    }
    
    checkCollisions() {
        this.ghosts.forEach(ghost => {
            if (ghost.x === this.player.x && ghost.y === this.player.y) {
                if (ghost.vulnerable) {
                    // Eat ghost
                    this.score += 200;
                    this.playSound('ghost', 0.3);
                    // Reset ghost position
                    ghost.x = 14 + Math.floor(Math.random() * 2);
                    ghost.y = 9 + Math.floor(Math.random() * 2);
                    ghost.vulnerable = false;
                } else {
                    // Player dies
                    this.lives--;
                    this.playSound('death', 0.8);
                    this.updateUI();
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        // Reset player position
                        this.player.x = 1;
                        this.player.y = 9;
                        this.player.direction = 'right';
                    }
                }
            }
        });
    }
    
    checkWinCondition() {
        let dotsLeft = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === 1 || this.map[y][x] === 3) {
                    dotsLeft++;
                }
            }
        }
        
        if (dotsLeft === 0) {
            this.level++;
            this.score += 1000;
            this.createGoogleMaze(); // Reset maze
            this.updateUI();
        }
    }
    
    drawPacman(centerX, centerY, size) {
        const ctx = this.ctx;
        
        if (this.images.pikachu && this.images.pikachu.complete) {
            // Draw Pikachu image - Neon style with glow
            const imageSize = size * 1.0;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 20;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                this.images.pikachu,
                centerX - imageSize / 2,
                centerY - imageSize / 2,
                imageSize,
                imageSize
            );
            ctx.imageSmoothingEnabled = true;
            ctx.shadowBlur = 0;
        } else {
            // Fallback: Neon style Pacman
            const radius = size * 0.4;
            
            // Main body with optimized neon glow
            const pacmanGlow = this.actualFPS > 45 ? 20 : 10; // Reduce glow for better performance
            ctx.fillStyle = '#ffff00';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = pacmanGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Mouth opening
            const mouthAngle = Math.sin(this.animationTime * 0.01) * 0.5 + 0.5;
            ctx.fillStyle = '#000000';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius - 2, -mouthAngle, mouthAngle);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawGhost(centerX, centerY, imageKey, vulnerable = false) {
        const size = this.gridSize * 0.8;
        
        const ctx = this.ctx;
        
        if (this.images[imageKey] && this.images[imageKey].complete) {
            // Draw enemy image - Neon style with glow
            const colors = ['#ff0066', '#00ff66', '#6600ff', '#ff6600'];
            const ghostIndex = this.ghosts.findIndex(g => g.imageKey === imageKey);
            const glowColor = vulnerable ? '#0066ff' : colors[ghostIndex % colors.length];
            const enemyGlow = this.actualFPS > 45 ? 15 : 8; // Adaptive glow based on performance
            
            if (vulnerable) {
                // Add blue tint for vulnerable state
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#0066ff';
                ctx.shadowColor = '#0066ff';
                ctx.shadowBlur = enemyGlow;
                ctx.fillRect(centerX - size/2, centerY - size/2, size, size);
                ctx.globalAlpha = 1.0;
            }
            
            const enemySize = size * 0.9;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = enemyGlow;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                this.images[imageKey],
                centerX - enemySize / 2,
                centerY - enemySize / 2,
                enemySize,
                enemySize
            );
            ctx.imageSmoothingEnabled = true;
            ctx.shadowBlur = 0;
        } else {
            // Fallback: Neon style ghost
            const radius = size * 0.4;
            const colors = ['#ff0066', '#00ff66', '#6600ff', '#ff6600'];
            const ghostIndex = this.ghosts.findIndex(g => g.imageKey === imageKey);
            const fallbackColor = vulnerable ? '#0066ff' : colors[ghostIndex % colors.length];
            
            // Main body with neon glow
            const fallbackGlow = this.actualFPS > 45 ? 15 : 8; // Adaptive glow for fallback
            ctx.fillStyle = fallbackColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowColor = fallbackColor;
            ctx.shadowBlur = fallbackGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY - radius/2, radius, Math.PI, 0);
            ctx.fillRect(centerX - radius, centerY - radius/2, radius * 2, radius * 1.5);
            
            // Bottom wavy edge
            for (let i = 0; i < 4; i++) {
                const waveX = centerX - radius + (i * radius/2);
                const waveY = centerY + radius;
                ctx.lineTo(waveX, waveY - (i % 2) * 6);
            }
            ctx.fill();
            ctx.stroke();
            
            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillRect(centerX - radius/2, centerY - radius/3, 6, 6);
            ctx.fillRect(centerX + radius/4, centerY - radius/3, 6, 6);
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        // Neon retro background with starfield effect
        const gradient = ctx.createRadialGradient(this.logicalWidth/2, this.logicalHeight/2, 0, this.logicalWidth/2, this.logicalHeight/2, Math.max(this.logicalWidth, this.logicalHeight)/2);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
        
        // Enhanced neon grid pattern with pulsing effect - adjusted for game area
         const pulseIntensity = Math.sin(this.animationTime * 0.005) * 0.1 + 0.15;
         ctx.strokeStyle = `rgba(0, 255, 255, ${pulseIntensity})`;
         ctx.lineWidth = 0.5;
         ctx.shadowColor = '#00ffff';
         ctx.shadowBlur = 3;
         
         // Grid lines within game area
         const gameAreaWidth = this.cols * this.gridSize;
         const gameAreaHeight = this.rows * this.gridSize;
         
         // Vertical lines
         for (let x = 0; x <= this.cols; x++) {
             const lineX = this.offsetX + x * this.gridSize;
             ctx.beginPath();
             ctx.moveTo(lineX, this.offsetY);
             ctx.lineTo(lineX, this.offsetY + gameAreaHeight);
             ctx.stroke();
         }
         
         // Horizontal lines
         for (let y = 0; y <= this.rows; y++) {
             const lineY = this.offsetY + y * this.gridSize;
             ctx.beginPath();
             ctx.moveTo(this.offsetX, lineY);
             ctx.lineTo(this.offsetX + gameAreaWidth, lineY);
             ctx.stroke();
         }
         
         ctx.shadowBlur = 0;
        
        // Draw maze with proper offset
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const centerX = this.offsetX + x * this.gridSize + this.gridSize / 2;
                const centerY = this.offsetY + y * this.gridSize + this.gridSize / 2;
                
                switch (this.map[y][x]) {
                    case 0: // Wall - Transparent with striking neon outline
                         // Create transparent wall with intense neon border
                         const wallX = x * this.gridSize + 1;
                         const wallY = y * this.gridSize + 1;
                         const wallSize = this.gridSize - 2;
                         
                         // Transparent fill with subtle gradient
                         const wallGradient = ctx.createLinearGradient(wallX, wallY, wallX + wallSize, wallY + wallSize);
                         wallGradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
                         wallGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.05)');
                         wallGradient.addColorStop(1, 'rgba(0, 255, 255, 0.15)');
                         ctx.fillStyle = wallGradient;
                         ctx.fillRect(wallX, wallY, wallSize, wallSize);
                         
                         // Multiple neon outline layers for striking effect
                         // Outer glow
                         ctx.strokeStyle = '#00ffff';
                         ctx.lineWidth = 4;
                         ctx.shadowColor = '#00ffff';
                         ctx.shadowBlur = 25;
                         ctx.strokeRect(wallX, wallY, wallSize, wallSize);
                         
                         // Inner bright outline
                         ctx.strokeStyle = '#ffffff';
                         ctx.lineWidth = 2;
                         ctx.shadowColor = '#ffffff';
                         ctx.shadowBlur = 10;
                         ctx.strokeRect(wallX + 1, wallY + 1, wallSize - 2, wallSize - 2);
                         
                         // Core neon line
                         ctx.strokeStyle = '#00ffff';
                         ctx.lineWidth = 1;
                         ctx.shadowColor = '#00ffff';
                         ctx.shadowBlur = 5;
                         ctx.strokeRect(wallX + 2, wallY + 2, wallSize - 4, wallSize - 4);
                         
                         ctx.shadowBlur = 0;
                         break;
                        
                    case 1: // Dot
                        if (this.images.ball && this.images.ball.complete) {
                             // Enhanced neon ball with multiple glow layers
                             const ballSize = 16;
                             
                             // Outer glow
                             ctx.shadowColor = '#ffff00';
                             ctx.shadowBlur = 20;
                             ctx.globalAlpha = 0.8;
                             ctx.drawImage(
                                 this.images.ball,
                                 centerX - ballSize/2,
                                 centerY - ballSize/2,
                                 ballSize,
                                 ballSize
                             );
                             
                             // Inner bright glow
                             ctx.shadowBlur = 8;
                             ctx.globalAlpha = 1.0;
                             ctx.drawImage(
                                 this.images.ball,
                                 centerX - ballSize/2,
                                 centerY - ballSize/2,
                                 ballSize,
                                 ballSize
                             );
                             ctx.shadowBlur = 0;
                         } else {
                             // Enhanced fallback dot with multi-layer glow
                             const dotPulse = Math.sin(this.animationTime * 0.008) * 0.3 + 0.7;
                             
                             // Outer glow ring
                             ctx.fillStyle = `rgba(255, 255, 0, ${0.3 * dotPulse})`;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
                             ctx.fill();
                             
                             // Main dot with intense glow
                             ctx.fillStyle = '#ffff00';
                             ctx.shadowColor = '#ffff00';
                             ctx.shadowBlur = 15 * dotPulse;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
                             ctx.fill();
                             ctx.shadowBlur = 0;
                         }
                        break;
                        
                    case 3: // Power pellet
                        if (this.images.ball && this.images.ball.complete) {
                             // Enhanced power pellet with dramatic pulsing effect
                             const powerBallSize = 28;
                             const pulseIntensity = Math.sin(this.animationTime * 0.012) * 0.4 + 0.8;
                             const scaleEffect = Math.sin(this.animationTime * 0.008) * 0.1 + 1.0;
                             
                             // Outer energy ring
                             ctx.fillStyle = `rgba(255, 0, 255, ${0.2 * pulseIntensity})`;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, 20 * scaleEffect, 0, Math.PI * 2);
                             ctx.fill();
                             
                             // Middle glow ring
                             ctx.fillStyle = `rgba(255, 0, 255, ${0.4 * pulseIntensity})`;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, 15 * scaleEffect, 0, Math.PI * 2);
                             ctx.fill();
                             
                             // Main power pellet with intense glow
                             ctx.shadowColor = '#ff00ff';
                             ctx.shadowBlur = 35 * pulseIntensity;
                             ctx.globalAlpha = pulseIntensity;
                             ctx.drawImage(
                                 this.images.ball,
                                 centerX - (powerBallSize * scaleEffect)/2,
                                 centerY - (powerBallSize * scaleEffect)/2,
                                 powerBallSize * scaleEffect,
                                 powerBallSize * scaleEffect
                             );
                             ctx.globalAlpha = 1.0;
                             ctx.shadowBlur = 0;
                         } else {
                             // Enhanced fallback power pellet with multi-layer effects
                             const pulseIntensity = Math.sin(this.animationTime * 0.012) * 0.4 + 0.8;
                             const pulseSize = 8 + Math.sin(this.animationTime * 0.008) * 3;
                             const scaleEffect = Math.sin(this.animationTime * 0.006) * 0.2 + 1.0;
                             
                             // Outer energy field
                             ctx.fillStyle = `rgba(255, 0, 255, ${0.15 * pulseIntensity})`;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, 18 * scaleEffect, 0, Math.PI * 2);
                             ctx.fill();
                             
                             // Middle energy ring
                             ctx.fillStyle = `rgba(255, 0, 255, ${0.3 * pulseIntensity})`;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, 12 * scaleEffect, 0, Math.PI * 2);
                             ctx.fill();
                             
                             // Core power pellet
                             ctx.fillStyle = '#ff00ff';
                             ctx.shadowColor = '#ff00ff';
                             ctx.shadowBlur = 30 * pulseIntensity;
                             ctx.beginPath();
                             ctx.arc(centerX, centerY, pulseSize * scaleEffect, 0, Math.PI * 2);
                             ctx.fill();
                             ctx.shadowBlur = 0;
                         }
                        break;
                }
            }
        }
        
        // Draw Pacman with proper offset
        const pacmanCenterX = this.offsetX + this.player.x * this.gridSize + this.gridSize / 2;
        const pacmanCenterY = this.offsetY + this.player.y * this.gridSize + this.gridSize / 2;
        this.drawPacman(pacmanCenterX, pacmanCenterY, this.gridSize);
        
        // Draw ghosts with proper offset
        this.ghosts.forEach(ghost => {
            const ghostCenterX = this.offsetX + ghost.x * this.gridSize + this.gridSize / 2;
            const ghostCenterY = this.offsetY + ghost.y * this.gridSize + this.gridSize / 2;
            this.drawGhost(ghostCenterX, ghostCenterY, ghost.imageKey, ghost.vulnerable);
        });
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.levelElement.textContent = this.level;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
    }
    
    resetGame() {
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Reset player
        this.player.x = 1;
        this.player.y = 9;
        this.player.direction = 'right';
        this.player.nextDirection = null;
        
        // Reset ghosts
        this.ghosts = [
            { x: 14, y: 9, direction: 'left', imageKey: 'enemy1', speed: 1, name: 'Blinky' },
            { x: 15, y: 9, direction: 'up', imageKey: 'enemy2', speed: 1, name: 'Pinky' },
            { x: 14, y: 10, direction: 'right', imageKey: 'enemy3', speed: 1, name: 'Inky' },
            { x: 15, y: 10, direction: 'down', imageKey: 'enemy1', speed: 1, name: 'Clyde' }
        ];
        
        // Reset maze
        this.createGoogleMaze();
        
        // Hide game over screen
        this.gameOverElement.classList.add('hidden');
        
        // Update UI
        this.updateUI();
        
        // Start game
        this.startGame();
    }
    
    startGame() {
        this.gameRunning = true;
        this.playSound('gameStart', 0.5);
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(currentTime = 0) {
        // Enhanced FPS control with adaptive rendering
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime < this.frameInterval) {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        // Calculate actual FPS and adjust rendering quality
        this.fpsCounter++;
        if (currentTime - this.fpsTime >= 1000) {
            this.actualFPS = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTime = currentTime;
            
            // Adaptive quality based on performance
            if (this.actualFPS < 30) {
                this.maxSkipFrames = 3;
            } else if (this.actualFPS < 45) {
                this.maxSkipFrames = 2;
            } else {
                this.maxSkipFrames = 1;
            }
        }
        
        if (this.gameRunning) {
            // Update game logic every 150ms
            if (deltaTime > 150) {
                this.movePlayer();
                this.moveGhosts();
                this.checkCollisions();
                this.checkWinCondition();
            }
        }
        
        // Optimized rendering with frame skipping for performance
        const shouldRender = this.skipFrames <= 0 || this.actualFPS < 30;
        
        if (shouldRender) {
            this.render();
            this.skipFrames = this.maxSkipFrames;
        } else {
            this.skipFrames--;
        }
        
        this.animationTime += this.animationSpeed;
        
        // Performance monitoring
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            // Adjust animation speed based on performance
            const fps = this.frameCount;
            if (fps < 30 && this.animationSpeed > 0.5) {
                this.animationSpeed *= 0.9; // Reduce animation speed if FPS is low
            }
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        this.lastFrameTime = currentTime;
        
        // Continue game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new GooglePacman();
});