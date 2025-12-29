<template>
  <Transition name="fade">
    <div v-if="isVisible" class="popup-overlay">
      <div class="popup-content">
        <h3>Transposition Found!</h3>
        <p>This position exists elsewhere in your repertoire.</p>
        <p class="path-info">Jump to: {{ targetPath }}</p>
        <div class="actions">
          <button @click="confirm" class="btn confirm-btn">Jump</button>
          <button @click="cancel" class="btn cancel-btn">Stay</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(false)
const targetPath = ref('')
let onConfirm: (() => void) | null = null
let onCancel: (() => void) | null = null

function show(path: string[], confirmCallback: () => void, cancelCallback: () => void) {
  targetPath.value = path.join(' ')
  onConfirm = confirmCallback
  onCancel = cancelCallback
  isVisible.value = true
}

function confirm() {
  if (onConfirm) onConfirm()
  isVisible.value = false
}

function cancel() {
  if (onCancel) onCancel()
  isVisible.value = false
}

defineExpose({ show })
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.popup-content {
  background-color: white;
  color: #333;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 400px;
}

h3 {
  margin: 0;
  color: #2c3e50;
}

.path-info {
  font-family: monospace;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.confirm-btn {
  background-color: #4caf50;
  color: white;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
