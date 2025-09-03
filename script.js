// Game State Management
class BattleCardGame {
    constructor() {
        this.cards = [];
        this.selectedCard = null;
        this.opponentCard = null;
        this.gamePhase = 'selection'; // selection, battle, result
        this.battleLog = [];
        this.soundEffects = {
            battleStart: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-show-intro-331.mp3'),
            attack: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-spell-attack-2761.mp3'),
            defend: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-shield-2780.mp3'),
            victory: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
            defeat: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-losing-drums-2023.mp3'),
            cardSelect: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3'),
            hover: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3')
        };
        
        // Set volume levels
        Object.values(this.soundEffects).forEach(sound => {
            sound.volume = 0.6;
        });
        
        this.initializeCards();
        this.initializeEventListeners();
        this.renderCardCollection();
    }

    // Inisialisasi data kartu dengan statistik
    initializeCards() {
        this.cards = [
            {
                id: 1,
                name: "Fire Dragon",
                attack: 85,
                defense: 70,
                health: 90,
                image: "cards/card (1).jpg",
                description: "Legendary dragon that commands fire"
            },
            {
                id: 2,
                name: "Silver Knight",
                attack: 75,
                defense: 90,
                health: 80,
                image: "cards/card (2).jpg",
                description: "Brave knight with silver armor"
            },
            {
                id: 3,
                name: "Dark Wizard",
                attack: 95,
                defense: 50,
                health: 70,
                image: "cards/card (3).jpg",
                description: "Wizard who masters dark magic"
            },
            {
                id: 4,
                name: "Stone Giant",
                attack: 70,
                defense: 95,
                health: 100,
                image: "cards/card (4).jpg",
                description: "Giant with impenetrable defense"
            },
            {
                id: 5,
                name: "Elf Archer",
                attack: 80,
                defense: 60,
                health: 75,
                image: "cards/card (5).jpg",
                description: "Elf archer with perfect accuracy"
            },
            {
                id: 6,
                name: "Phoenix",
                attack: 90,
                defense: 65,
                health: 85,
                image: "cards/card (6).jpg",
                description: "Fire bird that can rise again"
            },
            {
                id: 7,
                name: "Samurai",
                attack: 88,
                defense: 75,
                health: 82,
                image: "cards/card (7).jpg",
                description: "Warrior with legendary sword techniques"
            },
            {
                id: 8,
                name: "Unicorn",
                attack: 65,
                defense: 80,
                health: 95,
                image: "cards/card (8).jpg",
                description: "Sacred creature with healing powers"
            },
            {
                id: 9,
                name: "Shadow Assassin",
                attack: 92,
                defense: 55,
                health: 78,
                image: "cards/card (9).jpg",
                description: "Silent killer that strikes from the shadows"
            },
            {
                id: 10,
                name: "Ancient Golem",
                attack: 76,
                defense: 98,
                health: 110,
                image: "cards/card (10).jpg",
                description: "Ancient protector with immense endurance"
            }
        ];
    }

