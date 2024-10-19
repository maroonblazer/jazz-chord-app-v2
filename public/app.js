export const maxIterations = 4; // Maximum number of iterations for a session

const SessionState = {
  STOPPED: "STOPPED",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  LAST: "LAST",
  END: "END",
};

let currentState = SessionState.STOPPED;

let cpsAndTimes = []; // Array to store CPs and their solve times; we'll use these to create a table of results and send to the server to write out to the csv file.
let isSessionRunning = false;
let iterationCount = 0; // Variable to store the session count

// Get the button, text field, and elapsed time elements
const startButton = document.getElementById("start-stop-button");
const startStopButtonLabel = document.getElementById("start-stop-button-label");
const stringSetTextField = document.getElementById("stringSetTextField");
const rootTextField = document.getElementById("rootTextField");
const keyTextField = document.getElementById("keyTextField");
const typeTextField = document.getElementById("typeTextField"); // Add this line
// const elapsedTime = document.getElementById("elapsedTime");
// const inputContainer = document.getElementById('input-container');
// inputContainer.style.display = 'none';

let timerId; // Variable to store the timer ID
let startTime; // Variable to store the start time
let chordsToForget = []; // Queue to store the last two strings

// select the div container that will hold the svg image
const fretboardContainer = document.getElementById("fretboard-container");

function newChord(fretPositions, options = {}) {
  // Default values
  const { width = 339, height = 806, circleColor = "black" } = options;

  // Ensure fretPositions is always an array
  if (!Array.isArray(fretPositions)) {
    throw new Error("fretPositions must be an array");
  }

  console.log("Input fretPositions:", fretPositions);

  // Generate SVG string
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;

  // Add fretboard base group
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

  // Add circles for pressed frets
  svg += `<g id="chord-circles">`;
  const stringPositions = [13.5, 73.5, 133.5, 193.5, 253.5, 313.5]; // Low E to High E
  const fretYPositions = [0, 80.25, 230.5, 370.5, 500.5, 620.5]; // 0 is open string

  fretPositions.forEach((fret, index) => {
    if (fret !== null) {
      const x = stringPositions[index];
      const y = fretYPositions[fret];
      console.log(
        `Adding circle: string ${index + 1}, fret ${fret}, x: ${x}, y: ${y}`
      );
      svg += `<circle cx="${x}" cy="${y}" r="24" fill="${circleColor}"/>`;
    }
  });
  svg += `</g>`;

  // Close SVG tag
  svg += "</svg>";

  return svg;
}

function getFretPositions(stringSet, root, type) {
  // Define chord shapes
  const chordShapes = {
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
        maj7: [null, 3,3,1,2, null],
        min7: [null, 3, 3, 2, 3, null],
        dom7: [null, 3, 4, 2, 3, null],
        min7b5: [null, 3, 3, 1, 3, null],
        "alt dom": [null, 3,4,3,4, null],
        maj9: [null, 4,4,4,5, null],
        min9: [null, 2,2,1,4, null],
        dom13: [null, 3,4,4,5, null],
      },
      "R/3": {
        maj7: [null, 3,5,1,4, null],
        min7: [null, 2,4,1,4, null],
        dom7: [null, 3,4,1,4, null],
        min7b5: [null, 2,4,1,3, null],
        "alt dom": [null, 3,4,2,5, null],
        maj9: [null, 2,2,2,3, null],
        min9: [null, 2,4,3,2, null],
        dom13: [null, 3,4,3,4, null],
      },
      "R/4": {
        maj7: [null, 2,2,1,4, null],
        min7: [null, 3,3,1,4, null],
        dom7: [null, 3,3,2,4, null],
        min7b5: [null, 2,3,1,4, null],
        "alt dom": [null, 4,4,2,4, null],
        maj9: [null, 2,4,1,4, null],
        min9: [null, 3,5,1,4, null],
        dom13: [null, 3,5,2,4, null],
      },
      "R/5": {
        maj7: [null, 3,5,4,5, null],
        min7: [null, 3,5,3,4, null],
        dom7: [null, 3,5,3,5, null],
        min7b5: [null, 3,4,3,4, null],
        "alt dom": [null, 3,5,2,4, null],
        maj9: [null, 3,5,4,5, null],
        min9: [null, 3,3,3,4, null],
        dom13: [null, 1,5,1,3, null],
      },
    },
  };

  // Lookup the chord shape
  const shape = chordShapes[`SS${stringSet}`]?.[`R/${root}`]?.[type];

  if (!shape) {
    console.error(`No shape found for SS${stringSet} R/${root} ${type}`);
    return [null, null, null, null, null, null]; // Return a default shape if not found
  }

  return shape;
}

