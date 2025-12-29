<template>
  <div class="controls-panel">
    <div class="panel-header">
      <h3>Training Controls</h3>
    </div>

    <div class="panel-content">
      <div class="control-section">
        <h4>Session</h4>
        <div class="control-buttons">
          <button @click="$emit('newSession')" class="control-btn primary">🔄 New Session</button>
        </div>
      </div>

      <div class="control-section">
        <h4>Move Control</h4>
        <div class="control-buttons">
          <button @click="$emit('rollback')" :disabled="!canRollback" class="control-btn danger">
            ↶ Undo Move
          </button>
          <button
            @click="$emit('cancelOpponentMove')"
            :disabled="!canCancelOpponent"
            class="control-btn warning"
          >
            🚫 Cancel Opponent Move
          </button>
          <button
            @click="$emit('toggleEditMode')"
            class="control-btn"
            :class="isEditMode ? 'active' : 'secondary'"
          >
            {{ isEditMode ? '✏️ Exit Edit' : '📝 Edit Mode' }}
          </button>
        </div>
      </div>

      <div class="control-section">
        <h4>Theme</h4>
        <div class="theme-switcher">
          <label class="theme-toggle">
            <input type="checkbox" v-model="isDarkMode" @change="toggleTheme" />
            <span class="slider">
              <span class="slider-icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
            </span>
            <span class="theme-label">{{ isDarkMode ? 'Dark' : 'Light' }} Mode</span>
          </label>
        </div>
      </div>

      <div class="control-section">
        <h4>Training Info</h4>
        <div class="training-stats">
          <div class="stat-item">
            <span class="stat-label">Current Color:</span>
            <span class="stat-value">{{ currentColor === 'white' ? 'White' : 'Black' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Move Count:</span>
            <span class="stat-value">{{ moveCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Line Progress:</span>
            <span class="stat-value">{{ currentLineDisplay }}</span>
          </div>
          <div class="stat-item" v-if="isLineCompleted">
            <span class="stat-label">Status:</span>
            <span class="stat-value line-completed">✅&nbsp;Line&nbsp;Completed</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  canRollback: boolean
  canCancelOpponent: boolean
  currentColor: 'white' | 'black'
  moveCount: number
  currentLineDisplay: string
  isLineCompleted: boolean
  isEditMode: boolean
}

defineProps<Props>()

defineEmits<{
  newSession: []
  switchColor: []
  rollback: []
  cancelOpponentMove: []
  toggleEditMode: []
}>()

const isDarkMode = ref(true)

function toggleTheme() {
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
  localStorage.setItem('darkMode', isDarkMode.value.toString())
}

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('darkMode')
if (savedTheme === 'true') {
  isDarkMode.value = true
  document.documentElement.classList.add('dark-mode')
}
</script>

<style scoped>
.controls-panel {
  width: 280px;
  height: 100vh;
  background: #f8f9fa;
  border-left: 2px solid #dee2e6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  background: white;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.control-section {
  margin-bottom: 30px;
}

.control-section h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 5px;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.control-btn.primary {
  background: #007bff;
  color: white;
}

.control-btn.primary:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.control-btn.secondary {
  background: #6c757d;
  color: white;
}

.control-btn.secondary:hover {
  background: #545b62;
  transform: translateY(-1px);
}

.control-btn.danger {
  background: #dc3545;
  color: white;
}

.control-btn.danger:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.control-btn.warning {
  background: #ffc107;
  color: #212529;
}

.control-btn.warning:hover {
  background: #e0a800;
  transform: translateY(-1px);
}

.control-btn.active {
  background: #28a745;
  color: white;
}

.control-btn.active:hover {
  background: #218838;
  transform: translateY(-1px);
}

.control-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.theme-switcher {
  margin-top: 10px;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.theme-toggle input {
  display: none;
}

.slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle input:checked + .slider {
  background: #007bff;
}

.slider-icon {
  font-size: 14px;
  transition: transform 0.3s;
}

.theme-toggle input:checked + .slider .slider-icon {
  transform: translateX(13px);
}

.theme-toggle input:not(:checked) + .slider .slider-icon {
  transform: translateX(-13px);
}

.theme-label {
  font-weight: 500;
  color: #495057;
}

.training-stats {
  background: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #6c757d;
  font-size: 13px;
  font-weight: 500;
}

.stat-value {
  color: #333;
  font-weight: 600;
  font-size: 13px;
  max-width: 120px;
  text-align: right;
  word-break: break-word;
}

.line-completed {
  color: #28a745 !important;
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* Dark mode styles */
:global(.dark-mode) .controls-panel {
  background: #1a202c;
  border-left-color: #2d3748;
}

:global(.dark-mode) .panel-header {
  background: #2d3748;
  border-bottom-color: #4a5568;
}

:global(.dark-mode) .panel-header h3 {
  color: #e2e8f0;
}

:global(.dark-mode) .control-section h4 {
  color: #a0aec0;
  border-bottom-color: #4a5568;
}

:global(.dark-mode) .training-stats {
  background: #2d3748;
  border-color: #4a5568;
}

:global(.dark-mode) .stat-item {
  border-bottom-color: #4a5568;
}

:global(.dark-mode) .stat-label {
  color: #a0aec0;
}

:global(.dark-mode) .stat-value {
  color: #e2e8f0;
}

:global(.dark-mode) .theme-label {
  color: #a0aec0;
}
</style>
