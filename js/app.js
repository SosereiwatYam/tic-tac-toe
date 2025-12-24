// Screen Manager
class ScreenManager {
    constructor() {
        this.screens = {
            splash: document.getElementById('splash-screen'),
            mainMenu: document.getElementById('main-menu'),
            difficulty: document.getElementById('difficulty-screen'),
            game: document.getElementById('game-screen')
        };
        
        this.currentScreen = 'splash';
        this.init();
    }
    
    init() {
        const backBtnSplash = document.querySelector('.back-btn-splash');
        if (backBtnSplash) {
            backBtnSplash.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('splash'); // Go directly to splash screen
            });
        }
        // Event listeners for navigation
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
            
        });
        
        // Menu option clicks
        document.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                if (mode === 'ai') {
                    this.showScreen('difficulty');
                } else if (mode === 'pvp') {
                    game.startGame('pvp');
                    this.showScreen('game');
                }
            });
        });
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                game.startGame('ai', difficulty);
                this.showScreen('game');
            });
        });
        
        // Play now button on splash screen
        document.querySelector('.play-now-btn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            game.resetGame();
        });
    }
    
    showScreen(screenName) {
        // If we're leaving the game screen (going back to menu or difficulty screen)
        if (this.currentScreen === 'game' && screenName !== 'game') {
            // Reset the game completely to clean state
            this.resetGameScreen();
        }
        
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show requested screen
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;
        
        // Update UI based on screen
        this.updateScreenUI(screenName);
    }

    resetGameScreen() {
        // Reset game state
        if (game) {
            game.gameActive = false;
            
            // Clear game result display
            const gameResult = document.getElementById('game-result');
            if (gameResult) {
                gameResult.className = 'game-result';
                gameResult.textContent = '';
                gameResult.innerHTML = '';
            }
            
            // Hide AI thinking indicator
            const aiThinking = document.getElementById('ai-thinking');
            if (aiThinking) {
                aiThinking.style.display = 'none';
            }
            
            // Reset all board cells
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.textContent = '';
                cell.className = 'cell';
                cell.classList.remove('winning', 'x', 'o', 'occupied', 'placed', 'hint');
            });
            
            // Reset current player display
            const currentPlayerMarker = document.getElementById('current-player-marker');
            if (currentPlayerMarker) {
                currentPlayerMarker.textContent = 'X';
                currentPlayerMarker.className = 'player-marker x';
            }
            
            // Reset turn status
            const turnStatus = document.getElementById('turn-status');
            if (turnStatus) {
                turnStatus.textContent = 'Your Turn';
            }
        }
        
        // Remove confetti overlay
        const confettiOverlay = document.getElementById('confetti-overlay');
        if (confettiOverlay) {
            confettiOverlay.classList.remove('active');
        }
        
        // Remove all confetti particles
        document.querySelectorAll('.confetti').forEach(c => c.remove());
    }
    
    goBack() {
        const backMap = {
            'game': this.currentScreen === 'game' ? (game.gameMode === 'ai' ? 'difficulty' : 'mainMenu') : null,
            'difficulty': 'mainMenu',
            'mainMenu': 'mainMenu'
        };
        
        const targetScreen = backMap[this.currentScreen];
        if (targetScreen) {
            this.showScreen(targetScreen);
        }
    }
    
    updateScreenUI(screenName) {
        // Update game mode display when entering game screen
        if (screenName === 'game') {
            const display = document.getElementById('game-mode-display');
            if (game.gameMode === 'ai') {
                display.textContent = `Player vs AI (${game.difficulty})`;
            } else {
                display.textContent = 'Player vs Player';
            }
            
            // Show/hide hint button
            const hintBtn = document.getElementById('hint-btn');
            hintBtn.style.display = game.gameMode === 'ai' ? 'flex' : 'none';
        }
    }
}

// Initialize screen manager when DOM is loaded
let screenManager;
let game;

document.addEventListener('DOMContentLoaded', () => {
    screenManager = new ScreenManager();
    game = new TicTacToeGame();
});