function testChordShape(stringSet, root, type) {
  const fretPositions = getFretPositions(stringSet, root, type);
  const svgString = newChord(fretPositions);

  // Clear previous content and display the new chord
  fretboardContainer.innerHTML = svgString;
  fretboardContainer.style.visibility = "visible";

  console.log(`Displaying chord: SS${stringSet} R/${root} ${type}`);
  console.log("Fret positions:", fretPositions);
}

// Make testChordShape available globally for console testing
window.testChordShape = testChordShape;

function cycleChordShapes(stringSet, root) {
  const chordTypes = [
    "maj7",
    "min7",
    "dom7",
    "min7b5",
    "alt dom",
    "maj9",
    "min9",
    "dom13"
  ];

  let index = 0;

  function displayNextChord() {
    if (index < chordTypes.length) {
      const chordType = chordTypes[index];
      console.log(`Displaying: SS${stringSet} R/${root} ${chordType}`);
      testChordShape(stringSet, root, chordType);
      index++;
      setTimeout(displayNextChord, 3000); // Wait for 3 seconds before showing the next chord
    } else {
      console.log("Finished cycling through all chord types.");
    }
  }

  displayNextChord();
}

// Make cycleChordShapes available globally for console testing
window.cycleChordShapes = cycleChordShapes;

function chooseRandomString(strings) {
  if (!Array.isArray(strings) || strings.length === 0) {
    console.error("Invalid input to chooseRandomString:", strings);
    return null;
  }
  return strings[Math.floor(Math.random() * strings.length)];
}

// Add this to your global variables
const chordTypes = [
  "maj7",
  "min7",
  "dom7",
  "min7b5",
  "alt dom",
  "maj9",
  "min9",
  "dom13",
];

// Function to concatenate two strings returned from chooseRandomString. If 'SS1' is chosen, then 'R/5' should not be chosen. If 'SS2' is chosen, then 'R/1' should not be chosen.
function selectStringAndRootWithKey() {
  console.log("Selecting string and root with key");
  const stringSet = ["1", "2"];
  const roots = ["1", "2", "3", "4", "5"];
  const musicalKeys = [
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
    "Db",
    "Eb",
    "Gb",
    "Ab",
    "Bb",
    "C#",
    "D#",
    "F#",
    "G#",
    "A#",
  ];

  const chosenKey = chooseRandomString(musicalKeys);
  const chosenType = chooseRandomString(chordTypes);
  const chosenString = chooseRandomString(stringSet);

  console.log("Chosen key:", chosenKey);
  console.log("Chosen type:", chosenType);
  console.log("Chosen string:", chosenString);

  let chosenRoot;
  let attempts = 0;
  do {
    chosenRoot = chooseRandomString(roots);
    attempts++;
    console.log(`Attempt ${attempts}: Trying root ${chosenRoot}`);

    // Adjust chosenRoot if it's an invalid combination
    if (chosenString === "1" && chosenRoot === "5") {
      chosenRoot = "2";
      console.log("Adjusted root to 2 for string set 1");
    } else if (chosenString === "2" && chosenRoot === "1") {
      chosenRoot = "2";
      console.log("Adjusted root to 2 for string set 2");
    }

    console.log(
      `Checking if ${chosenString} ${chosenRoot} is in chordsToForget:`,
      chordsToForget
    );

    if (attempts > 100) {
      console.error("Unable to find valid root after 100 attempts");
      break;
    }
  } while (chordsToForget.includes(`${chosenString} ${chosenRoot}`));

  console.log("Final chosen root:", chosenRoot);
  console.log("Attempts made:", attempts);

  // Update the queue of the last five strings
  if (chordsToForget.length >= 5) {
    chordsToForget.shift();
  }
  chordsToForget.push(`${chosenString} ${chosenRoot}`);

  console.log("Updated chordsToForget:", chordsToForget);

  return {
    stringSet: chosenString,
    root: chosenRoot,
    key: chosenKey,
    type: chosenType,
  };
}

function startTimer() {
  startTime = new Date().getTime();
  timerId = setInterval(updateElapsedTime, 100);
}

function updateElapsedTime() {
  const currentTime = new Date().getTime();
  const elapsedTimeInMilliseconds = currentTime - startTime;
  const elapsedTimeInSeconds = (elapsedTimeInMilliseconds / 1000).toFixed(1);
  // elapsedTime.textContent = `Elapsed Time: ${elapsedTimeInSeconds} seconds`;
}

function stopTimer() {
  clearInterval(timerId);
}

function handleSpacebarEvent(event) {
  if (event.keyCode === 32) {
    // Check if the pressed key is the spacebar5
    handleStartButtonClick();
  }
}

let sessionData = {
  stringSet: "",
  root: "",
  key: "",
  type: "",
};

function updateSessionData(stringSet, root, key, type) {
  sessionData.stringSet = stringSet;
  sessionData.root = root;
  sessionData.key = key;
  sessionData.type = type;
}

