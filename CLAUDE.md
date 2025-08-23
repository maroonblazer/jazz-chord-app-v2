# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start the legacy Express server on port 3000
- `npm run start:refactored` - Start the refactored server with database layer
- `node server.js` - Alternative way to start legacy server
- `node server-refactored.js` - Alternative way to start refactored server

### Testing
- `npx playwright test` - Run E2E tests across all browsers
- `npx playwright test --headed` - Run tests with browser UI visible
- `npx playwright show-report` - View test results in browser

### Build
- `npm run create-sprite` - Generate SVG sprite from individual SVG files in public/svgs/

## Architecture Overview

This is a full-stack jazz chord practice app built with vanilla JavaScript frontend and Express backend. The app presents timed chord identification challenges and tracks performance data.

**Two Architecture Versions Available:**
1. **Legacy Architecture** (`app.js`, `server.js`) - Original monolithic implementation
2. **Refactored Architecture** (`app-refactored.js`, `server-refactored.js`) - Modular, component-based with database layer

Access refactored version: `http://localhost:3000?arch=refactored`

### Frontend Architecture (`public/app.js`)
- **State Machine**: Uses `SessionState` enum (STOPPED, RUNNING, PAUSED, LAST, END)
- **Session Management**: Tracks 10 iterations per session with timing data
- **Chord Generation**: Dynamic SVG chord diagrams via `newChord()` function
- **Options System**: User can filter by key, chord type, and string set
- **Results Display**: Copy-friendly results list with keyboard shortcuts (Cmd+C)

### Backend Architecture (`server.js`)
- **REST API**: Express server with JSON endpoints
- **Data Persistence**: Dual CSV file system:
  - `session-data.csv` - All historical session data
  - `session-data-last-10.csv` - Recent sessions for analysis
- **AI Integration**: OpenAI + LangChain for performance analysis (some features commented out)

### Key Endpoints
- `POST /append-session-data` - Store session results to CSV
- `GET /analyze-session-data` - Get analysis of slowest chord problems
- `POST /send-message` - Custom AI queries on session data

### Chord System
The app uses a two-tier chord representation:

1. **Static SVG Symbols** (`public/index.html`): Pre-built chord diagrams for complex shapes
2. **Dynamic Generation** (`public/app.js`): Programmatic SVG creation using chord shape data

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
4. Backend appends to CSV files
5. AI analysis identifies problematic patterns
6. Results displayed with copy functionality

### Important Implementation Details

**State Management:**
- Global variables track session state, timing, and chord data
- `cpsAndTimes` array stores session results before server submission
- `chordsToForget` queue prevents recent chord repetition

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

### AI Features (`qa.js`, `openai.js`)
- LangChain document loading from CSV data
- Vector embeddings for similarity search
- GPT-3.5-turbo generates practice recommendations
- Custom question-answering on practice history

### Development Notes
- Pure vanilla JavaScript - no build step required for core functionality
- CSS uses modern features (custom properties, grid layout)
- SVG manipulation for chord diagrams
- Express serves static files from `public/` directory
- Session data persists across server restarts via CSV files
- Always push to origin after making a commit
- Remind me to use good Git 'hygiene'. I.e., don't let too many changes happen before reminding me to commit. Also, don't let me get too far with branching without merging back into main.