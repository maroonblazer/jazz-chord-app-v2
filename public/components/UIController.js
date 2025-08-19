export class UIController {
  constructor(stateManager, sessionManager) {
    this.stateManager = stateManager;
    this.sessionManager = sessionManager;
    this.elements = {};
    this.setupElements();
    this.setupEventListeners();
    this.setupStateSubscriptions();
  }

  setupElements() {
    this.elements = {
      startButton: document.getElementById("start-stop-button"),
      startStopButtonLabel: document.getElementById("start-stop-button-label"),
      stringSetTextField: document.getElementById("stringSetTextField"),
      rootTextField: document.getElementById("rootTextField"),
      keyTextField: document.getElementById("keyTextField"),
      typeTextField: document.getElementById("typeTextField"),
      fretboardContainer: document.getElementById("fretboard-container"),
      markWrongButton: document.getElementById('mark-wrong-button'),
      optionsButton: document.getElementById('options-button'),
      optionsMenu: document.querySelector('.options-menu'),
      keySelect: document.getElementById('key-select'),
      typeSelect: document.getElementById('type-select'),
      stringSetSelect: document.getElementById('string-set-select'),
      resetOptionsButton: document.getElementById('reset-options-button')
    };
  }

  setupEventListeners() {
    // Start/Stop button
    this.elements.startButton.addEventListener("click", () => {
      this.sessionManager.handleStartStopClick();
    });

    // Spacebar for start/stop
    document.addEventListener("keydown", (event) => {
      if (event.keyCode === 32) {
        event.preventDefault();
        this.sessionManager.handleStartStopClick();
      }
    });

    // Mark wrong button
    this.elements.markWrongButton.addEventListener('click', () => {
      this.sessionManager.markCurrentAsWrong();
    });

    // Options menu toggle
    this.elements.optionsButton.addEventListener('click', () => {
      const isExpanded = this.elements.optionsButton.getAttribute('aria-expanded') === 'true';
      this.elements.optionsButton.setAttribute('aria-expanded', !isExpanded);
      this.elements.optionsMenu.hidden = isExpanded;
    });

    // Close options menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!this.elements.optionsMenu.hidden && 
          !this.elements.optionsMenu.contains(event.target) && 
          !this.elements.optionsButton.contains(event.target)) {
        this.elements.optionsButton.setAttribute('aria-expanded', 'false');
        this.elements.optionsMenu.hidden = true;
      }
    });

    // Options changes
    this.elements.keySelect.addEventListener('change', (e) => {
      this.stateManager.updateState('options.selectedKey', e.target.value || null);
    });

    this.elements.typeSelect.addEventListener('change', (e) => {
      this.stateManager.updateState('options.selectedType', e.target.value || null);
    });

    this.elements.stringSetSelect.addEventListener('change', (e) => {
      this.stateManager.updateState('options.selectedStringSet', e.target.value || null);
    });

    // Reset options
    this.elements.resetOptionsButton.addEventListener('click', () => {
      this.elements.keySelect.value = "";
      this.elements.typeSelect.value = "";
      this.elements.stringSetSelect.value = "";
      
      this.stateManager.updateOptions({
        selectedKey: null,
        selectedType: null,
        selectedStringSet: null
      });
    });
  }

  setupStateSubscriptions() {
    // Update button label based on session status
    this.stateManager.subscribe('session.status', (status) => {
      const buttonText = this.getButtonTextForStatus(status);
      this.elements.startStopButtonLabel.textContent = buttonText;
    });

    // Update current problem display
    this.stateManager.subscribe('currentProblem', (_, state) => {
      const { currentProblem, session } = state;
      
      if (session.status === 'RUNNING') {
        this.elements.stringSetTextField.textContent = currentProblem.stringSet || "--";
        this.elements.rootTextField.textContent = currentProblem.root || "--";
        this.elements.keyTextField.textContent = currentProblem.key || "--";
        this.elements.typeTextField.textContent = currentProblem.type || "--";
      } else if (session.status === 'STOPPED') {
        this.clearProblemDisplay();
      }
    });

    // Show/hide mark wrong button
    this.stateManager.subscribe('ui.markWrongVisible', (visible) => {
      if (visible) {
        this.elements.markWrongButton.classList.remove('hidden');
      } else {
        this.elements.markWrongButton.classList.add('hidden');
      }
    });

    // Clear fretboard when session stops
    this.stateManager.subscribe('session.status', (status) => {
      if (status === 'STOPPED') {
        this.elements.fretboardContainer.innerHTML = "";
        this.clearProblemDisplay();
      }
    });
  }

  getButtonTextForStatus(status) {
    switch (status) {
      case 'STOPPED':
      case 'PAUSED':
        return 'Start';
      case 'RUNNING':
        return 'Stop';
      case 'LAST':
        return 'See Results';
      case 'END':
        return 'Start';
      default:
        return 'Start';
    }
  }

  clearProblemDisplay() {
    this.elements.stringSetTextField.textContent = "--";
    this.elements.rootTextField.textContent = "--";
    this.elements.keyTextField.textContent = "--";
    this.elements.typeTextField.textContent = "--";
  }
}