import { test, expect, describe, beforeEach, jest } from '@jest/globals';
import '../setup/jest.setup.js';

// Mock UIController functionality
class MockStateManager {
  constructor() {
    this.state = {
      session: { status: 'STOPPED' },
      ui: { markWrongVisible: false }
    };
    this.listeners = new Map();
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
    callbacks.forEach(callback => callback(value, this.state));
  }

  updateState(path, value) {
    // Simplified state update for testing
    if (path === 'session.status') {
      this.state.session.status = value;
    }
    this.notifyListeners(path, value);
  }

  getState() {
    return this.state;
  }
}

class MockSessionManager {
  constructor() {
    this.cancelSessionCalled = false;
  }

  cancelSession() {
    this.cancelSessionCalled = true;
    return true;
  }
}

class MockUIController {
  constructor(stateManager, sessionManager) {
    this.stateManager = stateManager;
    this.sessionManager = sessionManager;
    this.elements = {
      cancelButton: document.getElementById('cancel-button'),
      markWrongButton: document.getElementById('mark-wrong-button')
    };
    
    this.setupEventListeners();
    this.setupStateSubscriptions();
  }

  setupEventListeners() {
    // Cancel button click
    this.elements.cancelButton.addEventListener('click', () => {
      this.sessionManager.cancelSession();
    });
  }

  setupStateSubscriptions() {
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
  }
}

