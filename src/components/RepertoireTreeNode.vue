<template>
  <div class="tree-node">
    <div
      class="node-content"
      :class="{ highlighted: isHighlighted }"
      :style="{ paddingLeft: `${depth * 10}px` }"
      @click="navigateToPosition"
    >
      <div class="node-info">
        <span class="move-pair">
          <span class="move-number"
            >{{ Math.floor(depth / 2) + 1 }}{{ depth % 2 === 1 ? '...' : '.' }}</span
          >
          <span
            class="move-text"
            :class="{ 'white-move': depth % 2 === 0, 'black-move': depth % 2 === 1 }"
          >
            {{ move }}
          </span>
        </span>
        <span v-if="children.name" class="inline-name"> {{ children.name }}</span>
      </div>

      <div class="node-actions">
        <button
          @click="$emit('addResponse', path)"
          class="action-icon add-icon"
          title="Add response"
        >
          +
        </button>
        <button @click="showNameDialog" class="action-icon name-icon" title="Name this line">
          ✏️
        </button>
        <button
          @click="$emit('deleteMove', path)"
          class="action-icon delete-icon"
          title="Delete move"
        >
          🗑️
        </button>
        <button
          @click="toggleExpanded"
          class="action-icon expand-icon"
          v-if="hasChildren"
          :title="isExpanded ? 'Collapse' : 'Expand'"
        >
          {{ isExpanded ? '▼' : '▶' }}
        </button>
      </div>
    </div>

    <div v-if="isExpanded && hasChildren" class="children">
      <template v-for="(childMoves, childMove) in children" :key="childMove">
        <RepertoireTreeNode
          v-if="childMove !== 'name'"
          :move="String(childMove)"
          :children="childMoves as RepertoireMove"
          :depth="depth + 1"
          :path="[...path, String(childMove)]"
          :current-line="currentLine"
          :is-highlighted="isChildHighlighted(String(childMove))"
          @edit-move="$emit('editMove', $event)"
          @delete-move="$emit('deleteMove', $event)"
          @add-response="$emit('addResponse', $event)"
          @navigate-to-position="$emit('navigateToPosition', $event)"
          @name-line="(path, name) => $emit('nameLine', path, name)"
        />
      </template>
    </div>

    <div v-if="isExpanded && !hasChildren" class="end-line">
      <div :style="{ paddingLeft: `${(depth + 1) * 20}px` }" class="end-marker">
        📍 End of line
        <span v-if="lineName" class="line-name">- {{ lineName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RepertoireMove } from '../stores/repertoire'

interface Props {
  move: string
  children: RepertoireMove
  depth: number
  path: string[]
  currentLine?: string[]
  isHighlighted?: boolean
  lineName?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  editMove: [path: string[]]
  deleteMove: [path: string[]]
  addResponse: [path: string[]]
  navigateToPosition: [path: string[]]
  nameLine: [path: string[], name: string]
}>()

const isExpanded = ref(false)

const hasChildren = computed(() => {
  const keys = Object.keys(props.children)
  // Filter out 'name' key when checking for children
  return keys.filter((k) => k !== 'name').length > 0
})

watch(
  () => props.currentLine,
  (newLine) => {
    if (!newLine) return

    // If the current line includes this node's path, expand it
    // Only expand if the current line goes deeper than this node
    if (newLine.length > props.path.length) {
      const isPathInLine = props.path.every((move, index) => move === newLine[index])
      if (isPathInLine) {
        isExpanded.value = true
      }
    }
  },
  { immediate: true, deep: true },
)

function isChildHighlighted(childMove: string): boolean {
  if (!props.currentLine) return false
  const currentIndex = props.depth + 1
  return props.currentLine[currentIndex] === childMove
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function navigateToPosition(event: Event) {
  // Prevent event bubbling to parent nodes
  event.stopPropagation()

  // Don't navigate if clicking on action buttons
  if ((event.target as HTMLElement).closest('.node-actions')) {
    return
  }

  emit('navigateToPosition', props.path)
}

function showNameDialog(event: Event) {
  event.stopPropagation()
  const currentName = props.children.name || ''
  const name = prompt('Enter a name for this line:', currentName)
  if (name !== null) {
    emit('nameLine', props.path, name)
  }
}
</script>

<style scoped>
.tree-node {
  margin: 2px 0;
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.node-content:hover {
  background-color: #f0f0f0;
}

.node-content.highlighted {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
  font-weight: bold;
}

.dark-mode .node-content.highlighted {
  background-color: #2d2f1a !important;
  border-left-color: #f6d55c !important;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.move-pair {
  display: flex;
  align-items: center;
  gap: 4px;
}

.move-number {
  font-size: 12px;
  color: #666;
  font-weight: normal;
  min-width: 20px;
}

.dark-mode .move-number {
  color: #a0aec0 !important;
}

.move-text {
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.white-move {
  color: #2c3e50;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 3px;
}
.dark-mode .white-move {
  color: #2c3e50;
}
.black-move {
  color: #ecf0f1;
  background: #2c3e50;
  padding: 2px 6px;
  border-radius: 3px;
}

.depth-indicator {
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 12px;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.node-content:hover .node-actions {
  opacity: 1;
}

.action-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  transition: background-color 0.2s;
}

.add-icon {
  color: #28a745;
  font-weight: bold;
}

.add-icon:hover {
  background: #28a745;
  color: white;
}

.edit-icon:hover {
  background: #ffc107;
}

.name-icon {
  color: #6f42c1;
}

.name-icon:hover {
  background: #6f42c1;
  color: white;
}

.delete-icon:hover {
  background: #dc3545;
}

.expand-icon {
  color: #007bff;
  font-weight: bold;
}

.expand-icon:hover {
  background: #007bff;
  color: white;
}

.children {
  border-left: 2px solid #dee2e6;
  margin-left: 0px;
}

.end-line {
  margin: 4px 0;
}

.end-marker {
  font-size: 12px;
  color: #28a745;
  font-style: italic;
  padding: 4px 8px;
}

.line-name {
  color: #6f42c1;
  font-weight: bold;
  font-style: normal;
  margin-left: 8px;
}

.inline-name {
  font-weight: normal;
  font-style: italic;
  opacity: 0.9;
}
.dark-mode .inline-name:hover {
  color: black;
}
</style>
