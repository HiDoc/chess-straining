import { ref, computed } from 'vue'
import { Chess } from 'chess.js'
import type { Move } from 'chess.js'

/**
 * Chess Game Composable
 *
 * Encapsulates Chess.js game logic and provides a clean interface
 * for move execution, game state queries, and position management.
 *
 * Responsibilities:
 * - Manage Chess.js instance
 * - Execute and validate moves
 * - Provide game state (FEN, current turn)
 * - Handle undo/reset operations
 * - Rebuild game from move history
 */
export function useChessGame() {
  const game = ref(new Chess())

  // Computed reactive state
  const currentFen = computed(() => game.value.fen())

  const currentTurn = computed<'white' | 'black'>(() =>
    game.value.turn() === 'w' ? 'white' : 'black'
  )

  /**
   * Make a move from coordinates
   * @param from - Starting square (e.g., 'e2')
   * @param to - Destination square (e.g., 'e4')
   * @param promotion - Piece to promote to (default: 'q')
   * @returns Move object if successful, null if invalid
   */
  function makeMove(from: string, to: string, promotion = 'q'): Move | null {
    try {
      return game.value.move({ from, to, promotion })
    } catch (e) {
      return null
    }
  }

  /**
   * Make a move using algebraic notation
   * @param notation - Move in SAN format (e.g., 'e4', 'Nf3')
   * @returns Move object if successful, null if invalid
   */
  function makeMoveByNotation(notation: string): Move | null {
    try {
      return game.value.move(notation)
    } catch (e) {
      return null
    }
  }

  /**
   * Undo the last move
   * @returns The undone move or null if no moves to undo
   */
  function undo(): Move | null {
    return game.value.undo()
  }

  /**
   * Reset the game to starting position
   */
  function reset(): void {
    game.value.reset()
  }

  /**
   * Rebuild the game from a sequence of moves
   * Useful for restoring game state from stored history
   * @param moves - Array of moves in SAN format
   */
  function rebuildFromHistory(moves: string[]): void {
    const newGame = new Chess()

    for (const move of moves) {
      try {
        newGame.move(move)
      } catch (e) {
        console.error(`Invalid move in history: ${move}`, e)
      }
    }

    game.value = newGame
  }

  /**
   * Check if the game is in checkmate
   */
  function isCheckmate(): boolean {
    return game.value.isCheckmate()
  }

  /**
   * Check if the game is in stalemate
   */
  function isStalemate(): boolean {
    return game.value.isStalemate()
  }

  /**
   * Check if the game is over
   */
  function isGameOver(): boolean {
    return game.value.isGameOver()
  }

  /**
   * Get the current board state as FEN string
   */
  function getFen(): string {
    return game.value.fen()
  }

  return {
    // Reactive state
    currentFen,
    currentTurn,

    // Move operations
    makeMove,
    makeMoveByNotation,
    undo,
    reset,

    // State management
    rebuildFromHistory,
    getFen,

    // Game status
    isCheckmate,
    isStalemate,
    isGameOver
  }
}

export type UseChessGame = ReturnType<typeof useChessGame>
