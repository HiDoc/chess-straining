<template>
  <div class="repertoire-panel">
    <div class="panel-header">
      <h3>Repertoire Management</h3>
      <div class="color-selector">
        <div class="segmented-control">
          <input
            type="radio"
            id="color-white"
            value="white"
            v-model="selectedColor"
            @change="switchToColor('white')"
          />
          <label for="color-white" class="segment-label"> <span class="icon">♔</span> White </label>

          <input
            type="radio"
            id="color-black"
            value="black"
            v-model="selectedColor"
            @change="switchToColor('black')"
          />
          <label for="color-black" class="segment-label"> <span class="icon">♚</span> Black </label>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <div class="repertoire-actions">
        <label class="action-btn import-btn">
          Import JSON
          <input type="file" @change="importRepertoire" accept=".json" style="display: none" />
        </label>
        <button @click="exportRepertoire" class="action-btn export-btn">Export JSON</button>
      </div>

      <div class="repertoire-tree">
        <div class="tree-container">
          <template v-for="(moves, move) in currentRepertoire" :key="move">
            <RepertoireTreeNode
              v-if="move !== 'name'"
              :move="String(move)"
              :children="moves as RepertoireMove"
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
          </template>
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

      <div v-if="isExporting" class="edit-modal">
        <div class="modal-content">
          <h4>Export Repertoire</h4>
          <div class="edit-form">
            <label>File Name:</label>
            <input
              v-model="exportFileName"
              type="text"
              placeholder="Enter file name"
              @keyup.enter="confirmExport"
            />
            <div class="modal-actions">
              <button @click="confirmExport" class="save-btn">Export</button>
              <button @click="cancelExport" class="cancel-btn">Cancel</button>
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
const isExporting = ref(false)
const exportFileName = ref('')

const currentRepertoire = computed(() => repertoireStore.repertoire[selectedColor.value])

const totalLines = computed(() => {
  function countLines(moves: RepertoireMove): number {
    let count = 0
    for (const [key, children] of Object.entries(moves)) {
      if (key === 'name') continue

      // Check if children is an object and not a string (just in case)
      if (typeof children === 'object' && children !== null) {
        // Filter out 'name' from keys check
        const childKeys = Object.keys(children).filter((k) => k !== 'name')

        if (childKeys.length === 0) {
          count += 1
        } else {
          count += countLines(children as RepertoireMove)
        }
      }
    }
    return count
  }
  return countLines(currentRepertoire.value)
})

const maxDepth = computed(() => {
  function getDepth(moves: RepertoireMove, depth = 0): number {
    let maxD = depth
    for (const [key, children] of Object.entries(moves)) {
      if (key === 'name') continue

      if (typeof children === 'object' && children !== null) {
        const childKeys = Object.keys(children).filter((k) => k !== 'name')

        if (childKeys.length > 0) {
          maxD = Math.max(maxD, getDepth(children as RepertoireMove, depth + 1))
        } else {
          // If it's a leaf node (only has name or empty), depth is current depth + 1
          maxD = Math.max(maxD, depth + 1)
        }
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

function navigateToPosition(path: string[]) {
  // Navigate to this position in the store
  repertoireStore.navigateToPosition(path, selectedColor.value)
}

function handleNameLine(path: string[], name: string) {
  repertoireStore.nameLine(path, name, selectedColor.value)
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
      current = current[path[i]] as RepertoireMove
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
    current = current[pathMove] as RepertoireMove
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
  exportFileName.value = `chess-repertoire-${new Date().toISOString().split('T')[0]}`
  isExporting.value = true
}

function cancelExport() {
  isExporting.value = false
  exportFileName.value = ''
}

function confirmExport() {
  const fileName = exportFileName.value.endsWith('.json')
    ? exportFileName.value
    : `${exportFileName.value}.json`

  // Check if running in Electron
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any
  if (typeof window !== 'undefined' && win?.process?.versions?.electron) {
    const { ipcRenderer } = win.require('electron')
    ipcRenderer.invoke('save-repertoire', {
      data: repertoireStore.repertoire,
      fileName: fileName,
    })
    isExporting.value = false
    return
  }

  const dataStr = JSON.stringify(repertoireStore.repertoire, null, 2)

  // Try using the File System Access API (Chrome/Edge/Opera)
  if ('showSaveFilePicker' in window) {
    try {
      // @ts-expect-error Experimental API
      window
        .showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'JSON File',
              accept: { 'application/json': ['.json'] },
            },
          ],
        })
        .then(async (fileHandle: FileSystemFileHandle) => {
          const writable = await fileHandle.createWritable()
          await writable.write(dataStr)
          await writable.close()
        })
        .catch((err: DOMException) => {
          if (err.name !== 'AbortError') {
            console.error('File Save Error:', err)
            // Fallback if something goes wrong (but not if user cancelled)
            downloadFallback(dataStr, fileName)
          }
        })
      isExporting.value = false
      return
    } catch (e) {
      // Fallback to download
      console.error('File System Access API Error:', e)
    }
  }

  downloadFallback(dataStr, fileName)
  isExporting.value = false
}

function downloadFallback(dataStr: string, fileName: string) {
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', fileName)
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
  justify-content: center;
  margin-top: 10px;
}

.segmented-control {
  display: flex;
  background: #e9ecef;
  border-radius: 8px;
  padding: 4px;
  width: 100%;
}

.segmented-control input[type='radio'] {
  display: none;
}

.segment-label {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  color: black;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  user-select: none;
}

.segment-label:hover {
  color: #212529;
}

.segmented-control input[type='radio']:checked + .segment-label {
  background: white;
  color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 1.2em;
  line-height: 1;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
}

.repertoire-actions {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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
