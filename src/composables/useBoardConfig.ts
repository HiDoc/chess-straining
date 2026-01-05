import { ref, reactive, type ComputedRef } from 'vue'
import type { BoardApi } from 'vue3-chessboard'
import type { UseChessGame } from './useChessGame'

/**
 * Board Configuration Composable
 *
 * Manages chess board visual configuration and state updates.
 *
 * Responsibilities:
 * - Manage board orientation
 * - Configure board visual settings
 * - Update board position from game state
 * - Handle board API interactions
 */
export function useBoardConfig(
  chessGame: UseChessGame,
  currentColor: ComputedRef<'white' | 'black'>
) {
  const boardApi = ref<(BoardApi & { setPosition: (fen: string) => void }) | null>(null)

  const config = reactive({
    orientation: 'white' as 'white' | 'black',
    coordinates: true,
    autoCastle: true,
    viewOnly: false,
    disableContextMenu: false,
    addPieceZIndex: false,
    blockTouchScroll: false,
    highlight: {
      lastMove: true,
      check: true
    },
    animation: {
      enabled: true,
      duration: 200
    },
    movable: {
      free: false,
      color: 'white' as 'white' | 'black',
      showDests: true,
      events: {}
    },
    drawable: {
      enabled: false
    }
  })

  /**
   * Set board orientation
   * @param orientation - 'white' or 'black' perspective
   */
  function setOrientation(orientation: 'white' | 'black'): void {
    config.orientation = orientation
  }

  /**
   * Update board position to match current game state
   * Also updates which pieces are movable based on current turn
   */
  function updatePosition(): void {
    if (boardApi.value) {
      boardApi.value.setPosition(chessGame.currentFen.value)
    }

    // Update movable color based on current turn
    config.movable.color = chessGame.currentTurn.value

    // Ensure orientation matches current player color
    config.orientation = currentColor.value
  }

  /**
   * Toggle board orientation using the board API
   * Used for smooth animation when switching colors
   */
  function toggleOrientation(): void {
    boardApi.value?.toggleOrientation()
  }

  /**
   * Initialize board orientation
   * Should be called on mount
   */
  function initializeOrientation(color: 'white' | 'black'): void {
    config.orientation = color
  }

  return {
    boardApi,
    config,
    setOrientation,
    updatePosition,
    toggleOrientation,
    initializeOrientation
  }
}

export type UseBoardConfig = ReturnType<typeof useBoardConfig>
