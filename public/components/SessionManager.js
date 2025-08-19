export class SessionManager {
  constructor(stateManager, timerManager, chordGenerator) {
    this.stateManager = stateManager;
    this.timerManager = timerManager;
    this.chordGenerator = chordGenerator;
    this.WRONG_ANSWER_TIME = 999999;
  }

  startSession() {
    this.stateManager.reset();
    this.startIteration();
  }

  startIteration() {
    const state = this.stateManager.getState();
    
    if (state.session.iterationCount >= state.session.maxIterations) {
      this.endSession();
      return;
    }

    // Generate new problem
    const problem = this.chordGenerator.generateRandomProblem();
    this.stateManager.updateCurrentProblem(problem);
    
    // Start timing
    this.timerManager.start();
    
    // Update session state
    this.stateManager.updateSession({
      isRunning: true
    });
    
    this.stateManager.transitionTo('RUNNING');
    
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
    if (newIterationCount >= state.session.maxIterations) {
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
    
    // This would be handled by UI component in full implementation
    const container = document.getElementById("fretboard-container");
    if (container) {
      container.innerHTML = svgString;
      container.style.visibility = "visible";
    }
    
    this.stateManager.updateState('ui.fretboardVisible', true);
  }

  endSession() {
    this.stateManager.transitionTo('END');
    this.stateManager.updateState('session.isRunning', false);
    
    // Send results to server
    this.sendResultsToServer();
  }

  async sendResultsToServer() {
    const state = this.stateManager.getState();
    const results = state.results.cpsAndTimes;
    
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
      
      // Get analysis
      const analysisResponse = await fetch("/analyze-session-data");
      const analysisData = await analysisResponse.json();
      
      this.displayResults(analysisData.results);
      
    } catch (error) {
      console.error("Error sending results to server:", error);
    }
  }

  displayResults(analysisResults) {
    // This would be handled by ResultsDisplay component in full implementation
    const container = document.getElementById("fretboard-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    const header = document.createElement("h3");
    header.textContent = "Drill These Chord Shapes:";
    container.appendChild(header);
    
    const list = document.createElement("ul");
    list.setAttribute('tabindex', '0');
    list.style.cursor = 'text';
    
    analysisResults.forEach((result, index) => {
      const item = document.createElement("li");
      item.innerHTML = `
        <span class="problem-number">${index + 1}</span>
        <span class="chord-info">${result.chordInfo}</span>
        <span class="time-info">${result.timeInfo}</span>
      `;
      list.appendChild(item);
    });
    
    // Add copy functionality
    list.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        const clipboardText = this.formatResultsForClipboard(analysisResults);
        navigator.clipboard.writeText(clipboardText)
          .then(() => {
            const items = list.querySelectorAll('li');
            items.forEach(item => item.classList.add('copy-flash'));
            setTimeout(() => {
              items.forEach(item => item.classList.remove('copy-flash'));
            }, 300);
          })
          .catch(err => console.error('Failed to copy:', err));
      }
    });
    
    container.appendChild(list);
    
    // Reset session
    this.stateManager.transitionTo('STOPPED');
  }

  formatResultsForClipboard(results) {
    return results
      .map((result, index) => `${index + 1} ${result.chordInfo} ${result.timeInfo}`)
      .join('\n');
  }

  handleStartStopClick() {
    const state = this.stateManager.getState();
    const { status } = state.session;
    
    switch (status) {
      case 'STOPPED':
      case 'PAUSED':
        this.startIteration();
        break;
      case 'RUNNING':
        this.stopIteration();
        break;
      case 'LAST':
        this.endSession();
        break;
      default:
        console.log("Unexpected state:", status);
    }
  }
}