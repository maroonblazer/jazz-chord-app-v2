# Architecture Documentation

This document describes the refactored architecture of the Jazz Chord Practice App, implementing the three key enhancements for improved maintainability, scalability, and testability.

## Overview

The application has been refactored from a monolithic structure into a modular, component-based architecture with proper state management and database persistence.

## Architecture Enhancements

### 1. Modular State Management System

**Location**: `public/state/SessionStateManager.js`

**Purpose**: Centralized, observable state management replacing scattered global variables.

**Key Features**:
- **Immutable State Updates**: All state changes create new state objects
- **Observable Pattern**: Components can subscribe to specific state changes
- **State Validation**: Enforces valid state transitions (STOPPED → RUNNING → PAUSED/LAST → END)
- **Structured State**: Organized into logical sections (session, timing, currentProblem, results, ui, options)

**Usage**:
```javascript
// Subscribe to state changes
stateManager.subscribe('session.status', (status) => {
  console.log('Session status changed to:', status);
});

// Update state
stateManager.updateState('session.iterationCount', 5);
stateManager.transitionTo('RUNNING');
```

### 2. Component-Based Frontend Architecture

**Location**: `public/components/`

The monolithic `app.js` has been decomposed into focused, single-responsibility components:

#### **TimerManager** (`components/TimerManager.js`)
- Handles all timing operations
- Uses `performance.now()` for precise timing
- Integrates with state manager for timing updates

#### **ChordGenerator** (`components/ChordGenerator.js`)
- Manages chord data and generation logic
- Contains all chord shape definitions
- Generates SVG representations
- Handles random problem generation with collision avoidance

#### **SessionManager** (`components/SessionManager.js`)
- Orchestrates session lifecycle
- Manages iteration flow and state transitions
- Handles result storage and server communication
- Coordinates between timer and chord generator

#### **UIController** (`components/UIController.js`)
- Manages DOM interactions and UI state
- Sets up event listeners
- Subscribes to state changes for UI updates
- Handles user input and button states

#### **Main Application** (`app-refactored.js`)
- Initializes and wires together all components
- Provides public API for external access
- Maintains backward compatibility with legacy methods

### 3. Database Layer with Migration Support

**Location**: `database/Database.js`, `server-refactored.js`

**Purpose**: Replace CSV files with proper database persistence and query capabilities.

**Key Features**:

#### **Migration System**
- Versioned database schema changes
- Automatic migration execution on startup
- Rollback support for failed migrations
- Migration tracking table

#### **Structured Data Model**
```sql
-- Sessions table
sessions (id, created_at, completed_at, total_iterations, metadata)

-- Session results table  
session_results (id, session_id, string_set, root, key_signature, 
                chord_type, solve_time_seconds, was_marked_wrong, created_at)

-- Performance analysis view
performance_summary (chord_info, avg_time, attempts, wrong_answers, max_time, min_time)
```

#### **Enhanced Server API**
- `POST /append-session-data`: Store session with proper transaction handling
- `GET /analyze-session-data`: Query worst-performing chords
- `GET /performance-summary`: Comprehensive performance analytics
- `GET /export-csv`: Backward-compatible CSV export
- `GET /health`: System health and statistics

## Usage

### Running the Refactored Architecture

```bash
# Install new dependencies
npm install

# Start refactored server
npm run start:refactored

# Access refactored frontend
http://localhost:3000?arch=refactored
```

### Running Legacy Architecture

```bash
# Start legacy server
npm start

# Access legacy frontend (default)
http://localhost:3000
```

### Development and Testing

```bash
# Run E2E tests (works with both architectures)
npx playwright test

# Debug in browser console (refactored architecture)
window.jazzChordApp.logState()           // View current state
window.jazzChordApp.resetApp()           // Reset to initial state
window.testChordShape(1, 2, 'maj7')      // Test chord rendering
```

## Benefits of Refactored Architecture

### 1. **Improved Maintainability**
- **Separation of Concerns**: Each component has a single responsibility
- **Reduced Coupling**: Components communicate through well-defined interfaces
- **Easier Debugging**: State changes are centralized and observable

### 2. **Enhanced Testability**
- **Unit Testing**: Components can be tested in isolation
- **Mocked Dependencies**: State manager and other dependencies can be easily mocked
- **Predictable State**: State transitions are explicit and verifiable

### 3. **Better Performance**
- **Efficient Updates**: Only components that need to update are notified
- **Database Optimization**: Proper indexing and query optimization
- **Memory Management**: Clear component lifecycle and cleanup

### 4. **Scalability**
- **Database Queries**: Complex performance analysis without loading all data
- **Component Reusability**: Components can be easily extended or replaced
- **Future Features**: Architecture supports adding new features without major rewrites

### 5. **Data Integrity**
- **ACID Transactions**: Database ensures data consistency
- **Foreign Key Constraints**: Referential integrity between sessions and results
- **Migration Safety**: Schema changes are applied atomically

## Migration Path

The refactored architecture maintains **full backward compatibility**:

1. **Gradual Migration**: Both architectures can run simultaneously
2. **Feature Parity**: All existing functionality is preserved
3. **Data Migration**: CSV data can be imported into the database
4. **API Compatibility**: Legacy endpoints remain functional

## Future Enhancements

The new architecture enables several potential improvements:

1. **Real-time Analytics**: WebSocket-based live performance tracking
2. **User Accounts**: Multi-user support with personal progress tracking
3. **Advanced AI Features**: Better integration with LangChain and OpenAI
4. **Mobile App**: Components can be adapted for React Native
5. **Plugin System**: Extensible architecture for custom chord types or analysis

## File Structure

```
jazz-chord-app-v2/
├── public/
│   ├── app.js                    # Legacy monolithic app
│   ├── app-refactored.js         # New modular app entry point
│   ├── state/
│   │   └── SessionStateManager.js # Centralized state management
│   └── components/
│       ├── TimerManager.js       # Timing operations
│       ├── ChordGenerator.js     # Chord logic and SVG generation
│       ├── SessionManager.js     # Session orchestration
│       └── UIController.js       # DOM and UI management
├── database/
│   └── Database.js               # Database layer with migrations
├── server.js                     # Legacy server
├── server-refactored.js          # New database-backed server
└── ARCHITECTURE.md               # This document
```

This refactored architecture provides a solid foundation for continued development while maintaining the simplicity and functionality that makes the Jazz Chord app effective for practice and learning.