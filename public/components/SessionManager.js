export class SessionManager {
  constructor(stateManager, timerManager, chordGenerator) {
    this.stateManager = stateManager;
    this.timerManager = timerManager;
    this.chordGenerator = chordGenerator;
    this.WRONG_ANSWER_TIME = 999999;
    this.fretboardView = null;
    this.resultsView = null;
  }

  setViews({ fretboardView, resultsView } = {}) {
    this.fretboardView = fretboardView || null;
    this.resultsView = resultsView || null;
  }

  startSession() {
    if (this.fretboardView) {
      this.fretboardView.clear();
      this.fretboardView.show();
    }

    this.stateManager.reset();
    this.startIteration();
  }

  startIteration() {
    const state = this.stateManager.getState();
    
    if (state.session.iterationCount >= state.session.maxIterations) {
      this.endSession();
      return;
    }

    if (this.fretboardView) {
      this.fretboardView.clear();
      this.fretboardView.show();
    }

    // Update session state first
    this.stateManager.updateSession({
      isRunning: true
    });
    
    this.stateManager.transitionTo('RUNNING');
    
    // Generate new problem
    const problem = this.chordGenerator.generateRandomProblem();
    this.stateManager.updateCurrentProblem(problem);
    
    // Start timing
    this.timerManager.start();
    
    // Hide mark wrong button
    this.stateManager.updateState('ui.markWrongVisible', false);
  }

  stopIteration() {
    const elapsedTime = this.timerManager.stop();
    const state = this.stateManager.getState();
    const { currentProblem, session } = state;
    
    // Store result
    const result = {
      stringSet: currentProblem.stringSet,
      root: currentProblem.root,
      key: currentProblem.key,
      time: elapsedTime,
      quality: currentProblem.type,
      date: new Date().toISOString(),
      wasMarkedWrong: false
    };
    
    this.stateManager.addResult(result);
    
    // Show fretboard and mark wrong button
    this.displaySolution();
    this.stateManager.updateState('ui.markWrongVisible', true);
    
    // Update iteration count
    const newIterationCount = session.iterationCount + 1;
    this.stateManager.updateState('session.iterationCount', newIterationCount);
    
    // Determine next state
    const maxIterations = this.stateManager.getState().session.maxIterations;
    if (newIterationCount >= maxIterations) {
      this.stateManager.transitionTo('LAST');
    } else {
      this.stateManager.transitionTo('PAUSED');
    }
    
    this.stateManager.updateState('session.isRunning', false);
  }

  markCurrentAsWrong() {
    const state = this.stateManager.getState();
    const results = [...state.results.cpsAndTimes];
    
    if (results.length > 0) {
      const lastIndex = results.length - 1;
      results[lastIndex] = {
        ...results[lastIndex],
        time: this.WRONG_ANSWER_TIME,
        wasMarkedWrong: true
      };
      
      this.stateManager.updateState('results.cpsAndTimes', results);
      this.stateManager.updateState('ui.markWrongVisible', false);
    }
  }

  displaySolution() {
    const state = this.stateManager.getState();
    const { currentProblem } = state;

    const fretPositions = this.chordGenerator.getFretPositions(
      currentProblem.stringSet,
      currentProblem.root,
      currentProblem.type
    );

    const svgString = this.chordGenerator.generateSVG(fretPositions);
    if (this.fretboardView) {
      this.fretboardView.render(svgString);
    }

    this.stateManager.updateState('ui.fretboardVisible', true);
  }

  endSession() {
    // Send results to server and display them
    this.stateManager.updateState('ui.statusMessage', 'Calculating analysis...');
    this.sendResultsToServer();
  }

  async sendResultsToServer() {
    const state = this.stateManager.getState();
    const results = state.results.cpsAndTimes;

    console.log('Sending results to server:', results.length, 'results');
    this.stateManager.updateState('ui.statusMessage', 'Sending results...');
    this.stateManager.updateState('ui.errorMessage', null);

    try {
      const response = await fetch("/append-session-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: results }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Results sent successfully, fetching analysis...');

      // Get analysis
      const analysisResponse = await fetch("/analyze-session-data");
      if (!analysisResponse.ok) {
        throw new Error(`HTTP error! status: ${analysisResponse.status}`);
      }
      const analysisData = await analysisResponse.json();

      console.log('Analysis received:', analysisData);

      this.displayResults(analysisData.results);
      this.stateManager.updateState('ui.statusMessage', 'Analysis updated');
      this.stateManager.updateState('ui.errorMessage', null);

    } catch (error) {
      console.error("Error sending results to server:", error);
      this.stateManager.updateState('ui.errorMessage', 'Failed to save results. Please try again.');
      this.stateManager.updateState('ui.statusMessage', null);
    }
  }

  displayResults(analysisResults) {
    if (this.resultsView) {
      this.resultsView.render(analysisResults);
    }

    // Now transition to END state - results are displayed
    const transitioned = this.stateManager.transitionTo('END');
    if (!transitioned) {
      this.stateManager.updateState('session.status', 'END');
    }
    this.stateManager.updateState('session.isRunning', false);
  }

  cancelSession() {
    console.log('Cancelling session...');

    // Use the state manager's cancel method which handles state transitions and cleanup
    const cancelled = this.stateManager.cancel();

    if (cancelled) {
      if (this.fretboardView) {
        this.fretboardView.clear();
        this.fretboardView.hide();
      }
      this.stateManager.clearMessages();
      console.log('Session cancelled successfully');
    } else {
      console.warn('Failed to cancel session - invalid state transition');
    }

    return cancelled;
  }

  handleStartStopClick() {
    const state = this.stateManager.getState();
    const { status, iterationCount } = state.session;
    
    switch (status) {
      case 'STOPPED':
        // Only reset session if we're truly starting fresh (count is 0)
        if (iterationCount === 0) {
          this.startSession();
        } else {
          this.startIteration();
        }
        break;
      case 'PAUSED':
        this.startIteration();
        break;
      case 'RUNNING':
        this.stopIteration();
        break;
      case 'LAST':
        this.endSession();
        break;
      case 'END':
        this.startSession();
        break;
      default:
        console.log("Unexpected state:", status);
    }
  }
}
