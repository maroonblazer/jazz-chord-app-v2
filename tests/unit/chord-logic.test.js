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

  describe('Problematic Chords Analysis', () => {
    function aggregateChordProblems(sessionData, topN = 3) {
      // Group by chord combination and calculate average time
      const chordGroups = {};
      
      sessionData.forEach(row => {
        const chordKey = `SS${row.stringSet}, R/${row.root}, ${row.key} ${row.type}`;
        const time = parseFloat(row.time);
        
        if (!chordGroups[chordKey]) {
          chordGroups[chordKey] = {
            times: [],
            maxTime: time,
            attempts: 0
          };
        }
        
        chordGroups[chordKey].times.push(time);
        chordGroups[chordKey].maxTime = Math.max(chordGroups[chordKey].maxTime, time);
        chordGroups[chordKey].attempts++;
      });

      // Calculate averages and sort by worst average time
      const aggregatedResults = Object.keys(chordGroups).map(chordKey => {
        const group = chordGroups[chordKey];
        const avgTime = group.times.reduce((sum, time) => sum + time, 0) / group.times.length;
        
        return {
          chordInfo: chordKey,
          timeInfo: `${avgTime.toFixed(1)}s avg (${group.attempts} attempts)`,
          avgTime: avgTime,
          maxTime: group.maxTime,
          attempts: group.attempts
        };
      });

      // Sort by average time descending and take top N
      aggregatedResults.sort((a, b) => b.avgTime - a.avgTime);
      return aggregatedResults.slice(0, topN);
    }

    test('should deduplicate same chord problems', () => {
      const sessionData = [
        { stringSet: 1, root: 2, key: 'C', type: 'maj7', time: 5000 },
        { stringSet: 1, root: 2, key: 'C', type: 'maj7', time: 4000 },
        { stringSet: 1, root: 3, key: 'D', type: 'min7', time: 3000 },
        { stringSet: 2, root: 4, key: 'F', type: 'dom7', time: 2000 }
      ];

      const results = aggregateChordProblems(sessionData, 3);
      
      expect(results).toHaveLength(3);
      
      // Should have unique chord combinations only
      const chordInfos = results.map(r => r.chordInfo);
      const uniqueChords = new Set(chordInfos);
      expect(uniqueChords.size).toBe(3);
      
      // C maj7 should be aggregated with average time of 4.5s
      const cMaj7Result = results.find(r => r.chordInfo === 'SS1, R/2, C maj7');
      expect(cMaj7Result).toBeDefined();
      expect(cMaj7Result.avgTime).toBe(4500);
      expect(cMaj7Result.attempts).toBe(2);
    });

    test('should sort by average time descending', () => {
      const sessionData = [
        { stringSet: 1, root: 1, key: 'A', type: 'maj7', time: 2000 },
        { stringSet: 1, root: 2, key: 'B', type: 'min7', time: 6000 },
        { stringSet: 1, root: 2, key: 'B', type: 'min7', time: 4000 },
        { stringSet: 1, root: 3, key: 'C', type: 'dom7', time: 3000 }
      ];

      const results = aggregateChordProblems(sessionData, 3);
      
      expect(results[0].chordInfo).toBe('SS1, R/2, B min7'); // avg 5000
      expect(results[1].chordInfo).toBe('SS1, R/3, C dom7'); // 3000
      expect(results[2].chordInfo).toBe('SS1, R/1, A maj7'); // 2000
    });

    test('should handle single attempts correctly', () => {
      const sessionData = [
        { stringSet: 1, root: 1, key: 'C', type: 'maj7', time: 4000 },
        { stringSet: 2, root: 2, key: 'D', type: 'min7', time: 3000 }
      ];

      const results = aggregateChordProblems(sessionData, 2);
      
      expect(results).toHaveLength(2);
      expect(results[0].attempts).toBe(1);
      expect(results[1].attempts).toBe(1);
    });

    test('should calculate times correctly with real CSV data format', () => {
      // Simulate real CSV data structure from session-data-last-10.csv
      const csvRows = [
        { SS: '2', Root: '3', Key: 'C', Quality: 'min7b5', Time: '34.7' },
        { SS: '2', Root: '5', Key: 'Bb', Quality: 'maj7', Time: '9.8' },
        { SS: '2', Root: '3', Key: 'C', Quality: 'min7b5', Time: '25.3' }, // Same chord as first
        { SS: '1', Root: '1', Key: 'A#', Quality: 'min9', Time: '7.4' }
      ];

      // Convert to format expected by aggregateChordProblems function
      const sessionData = csvRows.map(row => ({
        stringSet: parseInt(row.SS),
        root: parseInt(row.Root),
        key: row.Key,
        type: row.Quality,
        time: parseFloat(row.Time)
      }));

      const results = aggregateChordProblems(sessionData, 3);
      
      // C min7b5 should be aggregated: (34.7 + 25.3) / 2 = 30.0
      const cMin7b5Result = results.find(r => r.chordInfo === 'SS2, R/3, C min7b5');
      expect(cMin7b5Result).toBeDefined();
      expect(cMin7b5Result.avgTime).toBe(30.0);
      expect(cMin7b5Result.attempts).toBe(2);
      expect(cMin7b5Result.timeInfo).toBe('30.0s avg (2 attempts)');

      // Bb maj7 should have single attempt
      const bbMaj7Result = results.find(r => r.chordInfo === 'SS2, R/5, Bb maj7');
      expect(bbMaj7Result).toBeDefined();
      expect(bbMaj7Result.avgTime).toBe(9.8);
      expect(bbMaj7Result.attempts).toBe(1);
      expect(bbMaj7Result.timeInfo).toBe('9.8s avg (1 attempts)');
    });

    test('should match legacy server parseFloat logic', () => {
      // Test the exact logic from server.js line 142
      const mockCSVRow = { SS: '1', Root: '2', Key: 'D', Quality: 'maj7', Time: '15.6' };
      const time = parseFloat(mockCSVRow.Time);
      
      expect(time).toBe(15.6);
      expect(typeof time).toBe('number');
    });
  });
});