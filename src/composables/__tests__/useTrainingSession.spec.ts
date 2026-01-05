import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTrainingSession } from '../useTrainingSession'
import { useChessGame } from '../useChessGame'
import { setActivePinia, createPinia } from 'pinia'
import { useRepertoireStore } from '../../stores/repertoire'

describe('useTrainingSession', () => {
  let chessGame: ReturnType<typeof useChessGame>
  let repertoireStore: ReturnType<typeof useRepertoireStore>
  let trainingSession: ReturnType<typeof useTrainingSession>

  beforeEach(() => {
    setActivePinia(createPinia())
    chessGame = useChessGame()
    repertoireStore = useRepertoireStore()
    trainingSession = useTrainingSession(chessGame, repertoireStore)

    // Set up a basic repertoire for testing
    repertoireStore.white = {
      e4: {
        e5: {
          Nf3: {}
        }
      }
    }
    repertoireStore.black = {
      e4: {
        e5: {}
      }
    }
    repertoireStore.currentColor = 'white'
    repertoireStore.currentLine = []
  })

  describe('Initial State', () => {
    it('should start in training mode (not edit mode)', () => {
      expect(trainingSession.isEditMode.value).toBe(false)
    })

    it('should get current color from repertoire store', () => {
      expect(trainingSession.currentColor.value).toBe('white')

      repertoireStore.currentColor = 'black'
      expect(trainingSession.currentColor.value).toBe('black')
    })
  })

  describe('handlePlayerMove - Training Mode', () => {
    beforeEach(() => {
      repertoireStore.currentColor = 'white'
      repertoireStore.currentRepertoire = repertoireStore.white
    })

    it('should accept valid repertoire move', () => {
      const result = trainingSession.handlePlayerMove('e4', chessGame.currentFen.value)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Correct move!')
      expect(result.checkTransposition).toBe(true)
      expect(result.continueTraining).toBe(true)
    })

    it('should reject invalid repertoire move', () => {
      const result = trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Not in your repertoire! Try again.')
      expect(result.undoRequired).toBe(true)
    })

    it('should update repertoire store on valid move', () => {
      const makeMoveSpy = vi.spyOn(repertoireStore, 'makeMove')

      trainingSession.handlePlayerMove('e4', chessGame.currentFen.value)

      expect(makeMoveSpy).toHaveBeenCalledWith('e4')
    })

    it('should not update store on invalid move', () => {
      const makeMoveSpy = vi.spyOn(repertoireStore, 'makeMove')

      trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)

      expect(makeMoveSpy).not.toHaveBeenCalled()
    })
  })

  describe('handlePlayerMove - Edit Mode', () => {
    beforeEach(() => {
      trainingSession.toggleEditMode()
      repertoireStore.currentColor = 'white'
      repertoireStore.currentRepertoire = repertoireStore.white
    })

    it('should accept any move in edit mode', () => {
      const result = trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Added move d4 to repertoire')
      expect(result.checkTransposition).toBe(true)
    })

    it('should add move to repertoire', () => {
      const addMoveSpy = vi.spyOn(repertoireStore, 'addMoveToRepertoire')

      trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)

      expect(addMoveSpy).toHaveBeenCalledWith(repertoireStore.currentLine, 'd4')
    })

    it('should update store with new move', () => {
      const makeMoveSpy = vi.spyOn(repertoireStore, 'makeMove')

      trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)

      expect(makeMoveSpy).toHaveBeenCalledWith('d4')
    })
  })

  describe('shouldShowLineComplete', () => {
    it('should return true when no more moves available and line has moves', () => {
      repertoireStore.currentRepertoire = {}
      repertoireStore.currentLine = ['e4', 'e5']

      expect(trainingSession.shouldShowLineComplete()).toBe(true)
    })

    it('should return false when moves are available', () => {
      repertoireStore.currentRepertoire = { e4: {} }
      repertoireStore.currentLine = ['e4']

      expect(trainingSession.shouldShowLineComplete()).toBe(false)
    })

    it('should return false when line is empty', () => {
      repertoireStore.currentRepertoire = {}
      repertoireStore.currentLine = []

      expect(trainingSession.shouldShowLineComplete()).toBe(false)
    })

    it('should ignore "name" property in repertoire', () => {
      repertoireStore.currentRepertoire = { name: 'Test Line' }
      repertoireStore.currentLine = ['e4']

      expect(trainingSession.shouldShowLineComplete()).toBe(true)
    })
  })

  describe('getAvailableMoves', () => {
    it('should return list of available moves', () => {
      repertoireStore.currentRepertoire = {
        e4: {},
        d4: {},
        Nf3: {}
      }

      const moves = trainingSession.getAvailableMoves()

      expect(moves).toHaveLength(3)
      expect(moves).toContain('e4')
      expect(moves).toContain('d4')
      expect(moves).toContain('Nf3')
    })

    it('should exclude "name" property', () => {
      repertoireStore.currentRepertoire = {
        name: 'Opening',
        e4: {},
        d4: {}
      }

      const moves = trainingSession.getAvailableMoves()

      expect(moves).toHaveLength(2)
      expect(moves).not.toContain('name')
    })

    it('should return empty array when no moves available', () => {
      repertoireStore.currentRepertoire = {}

      const moves = trainingSession.getAvailableMoves()

      expect(moves).toHaveLength(0)
    })
  })

  describe('toggleEditMode', () => {
    it('should toggle edit mode on', () => {
      expect(trainingSession.isEditMode.value).toBe(false)

      const result = trainingSession.toggleEditMode()

      expect(result).toBe(true)
      expect(trainingSession.isEditMode.value).toBe(true)
    })

    it('should toggle edit mode off', () => {
      trainingSession.toggleEditMode()
      expect(trainingSession.isEditMode.value).toBe(true)

      const result = trainingSession.toggleEditMode()

      expect(result).toBe(false)
      expect(trainingSession.isEditMode.value).toBe(false)
    })

    it('should toggle multiple times correctly', () => {
      trainingSession.toggleEditMode()
      trainingSession.toggleEditMode()
      trainingSession.toggleEditMode()

      expect(trainingSession.isEditMode.value).toBe(true)
    })
  })

  describe('startSession', () => {
    it('should reset chess game', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')

      trainingSession.startSession('white')

      expect(chessGame.currentFen.value).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should call store startNewSession with correct color', () => {
      const startSessionSpy = vi.spyOn(repertoireStore, 'startNewSession')

      trainingSession.startSession('black')

      expect(startSessionSpy).toHaveBeenCalledWith('black')
    })

    it('should work for white', () => {
      trainingSession.startSession('white')

      expect(repertoireStore.currentColor).toBe('white')
    })

    it('should work for black', () => {
      trainingSession.startSession('black')

      expect(repertoireStore.currentColor).toBe('black')
    })
  })

  describe('rollback', () => {
    beforeEach(() => {
      repertoireStore.currentColor = 'white'
      chessGame.makeMoveByNotation('e4') // white
      repertoireStore.currentLine.push('e4')
      chessGame.makeMoveByNotation('e5') // black
      repertoireStore.currentLine.push('e5')
    })

    it('should undo to previous player turn when on opponent turn', () => {
      // Currently black's turn, need to undo white's last move
      expect(chessGame.currentTurn.value).toBe('white')

      trainingSession.rollback()

      // Should be back to before white's move
      expect(repertoireStore.currentLine).toHaveLength(1)
      expect(chessGame.currentTurn.value).toBe('black')
    })

    it('should undo two moves when on player turn', () => {
      chessGame.makeMoveByNotation('Nf3') // white
      repertoireStore.currentLine.push('Nf3')

      // Currently on player (white) turn
      expect(chessGame.currentTurn.value).toBe('black')

      trainingSession.rollback()

      // Should undo both opponent and player moves
      expect(repertoireStore.currentLine).toHaveLength(1)
      expect(chessGame.currentTurn.value).toBe('black')
    })

    it('should not rollback if line has less than 1 move', () => {
      repertoireStore.currentLine = []
      const undoSpy = vi.spyOn(chessGame, 'undo')

      trainingSession.rollback()

      expect(undoSpy).not.toHaveBeenCalled()
    })

    it('should call store rollbackMove appropriate number of times', () => {
      const rollbackSpy = vi.spyOn(repertoireStore, 'rollbackMove')

      trainingSession.rollback()

      expect(rollbackSpy).toHaveBeenCalled()
    })
  })

  describe('requestNewWhiteMove', () => {
    it('should reset chess game', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')

      trainingSession.requestNewWhiteMove()

      expect(chessGame.currentFen.value).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should clear current line', () => {
      repertoireStore.currentLine = ['e4', 'e5']

      trainingSession.requestNewWhiteMove()

      expect(repertoireStore.currentLine).toHaveLength(0)
    })

    it('should clear game history', () => {
      repertoireStore.gameHistory = ['e4', 'e5']

      trainingSession.requestNewWhiteMove()

      expect(repertoireStore.gameHistory).toHaveLength(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle a complete training sequence', () => {
      // Start as white
      trainingSession.startSession('white')

      // Play e4 (valid)
      let result = trainingSession.handlePlayerMove('e4', chessGame.currentFen.value)
      expect(result.success).toBe(true)

      // Try invalid move
      result = trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)
      expect(result.success).toBe(false)

      // After opponent moves e5, check if line is complete
      repertoireStore.currentLine = ['e4', 'e5']
      repertoireStore.currentRepertoire = repertoireStore.white.e4.e5

      const hasMoreMoves = !trainingSession.shouldShowLineComplete()
      expect(hasMoreMoves).toBe(true) // Nf3 is available
    })

    it('should switch between edit and training mode seamlessly', () => {
      // Start in training mode
      expect(trainingSession.isEditMode.value).toBe(false)

      // Invalid move should fail
      let result = trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)
      expect(result.success).toBe(false)

      // Switch to edit mode
      trainingSession.toggleEditMode()

      // Same move should succeed
      result = trainingSession.handlePlayerMove('d4', chessGame.currentFen.value)
      expect(result.success).toBe(true)

      // Switch back to training
      trainingSession.toggleEditMode()

      // Invalid move should fail again
      result = trainingSession.handlePlayerMove('c4', chessGame.currentFen.value)
      expect(result.success).toBe(false)
    })
  })
})
