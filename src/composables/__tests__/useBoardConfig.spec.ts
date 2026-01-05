import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, type ComputedRef } from 'vue'
import { useBoardConfig } from '../useBoardConfig'
import { useChessGame } from '../useChessGame'

describe('useBoardConfig', () => {
  let chessGame: ReturnType<typeof useChessGame>
  let boardConfig: ReturnType<typeof useBoardConfig>
  let currentColor: ComputedRef<'white' | 'black'>

  beforeEach(() => {
    chessGame = useChessGame()
    currentColor = computed(() => 'white' as 'white' | 'black')
    boardConfig = useBoardConfig(chessGame, currentColor)
  })

  describe('Initial Configuration', () => {
    it('should initialize with white orientation', () => {
      expect(boardConfig.config.orientation).toBe('white')
    })

    it('should have coordinates enabled', () => {
      expect(boardConfig.config.coordinates).toBe(true)
    })

    it('should have autoCastle enabled', () => {
      expect(boardConfig.config.autoCastle).toBe(true)
    })

    it('should not be in view-only mode', () => {
      expect(boardConfig.config.viewOnly).toBe(false)
    })

    it('should have highlight settings configured', () => {
      expect(boardConfig.config.highlight).toEqual({
        lastMove: true,
        check: true
      })
    })

    it('should have animation settings configured', () => {
      expect(boardConfig.config.animation).toEqual({
        enabled: true,
        duration: 200
      })
    })

    it('should have movable configuration', () => {
      expect(boardConfig.config.movable).toMatchObject({
        free: false,
        color: 'white',
        showDests: true
      })
    })

    it('should have drawable disabled', () => {
      expect(boardConfig.config.drawable.enabled).toBe(false)
    })

    it('should initialize boardApi as null', () => {
      expect(boardConfig.boardApi.value).toBeNull()
    })
  })

  describe('setOrientation', () => {
    it('should set orientation to white', () => {
      boardConfig.config.orientation = 'black'

      boardConfig.setOrientation('white')

      expect(boardConfig.config.orientation).toBe('white')
    })

    it('should set orientation to black', () => {
      boardConfig.setOrientation('black')

      expect(boardConfig.config.orientation).toBe('black')
    })

    it('should be reactive', () => {
      expect(boardConfig.config.orientation).toBe('white')

      boardConfig.setOrientation('black')
      expect(boardConfig.config.orientation).toBe('black')

      boardConfig.setOrientation('white')
      expect(boardConfig.config.orientation).toBe('white')
    })
  })

  describe('initializeOrientation', () => {
    it('should initialize orientation to white', () => {
      boardConfig.initializeOrientation('white')

      expect(boardConfig.config.orientation).toBe('white')
    })

    it('should initialize orientation to black', () => {
      boardConfig.initializeOrientation('black')

      expect(boardConfig.config.orientation).toBe('black')
    })
  })

  describe('updatePosition', () => {
    it('should update movable color based on current turn', () => {
      chessGame.reset()

      boardConfig.updatePosition()

      expect(boardConfig.config.movable.color).toBe('white')
    })

    it('should update movable color after move', () => {
      chessGame.makeMoveByNotation('e4')

      boardConfig.updatePosition()

      expect(boardConfig.config.movable.color).toBe('black')
    })

    it('should set orientation from currentColor', () => {
      currentColor = computed(() => 'black')
      boardConfig = useBoardConfig(chessGame, currentColor)

      boardConfig.updatePosition()

      expect(boardConfig.config.orientation).toBe('black')
    })

    it('should call boardApi.setPosition when boardApi is available', () => {
      const mockBoardApi = {
        setPosition: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      boardConfig.updatePosition()

      expect(mockBoardApi.setPosition).toHaveBeenCalledWith(chessGame.currentFen.value)
    })

    it('should not throw when boardApi is null', () => {
      boardConfig.boardApi.value = null

      expect(() => boardConfig.updatePosition()).not.toThrow()
    })

    it('should update position with correct FEN', () => {
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')

      const mockBoardApi = {
        setPosition: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      boardConfig.updatePosition()

      expect(mockBoardApi.setPosition).toHaveBeenCalledWith(
        expect.stringContaining('rnbqkbnr/pppp1ppp/8/4p3/4P3')
      )
    })
  })

  describe('toggleOrientation', () => {
    it('should call boardApi.toggleOrientation when available', () => {
      const mockBoardApi = {
        toggleOrientation: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      boardConfig.toggleOrientation()

      expect(mockBoardApi.toggleOrientation).toHaveBeenCalled()
    })

    it('should not throw when boardApi is null', () => {
      boardConfig.boardApi.value = null

      expect(() => boardConfig.toggleOrientation()).not.toThrow()
    })

    it('should use optional chaining safely', () => {
      boardConfig.boardApi.value = null

      boardConfig.toggleOrientation()

      // Should complete without error
      expect(boardConfig.boardApi.value).toBeNull()
    })
  })

  describe('boardApi Integration', () => {
    it('should allow setting boardApi', () => {
      const mockBoardApi = {
        setPosition: vi.fn(),
        toggleOrientation: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      expect(boardConfig.boardApi.value).toStrictEqual(mockBoardApi)
    })

    it('should work with boardApi after assignment', () => {
      const mockBoardApi = {
        setPosition: vi.fn(),
        toggleOrientation: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      boardConfig.updatePosition()
      boardConfig.toggleOrientation()

      expect(mockBoardApi.setPosition).toHaveBeenCalled()
      expect(mockBoardApi.toggleOrientation).toHaveBeenCalled()
    })
  })

  describe('Reactive Configuration', () => {
    it('should have reactive config object', () => {
      const initialOrientation = boardConfig.config.orientation

      boardConfig.config.orientation = 'black'

      expect(boardConfig.config.orientation).not.toBe(initialOrientation)
      expect(boardConfig.config.orientation).toBe('black')
    })

    it('should allow changing coordinates setting', () => {
      boardConfig.config.coordinates = false

      expect(boardConfig.config.coordinates).toBe(false)
    })

    it('should allow changing animation settings', () => {
      boardConfig.config.animation.duration = 500

      expect(boardConfig.config.animation.duration).toBe(500)
    })

    it('should allow changing highlight settings', () => {
      boardConfig.config.highlight.lastMove = false

      expect(boardConfig.config.highlight.lastMove).toBe(false)
    })

    it('should allow changing movable color', () => {
      boardConfig.config.movable.color = 'black'

      expect(boardConfig.config.movable.color).toBe('black')
    })
  })

  describe('Integration with currentColor computed', () => {
    it('should update orientation when currentColor changes', () => {
      let colorValue: { value: 'white' | 'black' } = { value: 'white' }
      currentColor = computed(() => colorValue.value)
      boardConfig = useBoardConfig(chessGame, currentColor)

      boardConfig.updatePosition()
      expect(boardConfig.config.orientation).toBe('white')

      colorValue.value = 'black'
      boardConfig.updatePosition()
      expect(boardConfig.config.orientation).toBe('black')
    })

    it('should track turn changes from chess game', () => {
      boardConfig.updatePosition()
      expect(boardConfig.config.movable.color).toBe('white')

      chessGame.makeMoveByNotation('e4')
      boardConfig.updatePosition()
      expect(boardConfig.config.movable.color).toBe('black')

      chessGame.makeMoveByNotation('e5')
      boardConfig.updatePosition()
      expect(boardConfig.config.movable.color).toBe('white')
    })
  })

  describe('Complete Board Update Flow', () => {
    it('should handle complete position update', () => {
      const mockBoardApi = {
        setPosition: vi.fn(),
        toggleOrientation: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      // Make some moves
      chessGame.makeMoveByNotation('e4')
      chessGame.makeMoveByNotation('e5')
      chessGame.makeMoveByNotation('Nf3')

      // Update position
      boardConfig.updatePosition()

      // Should update board position
      expect(mockBoardApi.setPosition).toHaveBeenCalled()

      // Should set correct movable color (black's turn)
      expect(boardConfig.config.movable.color).toBe('black')

      // Should set correct orientation
      expect(boardConfig.config.orientation).toBe('white')
    })

    it('should handle orientation change flow', () => {
      const mockBoardApi = {
        setPosition: vi.fn(),
        toggleOrientation: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      // Change orientation
      boardConfig.setOrientation('black')
      expect(boardConfig.config.orientation).toBe('black')

      // Toggle orientation
      boardConfig.toggleOrientation()
      expect(mockBoardApi.toggleOrientation).toHaveBeenCalled()

      // Update position
      boardConfig.updatePosition()
      expect(mockBoardApi.setPosition).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid orientation changes', () => {
      boardConfig.setOrientation('black')
      boardConfig.setOrientation('white')
      boardConfig.setOrientation('black')
      boardConfig.setOrientation('white')

      expect(boardConfig.config.orientation).toBe('white')
    })

    it('should handle updatePosition with no moves', () => {
      const mockBoardApi = {
        setPosition: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any

      boardConfig.updatePosition()

      expect(mockBoardApi.setPosition).toHaveBeenCalledWith(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should handle boardApi being set and unset', () => {
      const mockBoardApi = {
        setPosition: vi.fn(),
        toggleOrientation: vi.fn()
      }

      boardConfig.boardApi.value = mockBoardApi as any
      boardConfig.updatePosition()

      expect(mockBoardApi.setPosition).toHaveBeenCalled()

      // Unset boardApi
      boardConfig.boardApi.value = null

      expect(() => boardConfig.updatePosition()).not.toThrow()
    })
  })
})
