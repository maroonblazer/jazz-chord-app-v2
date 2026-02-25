# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start the Express server on port 3000
- `node server.js` - Alternative way to start server

### Testing
- `npx playwright test` - Run E2E tests across all browsers
- `npx playwright test --headed` - Run tests with browser UI visible
- `npx playwright show-report` - View test results in browser

### Build
- `npm run create-sprite` - Generate SVG sprite from individual SVG files in public/svgs/

## Architecture Overview

This is a full-stack jazz chord practice app built with vanilla JavaScript frontend and Express backend. The app presents timed chord identification challenges and tracks performance data.

### Frontend Architecture (`public/app.js`)
- **Component-Based**: Modular ES module architecture with SessionStateManager, ChordGenerator, TimerManager, SessionManager, UIController
- **State Machine**: Uses `SessionState` enum (STOPPED, RUNNING, PAUSED, LAST, END) via centralized SessionStateManager
- **Session Management**: Tracks 10 iterations per session with timing data
- **Chord Data**: Centralized in `public/data/chordData.js` — single source of truth for shapes, keys, types
- **Chord Generation**: Dynamic SVG chord diagrams via ChordGenerator component
- **Options System**: User can filter by key, chord type, and string set
- **Results Display**: Copy-friendly results list with keyboard shortcuts (Cmd+C)

### Backend Architecture (`server.js`)
- **REST API**: Express server with JSON endpoints
- **Data Persistence**: SQLite database via `database/Database.js` with migration system

### Key Endpoints
- `POST /append-session-data` - Store session results to SQLite
- `GET /analyze-session-data` - Get analysis of slowest chord problems
- `GET /performance-summary` - Comprehensive performance analytics
- `GET /export-csv` - Backward-compatible CSV export
- `POST /wipe-database` - Clear all data (localhost only)
- `GET /health` - System health and statistics

### Chord System
The app uses dynamic SVG chord diagram generation:

1. **Chord Data** (`public/data/chordData.js`): Single source of truth for all chord shapes, keys, types
2. **Dynamic Generation** (`public/components/ChordGenerator.js`): Programmatic SVG creation using chord shape data

**Chord Problem Structure:**
- **String Set**: 1 (E,B,G,D strings) or 2 (B,G,D,A strings)
- **Root**: Which string plays the root note (1-4 for SS1, 2-5 for SS2)
- **Key**: 12 chromatic keys (C, Db, D, Eb, etc.)
- **Type**: maj7, maj9, min7, min9, dom7, m7b5, alt dom, dom13

**Chord Shape Data Structure:**
```javascript
chordShapes[`SS${stringSet}`][`R/${root}`][type] = [fret1, fret2, fret3, fret4, fret5, fret6]
```

### Session Data Flow
1. Frontend generates random chord problems
2. Timer measures recognition time
3. After 10 iterations, results sent to backend
4. Backend stores in SQLite database with session tracking
5. Database analysis identifies problematic patterns
6. Results displayed with copy functionality

### Important Implementation Details

**State Management:**
- Centralized SessionStateManager with observable pattern and batch updates
- Components subscribe to specific state paths for efficient updates
- State transitions validated (STOPPED → RUNNING → PAUSED/LAST → END)

**Timing System:**
- Precise timing using `performance.now()`
- Start/stop button toggles timer and advances session state

**Options System:**
- User can override random selection with specific keys/types
- String set selection affects available root positions

**Copy/Paste UX:**
- Recent enhancement adds keyboard shortcuts and visual feedback
- Results formatted for external use

### Testing Strategy
- **Playwright E2E**: Complete user workflow testing in `e2e/jazz-chords.spec.ts`
- **Puppeteer**: Development testing in `tests/test.js`
- Tests cover session flow, timing, and results display

### Performance Analysis
- SQLite database queries for chord problem identification
- Statistical analysis of practice times and patterns
- Automated identification of problematic chord combinations
- Results formatted for easy review and practice focus

### Development Notes
- Pure vanilla JavaScript - no build step required for core functionality
- CSS uses modern features (custom properties, grid layout)
- SVG manipulation for chord diagrams
- Express serves static files from `public/` directory
- Session data persists across server restarts via SQLite database
- Always push to origin after making a commit
- Periodically remind me of the complete Git workflow steps.