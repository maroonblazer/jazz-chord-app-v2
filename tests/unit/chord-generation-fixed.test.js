import { test, expect, describe, beforeEach } from '@jest/globals';

// Test chord generation using Jest's built-in jsdom environment
describe('Chord Generation with DOM', () => {
  // Mock chord shapes data structure for testing
  const chordShapes = {
    SS1: {
      'R/1': {
        'maj7': [0, 2, 1, 1, 0, 2],
        'min7': [0, 2, 0, 1, 0, 2],
        'dom7': [0, 2, 1, 3, 0, 2]
      },
      'R/2': {
        'maj7': [2, 0, 1, 1, 2, 0],
        'min7': [2, 0, 0, 1, 2, 0]
      },
      'R/3': {
        'maj7': [1, 3, 2, 2, 1, 3],
        'min7': [1, 3, 1, 2, 1, 3]
      },
      'R/4': {
        'maj7': [3, 1, 2, 2, 3, 1],
        'min7': [3, 1, 1, 2, 3, 1]
      }
    },
    SS2: {
      'R/2': {
        'maj7': [1, 1, 1, 2, 1, 1],
        'min7': [1, 1, 0, 2, 1, 1]
      },
      'R/3': {
        'maj7': [2, 2, 1, 3, 2, 2],
        'min7': [2, 2, 0, 3, 2, 2]
      },
      'R/4': {
        'maj7': [3, 3, 2, 0, 3, 3],
        'min7': [3, 3, 1, 0, 3, 3]
      },
      'R/5': {
        'maj7': [0, 0, 3, 1, 0, 0],
        'min7': [0, 0, 2, 1, 0, 0]
      }
    }
  };

  const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const types = ['maj7', 'maj9', 'min7', 'min9', 'dom7', 'm7b5', 'alt dom', 'dom13'];

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
    
    // Make chord data globally available
    global.chordShapes = chordShapes;
    global.keys = keys;
    global.types = types;
  });

  // Chord generation functions
  function getRandomStringSet() {
    return Math.random() < 0.5 ? 1 : 2;
  }

  function getRandomRoot(stringSet) {
    return stringSet === 1 ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 4) + 2;
  }

  function getRandomKey() {
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function getRandomType() {
    return types[Math.floor(Math.random() * types.length)];
  }

  function isValidChordShape(stringSet, root, type) {
    const ss = `SS${stringSet}`;
    const rootKey = `R/${root}`;
    const shapes = global.chordShapes || chordShapes;
    return !!(shapes[ss] && shapes[ss][rootKey] && shapes[ss][rootKey][type]);
  }

  function generateChordProblem(options = {}) {
    let stringSet, root, key, type;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      stringSet = options.stringSet || getRandomStringSet();
      root = options.root || getRandomRoot(stringSet);
      key = options.key || getRandomKey();
      type = options.type || getRandomType();
      attempts++;
    } while (!isValidChordShape(stringSet, root, type) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Could not generate valid chord after maximum attempts');
    }

    return { stringSet, root, key, type };
  }

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

  describe('Random Generation Functions', () => {
    test('should generate valid string sets', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomStringSet();
        expect([1, 2]).toContain(result);
      }
    });

    test('should generate valid roots for string sets', () => {
      // Test string set 1 (roots 1-4)
      for (let i = 0; i < 20; i++) {
        const result = getRandomRoot(1);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(4);
      }

      // Test string set 2 (roots 2-5)
      for (let i = 0; i < 20; i++) {
        const result = getRandomRoot(2);
        expect(result).toBeGreaterThanOrEqual(2);
        expect(result).toBeLessThanOrEqual(5);
      }
    });

    test('should generate valid keys and types', () => {
      for (let i = 0; i < 10; i++) {
        expect(keys).toContain(getRandomKey());
        expect(types).toContain(getRandomType());
      }
    });
  });

  describe('Chord Validation', () => {
    test('should validate existing chord shapes', () => {
      expect(isValidChordShape(1, 1, 'maj7')).toBe(true);
      expect(isValidChordShape(1, 2, 'min7')).toBe(true);
      expect(isValidChordShape(2, 3, 'maj7')).toBe(true);
      expect(isValidChordShape(2, 5, 'min7')).toBe(true);
    });

    test('should reject invalid chord shapes', () => {
      expect(isValidChordShape(1, 5, 'maj7')).toBe(false); // Invalid root for SS1
      expect(isValidChordShape(3, 1, 'maj7')).toBe(false); // Invalid string set
      expect(isValidChordShape(1, 1, 'invalid')).toBe(false); // Invalid type
      expect(isValidChordShape(2, 1, 'maj7')).toBe(false); // Root 1 not valid for SS2
    });
  });

  describe('Chord Problem Generation', () => {
    test('should generate valid chord problems', () => {
      for (let i = 0; i < 10; i++) {
        const chord = generateChordProblem();
        expect([1, 2]).toContain(chord.stringSet);
        expect(keys).toContain(chord.key);
        expect(types).toContain(chord.type);
        expect(isValidChordShape(chord.stringSet, chord.root, chord.type)).toBe(true);
      }
    });

    test('should respect provided options', () => {
      const options = { stringSet: 1, key: 'C', type: 'maj7' };
      const chord = generateChordProblem(options);
      expect(chord.stringSet).toBe(1);
      expect(chord.key).toBe('C');
      expect(chord.type).toBe('maj7');
      expect(isValidChordShape(chord.stringSet, chord.root, chord.type)).toBe(true);
    });

    test('should throw error if no valid chord can be generated', () => {
      // Mock an impossible scenario
      const originalChordShapes = global.chordShapes;
      global.chordShapes = { SS1: {}, SS2: {} };
      
      expect(() => {
        generateChordProblem();
      }).toThrow('Could not generate valid chord after maximum attempts');
      
      global.chordShapes = originalChordShapes;
    });
  });

  describe('DOM Display Functions', () => {
    test('should display chord problem correctly', () => {
      const problem = { stringSet: 1, root: 2, key: 'F#', type: 'maj7' };
      displayChordProblem(problem);
      
      expect(document.getElementById('stringSetTextField').textContent).toBe('SS1');
      expect(document.getElementById('rootTextField').textContent).toBe('R/2');
      expect(document.getElementById('keyTextField').textContent).toBe('F#');
      expect(document.getElementById('typeTextField').textContent).toBe('maj7');
    });

    test('should clear chord display', () => {
      // First set some values
      const problem = { stringSet: 2, root: 3, key: 'Bb', type: 'min7' };
      displayChordProblem(problem);
      
      // Then clear them
      clearChordDisplay();
      
      expect(document.getElementById('stringSetTextField').textContent).toBe('--');
      expect(document.getElementById('rootTextField').textContent).toBe('--');
      expect(document.getElementById('keyTextField').textContent).toBe('--');
      expect(document.getElementById('typeTextField').textContent).toBe('--');
    });

    test('should handle multiple chord displays', () => {
      const chords = [
        { stringSet: 1, root: 1, key: 'C', type: 'maj7' },
        { stringSet: 2, root: 4, key: 'G', type: 'min7' },
        { stringSet: 1, root: 3, key: 'E', type: 'dom7' }
      ];

      chords.forEach(chord => {
        displayChordProblem(chord);
        expect(document.getElementById('stringSetTextField').textContent).toBe(`SS${chord.stringSet}`);
        expect(document.getElementById('keyTextField').textContent).toBe(chord.key);
        expect(document.getElementById('typeTextField').textContent).toBe(chord.type);
      });
    });
  });

  describe('Integration with DOM Elements', () => {
    test('should verify required DOM elements exist', () => {
      expect(document.getElementById('stringSetTextField')).toBeTruthy();
      expect(document.getElementById('rootTextField')).toBeTruthy();
      expect(document.getElementById('keyTextField')).toBeTruthy();
      expect(document.getElementById('typeTextField')).toBeTruthy();
      expect(document.getElementById('fretboard-container')).toBeTruthy();
      expect(document.getElementById('fretboard')).toBeTruthy();
    });

    test('should handle complete chord generation and display flow', () => {
      // Generate a chord
      const chord = generateChordProblem({ stringSet: 1 });
      
      // Display it
      displayChordProblem(chord);
      
      // Verify it's displayed correctly
      expect(document.getElementById('stringSetTextField').textContent).toBe('SS1');
      expect(document.getElementById('rootTextField').textContent).toMatch(/^R\/[1-4]$/);
      expect(keys).toContain(document.getElementById('keyTextField').textContent);
      expect(types).toContain(document.getElementById('typeTextField').textContent);
      
      // Clear and verify
      clearChordDisplay();
      expect(document.getElementById('stringSetTextField').textContent).toBe('--');
    });
  });
});