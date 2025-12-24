class SuperAI {
    constructor(player, difficulty = 'medium') {
        this.player = player; // 'X' or 'O'
        this.opponent = player === 'X' ? 'O' : 'X';
        this.difficulty = difficulty;
        
        // Heatmap for positional preference (center is better)
        this.heatmap = this.generateHeatmap(6);
    }
    
    generateHeatmap(size) {
        const heatmap = Array(size).fill().map(() => Array(size).fill(0));
        const center = (size - 1) / 2;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                // Distance from center (Euclidean distance)
                const distance = Math.sqrt(
                    Math.pow(row - center, 2) + Math.pow(col - center, 2)
                );
                // Higher score for positions closer to center
                heatmap[row][col] = Math.max(0, (size/2 - distance) / (size/2));
            }
        }
        
        return heatmap;
    }
    
    getMove(board, lastMove) {
        const emptyCells = this.getEmptyCells(board);
        if (emptyCells.length === 0) return null;
        
        switch (this.difficulty) {
            case 'easy':
                return this.getEasyMove(board, emptyCells);
            case 'medium':
                return this.getMediumMove(board, emptyCells);
            case 'hard':
                return this.getHardMove(board, emptyCells);
            default:
                return this.getMediumMove(board, emptyCells);
        }
    }
    
    getEmptyCells(board) {
        const cells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (board[row][col] === '') {
                    cells.push({ row, col });
                }
            }
        }
        return cells;
    }
    
    getEasyMove(board, emptyCells) {
        // 70% random, 30% strategic
        if (Math.random() < 0.7) {
            // Pure random
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
            // Try to block or win
            const strategicMove = this.findWinningMove(board, this.player) ||
                                 this.findWinningMove(board, this.opponent);
            return strategicMove || emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    }
    
    getMediumMove(board, emptyCells) {
        // Check for immediate win
        const winningMove = this.findWinningMove(board, this.player);
        if (winningMove) return winningMove;
        
        // Check for opponent's immediate win
        const blockingMove = this.findWinningMove(board, this.opponent);
        if (blockingMove) return blockingMove;
        
        // Look for potential winning lines (3 in a row)
        const potentialMove = this.findPotentialWin(board, this.player, 3);
        if (potentialMove) return potentialMove;
        
        // Look for opponent's potential winning lines
        const opponentPotential = this.findPotentialWin(board, this.opponent, 3);
        if (opponentPotential) return opponentPotential;
        
        // Use heatmap for best position
        return this.getBestPosition(board, emptyCells);
    }
    
    getHardMove(board, emptyCells) {
        // Check for immediate win
        const winningMove = this.findWinningMove(board, this.player);
        if (winningMove) return winningMove;
        
        // Check for opponent's immediate win
        const blockingMove = this.findWinningMove(board, this.opponent);
        if (blockingMove) return blockingMove;
        
        // Look for fork opportunities (creating multiple winning threats)
        const forkMove = this.findForkMove(board, this.player);
        if (forkMove) return forkMove;
        
        // Block opponent's fork opportunities
        const blockForkMove = this.findForkMove(board, this.opponent);
        if (blockForkMove) return blockForkMove;
        
        // Look for potential winning lines
        const potentialMove = this.findPotentialWin(board, this.player, 2);
        if (potentialMove) return potentialMove;
        
        // Look for opponent's potential winning lines
        const opponentPotential = this.findPotentialWin(board, this.opponent, 2);
        if (opponentPotential) return opponentPotential;
        
        // Use minimax for deeper lookahead
        const minimaxMove = this.minimax(board, 2, true);
        if (minimaxMove.move) return minimaxMove.move;
        
        // Fallback to best position
        return this.getBestPosition(board, emptyCells);
    }
    
    findWinningMove(board, player) {
        for (const cell of this.getEmptyCells(board)) {
            // Simulate move
            board[cell.row][cell.col] = player;
            
            // Check if this creates a win
            const hasWin = this.checkWinForPlayer(board, player, cell.row, cell.col);
            
            // Undo move
            board[cell.row][cell.col] = '';
            
            if (hasWin) {
                return cell;
            }
        }
        return null;
    }
    
    findPotentialWin(board, player, requiredLength) {
        const emptyCells = this.getEmptyCells(board);
        
        for (const cell of emptyCells) {
            // Check all directions
            const directions = [[0,1],[1,0],[1,1],[1,-1]];
            
            for (const [dx, dy] of directions) {
                let count = 1;
                
                // Count consecutive marks in both directions
                for (let dir = -1; dir <= 1; dir += 2) {
                    for (let i = 1; i < 4; i++) {
                        const row = cell.row + dx * i * dir;
                        const col = cell.col + dy * i * dir;
                        
                        if (row >= 0 && row < 6 && col >= 0 && col < 6) {
                            if (board[row][col] === player) {
                                count++;
                            } else if (board[row][col] !== '') {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                }
                
                if (count >= requiredLength) {
                    // Check if this move creates an open-ended opportunity
                    if (this.isOpenEnded(board, cell.row, cell.col, dx, dy, player)) {
                        return cell;
                    }
                }
            }
        }
        
        return null;
    }
    
    isOpenEnded(board, row, col, dx, dy, player) {
        // Check if placing at (row, col) creates an open-ended line
        let openEnds = 0;
        
        // Check both ends
        for (let dir = -1; dir <= 1; dir += 2) {
            let distance = 1;
            let foundEmpty = false;
            
            while (distance < 4) {
                const newRow = row + dx * distance * dir;
                const newCol = col + dy * distance * dir;
                
                if (newRow < 0 || newRow >= 6 || newCol < 0 || newCol >= 6) {
                    break;
                }
                
                const cellContent = board[newRow][newCol];
                if (cellContent === '') {
                    foundEmpty = true;
                    break;
                } else if (cellContent !== player) {
                    break;
                }
                
                distance++;
            }
            
            if (foundEmpty) openEnds++;
        }
        
        return openEnds > 0;
    }
    
    findForkMove(board, player) {
        const emptyCells = this.getEmptyCells(board);
        
        for (const cell of emptyCells) {
            // Simulate move
            board[cell.row][cell.col] = player;
            
            // Count how many winning opportunities this creates
            let winOpportunities = 0;
            
            for (const testCell of this.getEmptyCells(board)) {
                board[testCell.row][testCell.col] = player;
                if (this.checkWinForPlayer(board, player, testCell.row, testCell.col)) {
                    winOpportunities++;
                }
                board[testCell.row][testCell.col] = '';
                
                if (winOpportunities >= 2) {
                    // This is a fork
                    board[cell.row][cell.col] = '';
                    return cell;
                }
            }
            
            // Undo move
            board[cell.row][cell.col] = '';
        }
        
        return null;
    }
    
    getBestPosition(board, emptyCells) {
        let bestScore = -Infinity;
        let bestMoves = [];
        
        for (const cell of emptyCells) {
            let score = this.heatmap[cell.row][cell.col] * 10;
            
            // Add bonus for positions that might lead to wins
            score += this.evaluatePosition(board, cell.row, cell.col, this.player);
            
            // Subtract penalty for giving opponent opportunities
            score -= this.evaluatePosition(board, cell.row, cell.col, this.opponent) * 0.8;
            
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [cell];
            } else if (Math.abs(score - bestScore) < 0.1) {
                bestMoves.push(cell);
            }
        }
        
        // Choose randomly among equally good moves
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    
    evaluatePosition(board, row, col, player) {
        let score = 0;
        const directions = [[0,1],[1,0],[1,1],[1,-1]];
        
        for (const [dx, dy] of directions) {
            let lineScore = 0;
            let emptyCount = 0;
            let playerCount = 0;
            
            // Evaluate in both directions
            for (let dir = -1; dir <= 1; dir += 2) {
                for (let i = 1; i < 4; i++) {
                    const newRow = row + dx * i * dir;
                    const newCol = col + dy * i * dir;
                    
                    if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 6) {
                        const cellContent = board[newRow][newCol];
                        if (cellContent === player) {
                            playerCount++;
                        } else if (cellContent === '') {
                            emptyCount++;
                        } else {
                            break; // Opponent's piece blocks this direction
                        }
                    }
                }
            }
            
            // Calculate line score
            if (playerCount === 3 && emptyCount >= 1) {
                lineScore = 100; // Immediate win
            } else if (playerCount === 2 && emptyCount >= 2) {
                lineScore = 20; // Potential win
            } else if (playerCount === 1 && emptyCount >= 3) {
                lineScore = 5; // Developing line
            }
            
            score += lineScore;
        }
        
        return score;
    }
    
    minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        // Base cases
        const winner = this.checkBoardWinner(board);
        if (winner === this.player) return { score: 100 - depth };
        if (winner === this.opponent) return { score: -100 + depth };
        
        const emptyCells = this.getEmptyCells(board);
        if (emptyCells.length === 0 || depth === 0) {
            return { score: this.evaluateBoard(board) };
        }
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            let bestMove = null;
            
            for (const cell of emptyCells) {
                board[cell.row][cell.col] = this.player;
                const result = this.minimax(board, depth - 1, false, alpha, beta);
                board[cell.row][cell.col] = '';
                
                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = cell;
                }
                
                alpha = Math.max(alpha, bestScore);
                if (beta <= alpha) break; // Beta cutoff
            }
            
            return { score: bestScore, move: bestMove };
        } else {
            let bestScore = Infinity;
            let bestMove = null;
            
            for (const cell of emptyCells) {
                board[cell.row][cell.col] = this.opponent;
                const result = this.minimax(board, depth - 1, true, alpha, beta);
                board[cell.row][cell.col] = '';
                
                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = cell;
                }
                
                beta = Math.min(beta, bestScore);
                if (beta <= alpha) break; // Alpha cutoff
            }
            
            return { score: bestScore, move: bestMove };
        }
    }
    
    checkBoardWinner(board) {
        // Check all positions for a win
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (board[row][col] !== '') {
                    if (this.checkWinForPlayer(board, board[row][col], row, col)) {
                        return board[row][col];
                    }
                }
            }
        }
        return null;
    }
    
    checkWinForPlayer(board, player, row, col) {
        const directions = [[0,1],[1,0],[1,1],[1,-1]];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            for (let dir = -1; dir <= 1; dir += 2) {
                for (let i = 1; i < 4; i++) {
                    const newRow = row + dx * i * dir;
                    const newCol = col + dy * i * dir;
                    
                    if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 6) {
                        if (board[newRow][newCol] === player) {
                            count++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
            
            if (count >= 4) return true;
        }
        
        return false;
    }
    
    evaluateBoard(board) {
        let score = 0;
        
        // Evaluate all possible 4-in-a-row lines
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (board[row][col] === this.player) {
                    score += this.heatmap[row][col] * 2;
                } else if (board[row][col] === this.opponent) {
                    score -= this.heatmap[row][col] * 2;
                }
            }
        }
        
        // Evaluate lines
        score += this.evaluateLines(board, this.player) * 5;
        score -= this.evaluateLines(board, this.opponent) * 5;
        
        return score;
    }
    
    evaluateLines(board, player) {
        let score = 0;
        
        // Check all possible 4-in-a-row lines
        const lines = this.getAllLines();
        
        for (const line of lines) {
            let playerCount = 0;
            let emptyCount = 0;
            
            for (const [row, col] of line) {
                if (board[row][col] === player) {
                    playerCount++;
                } else if (board[row][col] === '') {
                    emptyCount++;
                }
            }
            
            if (playerCount === 4) {
                score += 100;
            } else if (playerCount === 3 && emptyCount === 1) {
                score += 10;
            } else if (playerCount === 2 && emptyCount === 2) {
                score += 3;
            } else if (playerCount === 1 && emptyCount === 3) {
                score += 1;
            }
        }
        
        return score;
    }
    
    getAllLines() {
        const lines = [];
        
        // Horizontal lines
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col <= 2; col++) {
                const line = [];
                for (let i = 0; i < 4; i++) {
                    line.push([row, col + i]);
                }
                lines.push(line);
            }
        }
        
        // Vertical lines
        for (let col = 0; col < 6; col++) {
            for (let row = 0; row <= 2; row++) {
                const line = [];
                for (let i = 0; i < 4; i++) {
                    line.push([row + i, col]);
                }
                lines.push(line);
            }
        }
        
        // Diagonal down-right
        for (let row = 0; row <= 2; row++) {
            for (let col = 0; col <= 2; col++) {
                const line = [];
                for (let i = 0; i < 4; i++) {
                    line.push([row + i, col + i]);
                }
                lines.push(line);
            }
        }
        
        // Diagonal down-left
        for (let row = 0; row <= 2; row++) {
            for (let col = 3; col < 6; col++) {
                const line = [];
                for (let i = 0; i < 4; i++) {
                    line.push([row + i, col - i]);
                }
                lines.push(line);
            }
        }
        
        return lines;
    }
}