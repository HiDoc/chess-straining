<template>
  <div class="repertoire-panel">
    <div class="panel-header">
      <h3>Repertoire Management</h3>
      <div class="color-selector">
        <label>
          <input
            type="radio"
            value="white"
            v-model="selectedColor"
            @change="switchToColor('white')"
          />
          White
        </label>
        <label>
          <input
            type="radio"
            value="black"
            v-model="selectedColor"
            @change="switchToColor('black')"
          />
          Black
        </label>
      </div>
    </div>

    <div class="panel-content">
      <div class="repertoire-actions">
        <button @click="addNewLine" class="action-btn add-btn">+ Add New Line</button>
        <button @click="exportRepertoire" class="action-btn export-btn">Export JSON</button>
        <label class="action-btn import-btn">
          Import JSON
          <input type="file" @change="importRepertoire" accept=".json" style="display: none" />
        </label>
      </div>

      <div class="repertoire-tree">
        <div class="tree-header" @click="toggleTreeExpanded">
          <h4>{{ selectedColor === 'white' ? 'White' : 'Black' }} Repertoire</h4>
          <button class="collapse-btn">{{ isTreeExpanded ? '▼' : '▶' }}</button>
        </div>
        <div v-show="isTreeExpanded" class="tree-container">
          <RepertoireTreeNode
            v-for="(moves, move) in currentRepertoire"
            :key="move"
            :move="String(move)"
            :children="moves"
            :depth="0"
            :path="[String(move)]"
            :current-line="repertoireStore.currentLine"
            :is-highlighted="isRootHighlighted(String(move))"
            @edit-move="editMove"
            @delete-move="deleteMove"
            @add-response="addResponse"
            @navigate-to-position="navigateToPosition"
            @name-line="handleNameLine"
          />
        </div>
      </div>

      <div v-if="isEditing" class="edit-modal">
        <div class="modal-content">
          <h4>{{ editingPath.length === 0 ? 'Add New Line' : 'Add Response' }}</h4>
          <div class="edit-form">
            <label>Move (e.g., e4, Nf3, Bb5):</label>
            <input
              v-model="newMove"
              type="text"
              placeholder="Enter move in algebraic notation"
              @keyup.enter="saveMove"
            />
            <div class="modal-actions">
              <button @click="saveMove" class="save-btn">Save</button>
              <button @click="cancelEdit" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <div class="stats">
        <p>Total lines: {{ totalLines }}</p>
        <p>Current depth: {{ maxDepth }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRepertoireStore, type RepertoireMove } from '../stores/repertoire'
import RepertoireTreeNode from './RepertoireTreeNode.vue'

const repertoireStore = useRepertoireStore()
const selectedColor = ref<'white' | 'black'>('white')
const isEditing = ref(false)
const newMove = ref('')
const editingPath = ref<string[]>([])
const isTreeExpanded = ref(true)

const currentRepertoire = computed(() => repertoireStore.repertoire[selectedColor.value])

const totalLines = computed(() => {
  function countLines(moves: RepertoireMove): number {
    let count = 0
    for (const [, children] of Object.entries(moves)) {
      if (Object.keys(children as RepertoireMove).length === 0) {
        count += 1
      } else {
        count += countLines(children as RepertoireMove)
      }
    }
    return count
  }
  return countLines(currentRepertoire.value)
})

const maxDepth = computed(() => {
  function getDepth(moves: RepertoireMove, depth = 0): number {
    let maxD = depth
    for (const [, children] of Object.entries(moves)) {
      if (Object.keys(children as RepertoireMove).length > 0) {
        maxD = Math.max(maxD, getDepth(children as RepertoireMove, depth + 1))
      }
    }
    return maxD
  }
  return getDepth(currentRepertoire.value)
})

onMounted(() => {
  // Initialize selectedColor to match current training color
  selectedColor.value = repertoireStore.currentColor
})

function switchToColor(color: 'white' | 'black') {
  selectedColor.value = color
  // Auto-switch training to this color
  repertoireStore.startNewSession(color)
}

