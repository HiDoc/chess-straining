import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChessGame } from '../useChessGame'

describe('useChessGame', () => {
  let chessGame: ReturnType<typeof useChessGame>

  beforeEach(() => {
    chessGame = useChessGame()
  })

  describe('Initial State', () => {
    it('should start with the initial FEN position', () => {
      expect(chessGame.currentFen.value).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should start with white to move', () => {
      expect(chessGame.currentTurn.value).toBe('white')
    })

    it('should not be in checkmate initially', () => {
      expect(chessGame.isCheckmate()).toBe(false)
    })

    it('should not be in stalemate initially', () => {
      expect(chessGame.isStalemate()).toBe(false)
    })

    it('should not be game over initially', () => {
      expect(chessGame.isGameOver()).toBe(false)
    })
  })

  describe('makeMove', () => {
    it('should make a valid move from coordinates', () => {
      const move = chessGame.makeMove('e2', 'e4')
      expect(move).not.toBeNull()
      expect(move?.san).toBe('e4')
      expect(chessGame.currentTurn.value).toBe('black')
    })

    it('should return null for an invalid move', () => {
      const move = chessGame.makeMove('e2', 'e5')
      expect(move).toBeNull()
      expect(chessGame.currentTurn.value).toBe('white')
    })

    it('should handle pawn promotion with default queen', () => {
      // Simple promotion test: advance pawn to 7th rank, then promote
      chessGame.rebuildFromHistory([
        'e4', 'd5', 'exd5', 'Nf6', 'd6', 'Nxd6', 'cxd6', 'e6',
        'd7+', 'Kf8'
      ])
      // Now promote the pawn on d7 to d8
      const promoteMove = chessGame.makeMove('d7', 'd8')
      expect(promoteMove).not.toBeNull()
      expect(promoteMove?.promotion).toBe('q')
    })

    it('should update FEN after move', () => {
      const initialFen = chessGame.currentFen.value
      chessGame.makeMove('e2', 'e4')
      const newFen = chessGame.currentFen.value
      expect(newFen).not.toBe(initialFen)
      expect(newFen).toContain('b KQkq')
      expect(newFen).toContain('4P3')
    })
  })

  describe('makeMoveByNotation', () => {
    it('should make a valid move from algebraic notation', () => {
      const move = chessGame.makeMoveByNotation('e4')
      expect(move).not.toBeNull()
      expect(move?.san).toBe('e4')
      expect(chessGame.currentTurn.value).toBe('black')
    })

    it('should handle piece moves with notation', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')
      const move = chessGame.makeMoveByNotation('Nf3')
      expect(move).not.toBeNull()
      expect(move?.san).toBe('Nf3')
    })

    it('should return null for invalid notation', () => {
      const move = chessGame.makeMoveByNotation('invalid')
      expect(move).toBeNull()
      expect(chessGame.currentTurn.value).toBe('white')
    })

    it('should handle castling notation', () => {
      chessGame.rebuildFromHistory(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'])
      const move = chessGame.makeMoveByNotation('O-O')
      expect(move).not.toBeNull()
      expect(move?.san).toBe('O-O')
    })
  })

  describe('undo', () => {
    it('should undo the last move', () => {
      chessGame.makeMove('e2', 'e4')
      const undoneMove = chessGame.undo()
      expect(undoneMove).not.toBeNull()
      expect(undoneMove?.san).toBe('e4')
      expect(chessGame.currentTurn.value).toBe('white')
      expect(chessGame.currentFen.value).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should return null when no moves to undo', () => {
      const undoneMove = chessGame.undo()
      expect(undoneMove).toBeNull()
    })

    it('should undo multiple moves correctly', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')
      chessGame.makeMoveByNotation('Nf3')

      chessGame.undo()
      expect(chessGame.currentTurn.value).toBe('white')

      chessGame.undo()
      expect(chessGame.currentTurn.value).toBe('black')

      chessGame.undo()
      expect(chessGame.currentTurn.value).toBe('white')
      expect(chessGame.currentFen.value).toContain('w KQkq - 0 1')
    })
  })

  describe('reset', () => {
    it('should reset the game to initial position', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')
      chessGame.makeMoveByNotation('Nf3')

      chessGame.reset()

      expect(chessGame.currentFen.value).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
      expect(chessGame.currentTurn.value).toBe('white')
    })
  })

  describe('rebuildFromHistory', () => {
    it('should rebuild game from move history', () => {
      const moves = ['e4', 'e5', 'Nf3', 'Nc6']
      chessGame.rebuildFromHistory(moves)

      expect(chessGame.currentTurn.value).toBe('white')
      expect(chessGame.currentFen.value).toContain('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R')
    })

    it('should handle empty history', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.rebuildFromHistory([])

      expect(chessGame.currentFen.value).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should skip invalid moves and log errors', () => {
      // This tests that invalid moves don't break the rebuild
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const moves = ['e4', 'invalid', 'e5']
      chessGame.rebuildFromHistory(moves)

      // Should have logged error for invalid move
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Should have e4, e5 (skipping 'invalid')
      expect(chessGame.currentTurn.value).toBe('white')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Game Status', () => {
    it('should detect checkmate - Scholar\'s Mate', () => {
      chessGame.rebuildFromHistory(['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'])
      expect(chessGame.isCheckmate()).toBe(true)
      expect(chessGame.isGameOver()).toBe(true)
    })

    it('should detect stalemate', () => {
      // Set up a stalemate position
      chessGame.rebuildFromHistory([
        'e3', 'a5', 'Qh5', 'Ra6', 'Qxa5', 'h5', 'h4', 'Rah6',
        'Qxc7', 'f6', 'Qxd7+', 'Kf7', 'Qxb7', 'Qd3', 'Qxb8',
        'Qh7', 'Qxc8', 'Kg6', 'Qe6'
      ])
      expect(chessGame.isStalemate()).toBe(true)
      expect(chessGame.isGameOver()).toBe(true)
    })
  })

  describe('getFen', () => {
    it('should return current FEN string', () => {
      const fen = chessGame.getFen()
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    })

    it('should return updated FEN after moves', () => {
      chessGame.makeMoveByNotation('e4')
      const fen = chessGame.getFen()
      expect(fen).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3')
    })
  })

  describe('Reactive State', () => {
    it('should update currentTurn reactively', () => {
      expect(chessGame.currentTurn.value).toBe('white')
      chessGame.makeMoveByNotation('e4')
      expect(chessGame.currentTurn.value).toBe('black')
      chessGame.makeMoveByNotation('e5')
      expect(chessGame.currentTurn.value).toBe('white')
    })

    it('should update currentFen reactively', () => {
      const initialFen = chessGame.currentFen.value
      chessGame.makeMoveByNotation('e4')
      expect(chessGame.currentFen.value).not.toBe(initialFen)
    })
  })
})
