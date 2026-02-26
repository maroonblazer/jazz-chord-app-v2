import { FretboardView } from './views/FretboardView.js';
import { ResultsView } from './views/ResultsView.js';
import { StatusView } from './views/StatusView.js';

export class UIController {
  constructor(stateManager, sessionManager, themeManager) {
    this.stateManager = stateManager;
    this.sessionManager = sessionManager;
    this.themeManager = themeManager;
    this.elements = {};
    this.setupElements();
    this.initializeViews();
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
      cancelButton: document.getElementById('cancel-button'),
      optionsButton: document.getElementById('options-button'),
      optionsMenu: document.querySelector('.options-menu'),
      keySelect: document.getElementById('key-select'),
      typeSelect: document.getElementById('type-select'),
      stringSetSelect: document.getElementById('string-set-select'),
      resetOptionsButton: document.getElementById('reset-options-button'),
      wipeDatabaseButton: document.getElementById('wipe-database-button'),
      themeSelect: document.getElementById('theme-select'),
      statusMessage: document.getElementById('status-message'),
      errorMessage: document.getElementById('error-message')
    };

    // Set initial theme select value
    if (this.themeManager && this.elements.themeSelect) {
      this.elements.themeSelect.value = this.themeManager.getCurrentTheme();
    }
    
    // Validate all required DOM elements exist
    const missingElements = [];
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        missingElements.push(key);
      }
    });
    
    if (missingElements.length > 0) {
      console.error('UIController: Missing DOM elements:', missingElements);
      throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
    }
  }

  initializeViews() {
    this.fretboardView = new FretboardView(this.elements.fretboardContainer);
    this.resultsView = new ResultsView(this.elements.fretboardContainer, this.stateManager);
    this.statusView = new StatusView(this.elements.statusMessage, this.elements.errorMessage);

    this.sessionManager.setViews({
      fretboardView: this.fretboardView,
      resultsView: this.resultsView
    });

    this.statusView.setStatus(null);
    this.statusView.setError(null);
  }

  setupEventListeners() {
    // Start/Stop button
    this.elements.startButton.addEventListener("click", () => {
      this.sessionManager.handleStartStopClick();
    });

    // Spacebar for start/stop
    document.addEventListener("keydown", (event) => {
      if (event.code === 'Space') {
        // Don't handle spacebar if user is typing in an input, textarea, or focused on a button
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') {
          return;
        }
        event.preventDefault();
        this.sessionManager.handleStartStopClick();
      }
    });

    // Cancel button
    this.elements.cancelButton.addEventListener('click', () => {
      this.sessionManager.cancelSession();
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

    // Theme change
    this.elements.themeSelect.addEventListener('change', (e) => {
      if (this.themeManager) {
        this.themeManager.applyTheme(e.target.value);
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

    // Wipe database button (with confirmation)
    this.elements.wipeDatabaseButton.addEventListener('click', () => {
      this.showWipeDatabaseConfirmation();
    });
  }

  showWipeDatabaseConfirmation() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-icon">⚠️</span>
          <h2 class="modal-title">Delete All Session Data</h2>
        </div>
        <div class="modal-body">
          <p>This will permanently delete <strong>ALL</strong> your session history, practice data, and performance statistics.</p>
          <div class="modal-warning">
            <strong>Warning:</strong> This action cannot be undone. All your progress will be lost forever.
          </div>
          <p>To confirm, please type: <strong>DELETE ALL MY DATA</strong></p>
          <input type="text" class="modal-input" id="confirmation-input" placeholder="Type the confirmation text exactly...">
        </div>
        <div class="modal-actions">
          <button class="modal-button modal-button-cancel">Cancel</button>
          <button class="modal-button modal-button-confirm" disabled id="confirm-wipe-button">Delete All Data</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Get elements
    const input = overlay.querySelector('#confirmation-input');
    const confirmButton = overlay.querySelector('#confirm-wipe-button');
    const cancelButton = overlay.querySelector('.modal-button-cancel');
    
    // Enable/disable confirm button based on input
    input.addEventListener('input', () => {
      confirmButton.disabled = input.value !== 'DELETE ALL MY DATA';
    });
    
    // Handle cancel
    const closeModal = () => {
      document.body.removeChild(overlay);
    };
    
    cancelButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    // Handle confirm
    confirmButton.addEventListener('click', async () => {
      if (input.value === 'DELETE ALL MY DATA') {
        confirmButton.disabled = true;
        confirmButton.textContent = 'Deleting...';
        
        try {
          const response = await fetch('/wipe-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              confirmation: input.value
            })
          });
          
          const result = await response.json();
          
          closeModal();
          
          if (result.success) {
            this.showSuccessMessage('All session data has been permanently deleted.');
          } else {
            this.showErrorMessage('Failed to delete data: ' + result.message);
          }
          
        } catch (error) {
          closeModal();
          this.showErrorMessage('Failed to delete data: ' + error.message);
        }
      }
    });
    
    // Focus input
    input.focus();
  }

  showSuccessMessage(message) {
    const styles = getComputedStyle(document.documentElement);
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${styles.getPropertyValue('--color-success-bg').trim()};
      color: ${styles.getPropertyValue('--color-success-text').trim()};
      border: 1px solid ${styles.getPropertyValue('--color-success-border').trim()};
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1001;
      max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  showErrorMessage(message) {
    const styles = getComputedStyle(document.documentElement);
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${styles.getPropertyValue('--color-error-bg').trim()};
      color: ${styles.getPropertyValue('--color-error-text').trim()};
      border: 1px solid ${styles.getPropertyValue('--color-error-border').trim()};
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1001;
      max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  setupStateSubscriptions() {
    // Update button label based on session status
    this.stateManager.subscribe('session.status', (status) => {
      const buttonText = this.getButtonTextForStatus(status);
      this.elements.startStopButtonLabel.textContent = buttonText;
      
      // Add prominent styling for "See Results"
      if (buttonText === 'See Results') {
        this.elements.startButton.classList.add('see-results');
        this.elements.startStopButtonLabel.classList.add('see-results');
      } else {
        this.elements.startButton.classList.remove('see-results');
        this.elements.startStopButtonLabel.classList.remove('see-results');
      }
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
        // Don't clear if results are being displayed
        const hasResultsHeader = this.elements.fretboardContainer.querySelector('h3');
        if (!hasResultsHeader) {
          this.clearProblemDisplay();
        }
      }
    });

    // Show/hide cancel button based on session status
    this.stateManager.subscribe('session.status', (status) => {
      if (status === 'RUNNING' || status === 'PAUSED') {
        this.elements.cancelButton.classList.remove('hidden');
      } else {
        this.elements.cancelButton.classList.add('hidden');
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

    // Clear fretboard when session stops or when starting new iteration
    this.stateManager.subscribe('session.status', (status) => {
      if (status === 'STOPPED') {
        // Don't clear if fretboard contains results (has h3 header)
        const hasResultsHeader = this.elements.fretboardContainer.querySelector('h3');
        if (!hasResultsHeader) {
          this.elements.fretboardContainer.innerHTML = "";
          this.clearProblemDisplay();
        }
      } else if (status === 'RUNNING') {
        // Clear fretboard when starting a new iteration
        this.elements.fretboardContainer.innerHTML = "";
      }
    });

    this.stateManager.subscribe('ui.statusMessage', (message) => {
      if (this.statusView) {
        this.statusView.setStatus(message);
      }
    });

    this.stateManager.subscribe('ui.errorMessage', (message) => {
      if (this.statusView) {
        this.statusView.setError(message);
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
