import { test, expect, describe } from '@jest/globals';

// Pure logic tests without DOM dependencies
describe('Chord Generation Logic', () => {
  const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const types = ['maj7', 'maj9', 'min7', 'min9', 'dom7', 'm7b5', 'alt dom', 'dom13'];
  
  // Mock chord shapes data
  const chordShapes = {
    SS1: {
      'R/1': { 'maj7': [0, 2, 1, 1, 0, 2], 'min7': [0, 2, 0, 1, 0, 2] },
      'R/2': { 'maj7': [2, 0, 1, 1, 2, 0], 'min7': [2, 0, 0, 1, 2, 0] }
    },
    SS2: {
      'R/2': { 'maj7': [1, 1, 1, 2, 1, 1], 'min7': [1, 1, 0, 2, 1, 1] }
    }
  };

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
    return !!(chordShapes[ss] && chordShapes[ss][rootKey] && chordShapes[ss][rootKey][type]);
  }

  describe('Random Generation Functions', () => {
    test('getRandomStringSet should return 1 or 2', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomStringSet();
        expect([1, 2]).toContain(result);
      }
    });

    test('getRandomRoot should return valid ranges', () => {
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

    test('getRandomKey should return valid chromatic keys', () => {
      for (let i = 0; i < 20; i++) {
        const result = getRandomKey();
        expect(keys).toContain(result);
      }
    });

    test('getRandomType should return valid chord types', () => {
      for (let i = 0; i < 20; i++) {
        const result = getRandomType();
        expect(types).toContain(result);
      }
    });
  });

  describe('Chord Validation', () => {
    test('should validate existing chord shapes', () => {
      expect(isValidChordShape(1, 1, 'maj7')).toBe(true);
      expect(isValidChordShape(1, 1, 'min7')).toBe(true);
      expect(isValidChordShape(1, 2, 'maj7')).toBe(true);
      expect(isValidChordShape(2, 2, 'maj7')).toBe(true);
    });

    test('should reject invalid chord shapes', () => {
      expect(isValidChordShape(1, 5, 'maj7')).toBe(false); // Invalid root for SS1
      expect(isValidChordShape(3, 1, 'maj7')).toBe(false); // Invalid string set
      expect(isValidChordShape(1, 1, 'invalid')).toBe(false); // Invalid type
      expect(isValidChordShape(2, 1, 'maj7')).toBe(false); // Root 1 not valid for SS2
    });
  });

  describe('Chord Data Structure', () => {
    test('should have correct structure for chord shapes', () => {
      expect(chordShapes).toHaveProperty('SS1');
      expect(chordShapes).toHaveProperty('SS2');
      expect(chordShapes.SS1).toHaveProperty('R/1');
      expect(chordShapes.SS1).toHaveProperty('R/2');
      expect(chordShapes.SS2).toHaveProperty('R/2');
    });

    test('should have valid fret arrays', () => {
      const shape = chordShapes.SS1['R/1']['maj7'];
      expect(Array.isArray(shape)).toBe(true);
      expect(shape).toHaveLength(6); // 6 strings
      shape.forEach(fret => {
        expect(typeof fret).toBe('number');
        expect(fret).toBeGreaterThanOrEqual(0);
        expect(fret).toBeLessThanOrEqual(20); // Reasonable fret range
      });
    });
  });

  describe('Session Timing Logic', () => {
    function calculateAverageTime(times) {
      if (times.length === 0) return 0;
      return times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    function findSlowestChords(sessionData) {
      return sessionData
        .sort((a, b) => b.time - a.time)
        .slice(0, 3);
    }

    test('should calculate average time correctly', () => {
      const times = [1000, 2000, 3000, 4000];
      expect(calculateAverageTime(times)).toBe(2500);
      expect(calculateAverageTime([])).toBe(0);
      expect(calculateAverageTime([5000])).toBe(5000);
    });

    test('should find slowest chords', () => {
      const sessionData = [
        { time: 2000, chord: 'C maj7' },
        { time: 4000, chord: 'F# min7' },
        { time: 1000, chord: 'G dom7' },
        { time: 3000, chord: 'Bb maj7' },
        { time: 5000, chord: 'Eb min7' }
      ];

      const slowest = findSlowestChords(sessionData);
      expect(slowest).toHaveLength(3);
      expect(slowest[0].time).toBe(5000);
      expect(slowest[1].time).toBe(4000);
      expect(slowest[2].time).toBe(3000);
    });
  });

  describe('Options Filtering', () => {
    function applyOptionsFilter(options, stringSet, root, key, type) {
      if (options.stringSet && options.stringSet !== stringSet) return false;
      if (options.key && options.key !== key) return false;
      if (options.type && options.type !== type) return false;
      return true;
    }

    test('should filter by string set', () => {
      const options = { stringSet: 1 };
      expect(applyOptionsFilter(options, 1, 2, 'C', 'maj7')).toBe(true);
      expect(applyOptionsFilter(options, 2, 2, 'C', 'maj7')).toBe(false);
    });

    test('should filter by key', () => {
      const options = { key: 'C' };
      expect(applyOptionsFilter(options, 1, 2, 'C', 'maj7')).toBe(true);
      expect(applyOptionsFilter(options, 1, 2, 'D', 'maj7')).toBe(false);
    });

    test('should filter by type', () => {
      const options = { type: 'maj7' };
      expect(applyOptionsFilter(options, 1, 2, 'C', 'maj7')).toBe(true);
      expect(applyOptionsFilter(options, 1, 2, 'C', 'min7')).toBe(false);
    });

    test('should handle multiple filters', () => {
      const options = { stringSet: 1, key: 'C', type: 'maj7' };
      expect(applyOptionsFilter(options, 1, 2, 'C', 'maj7')).toBe(true);
      expect(applyOptionsFilter(options, 2, 2, 'C', 'maj7')).toBe(false);
      expect(applyOptionsFilter(options, 1, 2, 'D', 'maj7')).toBe(false);
      expect(applyOptionsFilter(options, 1, 2, 'C', 'min7')).toBe(false);
    });

    test('should pass when no filters applied', () => {
      const options = {};
      expect(applyOptionsFilter(options, 1, 2, 'C', 'maj7')).toBe(true);
      expect(applyOptionsFilter(options, 2, 3, 'F#', 'min7')).toBe(true);
    });
  });
});