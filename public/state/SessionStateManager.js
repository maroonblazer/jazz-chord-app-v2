export class SessionStateManager {
  constructor() {
    this.state = {
      session: {
        status: 'STOPPED', // STOPPED, RUNNING, PAUSED, LAST, END
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
        markWrongVisible: false
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
      RUNNING: ['PAUSED', 'LAST'],
      PAUSED: ['RUNNING', 'STOPPED'],
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
    
    // Also notify wildcard listeners
    const wildcardCallbacks = this.listeners.get('*') || [];
    wildcardCallbacks.forEach(callback => callback({ path, value }, this.getState()));
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

  updateSession(updates) {
    Object.keys(updates).forEach(key => {
      this.updateState(`session.${key}`, updates[key]);
    });
  }

  updateCurrentProblem(problem) {
    Object.keys(problem).forEach(key => {
      this.updateState(`currentProblem.${key}`, problem[key]);
    });
  }

  updateTiming(updates) {
    Object.keys(updates).forEach(key => {
      this.updateState(`timing.${key}`, updates[key]);
    });
  }

  updateOptions(updates) {
    Object.keys(updates).forEach(key => {
      this.updateState(`options.${key}`, updates[key]);
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

  reset() {
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
  }
}