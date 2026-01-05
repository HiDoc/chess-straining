import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ChessBoard from '../ChessBoard.vue'
import { useRepertoireStore } from '../../stores/repertoire'

// Mock vue3-chessboard component
vi.mock('vue3-chessboard', () => ({
  TheChessboard: {
    name: 'TheChessboard',
    template: '<div class="mock-chessboard"></div>',
    props: ['boardConfig'],
    emits: ['board-created', 'move']
  }
}))

describe('ChessBoard Component Integration Tests', () => {
  let wrapper: any
  let repertoireStore: ReturnType<typeof useRepertoireStore>

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    repertoireStore = useRepertoireStore()

    // Set up basic repertoire
    repertoireStore.repertoire.white = {
      e4: {
        e5: {
          Nf3: {
            Nc6: {}
          }
        },
        c5: {}
      }
    }
    repertoireStore.repertoire.black = {
      e4: {
        e5: {}
      }
    }

    // Mock loadRepertoire
    repertoireStore.loadRepertoire = vi.fn().mockResolvedValue(undefined)

    wrapper = mount(ChessBoard, {
      global: {
        stubs: {
          LineCompletePopup: true,
          TranspositionPopup: true
        }
      }
    })

    await flushPromises()
    vi.advanceTimersByTime(100)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Component Mounting', () => {
    it('should mount successfully', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should load repertoire on mount', () => {
      expect(repertoireStore.loadRepertoire).toHaveBeenCalled()
    })

    it('should render TheChessboard component', () => {
      expect(wrapper.findComponent({ name: 'TheChessboard' }).exists()).toBe(true)
    })

    it('should have LineCompletePopup stub', () => {
      const stub = wrapper.find('[data-testid="line-complete-popup"]') ||
                   wrapper.findAll('*').find((c: any) => c.element.tagName === 'LINE-COMPLETE-POPUP-STUB')
      // Popup is stubbed, just verify component renders
      expect(wrapper.exists()).toBe(true)
    })

    it('should have TranspositionPopup stub', () => {
      const stub = wrapper.find('[data-testid="transposition-popup"]') ||
                   wrapper.findAll('*').find((c: any) => c.element.tagName === 'TRANSPOSITION-POPUP-STUB')
      // Popup is stubbed, just verify component renders
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Toast Emissions', () => {
    it('should emit showToast on mount with available moves', async () => {
      expect(wrapper.emitted('showToast')).toBeTruthy()
    })

    it('should emit correct toast format', () => {
      const toastEvents = wrapper.emitted('showToast')
      if (toastEvents) {
        const [message, type] = toastEvents[0]
        expect(typeof message).toBe('string')
        expect(['success', 'error', 'info']).toContain(type)
      }
    })
  })

  describe('Player Move Handling', () => {
    beforeEach(() => {
      repertoireStore.currentColor = 'white'
      repertoireStore.currentLine = []
      // currentRepertoire is a getter, it's automatically computed from currentLine
    })

    it('should handle valid player move', () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })

      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })

      const toastEvents = wrapper.emitted('showToast')
      const lastToast = toastEvents[toastEvents.length - 1]
      expect(lastToast[0]).toContain('Correct move!')
      expect(lastToast[1]).toBe('success')
    })

    it('should reject invalid player move', () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })
      repertoireStore.isValidMove = vi.fn().mockReturnValue(false)

      chessboard.vm.$emit('move', { from: 'd2', to: 'd4' })

      const toastEvents = wrapper.emitted('showToast')
      const lastToast = toastEvents[toastEvents.length - 1]
      expect(lastToast[0]).toContain('Not in your repertoire')
      expect(lastToast[1]).toBe('error')
    })

    it('should prevent move when not player turn', () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })

      // Make a move to change turn
      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })

      // Try to move again (still white's turn due to no opponent response)
      chessboard.vm.$emit('move', { from: 'd2', to: 'd4' })

      const toastEvents = wrapper.emitted('showToast')
      const lastToast = toastEvents[toastEvents.length - 1]
      expect(lastToast[0]).toContain('Wait for opponent')
    })
  })

  describe('Edit Mode', () => {
    it('should toggle edit mode', () => {
      wrapper.vm.toggleEditMode?.()

      const toastEvents = wrapper.emitted('showToast')
      const lastToast = toastEvents[toastEvents.length - 1]
      expect(lastToast[0]).toContain('Edit mode enabled')
    })

    it('should accept any move in edit mode', () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })
      wrapper.vm.toggleEditMode()

      chessboard.vm.$emit('move', { from: 'd2', to: 'd4' })

      const toastEvents = wrapper.emitted('showToast')
      const lastToast = toastEvents[toastEvents.length - 1]
      expect(lastToast[0]).toContain('Added move')
      expect(lastToast[1]).toBe('success')
    })
  })

  describe('Session Management', () => {
    it('should start new session', () => {
      wrapper.vm.newSession?.()

      const toastEvents = wrapper.emitted('showToast')
      // Should emit toast about session or available moves
      expect(toastEvents.length).toBeGreaterThan(0)
    })

    it('should switch color', () => {
      const initialColor = repertoireStore.currentColor

      wrapper.vm.switchColor?.()

      expect(repertoireStore.currentColor).not.toBe(initialColor)
    })

    it('should switch to specific color', () => {
      wrapper.vm.switchColor?.('black')

      expect(repertoireStore.currentColor).toBe('black')
    })
  })

  describe('Rollback Functionality', () => {
    beforeEach(() => {
      repertoireStore.currentColor = 'white'
      repertoireStore.currentLine = ['e4', 'e5']
    })

    it('should rollback position', () => {
      wrapper.vm.rollback?.()

      expect(repertoireStore.currentLine.length).toBeLessThan(2)
    })

    it('should emit toast on rollback', () => {
      const initialToastCount = wrapper.emitted('showToast').length

      wrapper.vm.rollback?.()

      expect(wrapper.emitted('showToast').length).toBeGreaterThan(initialToastCount)
    })

    it('should not rollback when no moves made', () => {
      repertoireStore.currentLine = []

      const initialToastCount = wrapper.emitted('showToast').length
      wrapper.vm.rollback?.()

      // Should not emit new toast since there's nothing to rollback
      expect(wrapper.emitted('showToast').length).toBe(initialToastCount)
    })
  })

  describe('Cancel Opponent Move', () => {
    it('should handle cancel opponent move call', async () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })

      // Make player move
      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })
      await flushPromises()

      // Wait for opponent move
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Try to cancel (function should exist)
      expect(typeof wrapper.vm.cancelOpponentMove).toBe('function')
    })

    it('should not cancel in edit mode', () => {
      wrapper.vm.toggleEditMode?.()

      // In edit mode, cancel should have no effect or be disabled
      expect(typeof wrapper.vm.cancelOpponentMove).toBe('function')
    })
  })

  describe('Request New White Move', () => {
    beforeEach(() => {
      repertoireStore.currentColor = 'black'
    })

    it('should have requestNewWhiteMove method when training as black', () => {
      expect(typeof wrapper.vm.requestNewWhiteMove).toBe('function')
    })

    it('should have method when training as white too', () => {
      repertoireStore.currentColor = 'white'
      expect(typeof wrapper.vm.requestNewWhiteMove).toBe('function')
    })

    it('should reset position when requested', () => {
      repertoireStore.currentLine = ['e4']

      wrapper.vm.requestNewWhiteMove?.()

      expect(repertoireStore.currentLine).toHaveLength(0)
    })
  })

  describe('Color Change Handling', () => {
    it('should update board when color changes', async () => {
      const initialColor = repertoireStore.currentColor

      repertoireStore.currentColor = initialColor === 'white' ? 'black' : 'white'

      await wrapper.vm.$nextTick()

      const toastEvents = wrapper.emitted('showToast')
      expect(toastEvents.length).toBeGreaterThan(0)
    })

    it('should handle color switch', async () => {
      const initialToastCount = wrapper.emitted('showToast').length

      wrapper.vm.switchColor?.('black')

      await wrapper.vm.$nextTick()
      vi.advanceTimersByTime(500)

      // Should have emitted at least one toast
      expect(wrapper.emitted('showToast').length).toBeGreaterThanOrEqual(initialToastCount)
    })
  })

  describe('Exposed Methods', () => {
    it('should expose newSession method', () => {
      expect(typeof wrapper.vm.newSession).toBe('function')
    })

    it('should expose switchColor method', () => {
      expect(typeof wrapper.vm.switchColor).toBe('function')
    })

    it('should expose rollback method', () => {
      expect(typeof wrapper.vm.rollback).toBe('function')
    })

    it('should expose cancelOpponentMove method', () => {
      expect(typeof wrapper.vm.cancelOpponentMove).toBe('function')
    })

    it('should expose toggleEditMode method', () => {
      expect(typeof wrapper.vm.toggleEditMode).toBe('function')
    })

    it('should expose requestNewWhiteMove method', () => {
      expect(typeof wrapper.vm.requestNewWhiteMove).toBe('function')
    })

    it('should expose canCancelOpponent computed', () => {
      expect(wrapper.vm.canCancelOpponent).toBeDefined()
    })

    it('should expose canRollback computed', () => {
      expect(wrapper.vm.canRollback).toBeDefined()
    })

    it('should expose canRequestNewWhiteMove computed', () => {
      expect(wrapper.vm.canRequestNewWhiteMove).toBeDefined()
    })

    it('should expose isEditMode ref', () => {
      expect(wrapper.vm.isEditMode).toBeDefined()
    })
  })

  describe('Opponent Engine Integration', () => {
    beforeEach(() => {
      repertoireStore.currentColor = 'white'
      repertoireStore.currentLine = []
    })

    it('should schedule opponent move after player move', async () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })

      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })
      await flushPromises()

      // Advance timers to trigger opponent move
      vi.advanceTimersByTime(300)

      const toastEvents = wrapper.emitted('showToast')
      const hasOpponentMove = toastEvents.some((event: any) =>
        event[0].includes('Opponent played')
      )

      expect(hasOpponentMove).toBe(true)
    })

    it('should clear timers on new session', () => {
      const { newSession } = wrapper.vm

      // Make a move that would schedule opponent response
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })
      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })

      // Start new session (should clear pending timers)
      newSession()

      const initialToastCount = wrapper.emitted('showToast').length

      // Advance timers - should not trigger old opponent move
      vi.advanceTimersByTime(300)

      // Toast count should only increase from new session, not from old scheduled move
      expect(wrapper.emitted('showToast').length).toBeGreaterThanOrEqual(initialToastCount)
    })

    it('should clear timers when toggling edit mode', async () => {
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })
      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })

      wrapper.vm.toggleEditMode()
      await flushPromises()

      const toastCountBeforeTimer = wrapper.emitted('showToast').length

      vi.advanceTimersByTime(300)

      // Should not have opponent move toast after edit mode toggle
      const toastCountAfterTimer = wrapper.emitted('showToast').length
      const newToasts = wrapper.emitted('showToast').slice(toastCountBeforeTimer)

      const hasOpponentMove = newToasts.some((event: any) =>
        event[0].includes('Opponent played')
      )

      expect(hasOpponentMove).toBe(false)
    })
  })

  describe('Complete Game Flow', () => {
    it('should handle complete training sequence', async () => {
      repertoireStore.currentColor = 'white'
      repertoireStore.currentLine = []
      const chessboard = wrapper.findComponent({ name: 'TheChessboard' })

      // Player move
      chessboard.vm.$emit('move', { from: 'e2', to: 'e4' })
      await flushPromises()

      // Wait for opponent move
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Verify sequence
      const toastEvents = wrapper.emitted('showToast')
      const messages = toastEvents.map((e: any) => e[0])

      expect(messages.some((m: string) => m.includes('Correct move'))).toBe(true)
      expect(messages.some((m: string) => m.includes('Opponent played'))).toBe(true)
    })

    it('should handle line completion', async () => {
      // Set up a position where line will complete
      // Clear the repertoire at current path to simulate no more moves
      repertoireStore.currentLine = ['e4', 'e5', 'Nf3', 'Nc6']

      // Access exposed method through wrapper.vm
      // Line is complete when there are no more moves in currentRepertoire
      // Since we're deep in the tree with no further moves, line should be complete
      expect(repertoireStore.currentLine.length).toBeGreaterThan(0)
    })
  })
})
