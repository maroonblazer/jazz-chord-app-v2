import { test, expect, describe, beforeEach } from '@jest/globals';

// Import the refactored ChordGenerator class
import { ChordGenerator } from '../../public/components/ChordGenerator.js';
import { SessionStateManager } from '../../public/state/SessionStateManager.js';

describe('Refactored ChordGenerator Tests', () => {
  let stateManager;
  let chordGenerator;

  beforeEach(() => {
    // Set up DOM structure for chord display
    document.body.innerHTML = `
      <div id="fretboard-container"></div>
      <div id="stringSetTextField">--</div>
      <div id="rootTextField">--</div>
      <div id="keyTextField">--</div>
      <div id="typeTextField">--</div>
      <svg id="fretboard"></svg>
    `;
    
    // Initialize state manager and chord generator
    stateManager = new SessionStateManager();
    chordGenerator = new ChordGenerator(stateManager);
  });

  // Helper functions
  function displayChordProblem(problem) {
    document.getElementById('stringSetTextField').textContent = `SS${problem.stringSet}`;
    document.getElementById('rootTextField').textContent = `R/${problem.root}`;
    document.getElementById('keyTextField').textContent = problem.key;
    document.getElementById('typeTextField').textContent = problem.type;
  }

  function clearChordDisplay() {
    document.getElementById('stringSetTextField').textContent = '--';
    document.getElementById('rootTextField').textContent = '--';
    document.getElementById('keyTextField').textContent = '--';
    document.getElementById('typeTextField').textContent = '--';
  }

  describe('ChordGenerator Validation', () => {
    test('getValidRoots should return correct roots for each string set', () => {
      expect(chordGenerator.getValidRoots('1')).toEqual(['1', '2', '3', '4']);
      expect(chordGenerator.getValidRoots('2')).toEqual(['2', '3', '4', '5']);
    });

    test('chooseRandomFromArray should work correctly', () => {
      const testArray = ['a', 'b', 'c'];
      for (let i = 0; i < 20; i++) {
        const result = chordGenerator.chooseRandomFromArray(testArray);
        expect(testArray).toContain(result);
      }
    });

    test('chooseRandomFromArray should handle edge cases', () => {
      expect(chordGenerator.chooseRandomFromArray([])).toBe(null);
      expect(chordGenerator.chooseRandomFromArray(null)).toBe(null);
      expect(chordGenerator.chooseRandomFromArray(['single'])).toBe('single');
    });
  });

  describe('Chord Shape Validation', () => {
    test('getFretPositions should return valid shapes for existing combinations', () => {
      const shape = chordGenerator.getFretPositions('1', '1', 'maj7');
      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBe(6);
    });

    test('getFretPositions should handle invalid combinations', () => {
      const shape = chordGenerator.getFretPositions('1', '5', 'maj7'); // Invalid: SS1 doesn't have R/5
      expect(shape).toEqual([null, null, null, null, null, null]);
    });

    test('generateSVG should create valid SVG string', () => {
      const fretPositions = [null, null, 4, 4, 3, 3];
      const svg = chordGenerator.generateSVG(fretPositions);
      expect(typeof svg).toBe('string');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
    });
  });

  describe('Chord Problem Generation', () => {
    test('should generate valid chord problems with no options', () => {
      for (let i = 0; i < 10; i++) {
        const problem = chordGenerator.generateRandomProblem();
        expect(['1', '2']).toContain(problem.stringSet);
        expect(chordGenerator.musicalKeys).toContain(problem.key);
        expect(chordGenerator.chordTypes).toContain(problem.type);
        
        const validRoots = chordGenerator.getValidRoots(problem.stringSet);
        expect(validRoots).toContain(problem.root);
      }
    });

    test('should respect user options when provided', () => {
      // Set specific options in state
      stateManager.updateOptions({
        selectedKey: 'C',
        selectedType: 'maj7',
        selectedStringSet: '1'
      });
      
      const problem = chordGenerator.generateRandomProblem();
      expect(problem.key).toBe('C');
      expect(problem.type).toBe('maj7');
      expect(problem.stringSet).toBe('1');
      expect(['1', '2', '3', '4']).toContain(problem.root); // Valid roots for SS1
    });

    test('should respect partial options', () => {
      // Set only key option
      stateManager.updateOptions({
        selectedKey: 'F#',
        selectedType: null,
        selectedStringSet: null
      });
      
      const problem = chordGenerator.generateRandomProblem();
      expect(problem.key).toBe('F#');
      expect(['1', '2']).toContain(problem.stringSet);
      expect(chordGenerator.chordTypes).toContain(problem.type);
    });

    test('should avoid recent problems when possible', () => {
      // Add some recent problems
      stateManager.addRecentProblem('1 2');
      stateManager.addRecentProblem('1 3');
      stateManager.addRecentProblem('2 4');
      
      // Generate several problems and verify they avoid recent ones when possible
      const problems = [];
      for (let i = 0; i < 5; i++) {
        problems.push(chordGenerator.generateRandomProblem());
      }
      
      const problemStrings = problems.map(p => `${p.stringSet} ${p.root}`);
      const recentProblems = ['1 2', '1 3', '2 4'];
      
      // At least some problems should avoid the recent ones
      const nonRecentProblems = problemStrings.filter(p => !recentProblems.includes(p));
      expect(nonRecentProblems.length).toBeGreaterThan(0);
    });
  });

  describe('DOM Display Functions', () => {
    test('should display chord problem correctly', () => {
      const problem = { stringSet: '1', root: '2', key: 'F#', type: 'maj7' };
      displayChordProblem(problem);
      
      expect(document.getElementById('stringSetTextField').textContent).toBe('SS1');
      expect(document.getElementById('rootTextField').textContent).toBe('R/2');
      expect(document.getElementById('keyTextField').textContent).toBe('F#');
      expect(document.getElementById('typeTextField').textContent).toBe('maj7');
    });

    test('should clear chord display', () => {
      // First set some values
      const problem = { stringSet: '2', root: '3', key: 'Bb', type: 'min7' };
      displayChordProblem(problem);
      
      // Then clear them
      clearChordDisplay();
      
      expect(document.getElementById('stringSetTextField').textContent).toBe('--');
      expect(document.getElementById('rootTextField').textContent).toBe('--');
      expect(document.getElementById('keyTextField').textContent).toBe('--');
      expect(document.getElementById('typeTextField').textContent).toBe('--');
    });
  });

  describe('Integration Tests', () => {
    test('should verify required DOM elements exist', () => {
      expect(document.getElementById('stringSetTextField')).toBeTruthy();
      expect(document.getElementById('rootTextField')).toBeTruthy();
      expect(document.getElementById('keyTextField')).toBeTruthy();
      expect(document.getElementById('typeTextField')).toBeTruthy();
      expect(document.getElementById('fretboard-container')).toBeTruthy();
      expect(document.getElementById('fretboard')).toBeTruthy();
    });

    test('should handle complete chord generation and display flow', () => {
      // Set specific options for predictable testing
      stateManager.updateOptions({ selectedStringSet: '1' });
      
      // Generate a chord
      const chord = chordGenerator.generateRandomProblem();
      
      // Display it
      displayChordProblem(chord);
      
      // Verify it's displayed correctly
      expect(document.getElementById('stringSetTextField').textContent).toBe('SS1');
      expect(document.getElementById('rootTextField').textContent).toMatch(/^R\/[1-4]$/);
      expect(chordGenerator.musicalKeys).toContain(document.getElementById('keyTextField').textContent);
      expect(chordGenerator.chordTypes).toContain(document.getElementById('typeTextField').textContent);
      
      // Clear and verify
      clearChordDisplay();
      expect(document.getElementById('stringSetTextField').textContent).toBe('--');
    });

    test('should generate valid SVG for chord shapes', () => {
      const problem = chordGenerator.generateRandomProblem();
      const fretPositions = chordGenerator.getFretPositions(problem.stringSet, problem.root, problem.type);
      const svg = chordGenerator.generateSVG(fretPositions);
      
      expect(typeof svg).toBe('string');
      expect(svg.includes('<svg')).toBe(true);
      expect(svg.includes('</svg>')).toBe(true);
      expect(svg.includes('fretboard-base')).toBe(true);
    });
  });
});