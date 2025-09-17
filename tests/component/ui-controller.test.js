import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { SessionStateManager } from '../../public/state/SessionStateManager.js';
import { TimerManager } from '../../public/components/TimerManager.js';
import { ChordGenerator } from '../../public/components/ChordGenerator.js';
import { SessionManager } from '../../public/components/SessionManager.js';
import { UIController } from '../../public/components/UIController.js';

let stateManager;
let sessionManager;

const createDom = () => {
  document.body.innerHTML = `
    <div class="main">
      <div class="problem-container">
        <span class="label">String Set</span>
        <span id="stringSetTextField">--</span>
        <span class="label">Root</span>
        <span id="rootTextField">--</span>
        <span class="label">Key</span>
        <span id="keyTextField">--</span>
        <span class="label">Type</span>
        <span id="typeTextField">--</span>
      </div>

      <div id="fretboard-container"></div>

      <div class="button-container">
        <button id="start-stop-button" class="round" aria-labelledby="start-stop-button-label"></button>
        <p id="start-stop-button-label" class="label">Start</p>
        <button id="cancel-button" class="hidden cancel-button" role="button">Cancel</button>
        <button id="mark-wrong-button" class="hidden" role="button">Mark Wrong</button>
      </div>

      <div class="status-bar">
        <p id="status-message"></p>
        <p id="error-message"></p>
      </div>

      <button id="options-button" aria-expanded="false">Options</button>
      <div class="options-menu" hidden>
        <select id="key-select">
          <option value="">Random</option>
          <option value="C">C</option>
        </select>
        <select id="type-select">
          <option value="">Random</option>
          <option value="maj7">maj7</option>
        </select>
        <select id="string-set-select">
          <option value="">Random</option>
          <option value="1">1</option>
        </select>
        <button id="reset-options-button">Reset</button>
        <button id="wipe-database-button">Wipe Data</button>
      </div>
    </div>
  `;
};

describe('UIController integration with real managers', () => {
  beforeEach(() => {
    createDom();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ results: [] })
      })
    );

    navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue()
    };

    stateManager = new SessionStateManager();
    const timerManager = new TimerManager(stateManager);
    const chordGenerator = new ChordGenerator(stateManager);
    sessionManager = new SessionManager(stateManager, timerManager, chordGenerator);

    new UIController(stateManager, sessionManager);
  });

  test('cancel button visibility follows session status', () => {
    const cancelButton = document.getElementById('cancel-button');
    expect(cancelButton.classList.contains('hidden')).toBe(true);

    stateManager.updateState('session.status', 'RUNNING');
    expect(cancelButton.classList.contains('hidden')).toBe(false);

    stateManager.updateState('session.status', 'STOPPED');
    expect(cancelButton.classList.contains('hidden')).toBe(true);
  });

  test('start/stop label reflects session phase', () => {
    const startButtonLabel = document.getElementById('start-stop-button-label');
    const startButton = document.getElementById('start-stop-button');

    stateManager.updateState('session.status', 'RUNNING');
    expect(startButtonLabel.textContent).toBe('Stop');

    stateManager.updateState('session.status', 'LAST');
    expect(startButtonLabel.textContent).toBe('See Results');
    expect(startButton.classList.contains('see-results')).toBe(true);
  });

  test('reset options button clears UI selections and state', () => {
    const keySelect = document.getElementById('key-select');
    const typeSelect = document.getElementById('type-select');
    const stringSetSelect = document.getElementById('string-set-select');

    keySelect.value = 'C';
    keySelect.dispatchEvent(new Event('change', { bubbles: true }));
    typeSelect.value = 'maj7';
    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    stringSetSelect.value = '1';
    stringSetSelect.dispatchEvent(new Event('change', { bubbles: true }));

    document.getElementById('reset-options-button').click();

    const optionsState = stateManager.getState().options;
    expect(optionsState.selectedKey).toBeNull();
    expect(optionsState.selectedType).toBeNull();
    expect(optionsState.selectedStringSet).toBeNull();

    expect(keySelect.value).toBe('');
    expect(typeSelect.value).toBe('');
    expect(stringSetSelect.value).toBe('');
  });

  test('clicking cancel delegates to the real session manager', () => {
    const cancelSpy = jest.spyOn(sessionManager, 'cancelSession');
    stateManager.updateState('session.status', 'RUNNING');

    document.getElementById('cancel-button').click();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  test('mark wrong button visibility reflects UI state', () => {
    const markWrongButton = document.getElementById('mark-wrong-button');
    expect(markWrongButton.classList.contains('hidden')).toBe(true);

    stateManager.updateState('ui.markWrongVisible', true);
    expect(markWrongButton.classList.contains('hidden')).toBe(false);

    stateManager.updateState('ui.markWrongVisible', false);
    expect(markWrongButton.classList.contains('hidden')).toBe(true);
  });

  test('status and error messages update the status bar', () => {
    const status = document.getElementById('status-message');
    const error = document.getElementById('error-message');

    expect(status.getAttribute('aria-hidden')).toBe('true');
    expect(error.classList.contains('visible')).toBe(false);

    stateManager.updateState('ui.statusMessage', 'Uploading results...');
    expect(status.textContent).toBe('Uploading results...');
    expect(status.getAttribute('aria-hidden')).toBe('false');

    stateManager.updateState('ui.errorMessage', 'Something went wrong');
    expect(error.textContent).toBe('Something went wrong');
    expect(error.classList.contains('visible')).toBe(true);

    stateManager.updateState('ui.errorMessage', null);
    expect(error.textContent).toBe('');
    expect(error.classList.contains('visible')).toBe(false);
  });
});
