import { ref, computed } from 'vue'
import type { UseChessGame } from './useChessGame'
import type { useRepertoireStore } from '../stores/repertoire'

export interface TrainingMoveResult {
  success: boolean
  message: string
  undoRequired?: boolean
  checkTransposition?: boolean
  continueTraining?: boolean
}

/**
 * Training Session Composable
 *
 * Manages training session state and orchestrates the training flow.
 *
 * Responsibilities:
 * - Track training vs edit mode
 * - Handle player move validation
 * - Coordinate training flow logic
 * - Detect line completion
 * - Manage session lifecycle
 */
export function useTrainingSession(
  chessGame: UseChessGame,
  repertoireStore: ReturnType<typeof useRepertoireStore>
) {
  const isEditMode = ref(false)
  const currentColor = computed(() => repertoireStore.currentColor)

  /**
   * Handle a player's move in the current session
   * Routes to appropriate handler based on mode (training vs edit)
   *
   * @param move - Move notation (e.g., 'e4', 'Nf3')
   * @param fen - Current FEN position
   * @returns Result object with success status and actions to take
   */
  function handlePlayerMove(move: string, fen: string): TrainingMoveResult {
    if (isEditMode.value) {
      return handleEditModeMove(move)
    }
    return handleTrainingModeMove(move, fen)
  }

  /**
   * Handle move in edit mode
   * Adds move to repertoire without validation
   */
  function handleEditModeMove(move: string): TrainingMoveResult {
    repertoireStore.addMoveToRepertoire(repertoireStore.currentLine, move)
    repertoireStore.makeMove(move)

    return {
      success: true,
      message: `Added move ${move} to repertoire`,
      checkTransposition: true
    }
  }

  /**
   * Handle move in training mode
   * Validates move is in repertoire before accepting
   */
  function handleTrainingModeMove(move: string, fen: string): TrainingMoveResult {
    if (!repertoireStore.isValidMove(move)) {
      return {
        success: false,
        message: 'Not in your repertoire! Try again.',
        undoRequired: true
      }
    }

    repertoireStore.makeMove(move)

    return {
      success: true,
      message: 'Correct move!',
      checkTransposition: true,
      continueTraining: true
    }
  }

  /**
   * Check if current line is complete (no more moves available)
   * @returns True if no more moves available for the current player
   */
  function shouldShowLineComplete(): boolean {
    const nextMoves = Object.keys(repertoireStore.currentRepertoire).filter((k) => k !== 'name')
    return nextMoves.length === 0 && repertoireStore.currentLine.length > 0
  }

  /**
   * Get available moves for current position
   * @returns Array of move notations
   */
  function getAvailableMoves(): string[] {
    return Object.keys(repertoireStore.currentRepertoire).filter((k) => k !== 'name')
  }

  /**
   * Toggle between training and edit modes
   * @returns New edit mode state
   */
  function toggleEditMode(): boolean {
    isEditMode.value = !isEditMode.value
    return isEditMode.value
  }

  /**
   * Start a new training session
   * Resets game and store state
   *
   * @param color - Color to train as ('white' or 'black')
   */
  function startSession(color: 'white' | 'black'): void {
    chessGame.reset()
    repertoireStore.startNewSession(color)
  }

  /**
   * Rollback to previous player turn
   * Handles both situations: opponent's turn and player's turn
   */
  function rollback(): void {
    if (repertoireStore.currentLine.length < 1) return

    const isOpponentTurn = chessGame.currentTurn.value !== currentColor.value

    chessGame.undo() // Undo player move
    repertoireStore.rollbackMove()
  }

  /**
   * Request a new white opening move (for training as black)
   * Resets to initial position
   */
  function requestNewWhiteMove(): void {
    chessGame.reset()
    repertoireStore.currentLine = []
    repertoireStore.gameHistory = []
  }

  return {
    // State
    isEditMode,
    currentColor,

    // Move handling
    handlePlayerMove,

    // Status checks
    shouldShowLineComplete,
    getAvailableMoves,

    // Mode control
    toggleEditMode,

    // Session control
    startSession,
    rollback,
    requestNewWhiteMove
  }
}

export type UseTrainingSession = ReturnType<typeof useTrainingSession>