function isRootHighlighted(move: string): boolean {
  return repertoireStore.currentLine.length > 0 && repertoireStore.currentLine[0] === move
}

function toggleTreeExpanded() {
  isTreeExpanded.value = !isTreeExpanded.value
}

function navigateToPosition(path: string[]) {
  // Navigate to this position in the store
  repertoireStore.navigateToPosition(path, selectedColor.value)
}

function handleNameLine(path: string[], name: string) {
  repertoireStore.nameLine(path, name, selectedColor.value)
}

function addNewLine() {
  editingPath.value = []
  newMove.value = ''
  isEditing.value = true
}

function addResponse(path: string[]) {
  editingPath.value = [...path]
  newMove.value = ''
  isEditing.value = true
}

function editMove(path: string[]) {
  const lastMove = path[path.length - 1]
  editingPath.value = path.slice(0, -1)
  newMove.value = lastMove
  isEditing.value = true
}

function deleteMove(path: string[]) {
  if (
    confirm(
      `Are you sure you want to delete the move "${path[path.length - 1]}" and all its responses?`,
    )
  ) {
    let current = repertoireStore.repertoire[selectedColor.value]

    // Navigate to parent
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }

    // Delete the move
    delete current[path[path.length - 1]]

    repertoireStore.saveRepertoire()
  }
}

function saveMove() {
  if (!newMove.value.trim()) {
    alert('Please enter a move')
    return
  }

  const move = newMove.value.trim()

  // Add move to repertoire
  let current = repertoireStore.repertoire[selectedColor.value]

  // Navigate to the correct position
  for (const pathMove of editingPath.value) {
    if (!current[pathMove]) {
      current[pathMove] = {}
    }
    current = current[pathMove]
  }

  // Add the new move
  if (!current[move]) {
    current[move] = {}
  }

  repertoireStore.saveRepertoire()
  cancelEdit()
}

function cancelEdit() {
  isEditing.value = false
  newMove.value = ''
  editingPath.value = []
}

function exportRepertoire() {
  const dataStr = JSON.stringify(repertoireStore.repertoire, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

  const exportFileDefaultName = `chess-repertoire-${new Date().toISOString().split('T')[0]}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

function importRepertoire(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        const importedData = JSON.parse(result)

        if (importedData.white && importedData.black) {
          repertoireStore.repertoire = importedData
          repertoireStore.saveRepertoire()
          alert('Repertoire imported successfully!')
        } else {
          alert(
            'Invalid repertoire format. Expected structure with "white" and "black" properties.',
          )
        }
      } catch {
        alert('Error parsing JSON file. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }
}
</script>

<style scoped>
.repertoire-panel {
  width: 350px;
  height: 100vh;
  background: #f8f9fa;
  border-right: 2px solid #dee2e6;
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
  margin: 0 0 15px 0;
  color: #333;
}

.color-selector {
  display: flex;
  gap: 15px;
}

.color-selector label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
}

.repertoire-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
}

.add-btn {
  background: #28a745;
  color: white;
}

.add-btn:hover {
  background: #218838;
}

.export-btn {
  background: #007bff;
  color: white;
}

.export-btn:hover {
  background: #0056b3;
}

.import-btn {
  background: #6c757d;
  color: white;
  display: block;
}

.import-btn:hover {
  background: #545b62;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 15px;
  border: 1px solid #dee2e6;
}

.tree-header:hover {
  background-color: #f8f9fa;
}

.tree-header h4 {
  margin: 0;
  color: #333;
}

.collapse-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.tree-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
  background: white;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
}

.modal-content h4 {
  margin: 0 0 15px 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.edit-form label {
  font-weight: bold;
  color: #333;
}

.edit-form input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.save-btn {
  background: #28a745;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background: #218838;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #545b62;
}

.panel-footer {
  padding: 15px 20px;
  border-top: 1px solid #dee2e6;
  background: white;
}
.dark-mode .panel-footer {
  background: #2d3748 !important;
  border-bottom-color: #4a5568 !important;
  color: white;
}

.stats {
  font-size: 12px;
  color: #666;
}

.stats p {
  margin: 0 0 5px 0;
}
</style>