    // Event Listeners
    initializeEventListeners() {
        document.getElementById('confirmSelection').addEventListener('click', () => {
            this.startBattle();
        });

        document.getElementById('battleBtn').addEventListener('click', () => {
            this.executeBattle();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('changeCardBtn').addEventListener('click', () => {
            this.backToSelection();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('cardModal').addEventListener('click', (e) => {
            if (e.target.id === 'cardModal') {
                this.closeModal();
            }
        });
    }

    // Render koleksi kartu
    renderCardCollection() {
        const collection = document.getElementById('cardCollection');
        if (!collection) {
            console.error('Card collection element not found');
            return;
        }

        // Update dynamic card count in header
        const countEl = document.querySelector('.card-count');
        if (countEl) {
            countEl.textContent = `${this.cards.length} Cards Available`;
        }
        
        collection.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card);
            // Add staggered animation delay for Pokemon-style entrance
            cardElement.style.animationDelay = `${index * 0.1}s`;
            // Ensure card is visible
            cardElement.style.opacity = '1';
            cardElement.style.visibility = 'visible';
            collection.appendChild(cardElement);
        });
    }

    // Membuat elemen kartu
    createCardElement(card, isInBattle = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${isInBattle ? 'battle-card-content' : ''}`;
        cardDiv.dataset.cardId = card.id;

        const imageDiv = document.createElement('div');
        imageDiv.className = 'card-image';
        
        // Improved image loading with better error handling
        const loadImage = () => {
            const img = new Image();
            
            img.onload = () => {
                imageDiv.style.backgroundImage = `url("${card.image}")`;
                imageDiv.style.backgroundSize = 'cover';
                imageDiv.style.backgroundPosition = 'center';
                imageDiv.style.backgroundRepeat = 'no-repeat';
                // Clear placeholder when image loads
                imageDiv.innerHTML = '';
            };
            
            img.onerror = () => {
                // Enhanced fallback with better styling
                imageDiv.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: #666;
                        font-size: 24px;
                        text-align: center;
                        background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                    ">
                        <div style="font-size: 48px; margin-bottom: 8px;">🃏</div>
                        <div style="font-size: 12px; font-weight: bold;">${card.name}</div>
                    </div>
                `;
            };
            
            // Set source to trigger loading
            img.src = card.image;
        };
        
