import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { SessionStateManager } from '../../public/state/SessionStateManager.js';
import { TimerManager } from '../../public/components/TimerManager.js';
import { ChordGenerator } from '../../public/components/ChordGenerator.js';
import { SessionManager } from '../../public/components/SessionManager.js';

let stateManager;
let sessionManager;

const setupDom = () => {
  document.body.innerHTML = `
    <div id="fretboard-container"></div>
    <button id="mark-wrong-button" class="hidden">Mark Wrong</button>
  `;
};

describe('SessionManager behaviours', () => {
  beforeEach(() => {
    setupDom();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ results: [] })
      })
    );

    stateManager = new SessionStateManager();
    const timerManager = new TimerManager(stateManager);
    const chordGenerator = new ChordGenerator(stateManager);
    sessionManager = new SessionManager(stateManager, timerManager, chordGenerator);
  });

  test('markCurrentAsWrong updates the most recent result', () => {
    const result = {
      stringSet: '1',
      root: '2',
      key: 'C',
      time: '3.5',
      quality: 'maj7',
      date: new Date().toISOString(),
      wasMarkedWrong: false
    };

    stateManager.addResult(result);
    sessionManager.markCurrentAsWrong();

    const latest = stateManager.getState().results.cpsAndTimes.at(-1);
    expect(latest.wasMarkedWrong).toBe(true);
    expect(latest.time).toBe(999999);
  });

  test('displaySolution renders an SVG into the fretboard container', () => {
    const problem = { stringSet: '1', root: '2', key: 'C', type: 'maj7' };
    stateManager.updateCurrentProblem(problem);

    sessionManager.displaySolution();

    const container = document.getElementById('fretboard-container');
    expect(container.innerHTML).toContain('<svg');
    expect(container.style.visibility).toBe('visible');
  });

  test('formatResultsForClipboard returns numbered rows', () => {
    const rows = [
      { chordInfo: 'SS1, R/2, C maj7', timeInfo: '3.5s' },
      { chordInfo: 'SS2, R/4, Bb dom7', timeInfo: '7.1s' }
    ];

    const formatted = sessionManager.formatResultsForClipboard(rows);
    const lines = formatted.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('1 SS1, R/2, C maj7 3.5s');
  });
});