describe('Cancel Button UI Logic', () => {
  let stateManager;
  let sessionManager;
  let uiController;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="start-stop-button">
        <span id="start-stop-button-label">Start</span>
      </button>
      <button id="cancel-button" class="hidden cancel-button">Cancel</button>
      <button id="mark-wrong-button" class="hidden">Mark Wrong</button>
      <button id="options-button">Options</button>
      <div class="options-menu" hidden>
        <select id="key-select"></select>
        <select id="type-select"></select>
        <select id="string-set-select"></select>
        <button id="reset-options-button">Reset</button>
        <button id="wipe-database-button">Wipe</button>
      </div>
      <div id="fretboard-container"></div>
      <div id="stringSetTextField">--</div>
      <div id="rootTextField">--</div>
      <div id="keyTextField">--</div>
      <div id="typeTextField">--</div>
    `;
    
    stateManager = new MockStateManager();
    sessionManager = new MockSessionManager();
    uiController = new MockUIController(stateManager, sessionManager);
    
    // Reset mock
    sessionManager.cancelSessionCalled = false;
  });

  describe('Cancel Button Visibility', () => {
    test('should be hidden initially in STOPPED state', () => {
      const cancelButton = document.getElementById('cancel-button');
      expect(cancelButton.classList.contains('hidden')).toBe(true);
    });

    test('should show when session transitions to RUNNING', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      stateManager.updateState('session.status', 'RUNNING');
      
      expect(cancelButton.classList.contains('hidden')).toBe(false);
    });

    test('should show when session transitions to PAUSED', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      stateManager.updateState('session.status', 'PAUSED');
      
      expect(cancelButton.classList.contains('hidden')).toBe(false);
    });

    test('should hide when session transitions to STOPPED', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      // First show it
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      // Then hide it
      stateManager.updateState('session.status', 'STOPPED');
      expect(cancelButton.classList.contains('hidden')).toBe(true);
    });

    test('should hide when session transitions to END', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      // First show it
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      // Then hide it
      stateManager.updateState('session.status', 'END');
      expect(cancelButton.classList.contains('hidden')).toBe(true);
    });

    test('should hide when session transitions to LAST', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      // First show it
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      // Then hide it
      stateManager.updateState('session.status', 'LAST');
      expect(cancelButton.classList.contains('hidden')).toBe(true);
    });

    test('should handle rapid state changes correctly', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      // Rapid state changes
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      stateManager.updateState('session.status', 'PAUSED');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      stateManager.updateState('session.status', 'STOPPED');
      expect(cancelButton.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Cancel Button Click Behavior', () => {
    test('should call sessionManager.cancelSession when clicked', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      // Make button visible and clickable
      stateManager.updateState('session.status', 'RUNNING');
      
      // Click the button
      cancelButton.click();
      
      expect(sessionManager.cancelSessionCalled).toBe(true);
    });

    test('should work when button is visible during RUNNING state', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      cancelButton.click();
      expect(sessionManager.cancelSessionCalled).toBe(true);
    });

    test('should work when button is visible during PAUSED state', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      stateManager.updateState('session.status', 'PAUSED');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      
      cancelButton.click();
      expect(sessionManager.cancelSessionCalled).toBe(true);
    });

    test('should have proper CSS classes applied', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      // Check initial classes
      expect(cancelButton.classList.contains('cancel-button')).toBe(true);
      expect(cancelButton.classList.contains('hidden')).toBe(true);
      
      // Check after showing
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('cancel-button')).toBe(true);
      expect(cancelButton.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Integration with Other UI Elements', () => {
    test('should not interfere with mark wrong button visibility', () => {
      const cancelButton = document.getElementById('cancel-button');
      const markWrongButton = document.getElementById('mark-wrong-button');
      
      // Both should be hidden initially
      expect(cancelButton.classList.contains('hidden')).toBe(true);
      expect(markWrongButton.classList.contains('hidden')).toBe(true);
      
      // Show cancel button
      stateManager.updateState('session.status', 'RUNNING');
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      expect(markWrongButton.classList.contains('hidden')).toBe(true);
      
      // Show mark wrong button
      stateManager.updateState('ui.markWrongVisible', true);
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      expect(markWrongButton.classList.contains('hidden')).toBe(false);
      
      // Hide cancel button, mark wrong should remain visible
      stateManager.updateState('session.status', 'STOPPED');
      expect(cancelButton.classList.contains('hidden')).toBe(true);
      expect(markWrongButton.classList.contains('hidden')).toBe(false);
    });

    test('should maintain independent state from other buttons', () => {
      const cancelButton = document.getElementById('cancel-button');
      const markWrongButton = document.getElementById('mark-wrong-button');
      
      // Set up different visibility states
      stateManager.updateState('session.status', 'RUNNING'); // Show cancel
      stateManager.updateState('ui.markWrongVisible', false); // Hide mark wrong
      
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      expect(markWrongButton.classList.contains('hidden')).toBe(true);
      
      // Change mark wrong visibility - shouldn't affect cancel
      stateManager.updateState('ui.markWrongVisible', true);
      
      expect(cancelButton.classList.contains('hidden')).toBe(false);
      expect(markWrongButton.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Accessibility and DOM Structure', () => {
    test('should have proper button attributes', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      expect(cancelButton.tagName).toBe('BUTTON');
      expect(cancelButton.textContent).toBe('Cancel');
      
      // Buttons have implicit role="button", so getAttribute may return null
      // but the element itself is accessible as a button
      expect(cancelButton.tagName.toLowerCase()).toBe('button');
    });

    test('should be focusable when visible', () => {
      const cancelButton = document.getElementById('cancel-button');
      
      stateManager.updateState('session.status', 'RUNNING');
      
      // Should be focusable (not disabled or hidden in a way that prevents focus)
      expect(cancelButton.tabIndex).not.toBe(-1);
      expect(cancelButton.disabled).toBe(false);
    });

    test('should maintain proper DOM order', () => {
      const startButton = document.getElementById('start-stop-button');
      const cancelButton = document.getElementById('cancel-button');
      const markWrongButton = document.getElementById('mark-wrong-button');
      
      // Verify DOM order is maintained
      const buttonContainer = startButton.parentNode;
      const buttons = Array.from(buttonContainer.children);
      
      const startIndex = buttons.indexOf(startButton);
      const cancelIndex = buttons.indexOf(cancelButton);
      const markWrongIndex = buttons.indexOf(markWrongButton);
      
      expect(startIndex).toBeLessThan(cancelIndex);
      expect(cancelIndex).toBeLessThan(markWrongIndex);
    });
  });
});