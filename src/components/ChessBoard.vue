<template>
  <div class="chess-board-container">
    <TheChessboard
      :board-config="boardConfig.config"
      @board-created="(api) => (boardConfig.boardApi.value = api)"
      @move="handleMove"
    />
    <LineCompletePopup ref="lineCompletePopup" />
    <TranspositionPopup ref="transpositionPopup" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import { useRepertoireStore } from '../stores/repertoire'
import { useChessGame } from '../composables/useChessGame'
import { useTrainingSession } from '../composables/useTrainingSession'
import { useOpponentEngine } from '../composables/useOpponentEngine'
import { useBoardConfig } from '../composables/useBoardConfig'
import LineCompletePopup from './LineCompletePopup.vue'
import TranspositionPopup from './TranspositionPopup.vue'

const emit = defineEmits<{
  showToast: [message: string, type: 'success' | 'error' | 'info']
}>()

// Initialize store and composables
const repertoireStore = useRepertoireStore()
const chessGame = useChessGame()
const trainingSession = useTrainingSession(chessGame, repertoireStore)
const boardConfig = useBoardConfig(chessGame, trainingSession.currentColor)
const opponentEngine = useOpponentEngine(
  chessGame,
  repertoireStore,
  (move) => {
    emit('showToast', `Opponent played: ${move}`, 'info')
    boardConfig.updatePosition()
    handleTranspositionCheck()
    checkLineComplete()
  },
  () => emit('showToast', 'No opponent responses available for this position.', 'info')
)

// Popup refs
const lineCompletePopup = ref<{ show: () => void } | null>(null)
const transpositionPopup = ref<{
  show: (path: string[], onConfirm: () => void, onCancel: () => void) => void
} | null>(null)

// Watch for color changes
watch(trainingSession.currentColor, handleColorChange)

// Watch for repertoire navigation (when clicking on moves in repertoire panel)
watch(
  () => repertoireStore.gameHistory,
  (newHistory) => {
    // Rebuild game from history when navigating via repertoire panel
    chessGame.reset()
    chessGame.rebuildFromHistory(newHistory)
    boardConfig.updatePosition()
  },
  { deep: true }
)

onMounted(async () => {
  await repertoireStore.loadRepertoire()
  boardConfig.initializeOrientation(trainingSession.currentColor.value)

  setTimeout(() => {
    boardConfig.updatePosition()
    startInitialTurn()
  }, 100)
})

function startInitialTurn() {
  if (trainingSession.currentColor.value === 'black' && !trainingSession.isEditMode.value) {
    opponentEngine.schedule(500)
  } else {
    const availableMoves = trainingSession.getAvailableMoves()
    if (availableMoves.length > 0) {
      emit('showToast', `Your turn! Available moves: ${availableMoves.join(', ')}`, 'info')
    } else {
      emit('showToast', 'No repertoire loaded. Use Edit Mode to add moves.', 'info')
    }
  }
}

function handleColorChange(newColor: 'white' | 'black') {
  chessGame.reset()
  boardConfig.toggleOrientation()
  boardConfig.setOrientation(newColor)
  boardConfig.updatePosition()

  if (newColor === 'black' && !trainingSession.isEditMode.value) {
    opponentEngine.schedule(500)
  } else {
    const availableMoves = trainingSession.getAvailableMoves()
    if (availableMoves.length > 0) {
      emit(
        'showToast',
        `New session started! Available moves: ${availableMoves.join(', ')}`,
        'info',
      )
    }
  }
}

function handleMove({ from, to }: { from: string; to: string }) {
  // Check whose turn it is before making the move
  if (
    !trainingSession.isEditMode.value &&
    chessGame.currentTurn.value !== trainingSession.currentColor.value
  ) {
    emit(
      'showToast',
      `Wait for opponent's move! It's ${chessGame.currentTurn.value}'s turn.`,
      'error',
    )
    return
  }

  const moveResult = chessGame.makeMove(from, to)

  if (!moveResult) {
    emit('showToast', 'Invalid chess move!', 'error')
    boardConfig.updatePosition()
    return
  }

  const result = trainingSession.handlePlayerMove(moveResult.san, chessGame.currentFen.value)

  if (!result.success) {
    if (result.undoRequired) {
      chessGame.undo()
    }
    emit('showToast', result.message, 'error')
    boardConfig.updatePosition()
    return
  }

  emit('showToast', result.message, 'success')
  boardConfig.updatePosition()

  if (result.checkTransposition) {
    handleTranspositionCheck(result.continueTraining)
  } else if (result.continueTraining) {
    continueAfterPlayerMove()
  }
}

