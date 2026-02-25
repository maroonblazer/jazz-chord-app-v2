/**
 * Shared chord data module.
 * 
 * Single source of truth for musical keys, chord types, and chord shape
 * definitions used throughout the app.
 */

export const musicalKeys = [
  "C", "D", "E", "F", "G", "A", "B",
  "C#", "D#", "F#", "G#", "A#",
  "Db", "Eb", "Gb", "Ab", "Bb"
];

export const chordTypes = [
  "maj7", "min7", "dom7", "min7b5",
  "alt dom", "maj9", "min9", "dom13"
];

/**
 * Chord shape data structure:
 *   chordShapes[`SS${stringSet}`][`R/${root}`][type] = [fret1, fret2, fret3, fret4, fret5, fret6]
 * 
 * - SS1: String Set 1 (E, B, G, D strings) — roots 1-4
 * - SS2: String Set 2 (B, G, D, A strings) — roots 2-5
 * - null entries mean the string is not played
 */
export const chordShapes = {
  SS1: {
    "R/1": {
      maj7: [null, null, 4, 4, 3, 3],
      min7: [null, null, 3, 3, 3, 3],
      dom7: [null, null, 3, 4, 3, 3],
      min7b5: [null, null, 3, 3, 2, 3],
      "alt dom": [null, null, 3, 4, 4, 4],
      maj9: [null, null, 4, 4, 5, 5],
      min9: [null, null, 3, 3, 3, 5],
      dom13: [null, null, 3, 3, 4, 5],
    },
    "R/2": {
      maj7: [null, null, 3, 5, 2, 4],
      min7: [null, null, 2, 4, 2, 4],
      dom7: [null, null, 3, 4, 2, 4],
      min7b5: [null, null, 2, 4, 2, 3],
      "alt dom": [null, null, 3, 4, 3, 5],
      maj9: [null, null, 3, 5, 4, 4],
      min9: [null, null, 2, 4, 4, 4],
      dom13: [null, null, 3, 4, 4, 4],
    },
    "R/3": {
      maj7: [null, null, 2, 4, 2, 4],
      min7: [null, null, 3, 3, 2, 4],
      dom7: [null, null, 3, 3, 3, 4],
      min7b5: [null, null, 2, 3, 2, 4],
      "alt dom": [null, null, 4, 4, 3, 4],
      maj9: [null, null, 3, 3, 3, 5],
      min9: [null, null, 3, 5, 2, 4],
      dom13: [null, null, 3, 5, 3, 4],
    },
    "R/4": {
      maj7: [null, null, 3, 5, 5, 5],
      min7: [null, null, 3, 5, 4, 4],
      dom7: [null, null, 3, 5, 4, 5],
      min7b5: [null, null, 3, 4, 4, 4],
      "alt dom": [null, null, 3, 5, 3, 4],
      maj9: [null, null, 3, 5, 5, 5],
      min9: [null, null, 3, 3, 4, 4],
      dom13: [null, null, 1, 5, 2, 3],
    },
  },
  SS2: {
    "R/2": {
      maj7: [null, 3, 3, 1, 2, null],
      min7: [null, 3, 3, 2, 3, null],
      dom7: [null, 3, 4, 2, 3, null],
      min7b5: [null, 3, 3, 1, 3, null],
      "alt dom": [null, 3, 4, 3, 4, null],
      maj9: [null, 4, 4, 4, 5, null],
      min9: [null, 2, 2, 1, 4, null],
      dom13: [null, 3, 4, 4, 5, null],
    },
    "R/3": {
      maj7: [null, 3, 5, 1, 4, null],
      min7: [null, 2, 4, 1, 4, null],
      dom7: [null, 3, 4, 1, 4, null],
      min7b5: [null, 2, 4, 1, 3, null],
      "alt dom": [null, 3, 4, 2, 5, null],
      maj9: [null, 2, 2, 2, 3, null],
      min9: [null, 2, 4, 3, 2, null],
      dom13: [null, 3, 4, 3, 4, null],
    },
    "R/4": {
      maj7: [null, 2, 2, 1, 4, null],
      min7: [null, 3, 3, 1, 4, null],
      dom7: [null, 3, 3, 2, 4, null],
      min7b5: [null, 2, 3, 1, 4, null],
      "alt dom": [null, 4, 4, 2, 4, null],
      maj9: [null, 2, 4, 1, 4, null],
      min9: [null, 3, 5, 1, 4, null],
      dom13: [null, 3, 5, 2, 4, null],
    },
    "R/5": {
      maj7: [null, 3, 5, 4, 5, null],
      min7: [null, 3, 5, 3, 4, null],
      dom7: [null, 3, 5, 3, 5, null],
      min7b5: [null, 3, 4, 3, 4, null],
      "alt dom": [null, 3, 5, 2, 4, null],
      maj9: [null, 3, 5, 4, 5, null],
      min9: [null, 3, 3, 3, 4, null],
      dom13: [null, 1, 5, 1, 3, null],
    },
  },
};

/** Valid root positions per string set */
export const validRootsByStringSet = {
  "1": ["1", "2", "3", "4"],
  "2": ["2", "3", "4", "5"],
};
