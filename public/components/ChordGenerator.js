import { musicalKeys, chordTypes, chordShapes, validRootsByStringSet } from '../data/chordData.js';

export class ChordGenerator {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.musicalKeys = musicalKeys;
    this.chordTypes = chordTypes;
    this.chordShapes = chordShapes;
  }

  chooseRandomFromArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
      console.error("Invalid input to chooseRandomFromArray:", array);
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  getValidRoots(stringSet) {
    return validRootsByStringSet[stringSet] || validRootsByStringSet["1"];
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