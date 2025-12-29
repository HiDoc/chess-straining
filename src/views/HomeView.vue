<script setup lang="ts">
import { ref, computed } from 'vue'
import ChessBoard from '../components/ChessBoard.vue'
import RepertoirePanel from '../components/RepertoirePanel.vue'
import ControlsPanel from '../components/ControlsPanel.vue'
import ToastNotification from '../components/ToastNotification.vue'
import { useRepertoireStore } from '../stores/repertoire'

const repertoireStore = useRepertoireStore()
const chessBoardRef = ref()
const toastRef = ref()

const canRollback = computed(() => chessBoardRef.value?.canRollback ?? false)
const canCancelOpponent = computed(() => chessBoardRef.value?.canCancelOpponent ?? false)
const currentColor = computed(() => repertoireStore.currentColor)
const moveCount = computed(() => repertoireStore.currentLine.length)
const currentLineDisplay = computed(() =>
  repertoireStore.currentLine.length > 0
    ? repertoireStore.currentLine.join(' → ')
    : 'Start position',
)
const isLineCompleted = computed(
  () =>
    Object.keys(repertoireStore.currentRepertoire).length === 0 &&
    repertoireStore.currentLine.length > 0,
)
const isEditMode = computed(() => chessBoardRef.value?.isEditMode ?? false)

function handleNewSession() {
  if (chessBoardRef.value) {
    chessBoardRef.value.newSession()
  }
}

function handleSwitchColor() {
  if (chessBoardRef.value) {
    chessBoardRef.value.switchColor()
  }
}

function handleRollback() {
  if (chessBoardRef.value) {
    chessBoardRef.value.rollback()
  }
}

function handleCancelOpponentMove() {
  if (chessBoardRef.value) {
    chessBoardRef.value.cancelOpponentMove()
  }
}

function handleToggleEditMode() {
  if (chessBoardRef.value) {
    chessBoardRef.value.toggleEditMode()
  }
}

function showToast(message: string, type: 'success' | 'error' | 'info') {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}
</script>

<template>
  <div class="app-layout">
    <RepertoirePanel class="left-panel" />
    <main class="main-content">
      <ChessBoard ref="chessBoardRef" @show-toast="showToast" />
    </main>
    <ControlsPanel
      class="right-panel"
      :can-rollback="canRollback"
      :can-cancel-opponent="canCancelOpponent"
      :current-color="currentColor"
      :move-count="moveCount"
      :current-line-display="currentLineDisplay"
      :is-line-completed="isLineCompleted"
      :is-edit-mode="isEditMode"
      @new-session="handleNewSession"
      @switch-color="handleSwitchColor"
      @rollback="handleRollback"
      @cancel-opponent-move="handleCancelOpponentMove"
      @toggle-edit-mode="handleToggleEditMode"
    />
    <ToastNotification ref="toastRef" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
}

.left-panel {
  flex-shrink: 0;
  width: 350px;
  z-index: 10;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  overflow-y: auto;
  min-width: 400px;
}

.right-panel {
  flex-shrink: 0;
}

.main-content h1 {
  color: #333;
  font-size: 1.8rem;
}

/* Dark mode styles */
:global(.dark-mode) {
  background: #1a202c;
  color: #e2e8f0;
}

:global(.dark-mode) .main-content h1 {
  color: #e2e8f0;
}

:global(.dark-mode) body {
  background: #1a202c;
}
</style>
