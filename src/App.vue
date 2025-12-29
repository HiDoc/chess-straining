<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100vw;
  transition:
    background-color 0.3s,
    color 0.3s;
}

/* Dark mode global styles */
.dark-mode {
  background: #1a202c !important;
  color: #e2e8f0 !important;
}

.dark-mode body {
  background: #1a202c !important;
  color: #e2e8f0 !important;
}

.dark-mode #app {
  background: #1a202c !important;
  color: #e2e8f0 !important;
}

/* Dark mode for RepertoirePanel */
.dark-mode .repertoire-panel {
  background: #1a202c !important;
  border-right-color: #2d3748 !important;
  color: #e2e8f0 !important;
}

.dark-mode .panel-header {
  background: #2d3748 !important;
  border-bottom-color: #4a5568 !important;
}

.dark-mode .panel-header h3 {
  color: #f7fafc !important;
}

.dark-mode .panel-content {
  background: #1a202c !important;
}

.dark-mode .tree-container {
  background: #2d3748 !important;
  border-color: #4a5568 !important;
}

.dark-mode .action-btn {
  border-color: #4a5568 !important;
}

.dark-mode .edit-modal {
  background: rgba(0, 0, 0, 0.8) !important;
}

.dark-mode .modal-content {
  background: #2d3748 !important;
  color: #e2e8f0 !important;
}

.dark-mode .modal-content input {
  background: #4a5568 !important;
  border-color: #718096 !important;
  color: #e2e8f0 !important;
}

.dark-mode .modal-content label {
  color: #cbd5e0 !important;
}

/* Dark mode for tree nodes */

.dark-mode .depth-indicator {
  background: #4a5568 !important;
  color: #cbd5e0 !important;
}

.dark-mode .end-marker {
  color: #68d391 !important;
}

/* Dark mode for controls panel */
.dark-mode .controls-panel {
  background: #1a202c !important;
  border-left-color: #2d3748 !important;
}

.dark-mode .control-section h4 {
  color: #cbd5e0 !important;
  border-bottom-color: #4a5568 !important;
}

.dark-mode .training-stats {
  background: #2d3748 !important;
  border-color: #4a5568 !important;
}

.dark-mode .stat-label {
  color: #a0aec0 !important;
}

.dark-mode .stat-value {
  color: #f7fafc !important;
}

.dark-mode .theme-label {
  color: #cbd5e0 !important;
}

/* Dark mode for main content */
.dark-mode .main-content {
  background: #1a202c !important;
}

.dark-mode .main-content h1 {
  color: #f7fafc !important;
}

/* Dark mode for repertoire actions */
.dark-mode .add-btn {
  background: #38a169 !important;
}

.dark-mode .export-btn {
  background: #3182ce !important;
}

.dark-mode .import-btn {
  background: #718096 !important;
}

/* Dark mode for buttons hover states */
.dark-mode .add-btn:hover {
  background: #2f855a !important;
}

.dark-mode .export-btn:hover {
  background: #2c5282 !important;
}

.dark-mode .import-btn:hover {
  background: #4a5568 !important;
}

/* Dark mode for collapsible tree header */
.dark-mode .tree-header {
  background: #2d3748 !important;
  border-color: #4a5568 !important;
}

.dark-mode .tree-header:hover {
  background: #4a5568 !important;
}

.dark-mode .tree-header h4 {
  color: #f7fafc !important;
}

.dark-mode .collapse-btn {
  color: #a0aec0 !important;
}
</style>
