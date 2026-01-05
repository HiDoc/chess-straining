import { ref } from 'vue'
import type { UseChessGame } from './useChessGame'
import type { useRepertoireStore } from '../stores/repertoire'

/**
 * Opponent Engine Composable
 *
 * Manages opponent move logic including move selection and scheduling.
 *
 * Responsibilities:
 * - Select opponent moves from repertoire
 * - Schedule opponent moves with session-safe timers
 * - Manage timer cleanup
 * - Handle opponent move execution
 */
export function useOpponentEngine(
  chessGame: UseChessGame,
  repertoireStore: ReturnType<typeof useRepertoireStore>,
  onMove: (move: string) => void,
  onNoMovesAvailable: () => void
) {
  const activeTimers = ref<Set<number>>(new Set())

  /**
   * Schedule an opponent move after a delay
   * Uses session token to prevent ghost moves from previous sessions
   *
   * @param delay - Delay in milliseconds before move execution
   */
  function schedule(delay: number): void {
    const sessionId = repertoireStore.sessionId

    const timerId = setTimeout(() => {
      // Check if session changed - prevent ghost moves
      if (repertoireStore.sessionId !== sessionId) return

      activeTimers.value.delete(timerId)
      makeMove()
    }, delay) as unknown as number

    activeTimers.value.add(timerId)
  }

  /**
   * Make an opponent move immediately
   * Selects random move from available repertoire moves
   *
   * @returns The move notation if successful, null otherwise
   */
  function makeMove(): string | null {
    const opponentMove = repertoireStore.getRandomOpponentMove()

    if (!opponentMove) {
      onNoMovesAvailable()
      return null
    }

    const result = chessGame.makeMoveByNotation(opponentMove)

    if (result) {
      repertoireStore.makeMove(opponentMove)
      onMove(opponentMove)
      return opponentMove
    }

    return null
  }

  /**
   * Clear all scheduled opponent moves
   * Should be called on session transitions
   */
  function clearAll(): void {
    activeTimers.value.forEach((id) => clearTimeout(id))
    activeTimers.value.clear()
  }

  /**
   * Get count of pending scheduled moves
   * Useful for debugging
   */
  function getPendingCount(): number {
    return activeTimers.value.size
  }

  return {
    schedule,
    makeMove,
    clearAll,
    getPendingCount
  }
}

export type UseOpponentEngine = ReturnType<typeof useOpponentEngine>
