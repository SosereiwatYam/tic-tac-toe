class TicTacToeGame {
    constructor() {
        this.boardSize = 6;
        this.winLength = 4;
        this.board = [];
        this.currentPlayer = 'X';
        this.gameMode = ''; // 'pvp' or 'ai'
        this.difficulty = '';
        this.gameActive = false;
        this.ai = null;
        this.lastMove = null;
        
        this.init();
    }
    
    init() {
        this.boardElement = document.getElementById('game-board');
        this.currentPlayerMarker = document.getElementById('current-player-marker');
        this.turnStatus = document.getElementById('turn-status');
        this.gameResult = document.getElementById('game-result');
        this.confettiOverlay = document.getElementById('confetti-overlay');
        this.aiThinking = document.getElementById('ai-thinking');
        
        this.initializeBoard();
        this.createBoardUI();
        this.setupEventListeners();
    }
    
    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => 
            Array(this.boardSize).fill('')
        );
    }
    
    createBoardUI() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('aria-label', `Cell ${row + 1}, ${col + 1}`);
                cell.setAttribute('tabindex', this.gameActive ? '0' : '-1');
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleCellClick(row, col);
                    }
                });
                
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameActive) {
                screenManager.goBack();
            }
        });
    }
    

    startGame(mode, difficulty = null) {
    // Clear any previous game state
    this.gameResult.className = 'game-result';
    this.gameResult.textContent = '';
    this.gameResult.innerHTML = '';
    
    // Reset the rest of your existing code
    this.gameMode = mode;
    this.difficulty = difficulty;
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.lastMove = null;
    this.winningCells = null;
    
    this.initializeBoard();
    this.createBoardUI();
    this.updateUI();
    
    // Initialize AI if needed
    if (mode === 'ai' && difficulty) {
        this.ai = new SuperAI('O', difficulty);
        
        // If AI goes first
        if (Math.random() > 0.5) {
            this.currentPlayer = 'O';
            this.makeAIMove();
        }
    }
}
    
    handleCellClick(row, col) {
        if (!this.gameActive || this.board[row][col] !== '') return;
        
        // Play click sound
        this.playSound('click');
        
        this.makeMove(row, col);
        
        // If playing against AI and game is still active
        if (this.gameMode === 'ai' && this.gameActive && this.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.lastMove = { row, col };
        
        const cell = this.boardElement.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
        );
        cell.textContent = this.currentPlayer;
        cell.classList.add('occupied', this.currentPlayer.toLowerCase(), 'placed');
        cell.setAttribute('aria-label', `${this.currentPlayer} placed at cell ${row + 1}, ${col + 1}`);
        
        // Check for win or draw
        if (this.checkWin(row, col)) {
            this.handleWin();
            return;
        }
        
        if (this.checkDraw()) {
            this.handleDraw();
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateUI();
    }
    
    makeAIMove() {
        if (!this.ai || !this.gameActive || this.currentPlayer !== 'O') return;
        
        this.showAIThinking(true);
        
        // Add slight delay for better UX
        setTimeout(() => {
            const move = this.ai.getMove(this.board, this.lastMove);
            if (move) {
                this.showAIThinking(false);
                this.makeMove(move.row, move.col);
            }
        }, this.difficulty === 'hard' ? 1000 : 500);
    }
    
    showAIThinking(show) {
        if (show) {
            this.aiThinking.style.display = 'flex';
            this.turnStatus.textContent = 'AI is thinking...';
        } else {
            this.aiThinking.style.display = 'none';
        }
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        if (!player) return false;
        
        // Directions: horizontal, vertical, diagonal down-right, diagonal down-left
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1; // Count current cell
            
            // Check positive direction
            for (let i = 1; i < this.winLength; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                
                if (this.isValidCell(newRow, newCol) && 
                    this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check negative direction
            for (let i = 1; i < this.winLength; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                
                if (this.isValidCell(newRow, newCol) && 
                    this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= this.winLength) {
                this.winningCells = this.getWinningCells(row, col, dx, dy, player);
                return true;
            }
        }
        
        return false;
    }
    
    getWinningCells(row, col, dx, dy, player) {
        const cells = [];
        
        // Find start of winning line
        let startRow = row;
        let startCol = col;
        
        while (this.isValidCell(startRow - dx, startCol - dy) && 
               this.board[startRow - dx][startCol - dy] === player) {
            startRow -= dx;
            startCol -= dy;
        }
        
        // Collect winning cells
        for (let i = 0; i < this.winLength; i++) {
            const winRow = startRow + dx * i;
            const winCol = startCol + dy * i;
            
            if (this.isValidCell(winRow, winCol) && 
                this.board[winRow][winCol] === player) {
                cells.push({ row: winRow, col: winCol });
            }
        }
        
        return cells;
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    checkDraw() {
        return this.board.every(row => row.every(cell => cell !== ''));
    }
    
    handleWin() {
        this.gameActive = false;
        this.playSound('win');
        
        // Highlight winning cells
        this.highlightWinningCells();
        
        // Show confetti
        this.showConfetti();
        
        // Update result display
        const winner = this.currentPlayer === 'X' ? 'Player 1 (X)' : 
                      this.gameMode === 'pvp' ? 'Player 2 (O)' : 'AI (O)';
        
        this.gameResult.textContent = `${winner} Wins! 🏆`;
        this.gameResult.className = 'game-result show win';
        this.gameResult.innerHTML = `
            <i class="ph ph-trophy"></i>
            <span>${winner} Wins!</span>
            <i class="ph ph-trophy"></i>
        `;
        
        this.turnStatus.textContent = 'Game Over';
    }
    
    handleDraw() {
        this.gameActive = false;
        this.playSound('draw');
        
        this.gameResult.textContent = "It's a Draw! 🤝";
        this.gameResult.className = 'game-result show draw';
        this.gameResult.innerHTML = `
            <i class="ph ph-handshake"></i>
            <span>It's a Draw!</span>
            <i class="ph ph-handshake"></i>
        `;
        
        this.turnStatus.textContent = 'Game Over';
    }
    
    highlightWinningCells() {
        this.winningCells.forEach(({ row, col }) => {
            const cell = this.boardElement.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );
            cell.classList.add('winning');
        });
    }
    
    showConfetti() {
        this.confettiOverlay.classList.add('active');
        
        // Create confetti particles
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${this.getRandomColor()};
                top: -20px;
                left: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.5 + 0.5};
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => confetti.remove(), 5000);
        }
        
        // Remove confetti after delay
        setTimeout(() => {
            this.confettiOverlay.classList.remove('active');
        }, 3000);
    }
    
    getRandomColor() {
        const colors = [
            '#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    showHint() {
        if (this.gameMode !== 'ai' || this.currentPlayer !== 'X' || !this.gameActive) return;
        
        // Get AI's suggested move
        const hintAI = new SuperAI('X', this.difficulty);
        const move = hintAI.getMove(this.board, this.lastMove);
        
        if (move) {
            const cell = this.boardElement.querySelector(
                `[data-row="${move.row}"][data-col="${move.col}"]`
            );
            
            // Add hint animation
            cell.classList.add('hint');
            setTimeout(() => cell.classList.remove('hint'), 2000);
        }
    }
    
    updateUI() {
        // Update current player marker
        this.currentPlayerMarker.textContent = this.currentPlayer;
        this.currentPlayerMarker.className = `player-marker ${this.currentPlayer.toLowerCase()}`;
        
        // Update turn status
        if (this.gameMode === 'pvp') {
            this.turnStatus.textContent = this.currentPlayer === 'X' ? 
                "Player 1's Turn (X)" : "Player 2's Turn (O)";
        } else {
            this.turnStatus.textContent = this.currentPlayer === 'X' ? 
                "Your Turn (X)" : "AI's Turn (O)";
        }
        
        // Update tabindex for accessibility
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.setAttribute('tabindex', this.gameActive ? '0' : '-1');
        });
    }
    
    resetGame() {
        this.gameActive = false;
        this.gameResult.className = 'game-result';
        this.gameResult.textContent = '';
        this.confettiOverlay.classList.remove('active');
        
        // Remove existing confetti
        document.querySelectorAll('.confetti').forEach(c => c.remove());
        
        // Start new game with same settings
        setTimeout(() => {
            this.startGame(this.gameMode, this.difficulty);
        }, 300);
    }
}

// Add confetti animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(${Math.random() * 360}deg);
            opacity: 0;
        }
    }
    
    .hint {
        animation: hintPulse 0.5s ease-in-out 3;
    }
    
    @keyframes hintPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
        50% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
    }
`;
document.head.appendChild(style);
