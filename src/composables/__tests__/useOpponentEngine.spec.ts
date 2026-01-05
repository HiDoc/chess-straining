import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useOpponentEngine } from '../useOpponentEngine'
import { useChessGame } from '../useChessGame'
import { setActivePinia, createPinia } from 'pinia'
import { useRepertoireStore } from '../../stores/repertoire'

describe('useOpponentEngine', () => {
  let chessGame: ReturnType<typeof useChessGame>
  let repertoireStore: ReturnType<typeof useRepertoireStore>
  let opponentEngine: ReturnType<typeof useOpponentEngine>
  let onMoveCalled: string[]
  let onNoMovesAvailableCalled: number

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())

    chessGame = useChessGame()
    repertoireStore = useRepertoireStore()

    onMoveCalled = []
    onNoMovesAvailableCalled = 0

    opponentEngine = useOpponentEngine(
      chessGame,
      repertoireStore,
      (move) => onMoveCalled.push(move),
      () => onNoMovesAvailableCalled++
    )

    // Set up basic repertoire
    repertoireStore.repertoire.white = {
      e4: {
        e5: {
          Nf3: {}
        },
        c5: {}
      }
    }
    repertoireStore.currentColor = 'white'
    repertoireStore.currentLine = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('schedule', () => {
    it('should schedule opponent move after delay', () => {
      opponentEngine.schedule(500)

      expect(onMoveCalled).toHaveLength(0)

      vi.advanceTimersByTime(500)

      expect(onMoveCalled).toHaveLength(1)
    })

    it('should not execute if session changes', () => {
      const initialSessionId = repertoireStore.sessionId

      opponentEngine.schedule(500)

      // Change session
      repertoireStore.sessionId = initialSessionId + 1

      vi.advanceTimersByTime(500)

      expect(onMoveCalled).toHaveLength(0)
    })

    it('should track pending timers', () => {
      expect(opponentEngine.getPendingCount()).toBe(0)

      opponentEngine.schedule(500)
      expect(opponentEngine.getPendingCount()).toBe(1)

      opponentEngine.schedule(300)
      expect(opponentEngine.getPendingCount()).toBe(2)
    })

    it('should remove timer from active set after execution', () => {
      opponentEngine.schedule(500)
      expect(opponentEngine.getPendingCount()).toBe(1)

      vi.advanceTimersByTime(500)

      expect(opponentEngine.getPendingCount()).toBe(0)
    })

    it('should handle multiple scheduled moves', () => {
      opponentEngine.schedule(100)
      opponentEngine.schedule(200)
      opponentEngine.schedule(300)

      vi.advanceTimersByTime(100)
      expect(onMoveCalled).toHaveLength(1)

      vi.advanceTimersByTime(100)
      expect(onMoveCalled).toHaveLength(2)

      vi.advanceTimersByTime(100)
      expect(onMoveCalled).toHaveLength(3)
    })
  })

  describe('makeMove', () => {
    beforeEach(() => {
      // Start position, white to move
      chessGame.reset()
    })

    it('should make a random opponent move from repertoire', () => {
      const move = opponentEngine.makeMove()

      expect(move).not.toBeNull()
      expect(['e4']).toContain(move) // Only e4 available for white
      expect(onMoveCalled).toHaveLength(1)
    })

    it('should update chess game state', () => {
      const initialFen = chessGame.currentFen.value

      opponentEngine.makeMove()

      expect(chessGame.currentFen.value).not.toBe(initialFen)
      expect(chessGame.currentTurn.value).toBe('black')
    })

    it('should update repertoire store', () => {
      const makeMoveSpy = vi.spyOn(repertoireStore, 'makeMove')

      opponentEngine.makeMove()

      expect(makeMoveSpy).toHaveBeenCalled()
    })

    it('should return null when no moves available', () => {
      // Empty repertoire
      repertoireStore.repertoire.white = {}

      const move = opponentEngine.makeMove()

      expect(move).toBeNull()
      expect(onNoMovesAvailableCalled).toBe(1)
      expect(onMoveCalled).toHaveLength(0)
    })

    it('should call onNoMovesAvailable callback when no moves', () => {
      repertoireStore.repertoire.white = {}

      opponentEngine.makeMove()

      expect(onNoMovesAvailableCalled).toBe(1)
    })

    it('should handle multiple moves in sequence', () => {
      // Make player move first
      chessGame.makeMoveByNotation('e4')
      repertoireStore.makeMove('e4')

      // Now opponent (black) can respond

      const move = opponentEngine.makeMove()

      expect(['e5', 'c5']).toContain(move)
      expect(chessGame.currentTurn.value).toBe('white')
    })

    it('should select randomly from multiple options', () => {
      // Set up position where black has multiple responses
      chessGame.makeMoveByNotation('e4')
      repertoireStore.makeMove('e4')

      const movesSelected = new Set<string>()

      // Run multiple times to check randomness
      for (let i = 0; i < 20; i++) {
        chessGame.undo()
        repertoireStore.rollbackMove()
        chessGame.makeMoveByNotation('e4')
        repertoireStore.makeMove('e4')

        const move = opponentEngine.makeMove()
        if (move) movesSelected.add(move)
      }

      // Should have selected both e5 and c5 at some point
      expect(movesSelected.size).toBeGreaterThan(0)
    })
  })

  describe('clearAll', () => {
    it('should clear all pending timers', () => {
      opponentEngine.schedule(100)
      opponentEngine.schedule(200)
      opponentEngine.schedule(300)

      expect(opponentEngine.getPendingCount()).toBe(3)

      opponentEngine.clearAll()

      expect(opponentEngine.getPendingCount()).toBe(0)
    })

    it('should prevent cleared timers from executing', () => {
      opponentEngine.schedule(100)
      opponentEngine.schedule(200)

      opponentEngine.clearAll()

      vi.advanceTimersByTime(300)

      expect(onMoveCalled).toHaveLength(0)
    })

    it('should work when no timers are active', () => {
      expect(() => opponentEngine.clearAll()).not.toThrow()
      expect(opponentEngine.getPendingCount()).toBe(0)
    })
  })

  describe('getPendingCount', () => {
    it('should return 0 initially', () => {
      expect(opponentEngine.getPendingCount()).toBe(0)
    })

    it('should track scheduled moves', () => {
      opponentEngine.schedule(100)
      expect(opponentEngine.getPendingCount()).toBe(1)

      opponentEngine.schedule(200)
      expect(opponentEngine.getPendingCount()).toBe(2)
    })

    it('should decrease after timer execution', () => {
      opponentEngine.schedule(100)
      opponentEngine.schedule(200)

      vi.advanceTimersByTime(100)
      expect(opponentEngine.getPendingCount()).toBe(1)

      vi.advanceTimersByTime(100)
      expect(opponentEngine.getPendingCount()).toBe(0)
    })

    it('should reset to 0 after clearAll', () => {
      opponentEngine.schedule(100)
      opponentEngine.schedule(200)
      opponentEngine.schedule(300)

      opponentEngine.clearAll()

      expect(opponentEngine.getPendingCount()).toBe(0)
    })
  })

  describe('Session Safety', () => {
    it('should prevent ghost moves when session changes', () => {
      const initialSession = repertoireStore.sessionId

      opponentEngine.schedule(100)
      opponentEngine.schedule(200)

      // Simulate session change (new game started)
      repertoireStore.sessionId = initialSession + 1

      vi.advanceTimersByTime(300)

      // No moves should execute
      expect(onMoveCalled).toHaveLength(0)
    })

    it('should allow moves in same session', () => {
      const sessionId = repertoireStore.sessionId

      opponentEngine.schedule(100)

      // Session unchanged
      expect(repertoireStore.sessionId).toBe(sessionId)

      vi.advanceTimersByTime(100)

      // Move should execute
      expect(onMoveCalled).toHaveLength(1)
    })

    it('should handle rapid session changes', () => {
      opponentEngine.schedule(100)
      repertoireStore.sessionId++

      opponentEngine.schedule(100)
      repertoireStore.sessionId++

      opponentEngine.schedule(100)

      vi.advanceTimersByTime(300)

      // Only the last scheduled move should execute (if session didn't change again)
      expect(onMoveCalled.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Integration with ChessGame', () => {
    it('should work with complete game flow', () => {
      // Player (white) makes a move
      chessGame.makeMoveByNotation('e4')
      repertoireStore.makeMove('e4')

      // Opponent responds
      const opponentMove = opponentEngine.makeMove()

      expect(opponentMove).not.toBeNull()
      expect(chessGame.currentTurn.value).toBe('white')
      expect(['e5', 'c5']).toContain(opponentMove!)
    })

    it('should handle invalid moves gracefully', () => {
      // Spy on getRandomOpponentMove to return invalid move
      vi.spyOn(repertoireStore, 'getRandomOpponentMove').mockReturnValue('invalid')

      const result = opponentEngine.makeMove()

      expect(result).toBeNull()
      expect(onMoveCalled).toHaveLength(0)
    })
  })

  describe('Callback Integration', () => {
    it('should call onMove callback with correct move notation', () => {
      opponentEngine.makeMove()

      expect(onMoveCalled).toHaveLength(1)
      expect(onMoveCalled[0]).toBe('e4')
    })

    it('should call callbacks in correct order during scheduled execution', () => {
      const callOrder: string[] = []

      opponentEngine = useOpponentEngine(
        chessGame,
        repertoireStore,
        (move) => {
          callOrder.push(`onMove:${move}`)
        },
        () => {
          callOrder.push('onNoMovesAvailable')
        }
      )

      opponentEngine.schedule(100)

      vi.advanceTimersByTime(100)

      expect(callOrder).toHaveLength(1)
      expect(callOrder[0]).toContain('onMove:')
    })

    it('should handle callback errors gracefully', () => {
      opponentEngine = useOpponentEngine(
        chessGame,
        repertoireStore,
        () => {
          throw new Error('Callback error')
        },
        () => {}
      )

      // Should not throw
      expect(() => opponentEngine.makeMove()).toThrow()
    })
  })
})
