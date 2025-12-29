<template>
  <Teleport to="body">
    <div class="toast-container">
      <Transition v-for="toast in toasts" :key="toast.id" name="toast" appear>
        <div :class="['toast', `toast-${toast.type}`]" @click="removeToast(toast.id)">
          <div class="toast-content">
            <div class="toast-icon">
              <span v-if="toast.type === 'success'">✅</span>
              <span v-else-if="toast.type === 'error'">❌</span>
              <span v-else-if="toast.type === 'info'">ℹ️</span>
            </div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click.stop="removeToast(toast.id)">×</button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

const toasts = ref<Toast[]>([])
let toastId = 0

function addToast(message: string, type: 'success' | 'error' | 'info', duration = 5000) {
  const toast: Toast = {
    id: ++toastId,
    message,
    type,
    duration,
  }

  toasts.value.push(toast)

  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(toast.id)
  }, duration)
}

function removeToast(id: number) {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose the addToast function for external use
defineExpose({
  addToast,
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  min-width: 300px;
  max-width: 400px;
  pointer-events: auto;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s;
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.toast-success {
  border-left: 4px solid #28a745;
}

.toast-error {
  border-left: 4px solid #dc3545;
}

.toast-info {
  border-left: 4px solid #17a2b8;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast-message {
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0;
  margin-left: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.toast-close:hover {
  background-color: #f0f0f0;
}

/* Animation styles */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .toast {
    background: #2d3748;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .toast-message {
    color: #e2e8f0;
  }

  .toast-close {
    color: #a0aec0;
  }

  .toast-close:hover {
    background-color: #4a5568;
  }
}
</style>
