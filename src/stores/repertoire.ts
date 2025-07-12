import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface RepertoireMove {
  [move: string]: RepertoireMove
}

export interface RepertoireData {
  white: RepertoireMove
  black: RepertoireMove
}

export const useRepertoireStore = defineStore('repertoire', () => {
  const repertoire = ref<RepertoireData>({ white: {}, black: {} })
  const currentColor = ref<'white' | 'black'>('white')
  const currentLine = ref<string[]>([])
  const gameHistory = ref<string[]>([])
  const lineNames = ref<{ [key: string]: string }>({})

  // Load repertoire from JSON file
  async function loadRepertoire() {
    try {
      const response = await fetch('/repertoire.json')
      const data = await response.json()
      repertoire.value = data
    } catch (error) {
      console.error('Failed to load repertoire:', error)
    }
  }

  // Save repertoire to JSON (in a real app, this would need a backend)
  async function saveRepertoire() {
    try {
      // For demo purposes, we'll just log the JSON
      // In production, this would send to a backend API
      console.log('Saving repertoire:', JSON.stringify(repertoire.value, null, 2))
    } catch (error) {
      console.error('Failed to save repertoire:', error)
    }
  }

  // Get possible responses for current position
  const currentRepertoire = computed(() => {
    let current = repertoire.value[currentColor.value]
    for (const move of currentLine.value) {
      if (current[move]) {
        current = current[move]
      } else {
        return {}
      }
    }
    return current
  })

  // Get random opponent move from current position
  function getRandomOpponentMove(): string | null {
    const possibleMoves = Object.keys(currentRepertoire.value)
    if (possibleMoves.length === 0) return null
    const randomIndex = Math.floor(Math.random() * possibleMoves.length)
    return possibleMoves[randomIndex]
  }

  // Check if a move is valid according to repertoire
  function isValidMove(move: string): boolean {
    return move in currentRepertoire.value
  }

  // Make a move in the training session
  function makeMove(move: string) {
    if (isValidMove(move)) {
      currentLine.value.push(move)
      gameHistory.value.push(move)
      return true
    }
    return false
  }

  // Rollback to previous position
  function rollbackMove() {
    if (currentLine.value.length > 0) {
      currentLine.value.pop()
      gameHistory.value.pop()
    }
  }

  // Start new training session
  function startNewSession(color: 'white' | 'black') {
    currentColor.value = color
    currentLine.value = []
    gameHistory.value = []
  }

  // Navigate to specific position in repertoire
  function navigateToPosition(path: string[], color: 'white' | 'black') {
    currentColor.value = color
    currentLine.value = [...path]
    gameHistory.value = [...path]
  }

  // Add new move to repertoire
  function addMoveToRepertoire(moves: string[], newMove: string) {
    let current = repertoire.value[currentColor.value]
    for (const move of moves) {
      if (!current[move]) {
        current[move] = {}
      }
      current = current[move]
    }
    if (!current[newMove]) {
      current[newMove] = {}
    }
    saveRepertoire()
  }

  // Name a line
  function nameLine(path: string[], name: string, color: 'white' | 'black') {
    const key = `${color}:${path.join(',')}`
    lineNames.value[key] = name
  }

  // Get line name
  function getLineName(path: string[], color: 'white' | 'black'): string | undefined {
    const key = `${color}:${path.join(',')}`
    return lineNames.value[key]
  }

  return {
    repertoire,
    currentColor,
    currentLine,
    gameHistory,
    currentRepertoire,
    lineNames,
    loadRepertoire,
    saveRepertoire,
    getRandomOpponentMove,
    isValidMove,
    makeMove,
    rollbackMove,
    startNewSession,
    navigateToPosition,
    addMoveToRepertoire,
    nameLine,
    getLineName
  }
})