function clearSessionData() {
  sessionData = { cp: "", key: "", type: "" };
}

function resetSession() {
  iterationCount = 0;
  cpsAndTimes = [];
  currentState = SessionState.STOPPED;
  clearSessionData();

  // Clear all display fields
  stringSetTextField.textContent = "--";
  rootTextField.textContent = "--";
  keyTextField.textContent = "--";
  typeTextField.textContent = "--"; // Use the global reference here
  // elapsedTime.textContent = "";

  console.log("Session reset - Iteration count:", iterationCount);
  console.log("Session reset - Current state:", currentState);
}

function handleStartButtonClick() {
  console.log("Current state:", currentState);
  console.log("Iteration count:", iterationCount);

  if (currentState === SessionState.STOPPED) {
    resetSession();
  }

  switch (currentState) {
    case SessionState.STOPPED:
    case SessionState.PAUSED:
      console.log("Starting iteration");
      startIteration();
      break;
    case SessionState.RUNNING:
      console.log("Stopping iteration and displaying solution");
      stopIteratingAndDisplaySolution();
      break;
    case SessionState.LAST:
      console.log("Ending session and displaying results");
      stopIteratingAndDisplayResults();
      break;
    default:
      console.log("Unexpected state:", currentState);
  }

  console.log("After switch - Current state:", currentState);
  console.log("After switch - Iteration count:", iterationCount);
}

function stopIteratingAndDisplayResults() {
  endSessionAndDisplayAndStoreResultsOnServer();
  cpsAndTimes = []; // Reset the array so that the results don't get appended to the previous session's results
  document.addEventListener("keydown", handleSpacebarEvent);
  currentState = SessionState.STOPPED;
  console.log(currentState);
}

function stopIteratingAndDisplaySolution() {
  console.log("Stopping iteration and displaying solution");
  stopTimer();
  const currentTime = new Date().getTime();
  const elapsedTimeInMilliseconds = currentTime - startTime;
  const elapsedTimeInSeconds = (elapsedTimeInMilliseconds / 1000).toFixed(1);
  const stringSet = sessionData.stringSet;
  const root = sessionData.root;
  const key = sessionData.key;
  const type = sessionData.type;

  // Store the CP, its solve time, and the current date and time in the array
  cpsAndTimes.push({
    stringSet: stringSet,
    root: root,
    key: key,
    time: elapsedTimeInSeconds,
    quality: type,
    date: new Date().toISOString(),
  });

  // Determine which cp and type was chosen and display the appropriate svg
  let fretPositions = getFretPositions(stringSet, root, type);
  let svgString = newChord(fretPositions);

  fretboardContainer.innerHTML = svgString;
  fretboardContainer.style.visibility = "visible";

  console.log("Before state update - Iteration count:", iterationCount);
  console.log("Before state update - Current state:", currentState);

  if (iterationCount >= maxIterations) {
    console.log("Maximum iterations reached. Transitioning to LAST state.");
    startStopButtonLabel.textContent = "See Results";
    currentState = SessionState.LAST;
  } else {
    startStopButtonLabel.textContent = "Start";
    currentState = SessionState.PAUSED;
  }
  console.log(currentState);
}

function startIteration() {
  console.log("Starting iteration - Current count:", iterationCount);

  if (iterationCount >= maxIterations) {
    console.log("Maximum iterations reached. Ending session.");
    stopIteratingAndDisplayResults();
    return;
  }

  console.log("Clearing previous iteration data");
  // document.getElementById("resultsContainer").innerHTML = "";
  fretboardContainer.innerHTML = "";
  // document.getElementById("assistant-response-text").innerHTML = "";

  console.log("Selecting new chord data");
  const cpData = selectStringAndRootWithKey();
  console.log("Selected chord data:", cpData);

  console.log("Updating UI with new chord data");
  stringSetTextField.textContent = cpData.stringSet;
  rootTextField.textContent = cpData.root;
  keyTextField.textContent = cpData.key;
  document.getElementById("typeTextField").textContent = cpData.type;
  startStopButtonLabel.textContent = "Stop";

  console.log("Starting timer");
  startTimer();

  console.log("Updating session data");
  updateSessionData(cpData.stringSet, cpData.root, cpData.key, cpData.type);

  iterationCount++;
  currentState = SessionState.RUNNING;

  console.log("After starting iteration - Iteration count:", iterationCount);
  console.log("After starting iteration - Current state:", currentState);
}

