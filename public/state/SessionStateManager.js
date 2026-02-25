export class SessionStateManager {
  constructor() {
    this.state = {
      session: {
        status: 'STOPPED', // STOPPED, RUNNING, PAUSED, CANCELLED, LAST, END
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
      },
      ui: {
        fretboardVisible: false,
        markWrongVisible: false,
        statusMessage: null,
        errorMessage: null
      },
      options: {
        selectedKey: null,
        selectedType: null,
        selectedStringSet: null
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

    // Batch update tracking
    this._batching = false;
    this._pendingNotifications = [];

    // Dirty flag for getState() clone optimization
    this._dirty = true;
    this._cachedState = null;
  }

  getState() {
    if (this._dirty || !this._cachedState) {
      this._cachedState = JSON.parse(JSON.stringify(this.state));
      this._dirty = false;
    }
    // Return a copy of the cache so callers can't mutate it
    return JSON.parse(JSON.stringify(this._cachedState));
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
    if (this._batching) {
      this._pendingNotifications.push({ path, value });
      return;
    }

    const callbacks = this.listeners.get(path) || [];
    callbacks.forEach(callback => callback(value, this.getState()));
    
    // Also notify wildcard listeners
    const wildcardCallbacks = this.listeners.get('*') || [];
    wildcardCallbacks.forEach(callback => callback({ path, value }, this.getState()));
  }

  /**
   * Execute multiple state updates in a single batch.
   * Defers notifications until all updates are applied, then fires
   * each unique notification once. Only one deep clone occurs.
   */
  batchUpdate(callback) {
    if (this._batching) {
      // Already in a batch — just run the callback
      callback();
      return;
    }

    this._batching = true;
    this._pendingNotifications = [];

    try {
      callback();
    } finally {
      this._batching = false;

      // Deduplicate notifications by path (keep last value per path)
      const uniqueNotifications = new Map();
      for (const { path, value } of this._pendingNotifications) {
        uniqueNotifications.set(path, value);
      }
      this._pendingNotifications = [];

      // Fire each notification once
      for (const [path, value] of uniqueNotifications) {
        const callbacks = this.listeners.get(path) || [];
        callbacks.forEach(cb => cb(value, this.getState()));
        
        const wildcardCallbacks = this.listeners.get('*') || [];
        wildcardCallbacks.forEach(cb => cb({ path, value }, this.getState()));
      }
    }
  }

  _setNestedValue(path, value) {
    const pathArray = path.split('.');
    let current = this.state;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    this._dirty = true;
  }

  updateState(path, value) {
    this._setNestedValue(path, value);
    this.notifyListeners(path, value);
  }

  updateSession(updates) {
    this.batchUpdate(() => {
      Object.keys(updates).forEach(key => {
        this.updateState(`session.${key}`, updates[key]);
      });
    });
  }

  updateCurrentProblem(problem) {
    this.batchUpdate(() => {
      Object.keys(problem).forEach(key => {
        this.updateState(`currentProblem.${key}`, problem[key]);
      });
      // Also notify about the whole currentProblem object change
      this.notifyListeners('currentProblem', this.state.currentProblem);
    });
  }

  updateTiming(updates) {
    this.batchUpdate(() => {
      Object.keys(updates).forEach(key => {
        this.updateState(`timing.${key}`, updates[key]);
      });
    });
  }

  updateOptions(updates) {
    this.batchUpdate(() => {
      Object.keys(updates).forEach(key => {
        this.updateState(`options.${key}`, updates[key]);
      });
    });
  }

  addResult(result) {
    const newResults = [...this.state.results.cpsAndTimes, result];
    this.updateState('results.cpsAndTimes', newResults);
  }

  addRecentProblem(problem) {
    const recent = [...this.state.results.recentProblems];
    if (recent.length >= 5) {
      recent.shift();
    }
    recent.push(problem);
    this.updateState('results.recentProblems', recent);
  }

  clearResults() {
    this.updateState('results.cpsAndTimes', []);
  }

  clearMessages() {
    this.batchUpdate(() => {
      this.updateState('ui.statusMessage', null);
      this.updateState('ui.errorMessage', null);
    });
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
    this.batchUpdate(() => {
      this.updateSession({
        status: 'STOPPED',
        iterationCount: 0,
        isRunning: false
      });
      
      this.updateTiming({
        timerId: null,
        startTime: null,
        currentElapsed: 0
      });
      
      this.updateCurrentProblem({
        stringSet: null,
        root: null,
        key: null,
        type: null
      });
      
      this.clearResults();
      this.updateState('ui.markWrongVisible', false);
      this.updateState('ui.fretboardVisible', false);
      this.clearMessages();
    });
  }
}
