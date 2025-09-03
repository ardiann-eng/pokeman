class PokemonPacman {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.trainerRankElement = document.getElementById('trainerRank');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Mobile detection and performance optimization
        this.isMobile = this.detectMobile();
        this.performanceMode = this.isMobile;
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.invincible = false;
        this.invincibleTime = 0;
        
        // Animation variables
        this.animationTime = 0;
        this.mouthAnimation = 0; // For Pac-Man mouth animation
        this.frameCount = 0;
        
        // Grid settings
        this.gridSize = 40;
        this.cols = this.canvas.width / this.gridSize;
        this.rows = this.canvas.height / this.gridSize;
        
        // Performance optimization
        this.setupCanvasOptimization();
        
        // Player (Pikachu)
        this.player = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: null
        };
        
        // Enemies
        this.enemies = [
            { x: 18, y: 1, direction: 'left', type: 'enemy.png', speed: 1 },
            { x: 1, y: 13, direction: 'up', type: 'enemy2.png', speed: 1 },
            { x: 18, y: 13, direction: 'down', type: 'enemy3.png', speed: 1 }
        ];
        
        // Game map (0 = wall, 1 = pokeball, 2 = empty)
        this.createMap();
        
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
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
               window.innerWidth <= 768;
    }
    
    setupCanvasOptimization() {
        // Optimize canvas for mobile performance
        if (this.isMobile) {
            // Reduce canvas resolution on mobile for better performance
            const rect = this.canvas.getBoundingClientRect();
            const scale = window.devicePixelRatio || 1;
            
            // Set actual size in memory (scaled down for performance)
            this.canvas.width = rect.width * Math.min(scale, 2);
            this.canvas.height = rect.height * Math.min(scale, 2);
            
            // Scale the drawing context so everything draws at the correct size
            this.ctx.scale(Math.min(scale, 2), Math.min(scale, 2));
            
            // Disable image smoothing for pixel-perfect rendering
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.webkitImageSmoothingEnabled = false;
            this.ctx.mozImageSmoothingEnabled = false;
            this.ctx.msImageSmoothingEnabled = false;
            
            // Recalculate grid based on new canvas size
            this.cols = Math.floor(this.canvas.width / (this.gridSize * Math.min(scale, 2)));
            this.rows = Math.floor(this.canvas.height / (this.gridSize * Math.min(scale, 2)));
        }
    }
    
    createMap() {
        this.map = [];
        // Map legend: 0=Wall/Rock, 1=Pokeball, 2=Empty, 3=Grass, 4=Water, 5=Pokemon Center, 6=Power Berry
        
        for (let y = 0; y < this.rows; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.cols; x++) {
                // Create detailed Pokemon-themed terrain
                if (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) {
                    this.map[y][x] = 0; // Border walls (rocky terrain)
                } else if ((x % 6 === 0 && y % 4 === 0) || (x % 4 === 0 && y % 6 === 0)) {
                    this.map[y][x] = 0; // Rock formations
                } else if ((x + y) % 8 === 0 && x > 2 && x < this.cols - 3 && y > 2 && y < this.rows - 3) {
                    this.map[y][x] = 4; // Water patches (obstacles)
                } else if ((x % 7 === 3 && y % 5 === 2) && x > 1 && x < this.cols - 2 && y > 1 && y < this.rows - 2) {
                    this.map[y][x] = 3; // Tall grass areas
                } else if (Math.random() > 0.85) {
                    this.map[y][x] = 6; // Power berries (rare)
                } else {
                    this.map[y][x] = 1; // Regular pokeballs
                }
            }
        }
        
        // Add Pokemon Centers at strategic locations
        this.map[Math.floor(this.rows/2)][Math.floor(this.cols/2)] = 5; // Center Pokemon Center
        this.map[3][3] = 5; // Top-left Pokemon Center
        this.map[this.rows-4][this.cols-4] = 5; // Bottom-right Pokemon Center
        
        // Clear starting positions and ensure paths
        this.map[1][1] = 2; // Player start (Pikachu)
        this.map[1][2] = 2; // Clear path from start
        this.map[2][1] = 2;
        
        // Enemy spawn points in different corners
        this.map[1][this.cols-2] = 2; // Enemy 1 start (top-right)
        this.map[this.rows-2][1] = 2; // Enemy 2 start (bottom-left) 
        this.map[this.rows-2][this.cols-2] = 2; // Enemy 3 start (bottom-right)
        
        // Create main pathways (Route-like corridors)
        for (let x = 1; x < this.cols - 1; x++) {
            if (x % 3 !== 0) {
                this.map[Math.floor(this.rows/2)][x] = Math.random() > 0.2 ? 1 : 2; // Horizontal route
            }
        }
        
        for (let y = 1; y < this.rows - 1; y++) {
            if (y % 3 !== 0) {
                this.map[y][Math.floor(this.cols/2)] = Math.random() > 0.2 ? 1 : 2; // Vertical route
            }
        }
        
        // Ensure accessibility around Pokemon Centers
        const centers = [[3,3], [Math.floor(this.rows/2), Math.floor(this.cols/2)], [this.rows-4, this.cols-4]];
        centers.forEach(([cy, cx]) => {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (cy + dy > 0 && cy + dy < this.rows - 1 && cx + dx > 0 && cx + dx < this.cols - 1) {
                        if (this.map[cy + dy][cx + dx] === 0 || this.map[cy + dy][cx + dx] === 4) {
                            this.map[cy + dy][cx + dx] = 2; // Clear obstacles around centers
                        }
                    }
                }
            }
        });
    }
    
    loadImages() {
        const imageFiles = ['pikachu.png', 'ball.png', 'enemy.png', 'enemy2.png', 'enemy3.png'];
        let loadedCount = 0;
        
        imageFiles.forEach(file => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === imageFiles.length) {
                    this.startGame();
                }
            };
            img.onerror = () => {
                console.warn(`Could not load ${file}, using colored rectangles instead`);
                loadedCount++;
                if (loadedCount === imageFiles.length) {
                    this.startGame();
                }
            };
            img.src = file;
            this.images[file] = img;
        });
    }
    
    loadSounds() {
        // Create Pokemon-themed sound effects using Web Audio API
        this.audioContext = null;
        try {
            // Enhanced compatibility for older Android browsers
            const AudioContext = window.AudioContext || 
                               window.webkitAudioContext || 
                               window.mozAudioContext || 
                               window.oAudioContext || 
                               window.msAudioContext;
            
            if (AudioContext) {
                this.audioContext = new AudioContext();
                
                // Handle suspended audio context (required for mobile browsers)
                if (this.audioContext.state === 'suspended') {
                    const resumeAudio = () => {
                        this.audioContext.resume();
                        document.removeEventListener('touchstart', resumeAudio);
                        document.removeEventListener('click', resumeAudio);
                    };
                    document.addEventListener('touchstart', resumeAudio);
                    document.addEventListener('click', resumeAudio);
                }
            } else {
                throw new Error('AudioContext not supported');
            }
        } catch (e) {
            console.log('Web Audio API not supported:', e);
            this.audioEnabled = false;
            return;
        }
        
        // Define sound frequencies for Pokemon-style effects
        this.soundFrequencies = {
            collect: [523, 659, 784], // C5, E5, G5 - cheerful collection sound
            powerup: [392, 523, 659, 784, 1047], // Pokemon level up sound
            damage: [220, 185, 147], // Descending damage sound
            victory: [523, 659, 784, 1047, 1319], // Victory fanfare
            move: [440], // Simple move beep
            encounter: [330, 370, 415], // Wild Pokemon encounter
            heal: [523, 587, 659, 740, 831] // Healing sound
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
                oscillator.type = soundType === 'damage' ? 'sawtooth' : 'square';
                
                const startTime = this.audioContext.currentTime + (index * 0.1);
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
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.player.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    this.player.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    this.player.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    this.player.nextDirection = 'right';
                    break;
            }
            e.preventDefault();
        });
        
        // Touch controls for mobile devices
        this.setupTouchControls();
        
        this.restartBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        const minSwipeDistance = 30;
        
        // Touch events for swipe gestures
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touch = e.changedTouches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            // Determine swipe direction
            if (Math.max(absDeltaX, absDeltaY) > minSwipeDistance) {
                if (absDeltaX > absDeltaY) {
                    // Horizontal swipe
                    this.player.nextDirection = deltaX > 0 ? 'right' : 'left';
                } else {
                    // Vertical swipe
                    this.player.nextDirection = deltaY > 0 ? 'down' : 'up';
                }
            }
        }, { passive: false });
        
        // Tap controls for direction buttons (if added to UI)
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.classList.contains('direction-btn')) {
                e.preventDefault();
                if (!this.gameRunning) return;
                
                const direction = target.dataset.direction;
                if (direction) {
                    this.player.nextDirection = direction;
                }
            }
        }, { passive: false });
    }
    
    canMove(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false; // Out of bounds
        }
        
        const terrain = this.map[y][x];
        
        // Impassable terrain: walls (0) and water (4)
        if (terrain === 0 || terrain === 4) {
            return false;
        }
        
        // All other terrain types are passable
        // 1=Pokeball, 2=Empty, 3=Grass, 5=Pokemon Center, 6=Power Berry
        return true;
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
        
        if (this.canMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Handle terrain interactions
            const terrain = this.map[newY][newX];
            
            if (terrain === 1) {
                // Collect pokeball
                this.map[newY][newX] = 2;
                this.score += 10;
                this.playSound('collect', 0.3);
                this.updateUI();
                
            } else if (terrain === 3) {
                // Walking through tall grass - chance of wild Pokemon encounter
                if (Math.random() < 0.1) {
                    this.score += 5; // Small bonus for brave exploration
                    this.playSound('encounter', 0.5);
                    console.log('Wild Pokemon appeared! +5 points for courage!');
                }
                
            } else if (terrain === 5) {
                // Pokemon Center - heal and bonus points
                if (this.lives < 3) {
                    this.lives = Math.min(3, this.lives + 1);
                    this.score += 50;
                    this.playSound('heal', 0.8);
                    console.log('Pokemon Center visited! Health restored! +50 points!');
                    this.updateUI();
                }
                
            } else if (terrain === 6) {
                // Power Berry - major bonus and temporary invincibility
                this.map[newY][newX] = 2;
                this.score += 100;
                this.lives = Math.min(3, this.lives + 1);
                this.playSound('powerup', 1.0);
                console.log('Power Berry collected! +100 points and extra life!');
                this.updateUI();
                
                // Temporary power-up effect (could be expanded)
                setTimeout(() => {
                    console.log('Power Berry effect wore off!');
                }, 5000);
            }
        }
    }
    
    moveEnemies() {
        this.enemies.forEach(enemy => {
            const directions = ['up', 'down', 'left', 'right'];
            const directionMap = {
                'up': { x: 0, y: -1 },
                'down': { x: 0, y: 1 },
                'left': { x: -1, y: 0 },
                'right': { x: 1, y: 0 }
            };
            
            // Try to continue in current direction
            let dir = directionMap[enemy.direction];
            let newX = enemy.x + dir.x;
            let newY = enemy.y + dir.y;
            
            // If can't move in current direction, choose random new direction
            if (!this.canMove(newX, newY)) {
                const availableDirections = directions.filter(d => {
                    const testDir = directionMap[d];
                    const testX = enemy.x + testDir.x;
                    const testY = enemy.y + testDir.y;
                    return this.canMove(testX, testY);
                });
                
                if (availableDirections.length > 0) {
                    enemy.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                    dir = directionMap[enemy.direction];
                    newX = enemy.x + dir.x;
                    newY = enemy.y + dir.y;
                }
            }
            
            // Occasionally change direction randomly for more unpredictable movement
            if (Math.random() < 0.1) {
                const availableDirections = directions.filter(d => {
                    const testDir = directionMap[d];
                    const testX = enemy.x + testDir.x;
                    const testY = enemy.y + testDir.y;
                    return this.canMove(testX, testY);
                });
                
                if (availableDirections.length > 0) {
                    enemy.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                    dir = directionMap[enemy.direction];
                    newX = enemy.x + dir.x;
                    newY = enemy.y + dir.y;
                }
            }
            
            if (this.canMove(newX, newY)) {
                enemy.x = newX;
                enemy.y = newY;
            }
        });
    }
    
    checkCollisions() {
        this.enemies.forEach(enemy => {
            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                this.lives--;
                this.playSound('damage', 0.4);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    // Reset player position
                    this.player.x = 1;
                    this.player.y = 1;
                    this.player.direction = 'right';
                }
            }
        });
    }
    
    checkWinCondition() {
        let pokeballsLeft = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === 1) {
                    pokeballsLeft++;
                }
            }
        }
        
        if (pokeballsLeft === 0) {
            this.score += 100; // Bonus for completing level
            this.updateUI();
            this.gameOver(true); // Win condition
        }
    }
    
    drawPikachu(centerX, centerY, size) {
        const ctx = this.ctx;
        
        // Save context
        ctx.save();
        
        // Pac-Man style body (bright yellow circle)
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Black outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Determine mouth direction based on player direction
        let mouthStartAngle = 0;
        let mouthEndAngle = 0;
        
        switch(this.player.direction) {
            case 'right':
                mouthStartAngle = -Math.PI / 6;
                mouthEndAngle = Math.PI / 6;
                break;
            case 'left':
                mouthStartAngle = Math.PI - Math.PI / 6;
                mouthEndAngle = Math.PI + Math.PI / 6;
                break;
            case 'up':
                mouthStartAngle = -Math.PI / 2 - Math.PI / 6;
                mouthEndAngle = -Math.PI / 2 + Math.PI / 6;
                break;
            case 'down':
                mouthStartAngle = Math.PI / 2 - Math.PI / 6;
                mouthEndAngle = Math.PI / 2 + Math.PI / 6;
                break;
        }
        
        // Draw mouth (Pac-Man style with animation)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        
        // Animate mouth opening and closing
        const mouthSize = this.mouthAnimation * 0.8 + 0.2; // 0.2 to 1.0
        const animatedStartAngle = mouthStartAngle * mouthSize;
        const animatedEndAngle = mouthEndAngle * mouthSize;
        
        ctx.arc(centerX, centerY, size * 0.9, animatedStartAngle, animatedEndAngle);
        ctx.closePath();
        ctx.fill();
        
        // Eyes (simple black dots)
        ctx.fillStyle = '#000';
        if (this.player.direction === 'up' || this.player.direction === 'down') {
            // Eyes on sides when moving up/down
            ctx.beginPath();
            ctx.arc(centerX - size * 0.3, centerY - size * 0.2, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(centerX + size * 0.3, centerY - size * 0.2, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Single eye when moving left/right
            const eyeX = this.player.direction === 'right' ? centerX - size * 0.2 : centerX + size * 0.2;
            ctx.beginPath();
            ctx.arc(eyeX, centerY - size * 0.3, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Restore context
        ctx.restore();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cellX = x * this.gridSize;
                const cellY = y * this.gridSize;
                
                if (this.map[y][x] === 0) {
                    // Rocky terrain walls - 8bit Pokemon style
                    this.ctx.fillStyle = '#444444';
                    this.ctx.fillRect(cellX + 1, cellY + 1, this.gridSize - 2, this.gridSize - 2);
                    
                    // Add rock texture with lighter highlights
                    this.ctx.fillStyle = '#666666';
                    this.ctx.fillRect(cellX + 2, cellY + 2, this.gridSize - 6, this.gridSize - 6);
                    
                    // Rock highlights (8bit style)
                    this.ctx.fillStyle = '#888888';
                    this.ctx.fillRect(cellX + 3, cellY + 3, 2, 2);
                    this.ctx.fillRect(cellX + this.gridSize - 6, cellY + 4, 2, 2);
                    
                } else if (this.map[y][x] === 1) {
                    // Draw pokeball using ball.png image
                    if (this.images['ball.png'] && this.images['ball.png'].complete) {
                        const ballSize = this.gridSize * 0.5;
                        const ballX = cellX + (this.gridSize - ballSize) / 2;
                        const ballY = cellY + (this.gridSize - ballSize) / 2;
                        this.ctx.drawImage(this.images['ball.png'], ballX, ballY, ballSize, ballSize);
                    } else {
                        // Fallback pokeball design
                        const centerX = cellX + this.gridSize/2;
                        const centerY = cellY + this.gridSize/2;
                        const radius = 4;
                        
                        // Red top half
                        this.ctx.fillStyle = '#FF0000';
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
                        this.ctx.fill();
                        
                        // White bottom half
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, radius, 0, Math.PI, false);
                        this.ctx.fill();
                        
                        // Center button
                        this.ctx.fillStyle = '#000000';
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                } else if (this.map[y][x] === 3) {
                    // Tall grass - Pokemon style
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(cellX + 2, cellY + 4, this.gridSize - 4, this.gridSize - 6);
                    
                    // Grass blades (8bit style)
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < 3; i++) {
                        const grassX = cellX + 4 + i * 3;
                        this.ctx.fillRect(grassX, cellY + 2, 1, this.gridSize - 4);
                    }
                    
                } else if (this.map[y][x] === 4) {
                    // Water patches - 8bit Pokemon style
                    this.ctx.fillStyle = '#0066CC';
                    this.ctx.fillRect(cellX + 1, cellY + 1, this.gridSize - 2, this.gridSize - 2);
                    
                    // Water highlights
                    this.ctx.fillStyle = '#3399FF';
                    this.ctx.fillRect(cellX + 2, cellY + 2, 2, 2);
                    this.ctx.fillRect(cellX + this.gridSize - 5, cellY + this.gridSize - 5, 2, 2);
                    
                } else if (this.map[y][x] === 5) {
                    // Pokemon Center - Red roof with white walls
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(cellX + 2, cellY + 4, this.gridSize - 4, this.gridSize - 6);
                    
                    // Red roof
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(cellX + 1, cellY + 1, this.gridSize - 2, 4);
                    
                    // Pokeball symbol on center
                    const centerX = cellX + this.gridSize/2;
                    const centerY = cellY + this.gridSize/2;
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                } else if (this.map[y][x] === 6) {
                    // Power Berry - Special glowing berry
                    const centerX = cellX + this.gridSize/2;
                    const centerY = cellY + this.gridSize/2;
                    
                    // Glowing effect
                    this.ctx.shadowColor = '#FF69B4';
                    this.ctx.shadowBlur = 8;
                    
                    // Berry body
                    this.ctx.fillStyle = '#FF1493';
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Berry highlight
                    this.ctx.fillStyle = '#FFB6C1';
                    this.ctx.beginPath();
                    this.ctx.arc(centerX - 1, centerY - 1, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 0;
                }
            }
        }
        
        // Draw player (Pikachu)
        const playerX = this.player.x * this.gridSize;
        const playerY = this.player.y * this.gridSize;
        
        if (this.images['pikachu.png'] && this.images['pikachu.png'].complete) {
            this.ctx.drawImage(this.images['pikachu.png'], playerX + 2, playerY + 2, this.gridSize - 4, this.gridSize - 4);
        } else {
            // Fallback to custom drawing if image not loaded
            const centerX = playerX + this.gridSize / 2;
            const centerY = playerY + this.gridSize / 2;
            this.drawPikachu(centerX, centerY, this.gridSize / 2 - 2);
        }
        
        // Draw enemies using PNG images
        this.enemies.forEach((enemy, index) => {
            const enemyX = enemy.x * this.gridSize;
            const enemyY = enemy.y * this.gridSize;
            
            // Use enemy.png, enemy2.png and enemy3.png in rotation
            const enemyImages = ['enemy.png', 'enemy2.png', 'enemy3.png'];
            const imageName = enemyImages[index % enemyImages.length];
            
            if (this.images[imageName] && this.images[imageName].complete) {
                this.ctx.drawImage(this.images[imageName], enemyX + 2, enemyY + 2, this.gridSize - 4, this.gridSize - 4);
            } else {
                // Fallback to custom ghost drawing if image not loaded
                const centerX = enemyX + this.gridSize / 2;
                const centerY = enemyY + this.gridSize / 2;
                
                // Ghost colors (classic Pac-Man colors)
                const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
                const color = ghostColors[index % ghostColors.length];
                
                // Ghost body (rounded top, wavy bottom)
                this.ctx.fillStyle = color;
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 6;
                
                this.ctx.beginPath();
                // Top half circle
                this.ctx.arc(centerX, centerY - this.gridSize * 0.1, this.gridSize * 0.4, Math.PI, 0);
                // Sides
                this.ctx.lineTo(centerX + this.gridSize * 0.4, centerY + this.gridSize * 0.3);
                // Wavy bottom
                this.ctx.lineTo(centerX + this.gridSize * 0.2, centerY + this.gridSize * 0.4);
                this.ctx.lineTo(centerX, centerY + this.gridSize * 0.3);
                this.ctx.lineTo(centerX - this.gridSize * 0.2, centerY + this.gridSize * 0.4);
                this.ctx.lineTo(centerX - this.gridSize * 0.4, centerY + this.gridSize * 0.3);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                // Black outline
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.levelElement.textContent = this.level;
    }
    
    getTrainerRank(score) {
        if (score >= 2000) return 'Pokeman Master';
        if (score >= 1500) return 'Elite Trainer';
        if (score >= 1000) return 'Gym Leader';
        if (score >= 700) return 'Ace Trainer';
        if (score >= 500) return 'Veteran';
        if (score >= 300) return 'Expert';
        if (score >= 150) return 'Trainer';
        return 'Rookie';
    }
    
    gameOver(won = false) {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.trainerRankElement.textContent = this.getTrainerRank(this.score);
        
        if (won) {
            this.gameOverElement.querySelector('h2').textContent = 'Pokemon Journey Complete!';
            this.gameOverElement.querySelector('h2').style.color = '#4CAF50';
        } else {
            this.gameOverElement.querySelector('h2').textContent = 'Pokemon Fainted!';
            this.gameOverElement.querySelector('h2').style.color = '#FF6B6B';
        }
        
        this.gameOverElement.classList.remove('hidden');
    }
    
    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.player.x = 1;
        this.player.y = 1;
        this.player.direction = 'right';
        this.player.nextDirection = null;
        
        // Reset enemies
        this.enemies[0] = { x: 18, y: 1, direction: 'left', type: 'enemy.png', speed: 1 };
        this.enemies[1] = { x: 1, y: 13, direction: 'up', type: 'enemy2.png', speed: 1 };
        this.enemies[2] = { x: 18, y: 13, direction: 'down', type: 'enemy3.png', speed: 1 };
        
        this.createMap();
        this.updateUI();
        this.gameOverElement.classList.add('hidden');
        this.startGame();
    }
    
    startGame() {
        this.gameRunning = true;
        this.updateUI();
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        // Update animation time
        this.animationTime = currentTime;
        this.mouthAnimation = Math.sin(currentTime * 0.01) * 0.5 + 0.5; // 0 to 1
        this.frameCount++;
        
        const deltaTime = currentTime - this.lastTime;
        
        // Adjust game speed based on device performance
        const gameSpeed = this.performanceMode ? 250 : 200; // Slower on mobile for better performance
        
        if (deltaTime >= gameSpeed) {
            this.movePlayer();
            this.moveEnemies();
            this.checkCollisions();
            this.checkWinCondition();
            this.lastTime = currentTime;
        }
        
        // Reduce render frequency on mobile devices
        const shouldRender = this.performanceMode ? (this.frameCount % 2 === 0) : true;
        
        if (shouldRender) {
            this.render();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
}

// Polyfills for older browsers
(function() {
    // RequestAnimationFrame polyfill
    let lastTime = 0;
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    for(let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
        
    // Performance.now polyfill
    if (!window.performance) {
        window.performance = {};
    }
    if (!window.performance.now) {
        window.performance.now = function() {
            return Date.now();
        };
    }
})();

// Start the game when page loads
window.addEventListener('load', () => {
    new PokemonPacman();
});