        // Initial placeholder with loading state
        imageDiv.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #999;
                font-size: 14px;
                text-align: center;
                background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%);
            ">
                <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
                <div>Loading...</div>
            </div>
        `;
        
        // Start loading image
        setTimeout(loadImage, 100); // Small delay to show loading state

        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = card.name;

        const statsDiv = document.createElement('div');
        statsDiv.className = 'card-stats';
        statsDiv.innerHTML = `
            <span class="stat attack">ATK: ${card.attack}</span>
            <span class="stat defense">DEF: ${card.defense}</span>
            <span class="stat health">HP: ${card.health}</span>
        `;

        cardDiv.appendChild(imageDiv);
        cardDiv.appendChild(nameDiv);
        cardDiv.appendChild(statsDiv);

        if (!isInBattle) {
            cardDiv.addEventListener('mouseenter', () => {
                this.playSound('hover');
            });
            
            cardDiv.addEventListener('click', () => this.selectCard(card));
            cardDiv.addEventListener('dblclick', () => this.showCardDetail(card));
        }

        return cardDiv;
    }

    // Pilih kartu
    selectCard(card) {
        // Remove previous selection
        document.querySelectorAll('.card.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new card
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            cardElement.classList.add('selected');
            // Ensure selected card remains visible
            cardElement.style.opacity = '1';
            cardElement.style.visibility = 'visible';
            cardElement.style.display = 'block';
        }
        
        this.selectedCard = card;
        this.playSound('cardSelect');
        const confirmBtn = document.getElementById('confirmSelection');
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
        
        this.updateGameStatus(`Card ${card.name} selected. Click Confirm to continue.`);
    }

    // Tampilkan detail kartu
    showCardDetail(card) {
        const modal = document.getElementById('cardModal');
        const cardDetail = document.getElementById('cardDetail');
        
        cardDetail.innerHTML = `
            <div class="card-image" style="background-image: url('${card.image}'); height: 200px;">
                <div style="text-align: center; color: #666; ${card.image ? 'display: none;' : ''}">🃏<br>${card.name}</div>
            </div>
            <div class="card-name">${card.name}</div>
            <p style="margin: 15px 0; color: #666; font-style: italic;">${card.description}</p>
            <div class="card-stats">
                <span class="stat attack">Attack: ${card.attack}</span>
                <span class="stat defense">Defense: ${card.defense}</span>
                <span class="stat health">Health: ${card.health}</span>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #f7fafc; border-radius: 8px;">
                <strong>Total Power: ${card.attack + card.defense + card.health}</strong>
            </div>
        `;
        
        modal.style.display = 'block';
        modal.classList.add('fade-in');
    }

    // Tutup modal
    closeModal() {
        const modal = document.getElementById('cardModal');
        modal.style.display = 'none';
        modal.classList.remove('fade-in');
    }

    // Method untuk memainkan efek suara
    playSound(soundName) {
        if (this.soundEffects[soundName]) {
            const sound = this.soundEffects[soundName].cloneNode();
            sound.volume = 0.6;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    // Mulai pertarungan
    startBattle() {
        if (!this.selectedCard) return;

        // Play battle start sound
        this.playSound('battleStart');

        // Pilih kartu lawan secara acak
        const availableCards = this.cards.filter(card => card.id !== this.selectedCard.id);
        this.opponentCard = availableCards[Math.floor(Math.random() * availableCards.length)];

        // Ubah tampilan ke arena pertarungan
        document.getElementById('cardSelection').style.display = 'none';
        document.getElementById('battleArena').style.display = 'block';
        document.getElementById('battleArena').classList.add('fade-in');

        // Activate battle arena glow effect
        const battleField = document.querySelector('.battle-field');
        if (battleField) {
            battleField.classList.add('battle-active');
        }

        this.gamePhase = 'battle';
        this.renderBattleCards();
        this.updateGameStatus('Battle Arena - Select card and press BATTLE!');
        
        document.getElementById('battleBtn').disabled = false;
        this.addBattleLog('Battle started! Select card to fight.', 'info');
    }

    // Render kartu di arena pertarungan
    renderBattleCards() {
        const playerCardDiv = document.getElementById('playerCard');
        const opponentCardDiv = document.getElementById('opponentCard');
        const playerStatsDiv = document.getElementById('playerStats');
        const opponentStatsDiv = document.getElementById('opponentStats');

        // Player card
        playerCardDiv.innerHTML = '';
        const playerCardElement = this.createCardElement(this.selectedCard, true);
        playerCardElement.classList.add('player');
        playerCardDiv.appendChild(playerCardElement);

        // Opponent card
        opponentCardDiv.innerHTML = '';
        const opponentCardElement = this.createCardElement(this.opponentCard, true);
        opponentCardElement.classList.add('opponent');
        opponentCardDiv.appendChild(opponentCardElement);

        // Stats
        playerStatsDiv.innerHTML = `
            <span class="stat attack">ATK: ${this.selectedCard.attack}</span>
            <span class="stat defense">DEF: ${this.selectedCard.defense}</span>
            <span class="stat health">HP: ${this.selectedCard.health}</span>
        `;

        opponentStatsDiv.innerHTML = `
            <span class="stat attack">ATK: ${this.opponentCard.attack}</span>
            <span class="stat defense">DEF: ${this.opponentCard.defense}</span>
            <span class="stat health">HP: ${this.opponentCard.health}</span>
        `;
    }

    // Eksekusi pertarungan
    executeBattle() {
        if (!this.selectedCard || !this.opponentCard) return;

        document.getElementById('battleBtn').disabled = true;
        this.addBattleLog(`${this.selectedCard.name} VS ${this.opponentCard.name}`, 'info');

        // Get battle card elements
        const playerBattleCard = document.querySelector('#playerCard .card.player');
        const opponentBattleCard = document.querySelector('#opponentCard .card.opponent');

        // Start battle animation sequence
        this.playBattleAnimation(playerBattleCard, opponentBattleCard).then(() => {
            // Sistem pertarungan yang fair dan transparan
            const playerPower = this.calculateBattlePower(this.selectedCard);
            const opponentPower = this.calculateBattlePower(this.opponentCard);

            this.addBattleLog(`${this.selectedCard.name} - Total Power: ${playerPower}`, 'info');
            this.addBattleLog(`${this.opponentCard.name} - Total Power: ${opponentPower}`, 'info');

            // Tentukan pemenang
            let result;
            if (playerPower > opponentPower) {
                result = 'win';
                this.addBattleLog(`${this.selectedCard.name} wins!`, 'win');
                this.playVictoryAnimation(playerBattleCard, opponentBattleCard, 'player');
            } else if (playerPower < opponentPower) {
                result = 'lose';
                this.addBattleLog(`${this.opponentCard.name} wins!`, 'lose');
                this.playVictoryAnimation(playerBattleCard, opponentBattleCard, 'opponent');
            } else {
                result = 'draw';
                this.addBattleLog('Battle ends in a draw!', 'info');
            }

            // Tampilkan hasil setelah delay
            setTimeout(() => {
                // Play appropriate sound effect
                if (result === 'win') {
                    this.playSound('victory');
                } else if (result === 'lose') {
                    this.playSound('defeat');
                }
                
                this.showBattleResult(result, playerPower, opponentPower);
            }, 3000);
        });
    }

    // Play battle animation sequence with enhanced effects
    async playBattleAnimation(playerCard, opponentCard) {
        return new Promise((resolve) => {
            // Phase 1: Player attacks
            playerCard.classList.add('attacking');
            opponentCard.classList.add('defending');
            this.playSound('attack');
            
            // Add attack particles
            setTimeout(() => {
                this.createParticleEffect(playerCard, 'attack');
            }, 300);
            
            // Add defend particles
            setTimeout(() => {
                this.createParticleEffect(opponentCard, 'defend');
                this.playSound('defend');
            }, 500);
            
            setTimeout(() => {
                playerCard.classList.remove('attacking');
                opponentCard.classList.remove('defending');
                
                // Phase 2: Opponent counter-attacks
                    setTimeout(() => {
                        opponentCard.classList.add('attacking');
                        playerCard.classList.add('defending');
                        this.playSound('attack');
                        
                        // Add counter-attack particles
                        setTimeout(() => {
                            this.createParticleEffect(opponentCard, 'attack');
                        }, 300);
                        
                        // Add counter-defend particles
                        setTimeout(() => {
                            this.createParticleEffect(playerCard, 'defend');
                            this.playSound('defend');
                        }, 500);
                    
                    setTimeout(() => {
                        opponentCard.classList.remove('attacking');
                        playerCard.classList.remove('defending');
                        resolve();
                    }, 1000);
                }, 300);
            }, 1200);
        });
    }

    // Play victory animation with enhanced effects
    playVictoryAnimation(playerCard, opponentCard, winner) {
        const winnerCard = winner === 'player' ? playerCard : opponentCard;
        
        if (winner === 'player') {
            playerCard.classList.add('winner');
            this.createParticleEffect(playerCard, 'victory');
        } else {
            opponentCard.classList.add('winner');
            this.createParticleEffect(opponentCard, 'victory');
        }
        
        // Add enhanced victory effects
        this.createVictoryExplosion(winnerCard, winner);
        this.createConfettiEffect(winner);
        this.createVictoryText(winner);
        
        // Add screen flash effect
        this.createScreenFlash(winner === 'player' ? 'green' : 'red');
        
        // Add victory sound effect simulation
        this.simulateVictorySound(winner);
    }
    
    createVictoryExplosion(card, winner) {
        const explosion = document.createElement('div');
        explosion.className = 'victory-explosion';
        explosion.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            margin: -100px 0 0 -100px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                ${winner === 'player' ? 'rgba(72, 187, 120, 0.8)' : 'rgba(245, 101, 101, 0.8)'} 0%, 
                ${winner === 'player' ? 'rgba(72, 187, 120, 0.4)' : 'rgba(245, 101, 101, 0.4)'} 50%, 
                transparent 100%);
            animation: victoryExplosion 1.5s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        card.style.position = 'relative';
        card.appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 1500);
    }
    
    createConfettiEffect(winner) {
        const colors = winner === 'player' ? 
            ['#48bb78', '#38a169', '#2f855a', '#ffd700'] : 
            ['#f56565', '#e53e3e', '#c53030', '#ff8c00'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    top: -10px;
                    left: ${Math.random() * 100}%;
                    width: ${Math.random() * 10 + 5}px;
                    height: ${Math.random() * 10 + 5}px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                    animation: confettiFall ${Math.random() * 3 + 2}s linear;
                    pointer-events: none;
                    z-index: 1001;
                    transform: rotate(${Math.random() * 360}deg);
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 5000);
            }, i * 100);
        }
    }
    
    createVictoryText(winner) {
        const victoryText = document.createElement('div');
        victoryText.className = 'victory-text-overlay';
        victoryText.innerHTML = winner === 'player' ? 
            '<span>VICTORY! </span>' : 
            '<span>DEFEAT </span>';
        
        victoryText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 64px;
            font-weight: bold;
            color: ${winner === 'player' ? '#48bb78' : '#f56565'};
            text-shadow: 0 0 30px ${winner === 'player' ? 'rgba(72, 187, 120, 0.8)' : 'rgba(245, 101, 101, 0.8)'};
            z-index: 1002;
            pointer-events: none;
            animation: victoryTextAppear 2s ease-out;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 4px;
        `;
        
        document.body.appendChild(victoryText);
        
        setTimeout(() => {
            if (victoryText.parentNode) {
                victoryText.parentNode.removeChild(victoryText);
            }
        }, 2000);
    }
    
    simulateVictorySound(winner) {
        // Create visual sound waves effect
        const soundWaves = document.createElement('div');
        soundWaves.className = 'sound-waves';
        soundWaves.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            margin: -50px 0 0 -50px;
            border: 3px solid ${winner === 'player' ? '#48bb78' : '#f56565'};
            border-radius: 50%;
            animation: soundWaveExpand 1s ease-out 3;
            pointer-events: none;
            z-index: 999;
        `;
        
        document.body.appendChild(soundWaves);
        
        setTimeout(() => {
            if (soundWaves.parentNode) {
                soundWaves.parentNode.removeChild(soundWaves);
            }
        }, 3000);
    }

    // Create particle effects
    createParticleEffect(cardElement, type) {
        const particleCount = type === 'victory' ? 15 : 8;
        const colors = {
            victory: ['#00ff88', '#ffd700', '#ff6b00'],
            attack: ['#ff0000', '#ff6600', '#ffaa00'],
            defend: ['#0066ff', '#00aaff', '#66ccff']
        };
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'battle-particle';
            
            const color = colors[type][Math.floor(Math.random() * colors[type].length)];
            particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
            
            const rect = cardElement.getBoundingClientRect();
            particle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            particle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            
            particle.style.animationDelay = (Math.random() * 0.5) + 's';
            particle.style.animationDuration = (1 + Math.random() * 0.5) + 's';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }

    // Create screen flash effect
    createScreenFlash(color) {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        
        const flashColor = color === 'green' ? 'rgba(0, 255, 100, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        flash.style.background = flashColor;
        flash.style.opacity = '0';
        flash.style.transition = 'opacity 0.2s ease-in-out';
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => {
                    if (flash.parentNode) {
                        flash.parentNode.removeChild(flash);
                    }
                }, 200);
            }, 100);
        }, 10);
    }

    // Hitung kekuatan pertarungan
    calculateBattlePower(card) {
        // Formula: Attack * 1.2 + Defense * 1.0 + Health * 0.8
        // Memberikan bobot lebih pada attack, seimbang pada defense, dan sedikit pada health
        const attackWeight = 1.2;
        const defenseWeight = 1.0;
        const healthWeight = 0.8;
        
        const power = Math.round(
            (card.attack * attackWeight) + 
            (card.defense * defenseWeight) + 
            (card.health * healthWeight)
        );
        
        // Tambahkan sedikit faktor acak (±5%) untuk variasi
        const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95 - 1.05
        return Math.round(power * randomFactor);
    }

    // Tampilkan hasil pertarungan
    showBattleResult(result, playerPower, opponentPower) {
        document.getElementById('battleArena').style.display = 'none';
        document.getElementById('battleResult').style.display = 'block';
        document.getElementById('battleResult').classList.add('fade-in');

        const resultTitle = document.getElementById('resultTitle');
        const resultDetails = document.getElementById('resultDetails');

        let title, subtitle, details;
        switch (result) {
            case 'win':
                title = 'VICTORY';
                subtitle = 'Congratulations! You won the battle!';
                resultTitle.className = 'win';
                details = `
                    <div class="battle-result-subtitle">${subtitle}</div>
                    <h3>${this.selectedCard.name} successfully defeated ${this.opponentCard.name}!</h3>
                    <div style="margin: 20px 0;">
                        <div><strong>${this.selectedCard.name}</strong> - Power: ${playerPower}</div>
                        <div><strong>${this.opponentCard.name}</strong> - Power: ${opponentPower}</div>
                        <div style="margin-top: 10px; color: #2f855a;">Difference: +${playerPower - opponentPower}</div>
                    </div>
                    <div class="battle-result-stats">
                        <div class="result-stat">
                            <span class="stat-label">Your Card:</span>
                            <span class="stat-value">${this.selectedCard.name}</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-label">Opponent:</span>
                            <span class="stat-value">${this.opponentCard.name}</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-label">Battle Duration:</span>
                            <span class="stat-value">${this.getBattleDuration()}s</span>
                        </div>
                    </div>
                    <div class="battle-result-actions">
                        <button class="action-btn primary" onclick="game.resetGame()">
                            <span class="btn-text">New Battle</span>
                        </button>
                        <button class="action-btn secondary" onclick="game.backToSelection()">
                            <span class="btn-text">Main Menu</span>
                        </button>
                    </div>
                `;
                break;
            case 'lose':
                title = 'DEFEAT';
                subtitle = 'Better luck next time!';
                resultTitle.className = 'lose';
                details = `
                    <div class="battle-result-subtitle">${subtitle}</div>
                    <h3>${this.opponentCard.name} successfully defeated ${this.selectedCard.name}!</h3>
                    <div style="margin: 20px 0;">
                        <div><strong>${this.selectedCard.name}</strong> - Power: ${playerPower}</div>
                        <div><strong>${this.opponentCard.name}</strong> - Power: ${opponentPower}</div>
                        <div style="margin-top: 10px; color: #c53030;">Difference: -${opponentPower - playerPower}</div>
                    </div>
                    <div class="battle-result-stats">
                        <div class="result-stat">
                            <span class="stat-label">Your Card:</span>
                            <span class="stat-value">${this.selectedCard.name}</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-label">Opponent:</span>
                            <span class="stat-value">${this.opponentCard.name}</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-label">Battle Duration:</span>
                            <span class="stat-value">${this.getBattleDuration()}s</span>
                        </div>
                    </div>
                    <div class="battle-result-actions">
                        <button class="action-btn primary" onclick="game.resetGame()">
                            <span class="btn-text">New Battle</span>
                        </button>
                        <button class="action-btn secondary" onclick="game.backToSelection()">
                            <span class="btn-text">Main Menu</span>
                        </button>
                    </div>
                `;
                break;
            case 'draw':
                title = 'DRAW';
                subtitle = 'An evenly matched battle!';
                resultTitle.className = 'draw';
                details = `
                    <div class="battle-result-subtitle">${subtitle}</div>
                    <h3>Battle ends in a draw!</h3>
                    <div style="margin: 20px 0;">
                        <div><strong>${this.selectedCard.name}</strong> - Power: ${playerPower}</div>
                        <div><strong>${this.opponentCard.name}</strong> - Power: ${opponentPower}</div>
                        <div style="margin-top: 10px; color: #d69e2e;">Equal power!</div>
                    </div>
                    <div class="battle-result-stats">
                        <div class="result-stat">
                            <span class="stat-label">Battle Duration:</span>
                            <span class="stat-value">${this.getBattleDuration()}s</span>
                        </div>
                    </div>
                `;
                break;
        }

        resultTitle.textContent = title;
        resultDetails.innerHTML = details + `
            <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px; font-size: 0.9em;">
                <strong>Calculation Formula:</strong><br>
                Power = (Attack × 1.2) + (Defense × 1.0) + (Health × 0.8) + Random Factor (±5%)
            </div>
        `;

        this.gamePhase = 'result';
        this.updateGameStatus('Battle completed!');
    }

    getBattleDuration() {
        // Simple battle duration calculation (can be enhanced)
        return (Math.random() * 5 + 2).toFixed(1);
    }
    
    startNewBattle() {
        // Hide battle result
        document.getElementById('battleResult').style.display = 'none';
        
        // Reset selected cards
        this.selectedCard = null;
        this.opponentCard = null;
        
        // Show card selection phase
        this.showPhase('selection');
        
        // Clear any existing selections
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Reset battle button
        const battleBtn = document.getElementById('battleBtn');
        if (battleBtn) {
            battleBtn.disabled = true;
            battleBtn.textContent = 'Select a Card';
        }
    }
    
    backToSelection() {
        this.startNewBattle();
    }

    // Tambah log pertarungan
    addBattleLog(message, type = 'info') {
        const logContent = document.getElementById('battleLogContent');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    // Update status game
    updateGameStatus(status) {
        document.getElementById('gamePhase').textContent = status;
    }

    // Reset game
    resetGame() {
        // Reset dengan kartu lawan baru
        const availableCards = this.cards.filter(card => card.id !== this.selectedCard.id);
        this.opponentCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        
        document.getElementById('battleResult').style.display = 'none';
        document.getElementById('battleArena').style.display = 'block';
        
        // Reset battle animations
        const battleField = document.querySelector('.battle-field');
        if (battleField) {
            battleField.classList.remove('battle-active');
        }
        
        // Reset card animations
        document.querySelectorAll('#playerCard .card, #opponentCard .card').forEach(card => {
            card.classList.remove('attacking', 'defending', 'winner');
        });
        
        this.gamePhase = 'battle';
        this.renderBattleCards();
        
        // Clear battle log
        document.getElementById('battleLogContent').innerHTML = '<p>Ready for battle!</p>';
        
        document.getElementById('battleBtn').disabled = false;
        this.updateGameStatus('Battle Arena - Ready to fight again!');
    }

    // Kembali ke pemilihan kartu
    backToSelection() {
        document.getElementById('battleResult').style.display = 'none';
        document.getElementById('battleArena').style.display = 'none';
        document.getElementById('cardSelection').style.display = 'block';
        
        // Reset battle animations
        const battleField = document.querySelector('.battle-field');
        if (battleField) {
            battleField.classList.remove('battle-active');
        }
        
        // Reset card animations
        document.querySelectorAll('#playerCard .card, #opponentCard .card').forEach(card => {
            card.classList.remove('attacking', 'defending', 'winner');
        });
        
        this.selectedCard = null;
        this.opponentCard = null;
        this.gamePhase = 'selection';
        
        // Reset battle log
        document.getElementById('battleLogContent').innerHTML = '<p>Ready for battle!</p>';
        
        // Clear selections
        document.querySelectorAll('.card.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        document.getElementById('confirmSelection').disabled = true;
        this.updateGameStatus('Select Your Card');
    }
}

// Inisialisasi game ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    new BattleCardGame();
});

// Fungsi utilitas untuk membuat folder kartu jika diperlukan
function createCardFolder() {
    // Fungsi ini bisa dipanggil untuk membuat folder cards
    // Dalam implementasi nyata, ini akan menangani pembuatan folder
    console.log('Cards folder ready to store card images');
    console.log('Place card images with names:');
    console.log('- dragon_fire.jpg');
    console.log('- silver_knight.jpg');
    console.log('- dark_wizard.jpg');
    console.log('- stone_giant.jpg');
    console.log('- elf_archer.jpg');
    console.log('- phoenix.jpg');
    console.log('- samurai.jpg');
    console.log('- unicorn.jpg');
}

// Panggil fungsi untuk informasi folder
createCardFolder();