<template>
  <div class="chess-board-container">
    <TheChessboard
      :board-config="boardConfig"
      @board-created="(api) => (boardApi = api)"
      @move="handleMove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { Chess } from 'chess.js'
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import { useRepertoireStore } from '../stores/repertoire'

const repertoireStore = useRepertoireStore()
const game = ref(new Chess())
const boardApi = ref<{ setPosition: (fen: string) => void } | null>(null)
const isEditMode = ref(false)
const lastOpponentMove = ref<string | null>(null)

const color = computed(() => repertoireStore.currentColor)

const emit = defineEmits<{
  showToast: [message: string, type: 'success' | 'error' | 'info']
}>()

const boardConfig = reactive({
  orientation: 'white' as 'white' | 'black',
  coordinates: true,
  autoCastle: true,
  viewOnly: false,
  disableContextMenu: false,
  addPieceZIndex: false,
  blockTouchScroll: false,
  highlight: {
    lastMove: true,
    check: true,
  },
  animation: {
    enabled: true,
    duration: 200,
  },
  movable: {
    free: false,
    color: 'white' as 'white' | 'black',
    showDests: true,
    events: {},
  },
  drawable: {
    enabled: false,
  },
})

onMounted(async () => {
  await repertoireStore.loadRepertoire()

  // Wait a bit for the board to be created
  setTimeout(() => {
    updateBoard()

    // If training as black, opponent (white) should make the first move
    // If training as white, player should move first (no opponent move needed)
    if (color.value === 'black') {
      setTimeout(() => {
        makeOpponentMove()
      }, 500)
    } else {
      // Show available opening moves for white
      const availableMoves = Object.keys(repertoireStore.currentRepertoire)
      const currentTurn = getCurrentTurn()
      if (availableMoves.length > 0) {
        emit('showToast', `Your turn! (${currentTurn} to move) Available moves: ${availableMoves.join(', ')}`, 'info')
      } else {
        emit('showToast', 'No repertoire loaded. Use Edit Mode to add moves.', 'info')
      }
    }
  }, 100)
})

function handleMove({ from, to }: { from: string; to: string }) {
  // Check whose turn it is BEFORE making the move
  const turnBeforeMove = getCurrentTurn()
  
  // In normal training mode, only allow moves when it's the player's turn
  if (!isEditMode.value && turnBeforeMove !== color.value) {
    emit('showToast', `Wait for opponent's move! It's ${turnBeforeMove}'s turn.`, 'error')
    return
  }

  const move = game.value.move({
    from,
    to,
    promotion: 'q',
  })

  if (move === null) {
    emit('showToast', 'Invalid chess move!', 'error')
    updateBoard()
    return
  }

  const moveNotation = move.san

  if (isEditMode.value) {
    // In edit mode, allow any legal move and add it to repertoire
    repertoireStore.addMoveToRepertoire(repertoireStore.currentLine, moveNotation)
    repertoireStore.makeMove(moveNotation)
    emit('showToast', `Added move ${moveNotation} to repertoire`, 'success')
    updateBoard()
    return
  }

  // Normal training mode - check if move is in repertoire

  if (repertoireStore.isValidMove(moveNotation)) {
    repertoireStore.makeMove(moveNotation)
    emit('showToast', 'Correct move!', 'success')
    updateBoard()

    // After player move, opponent should respond (unless line is completed)
    if (Object.keys(repertoireStore.currentRepertoire).length > 0) {
      setTimeout(() => {
        makeOpponentMove()
      }, 300)
    }
  } else {
    game.value.undo()
    emit('showToast', 'Not in your repertoire! Try again.', 'error')
    updateBoard()
  }
}

function makeOpponentMove() {
  const opponentMove = repertoireStore.getRandomOpponentMove()

  if (opponentMove) {
    const move = game.value.move(opponentMove)
    if (move) {
      repertoireStore.makeMove(opponentMove)
      lastOpponentMove.value = opponentMove
      updateBoard()
      emit('showToast', `Opponent played: ${opponentMove}`, 'info')
    }
  } else {
    emit('showToast', 'No opponent responses available for this position.', 'info')
  }
}

function rollback() {
  if (repertoireStore.currentLine.length >= 1) {
    const currentTurn = getCurrentTurn()

    // Undo back to the player's turn
    // If it's currently opponent's turn, undo the user's last move
    if (currentTurn !== color.value) {
      game.value.undo()
      repertoireStore.rollbackMove()
    }
    // If it's currently player's turn, we might need to undo an opponent move too
    else if (repertoireStore.currentLine.length >= 2) {
      // Undo opponent move and user move to get back to player's turn
      game.value.undo() // Undo opponent move
      repertoireStore.rollbackMove()
      game.value.undo() // Undo user move
      repertoireStore.rollbackMove()
    }

    updateBoard()
    emit('showToast', 'Position reset for retry', 'info')
  }
}

function cancelOpponentMove() {
  if (lastOpponentMove.value && repertoireStore.currentLine.length > 0) {
    // Undo only the opponent's last move
    game.value.undo()
    repertoireStore.rollbackMove()
    lastOpponentMove.value = null
    updateBoard()
    emit('showToast', 'Opponent move canceled. Try a different response.', 'info')

    // Allow opponent to make a different move
    setTimeout(() => {
      makeOpponentMove()
    }, 500)
  }
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value
  if (isEditMode.value) {
    emit('showToast', 'Edit mode enabled. You can play both colors to add moves.', 'info')
  } else {
    emit('showToast', 'Edit mode disabled. Back to training mode.', 'info')
  }
}

function newSession() {
  game.value.reset()
  repertoireStore.startNewSession(color.value)
  updateBoard()

  // If training as black, opponent (white) should make the first move
  if (color.value === 'black') {
    setTimeout(() => {
      makeOpponentMove()
    }, 500)
  } else {
    // Show available opening moves for white
    const availableMoves = Object.keys(repertoireStore.currentRepertoire)
    if (availableMoves.length > 0) {
      emit('showToast', `New session started! Available moves: ${availableMoves.join(', ')}`, 'info')
    } else {
      emit('showToast', 'No repertoire loaded. Use Edit Mode to add moves.', 'info')
    }
  }
}

function switchColor() {
  const newColor = color.value === 'white' ? 'black' : 'white'
  repertoireStore.startNewSession(newColor)
  game.value.reset()
  boardConfig.orientation = newColor
  updateBoard()

  // If switching to black, opponent (white) should make the first move
  if (newColor === 'black') {
    setTimeout(() => {
      makeOpponentMove()
    }, 500)
  }
}

function updateBoard() {
  const currentFen = game.value.fen()

  // Update board position using API
  if (boardApi.value) {
    boardApi.value.setPosition(currentFen)
  }

  // Update config for piece movement and orientation
  // Only allow the current turn's pieces to move
  const currentTurn = getCurrentTurn()
  boardConfig.movable.color = currentTurn
  boardConfig.orientation = color.value
}

function getCurrentTurn(): 'white' | 'black' {
  return game.value.turn() === 'w' ? 'white' : 'black'
}

// Computed properties for control panel
const canCancelOpponent = computed(() => {
  return lastOpponentMove.value !== null && repertoireStore.currentLine.length > 0
})

const canRollback = computed(() => {
  return repertoireStore.currentLine.length > 0
})

// Expose functions for external control
defineExpose({
  newSession,
  switchColor,
  rollback,
  cancelOpponentMove,
  toggleEditMode,
  canCancelOpponent,
  canRollback,
  isEditMode,
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
  width: 100%;
}
</style>
