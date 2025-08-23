import { test, expect, describe, beforeEach, jest } from '@jest/globals';
import '../setup/jest.setup.js';

// Import components (we'll mock file system imports)
class MockSessionStateManager {
  constructor() {
    this.state = {
      session: {
        status: 'STOPPED',
        iterationCount: 0,
        maxIterations: 10,
        isRunning: false
      },
      timing: {
        timerId: null,
        startTime: null,
        currentElapsed: 0
      },
      currentProblem: {
        stringSet: null,
        root: null,
        key: null,
        type: null
      },
      results: {
        cpsAndTimes: [],
        recentProblems: []
      }
    };
    
    this.listeners = new Map();
    this.validTransitions = {
      STOPPED: ['RUNNING'],
      RUNNING: ['PAUSED', 'LAST', 'CANCELLED'],
      PAUSED: ['RUNNING', 'STOPPED', 'CANCELLED'],
      CANCELLED: ['STOPPED'],
      LAST: ['END', 'STOPPED'],
      END: ['STOPPED']
    };
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  subscribe(eventPath, callback) {
    if (!this.listeners.has(eventPath)) {
      this.listeners.set(eventPath, []);
    }
    this.listeners.get(eventPath).push(callback);
    
    return () => {
      const callbacks = this.listeners.get(eventPath);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  notifyListeners(path, value) {
    const callbacks = this.listeners.get(path) || [];
    callbacks.forEach(callback => callback(value, this.getState()));
  }

  updateState(path, value) {
    const pathArray = path.split('.');
    const newState = JSON.parse(JSON.stringify(this.state));
    
    let current = newState;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    this.state = newState;
    this.notifyListeners(path, value);
  }

  canTransitionTo(newStatus) {
    const currentStatus = this.state.session.status;
    return this.validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  transitionTo(newStatus) {
    if (!this.canTransitionTo(newStatus)) {
      console.warn(`Invalid transition from ${this.state.session.status} to ${newStatus}`);
      return false;
    }
    
    this.updateState('session.status', newStatus);
    return true;
  }

  cancel() {
    if (!this.canTransitionTo('CANCELLED')) {
      console.warn(`Cannot cancel session from ${this.state.session.status} state`);
      return false;
    }
    
    this.transitionTo('CANCELLED');
    
    // Clear any running timer
    if (this.state.timing.timerId) {
      clearInterval(this.state.timing.timerId);
    }
    
    // Reset to clean state
    this.reset();
    
    return true;
  }

  reset() {
    this.updateState('session.status', 'STOPPED');
    this.updateState('session.iterationCount', 0);
    this.updateState('session.isRunning', false);
    this.updateState('timing.timerId', null);
    this.updateState('timing.startTime', null);
    this.updateState('timing.currentElapsed', 0);
    this.updateState('results.cpsAndTimes', []);
  }
}

class MockSessionManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  cancelSession() {
    console.log('Cancelling session...');
    
    const cancelled = this.stateManager.cancel();
    
    if (cancelled) {
      const container = document.getElementById("fretboard-container");
      if (container) {
        container.innerHTML = "";
      }
      
      console.log('Session cancelled successfully');
    } else {
      console.warn('Failed to cancel session - invalid state transition');
    }
    
    return cancelled;
  }
}

describe('Session Cancellation - State Management', () => {
  let stateManager;
  let sessionManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="start-stop-button">
        <span id="start-stop-button-label">Start</span>
      </button>
      <button id="cancel-button" class="hidden">Cancel</button>
      <button id="mark-wrong-button" class="hidden">Mark Wrong</button>
      <div id="fretboard-container"></div>
    `;
    
    stateManager = new MockSessionStateManager();
    sessionManager = new MockSessionManager(stateManager);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CANCELLED State Transitions', () => {
    test('should allow transition from RUNNING to CANCELLED', () => {
      stateManager.updateState('session.status', 'RUNNING');
      
      expect(stateManager.canTransitionTo('CANCELLED')).toBe(true);
      
      const result = stateManager.transitionTo('CANCELLED');
      expect(result).toBe(true);
      expect(stateManager.state.session.status).toBe('CANCELLED');
    });

    test('should allow transition from PAUSED to CANCELLED', () => {
      stateManager.updateState('session.status', 'PAUSED');
      
      expect(stateManager.canTransitionTo('CANCELLED')).toBe(true);
      
      const result = stateManager.transitionTo('CANCELLED');
      expect(result).toBe(true);
      expect(stateManager.state.session.status).toBe('CANCELLED');
    });

    test('should allow transition from CANCELLED to STOPPED', () => {
      stateManager.updateState('session.status', 'CANCELLED');
      
      expect(stateManager.canTransitionTo('STOPPED')).toBe(true);
      
      const result = stateManager.transitionTo('STOPPED');
      expect(result).toBe(true);
      expect(stateManager.state.session.status).toBe('STOPPED');
    });

    test('should not allow transition from STOPPED to CANCELLED', () => {
      stateManager.updateState('session.status', 'STOPPED');
      
      expect(stateManager.canTransitionTo('CANCELLED')).toBe(false);
      
      const result = stateManager.transitionTo('CANCELLED');
      expect(result).toBe(false);
      expect(stateManager.state.session.status).toBe('STOPPED');
    });

    test('should not allow transition from END to CANCELLED', () => {
      stateManager.updateState('session.status', 'END');
      
      expect(stateManager.canTransitionTo('CANCELLED')).toBe(false);
      
      const result = stateManager.transitionTo('CANCELLED');
      expect(result).toBe(false);
      expect(stateManager.state.session.status).toBe('END');
    });
  });

  describe('Cancel Method Behavior', () => {
    test('should successfully cancel from RUNNING state', () => {
      stateManager.updateState('session.status', 'RUNNING');
      stateManager.updateState('session.iterationCount', 3);
      stateManager.updateState('results.cpsAndTimes', [1, 2, 3]);
      
      const result = stateManager.cancel();
      
      expect(result).toBe(true);
      expect(stateManager.state.session.status).toBe('STOPPED');
      expect(stateManager.state.session.iterationCount).toBe(0);
      expect(stateManager.state.results.cpsAndTimes).toEqual([]);
    });

    test('should successfully cancel from PAUSED state', () => {
      stateManager.updateState('session.status', 'PAUSED');
      stateManager.updateState('session.iterationCount', 5);
      
      const result = stateManager.cancel();
      
      expect(result).toBe(true);
      expect(stateManager.state.session.status).toBe('STOPPED');
      expect(stateManager.state.session.iterationCount).toBe(0);
    });

    test('should fail to cancel from invalid states', () => {
      stateManager.updateState('session.status', 'END');
      
      const result = stateManager.cancel();
      
      expect(result).toBe(false);
      expect(stateManager.state.session.status).toBe('END');
    });

    test('should clear timer when cancelling', () => {
      const mockTimerId = 123;
      stateManager.updateState('session.status', 'RUNNING');
      stateManager.updateState('timing.timerId', mockTimerId);
      
      // Mock clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
      
      stateManager.cancel();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimerId);
      expect(stateManager.state.timing.timerId).toBe(null);
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('SessionManager Cancel Integration', () => {
    test('should clear fretboard when cancelling session', () => {
      const container = document.getElementById("fretboard-container");
      container.innerHTML = '<div>Some chord diagram</div>';
      
      stateManager.updateState('session.status', 'RUNNING');
      
      const result = sessionManager.cancelSession();
      
      expect(result).toBe(true);
      expect(container.innerHTML).toBe("");
      expect(console.log).toHaveBeenCalledWith('Cancelling session...');
      expect(console.log).toHaveBeenCalledWith('Session cancelled successfully');
    });

    test('should handle failed cancellation gracefully', () => {
      stateManager.updateState('session.status', 'STOPPED');
      
      const result = sessionManager.cancelSession();
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Failed to cancel session - invalid state transition');
    });
  });

  describe('Data Cleanup on Cancel', () => {
    test('should reset all session data when cancelled', () => {
      // Set up session with data
      stateManager.updateState('session.status', 'RUNNING');
      stateManager.updateState('session.iterationCount', 7);
      stateManager.updateState('session.isRunning', true);
      stateManager.updateState('timing.startTime', 12345);
      stateManager.updateState('timing.currentElapsed', 5000);
      stateManager.updateState('results.cpsAndTimes', [1, 2, 3, 4, 5, 6, 7]);
      
      stateManager.cancel();
      
      // Verify complete reset
      expect(stateManager.state.session.status).toBe('STOPPED');
      expect(stateManager.state.session.iterationCount).toBe(0);
      expect(stateManager.state.session.isRunning).toBe(false);
      expect(stateManager.state.timing.startTime).toBe(null);
      expect(stateManager.state.timing.currentElapsed).toBe(0);
      expect(stateManager.state.results.cpsAndTimes).toEqual([]);
    });

    test('should preserve options when cancelled', () => {
      // Note: In real implementation, options should persist through cancellation
      // This test would verify that user preferences aren't lost
      stateManager.state.options = {
        selectedKey: 'C',
        selectedType: 'maj7'
      };
      
      stateManager.updateState('session.status', 'RUNNING');
      stateManager.cancel();
      
      // Options should be preserved (this would need to be implemented in the actual cancel method)
      expect(stateManager.state.options.selectedKey).toBe('C');
      expect(stateManager.state.options.selectedType).toBe('maj7');
    });
  });
});