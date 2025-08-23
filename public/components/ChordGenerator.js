export class ChordGenerator {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.musicalKeys = [
      "C", "D", "E", "F", "G", "A", "B",
      "C#", "D#", "F#", "G#", "A#",
      "Db", "Eb", "Gb", "Ab", "Bb"
    ];
    
    this.chordTypes = [
      "maj7", "min7", "dom7", "min7b5",
      "alt dom", "maj9", "min9", "dom13"
    ];
    
    this.chordShapes = {
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
  }

  chooseRandomFromArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
      console.error("Invalid input to chooseRandomFromArray:", array);
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  getValidRoots(stringSet) {
    return stringSet === "1" ? ["1", "2", "3", "4"] : ["2", "3", "4", "5"];
  }

  generateRandomProblem() {
    const state = this.stateManager.getState();
    const { selectedKey, selectedType, selectedStringSet } = state.options;
    
    const key = selectedKey || this.chooseRandomFromArray(this.musicalKeys);
    const type = selectedType || this.chooseRandomFromArray(this.chordTypes);
    const chosenStringSet = selectedStringSet || this.chooseRandomFromArray(["1", "2"]);
    
    const validRoots = this.getValidRoots(chosenStringSet);
    const recentProblems = state.results.recentProblems;
    
    // Filter out recent combinations
    const availableRoots = validRoots.filter(root => 
      !recentProblems.includes(`${chosenStringSet} ${root}`)
    );
    
    // Use available roots, fallback to all valid roots if none available
    const chosenRoot = availableRoots.length > 0 
      ? this.chooseRandomFromArray(availableRoots)
      : this.chooseRandomFromArray(validRoots);
    
    this.stateManager.addRecentProblem(`${chosenStringSet} ${chosenRoot}`);
    
    return {
      stringSet: chosenStringSet,
      root: chosenRoot,
      key,
      type,
    };
  }

  getFretPositions(stringSet, root, type) {
    const shape = this.chordShapes[`SS${stringSet}`]?.[`R/${root}`]?.[type];
    
    if (!shape) {
      console.error(`No shape found for SS${stringSet} R/${root} ${type}`);
      return [null, null, null, null, null, null];
    }
    
    return shape;
  }

  generateSVG(fretPositions, options = {}) {
    const { width = 339, height = 806, circleColor = "black" } = options;
    
    if (!Array.isArray(fretPositions)) {
      throw new Error("fretPositions must be an array");
    }
    
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add fretboard base
    svg += `
      <g id="fretboard-base">
        <g id="Frame 1">
          <g id="Strings">
            <line id="Low E" x1="13.5" y1="2" x2="13.5" y2="806" stroke="black"/>
            <line id="A" x1="73.5" y1="2" x2="73.5" y2="806" stroke="black"/>
            <line id="D" x1="133.5" y1="2" x2="133.5" y2="806" stroke="black"/>
            <line id="G" x1="193.5" y1="2" x2="193.5" y2="806" stroke="black"/>
            <line id="B" x1="253.5" y1="2" x2="253.5" y2="806" stroke="black"/>
            <line id="High E" x1="313.5" y1="2" x2="313.5" y2="806" stroke="black"/>
          </g>
          <rect id="Fretboard" x="1.5" y="1.5" width="323" height="803" stroke="black" stroke-width="3"/>
        </g>
        <g id="Frets">
          <line id="Fret 5" x1="3" y1="680.5" x2="323" y2="680.5" stroke="black" stroke-width="3"/>
          <line id="Fret 4" x1="3" y1="560.5" x2="323" y2="560.5" stroke="black" stroke-width="3"/>
          <line id="Fret 3" x1="3" y1="440.5" x2="323" y2="440.5" stroke="black" stroke-width="3"/>
          <line id="Fret 2" x1="3" y1="300.5" x2="323" y2="300.5" stroke="black" stroke-width="3"/>
          <line id="Fret 1" x1="3" y1="160.5" x2="323" y2="160.5" stroke="black" stroke-width="3"/>
        </g>
      </g>`;
    
    // Add chord circles
    svg += `<g id="chord-circles">`;
    const stringPositions = [13.5, 73.5, 133.5, 193.5, 253.5, 313.5];
    const fretYPositions = [0, 80.25, 230.5, 370.5, 500.5, 620.5];
    
    fretPositions.forEach((fret, index) => {
      if (fret !== null) {
        const x = stringPositions[index];
        const y = fretYPositions[fret];
        svg += `<circle cx="${x}" cy="${y}" r="24" fill="${circleColor}"/>`;
      }
    });
    
    svg += `</g></svg>`;
    return svg;
  }
}