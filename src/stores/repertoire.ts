import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Chess } from 'chess.js'

export interface RepertoireMove {
  [move: string]: RepertoireMove | string | undefined
  name?: string
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
  const fenMap = ref<Record<string, { path: string[], color: 'white' | 'black' }>>({})

  function normalizeFen(fen: string): string {
    return fen.split(' ').slice(0, 4).join(' ')
  }

  function updateFenMap() {
    const map: Record<string, { path: string[], color: 'white' | 'black' }> = {}

    function traverse(moves: RepertoireMove, path: string[], game: Chess, color: 'white' | 'black') {
      const fen = normalizeFen(game.fen())

      // Only store if not root and not already stored (or maybe overwrite if shorter?)
      // We skip root position
      if (path.length > 0 && !map[fen]) {
        map[fen] = { path: [...path], color }
      }

      for (const move in moves) {
        if (move === 'name') continue

        try {
          const moveResult = game.move(move)
          if (moveResult) {
            traverse(moves[move] as RepertoireMove, [...path, move], game, color)
            game.undo()
          }
        } catch (e) {
          // Ignore invalid moves in traversal
        }
      }
    }

    traverse(repertoire.value.white, [], new Chess(), 'white')
    traverse(repertoire.value.black, [], new Chess(), 'black')

    fenMap.value = map
  }

  // Load repertoire from JSON file
  async function loadRepertoire() {
    try {
      const response = await fetch('/repertoire.json')
      const data = await response.json()
      repertoire.value = data
      updateFenMap()
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
    updateFenMap()
  }

  // Name a line
  function nameLine(path: string[], name: string, color: 'white' | 'black') {
    let current = repertoire.value[color]
    for (const move of path) {
      if (current[move]) {
        current = current[move] as RepertoireMove
      }
    }
    current.name = name
    saveRepertoire()
  }

  // Get line name
  function getLineName(path: string[], color: 'white' | 'black'): string | undefined {
    let current = repertoire.value[color]
    for (const move of path) {
      if (current[move]) {
        current = current[move] as RepertoireMove
      } else {
        return undefined
      }
    }
    return current.name
  }

  function findTransposition(fen: string): { path: string[], color: 'white' | 'black' } | null {
    const normalized = normalizeFen(fen)
    const found = fenMap.value[normalized]

    if (found) {
      // Only allow transposition within the same color repertoire
      if (found.color !== currentColor.value) {
        return null
      }

      // Don't return if it's the exact same path we are currently on
      // We need to check if the found path is different from currentLine
      // But currentLine might be a prefix or different.
      // If the found path is the same as currentLine, it's not a transposition, it's where we are.

      // Simple check: if paths are identical in length and content
      if (found.color === currentColor.value &&
        found.path.length === currentLine.value.length &&
        found.path.every((m, i) => m === currentLine.value[i])) {
        return null
      }

      // Also, if we are just extending the current line, we don't want to jump to ourselves.
      // But findTransposition is called after a move.
      // If I play a move and reach a position that is ALREADY in the map (from another branch),
      // then it is a transposition.

      return found
    }
    return null
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
    getLineName,
    findTransposition
  }
})