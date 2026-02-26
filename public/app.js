import { SessionStateManager } from './state/SessionStateManager.js';
import { TimerManager } from './components/TimerManager.js';
import { ChordGenerator } from './components/ChordGenerator.js';
import { SessionManager } from './components/SessionManager.js';
import { UIController } from './components/UIController.js';
import { ThemeManager } from './components/ThemeManager.js';

// Legacy export for backwards compatibility
export const maxIterations = 10;

class JazzChordApp {
  constructor() {
    this.themeManager = new ThemeManager();
    this.stateManager = new SessionStateManager();
    this.timerManager = new TimerManager(this.stateManager);
    this.chordGenerator = new ChordGenerator(this.stateManager);
    this.sessionManager = new SessionManager(
      this.stateManager,
      this.timerManager,
      this.chordGenerator,
      this.themeManager
    );
    this.uiController = new UIController(this.stateManager, this.sessionManager, this.themeManager);
    
    // Make components globally available for debugging
    window.jazzChordApp = this;
    window.testChordShape = this.testChordShape.bind(this);
    window.cycleChordShapes = this.cycleChordShapes.bind(this);
  }

  // Legacy methods for backwards compatibility
  testChordShape(stringSet, root, type) {
    const fretPositions = this.chordGenerator.getFretPositions(stringSet, root, type);
    const colors = this.themeManager.getFretboardColors();
    const svgString = this.chordGenerator.generateSVG(fretPositions, {
      circleColor: colors.dot,
      strokeColor: colors.stroke
    });
    
    const container = document.getElementById("fretboard-container");
    container.innerHTML = svgString;
    container.style.visibility = "visible";
    
    console.log(`Displaying chord: SS${stringSet} R/${root} ${type}`);
    console.log("Fret positions:", fretPositions);
  }

  cycleChordShapes(stringSet, root) {
    const chordTypes = [
      "maj7", "min7", "dom7", "min7b5",
      "alt dom", "maj9", "min9", "dom13"
    ];
    
    let index = 0;
    
    const displayNextChord = () => {
      if (index < chordTypes.length) {
        const chordType = chordTypes[index];
        console.log(`Displaying: SS${stringSet} R/${root} ${chordType}`);
        this.testChordShape(stringSet, root, chordType);
        index++;
        setTimeout(displayNextChord, 3000);
      } else {
        console.log("Finished cycling through all chord types.");
      }
    };
    
    displayNextChord();
  }

  // Public API methods
  getCurrentState() {
    return this.stateManager.getState();
  }

  subscribeToState(path, callback) {
    return this.stateManager.subscribe(path, callback);
  }

  // Development helpers
  logState() {
    console.table(this.getCurrentState());
  }

  resetApp() {
    this.stateManager.reset();
    console.log("App reset to initial state");
  }
}

// Initialize the app when DOM is loaded
function initializeApp() {
  try {
    console.log("Initializing JazzChordApp...");
    const app = new JazzChordApp();
    console.log("Jazz Chord App initialized with modular architecture");
  } catch (error) {
    console.error("Error initializing JazzChordApp:", error);
  }
}

// Check if DOM is already loaded, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  console.log("DOM still loading, waiting for DOMContentLoaded...");
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log("DOM already loaded, initializing immediately...");
  initializeApp();
}

// Export for potential use in other modules
export { JazzChordApp };