function endSessionAndDisplayAndStoreResultsOnServer() {
  console.log("Iteration count:", iterationCount);
  // Set the text field and elapsed time to empty strings
  document.removeEventListener("keydown", handleSpacebarEvent); //why is this here? To prevent the user from starting a new session by pressing the spacebar before we display and store the results.

  stringSetTextField.textContent = "--";
  rootTextField.textContent = "--";
  keyTextField.textContent = "--";
  typeTextField.textContent = "--"; // Use the global reference here
  // elapsedTime.textContent = "";

  // hide the fretboard svg container
  fretboardContainer.innerHTML = "";

  isSessionRunning = false;
  iterationCount = 0; // Reset the session count

  // Create and display a table of CPs and their solve times
  let resultsHTML =
    '<table class="myTable"><tr><th>SS</th><th>Root</th><th>Key</th><th>Quality</th><th>Time (seconds)</th><th>Date</th></tr>';
  cpsAndTimes.forEach((item) => {
    let rowColor = item.quality.includes("min7")
      ? ' style="background-color: #efeded;"'
      : "";
    resultsHTML += `<tr${rowColor}><td>${item.stringSet}</td><td>${item.root}</td><td>${item.key}</td><td>${item.quality}</td><td>${item.time}</td><td>${item.date}</td></tr>`;
  });
  resultsHTML += "</table>";
  // document.getElementById('resultsContainer').innerHTML = resultsHTML
  console.table(cpsAndTimes);

  // document.getElementById(
  //   "assistant-response-text"
  // ).innerHTML = `Generating feedback from the assistant...`;

  const feedbackMessage = document.createElement("p");
  feedbackMessage.textContent = "Generating feedback from the assistant...";
  const container = document.getElementById("fretboard-container");
  container.innerHTML = ""; // Clear previous content
  container.appendChild(feedbackMessage);

  // Code to send the session data to the server goes here
  // console.log('Making fetch request...');
  fetch("/append-session-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: cpsAndTimes }),
  })
    .then((response) => {
      // console.log('Received response:', response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // console.log('Response is OK, parsing as JSON...');
      return response.json(); // Parse the response as JSON
    })
    .then((data) => {
      // console.log('Received data:', data);
      console
        .log
        // `logging the result promise from append-session-data-${data.message}`
        (); // Access the message property of the data
    })
    .then(() => {
      // This fetch call will be executed after the first one completes
      return fetch("/get-assistant-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    })
    .then((response) => response.json())
    .then((data) => {
      // Create a new paragraph element
      const p = document.createElement("p");

      // Add an id to the paragraph element
      p.id = "assistant-response";

      // Set the inner HTML of the paragraph to the answer, replacing \n\n with <br>
      p.innerHTML = data.answer.replace(/\n\n/g, "<br>");

      // Change the start button text to 'Start'
      startStopButtonLabel.textContent = "Start";

      // Append the paragraph to the body of the document
      const responseContainer = document.getElementById(
        "fretboard-container"
      );
      responseContainer.innerHTML = ""; // Clear previous content
      responseContainer.appendChild(p);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
// Regarding the above: The fetch call is not sending any data in the body of the request. If the server-side route handler is expecting to receive data in the request body, you would need to add a body property to the fetch call, like so:
//   fetch('http://localhost:3000/get-assistant-feedback', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({ /* your data here */ }),
// })

// We could use this to send a question to the server and get a response from the assistant. E.g., let the user type in a question and then send it to the server to get a response from the assistant.

// Function to convert data to CSV format
function convertArrayToCSV(array) {
  let csvContent = "ss,root,,key,time,type,date\n"; // Add 'date' to the header

  array.forEach((item) => {
    csvContent += `${item.stringSet},${item.root},${item.key},${item.time},${item.type},${item.date}\n`; // Add item.date to each row
  });

  return csvContent;
}

function handleSendButtonClick() {
  // Get the message from the input field
  const message = messageInput.value;

  // send the message to the server
  fetch("/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message }),
  })
    .then((response) => {
      console.log("Received response:", response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log("Response is OK, parsing as JSON...");
      return response.json(); // Parse the response as JSON
    })
    .then((data) => {
      console.log("Received data:", data);
      console.log(
        `logging the result promise from send-message-${data.answer}`
      ); // Access the message property of the data
      // Create a new paragraph element
      const p = document.createElement("p");

      // Set the text of the paragraph to the answer
      p.textContent = data.answer;

      // Append the paragraph to the body of the document
      document.getElementById("fretboard-container").innerHTML =
        p.textContent;
      // Clear the input field
      messageInput.value = "";
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  // Clear the input field
  messageInput.value = "";
}

// Attach the handleButtonClick function to the button click event
startButton.addEventListener("click", handleStartButtonClick);

// Add keydown event listener to the document
document.addEventListener("keydown", handleSpacebarEvent);

// Update the sendDataToServer function
function sendDataToServer() {
  const data = {
    stringSet: sessionData.stringSet,
    root: sessionData.root,
    key: sessionData.key,
    quality: sessionData.type, // Changed from 'type' to 'quality'
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
  };
}