function continueAfterPlayerMove() {
  if (trainingSession.shouldShowLineComplete()) {
    lineCompletePopup.value?.show()
  } else {
    opponentEngine.schedule(300)
  }
}

function handleTranspositionCheck(shouldContinue = false) {
  const transposition = repertoireStore.findTransposition(chessGame.currentFen.value)

  if (transposition) {
    transpositionPopup.value?.show(
      transposition.path,
      () => {
        // Confirm: Jump to transposition
        repertoireStore.navigateToPosition(transposition.path, transposition.color)
        emit('showToast', 'Jumped to transposition!', 'success')
        boardConfig.updatePosition()
      },
      () => {
        // Cancel: Continue here if in training mode
        if (shouldContinue && !trainingSession.isEditMode.value) {
          continueAfterPlayerMove()
        }
      },
    )
  } else if (shouldContinue && !trainingSession.isEditMode.value) {
    continueAfterPlayerMove()
  }
}

function checkLineComplete() {
  if (trainingSession.shouldShowLineComplete()) {
    lineCompletePopup.value?.show()
  }
}

function rollback() {
  if (repertoireStore.currentLine.length < 1) return

  trainingSession.rollback()
  boardConfig.updatePosition()
  emit('showToast', 'Position reset for retry', 'info')
}

function cancelOpponentMove() {
  if (!canCancelOpponent.value) return

  chessGame.undo()
  repertoireStore.rollbackMove()
  boardConfig.updatePosition()
  emit('showToast', 'Opponent move canceled. Requesting different response.', 'info')

  opponentEngine.schedule(500)
}

function toggleEditMode() {
  opponentEngine.clearAll()
  const newMode = trainingSession.toggleEditMode()

  if (newMode) {
    emit('showToast', 'Edit mode enabled. You can play both colors to add moves.', 'info')
  } else {
    emit('showToast', 'Edit mode disabled. Back to training mode.', 'info')
  }
}

function newSession() {
  opponentEngine.clearAll()
  trainingSession.startSession(trainingSession.currentColor.value)
  boardConfig.updatePosition()

  if (trainingSession.currentColor.value === 'black') {
    opponentEngine.schedule(500)
  } else {
    const availableMoves = trainingSession.getAvailableMoves()
    if (availableMoves.length > 0) {
      emit(
        'showToast',
        `New session started! Available moves: ${availableMoves.join(', ')}`,
        'info',
      )
    } else {
      emit('showToast', 'No repertoire loaded. Use Edit Mode to add moves.', 'info')
    }
  }
}

function switchColor(orientation?: 'white' | 'black') {
  opponentEngine.clearAll()

  if (orientation) {
    repertoireStore.startNewSession(orientation)
    return
  }

  const newColor = trainingSession.currentColor.value === 'white' ? 'black' : 'white'
  repertoireStore.startNewSession(newColor)
}

function requestNewWhiteMove() {
  opponentEngine.clearAll()
  trainingSession.requestNewWhiteMove()
  boardConfig.updatePosition()
}

// Computed properties for control panel
const canCancelOpponent = computed(() => {
  if (trainingSession.isEditMode.value || repertoireStore.currentLine.length === 0) return false

  const isPlayerTurn = chessGame.currentTurn.value === trainingSession.currentColor.value
  return isPlayerTurn && repertoireStore.currentLine.length > 0
})

const canRollback = computed(() => {
  return repertoireStore.currentLine.length > 0
})

const canRequestNewWhiteMove = computed(() => {
  return (
    trainingSession.currentColor.value === 'black' && repertoireStore.currentLine.length <= 1
  )
})

// Expose functions for external control
defineExpose({
  newSession,
  switchColor,
  rollback,
  cancelOpponentMove,
  toggleEditMode,
  requestNewWhiteMove,
  canCancelOpponent,
  canRollback,
  canRequestNewWhiteMove,
  isEditMode: trainingSession.isEditMode,
})
</script>

<style scoped>
.chess-board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  max-width: 100%;
  max-height: 100vh;
  overflow-y: hidden;
  width: 100%;
}
</style>
