# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chess training application for openings using Vue.js + TypeScript + Vite + chess board library.

### Core Features
- Interactive repertoire training system where users learn proper responses to opponent moves
- Evolving repertoire database (using Pinia for state management)
- Move validation with warnings for incorrect moves and rollback functionality
- Random line selection from stored repertoire for training sessions
- Post-training options: add new moves from current position or start new random training
- Dark mode theme support with persistent user preference
- Toast notification system for user feedback
- Advanced training controls with undo and opponent move cancellation
- Edit mode for real-time repertoire expansion

### Key Requirements
- Application ONLY responds with moves stored in the repertoire database (Pinia)
- Incorrect moves trigger warnings and revert to previous position for retry
- Correct moves advance to next move in the line
- Training completion offers continuation options
- Chess notation follows standard algebraic notation (1.e4, 1...e5, 2.Nf3, etc.)

## Development Commands

Since this is a new project, you'll need to initialize it first:

```bash
# Initialize Vue.js + TypeScript + Vite project
npm create vue@latest . --typescript --pinia --router

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Architecture Notes

### State Management
- Use Pinia for repertoire database storage
- Repertoire data persisted in JSON file and loaded into Pinia store on app mounting
- Store move sequences, positions, and training progress
- Maintain current position state and move history for rollback functionality
- Sync store changes back to JSON file for persistence

### Chess Integration
- ✅ vue3-chessboard for interactive chess board display
- ✅ chess.js for game logic, move validation, and position management
- ✅ Support for board orientation (white/black perspective)
- ✅ Automatic promotion to queen for pawn moves
- ✅ Move highlighting and visual feedback

### Core Components Structure
- **RepertoirePanel**: Left panel for repertoire management, tree display, and line naming
- **ChessBoard**: Interactive chess board with training logic, edit mode, and move validation
- **ControlsPanel**: Right panel with training controls, session management, and theme toggle
- **RepertoireTreeNode**: Recursive component for displaying repertoire moves in tree format
- **ToastNotification**: User feedback system with success/error/info messages

### Current Implementation Status
- ✅ Full repertoire management with JSON persistence
- ✅ Interactive chess board with vue3-chessboard and chess.js
- ✅ Training mode with move validation and opponent responses
- ✅ Dark mode theme with comprehensive styling
- ✅ Toast notification system
- ✅ Collapsible repertoire tree with click navigation
- ✅ Line naming and organization features
- ✅ Advanced training controls (undo, cancel opponent move, edit mode)
- ✅ Proper chess notation display (1.e4, 1...e5 format)

### Data Structure Considerations
- Repertoire entries should store move sequences as trees/graphs
- Include position FEN strings for accurate state management
- Track training statistics and progress

## Advanced Features

### Training Controls
- **Undo Move**: Rolls back to player's turn for retry
- **Cancel Opponent Move**: Allows requesting different opponent responses
- **Edit Mode**: Toggle between training and repertoire building modes
- **New Session**: Start fresh training session
- **Color Switch**: Train from white or black perspective

### Edit Mode Features
- Play moves for both colors to build repertoire
- Automatic move addition to repertoire database
- Visual feedback when in edit mode
- Seamless toggle between training and editing

### Repertoire Management
- Tree-based move display with proper chess notation
- Click navigation to any position in repertoire
- Line naming for organization
- Import/export functionality for repertoire sharing
- Collapsible sections for better organization

## Important Implementation Notes

- Never respond with moves not in the repertoire database (except in edit mode)
- Implement strict move validation with immediate feedback
- Ensure rollback functionality preserves exact previous game state
- Random line selection should cover full repertoire breadth
- Position-based continuation allows repertoire expansion from any training endpoint
- Chess notation must follow standard format: 1.e4, 1...e5, 2.Nf3, 2...Nc6
- Dark mode preference persisted in localStorage
- Toast notifications provide immediate user feedback