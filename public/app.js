export const maxIterations = 10; // Maximum number of iterations for a session

const SessionState = {
  STOPPED: 'STOPPED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  LAST: 'LAST',
  END: 'END',
};

let currentState = SessionState.STOPPED;

let cpsAndTimes = []; // Array to store CPs and their solve times; we'll use these to create a table of results and send to the server to write out to the csv file.
let isSessionRunning = false;
let iterationCount = 0; // Variable to store the session count

// Get the button, text field, and elapsed time elements
const startButton = document.getElementById('start-stop-button');
const startStopButtonLabel = document.getElementById('start-stop-button-label');
const stringSetTextField = document.getElementById('stringSetTextField');
const rootTextField = document.getElementById('rootTextField');
const keyTextField = document.getElementById('keyTextField');
const elapsedTime = document.getElementById('elapsedTime');
// const inputContainer = document.getElementById('input-container');
// inputContainer.style.display = 'none';

let timerId; // Variable to store the timer ID
let startTime; // Variable to store the start time
let chordsToForget = []; // Queue to store the last two strings

// select the div container that will hold the svg image
const fretboardContainer = document.getElementById('fretboard-container');

function chooseRandomString(strings) {
  return strings[Math.floor(Math.random() * strings.length)];
}

// Function to concatenate two strings returned from chooseRandomString. If 'SS1' is chosen, then 'R/5' should not be chosen. If 'SS2' is chosen, then 'R/1' should not be chosen.
function selectStringAndRootWithKey() {
  const stringSet = ['1', '2'];
  const roots = ['1', '2', '3', '4', '5'];
  // prettier-ignore
  const musicalKeys = ['C','D','E','F','G','A','B','Db','Eb','Gb','Ab','Bb','C#','D#','F#','G#','A#'];
  const chosenKey = chooseRandomString(musicalKeys);
  let chosenString, chosenRoot;
  do {
    chosenString = chooseRandomString(stringSet);
    chosenRoot = chooseRandomString(roots);

    if (chosenString === '1' && chosenRoot === '5') {
      chosenRoot = '4';
    } else if (chosenString === '2' && chosenRoot === '1') {
      chosenRoot = '2';
    }
  } while (chordsToForget.includes(chosenString + ' ' + chosenRoot));

  // Update the queue of the last two strings
  if (chordsToForget.length >= 5) {
    chordsToForget.shift();
  }
  chordsToForget.push(chosenString + ' ' + chosenRoot);

  // Randomly choose between Major and Minor
  const majorOrMinor = Math.random() < 0.5 ? 'Major' : 'Minor';

  return {
    stringSet: chosenString,
    root: chosenRoot,
    key: chosenKey,
    type: majorOrMinor,
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
  elapsedTime.textContent = `Elapsed Time: ${elapsedTimeInSeconds} seconds`;
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
  stringSet: '',
  root: '',
  key: '',
  quality: '',
};

function updateSessionData(stringSet, root, key, quality) {
  sessionData.stringSet = stringSet;
  sessionData.root = root;
  sessionData.key = key;
  sessionData.quality = quality;
}

function clearSessionData() {
  sessionData = { cp: '', key: '', quality: '' };
}

function handleStartButtonClick() {
  switch (currentState) {
    case SessionState.STOPPED:
    case SessionState.PAUSED:
      startIteration();
      break;
    case SessionState.RUNNING:
      stopIteratingAndDisplaySolution();
      break;
    case SessionState.LAST:
      stopIteratingAndDisplayResults();
  }
}

function stopIteratingAndDisplayResults() {
  endSessionAndDisplayAndStoreResultsOnServer();
  cpsAndTimes = []; // Reset the array so that the results don't get appended to the previous session's results
  document.addEventListener('keydown', handleSpacebarEvent);
  currentState = SessionState.STOPPED;
  console.log(currentState);
}

function stopIteratingAndDisplaySolution() {
  stopTimer();
  const currentTime = new Date().getTime();
  const elapsedTimeInMilliseconds = currentTime - startTime;
  const elapsedTimeInSeconds = (elapsedTimeInMilliseconds / 1000).toFixed(1);
  const stringSet = sessionData.stringSet;
  const root = sessionData.root;
  const key = sessionData.key;
  const quality = sessionData.quality;

  // Store the CP, its solve time, and the current date and time in the array
  cpsAndTimes.push({
    stringSet: stringSet,
    root: root,
    key: key,
    time: elapsedTimeInSeconds,
    quality: quality,
    date: new Date().toISOString(), // This will store the current date and time
  });

  // Determine which cp and quality was chosen and display the appropriate svg
  let { svgClass, otherSvgClass } = getChordSVGs(stringSet, root, quality);

  fretboardContainer.innerHTML = `
      <svg class="${svgClass}" width="60" height="150">
        <use xlink:href='#${svgClass}'></use>
      </svg>
      <svg class="${otherSvgClass}" width="60" height="150">
        <use xlink:href='#${otherSvgClass}'></use>
      </svg>
    `;
  fretboardContainer.style.display = 'flex';
  if (iterationCount === maxIterations) {
    startStopButtonLabel.textContent = 'See Results';
    currentState = SessionState.LAST;
  } else {
    startStopButtonLabel.textContent = 'Start';
    currentState = SessionState.PAUSED;
  }
  console.log(currentState);
}

function getChordSVGs(ss, root, quality) {
  let cpAndQuality = `SS${ss} R/${root}-${quality}`;

  let svgClass = '';
  switch (cpAndQuality) {
    case 'SS1 R/1-Major':
      svgClass = 'ss1-r1-major';
      break;
    case 'SS1 R/1-Minor':
      svgClass = 'ss1-r1-minor';
      break;
    case 'SS1 R/2-Major':
      svgClass = 'ss1-r2-major';
      break;
    case 'SS1 R/2-Minor':
      svgClass = 'ss1-r2-minor';
      break;
    case 'SS1 R/3-Major':
      svgClass = 'ss1-r3-major';
      break;
    case 'SS1 R/3-Minor':
      svgClass = 'ss1-r3-minor';
      break;
    case 'SS1 R/4-Major':
      svgClass = 'ss1-r4-major';
      break;
    case 'SS1 R/4-Minor':
      svgClass = 'ss1-r4-minor';
      break;
    case 'SS2 R/2-Major':
      svgClass = 'ss2-r2-major';
      break;
    case 'SS2 R/2-Minor':
      svgClass = 'ss2-r2-minor';
      break;
    case 'SS2 R/3-Major':
      svgClass = 'ss2-r3-major';
      break;
    case 'SS2 R/3-Minor':
      svgClass = 'ss2-r3-minor';
      break;
    case 'SS2 R/4-Major':
      svgClass = 'ss2-r4-major';
      break;
    case 'SS2 R/4-Minor':
      svgClass = 'ss2-r4-minor';
      break;
    case 'SS2 R/5-Major':
      svgClass = 'ss2-r5-major';
      break;
    case 'SS2 R/5-Minor':
      svgClass = 'ss2-r5-minor';
      break;
  }

  let otherSvgClass;

  if (svgClass.endsWith('-major')) {
    otherSvgClass = svgClass.replace('-major', '-minor');
  } else if (svgClass.endsWith('-minor')) {
    otherSvgClass = svgClass.replace('-minor', '-major');
  }
  return { svgClass, otherSvgClass };
}

function startIteration() {
  document.getElementById('resultsContainer').innerHTML = '';
  fretboardContainer.innerHTML = '';
  document.getElementById('assistant-response-text').innerHTML = '';
  const cpData = selectStringAndRootWithKey();

  stringSetTextField.textContent = cpData.stringSet;
  rootTextField.textContent = cpData.root;
  keyTextField.textContent = cpData.key;
  // stringSetTextField.textContent =
  //   cpData.stringSet +
  //   '  ' +
  //   cpData.root +
  //   '  ' +
  //   cpData.key +
  //   '  ' +
  //   cpData.type;
  startStopButtonLabel.textContent = 'Stop';
  startTimer();
  updateSessionData(cpData.stringSet, cpData.root, cpData.key, cpData.type);
  iterationCount++;
  currentState = SessionState.RUNNING;
  console.log('Iteration count:', iterationCount, currentState);
}

function endSessionAndDisplayAndStoreResultsOnServer() {
  console.log('Iteration count:', iterationCount);
  // Set the text field and elapsed time to empty strings
  document.removeEventListener('keydown', handleSpacebarEvent); //why is this here? To prevent the user from starting a new session by pressing the spacebar before we display and store the results.

  stringSetTextField.textContent = '--';
  rootTextField.textContent = '--';
  keyTextField.textContent = '--';
  elapsedTime.textContent = '';

  // hide the fretboard svg container
  fretboardContainer.innerHTML = '';

  isSessionRunning = false;
  iterationCount = 0; // Reset the session count

  // Create and display a table of CPs and their solve times
  let resultsHTML =
    '<table class="myTable"><tr><th>SS</th><th>Root</th><th>Key</th><th>Quality</th><th>Time (seconds)</th><th>Date</th></tr>';
  cpsAndTimes.forEach(item => {
    let rowColor = item.quality.includes('Minor')
      ? ' style="background-color: #efeded;"'
      : '';
    resultsHTML += `<tr${rowColor}><td>${item.stringSet}</td><td>${item.root}</td><td>${item.key}</td><td>${item.quality}</td><td>${item.time}</td><td>${item.date}</td></tr>`;
  });
  resultsHTML += '</table>';
  // document.getElementById('resultsContainer').innerHTML = resultsHTML
  console.table(cpsAndTimes);

  document.getElementById(
    'assistant-response-text'
  ).innerHTML = `Generating feedback from the assistant...`;

  // Code to send the session data to the server goes here
  // console.log('Making fetch request...');
  fetch('/append-session-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: cpsAndTimes }),
  })
    .then(response => {
      // console.log('Received response:', response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // console.log('Response is OK, parsing as JSON...');
      return response.json(); // Parse the response as JSON
    })
    .then(data => {
      // console.log('Received data:', data);
      console
        .log
        // `logging the result promise from append-session-data-${data.message}`
        (); // Access the message property of the data
    })
    .then(() => {
      // This fetch call will be executed after the first one completes
      return fetch('/get-assistant-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    })
    .then(response => response.json())
    .then(data => {
      // THIS IS THE CONTENT OF OUR ANSWER FROM THE LLM. There are 2 objects: 'answer' and 'sources'.  We want just the answer.
      // START new code for this block:
      // Create a new paragraph element
      const p = document.createElement('p');

      // Set the inner HTML of the paragraph to the answer, replacing \n\n with <br>
      p.innerHTML = data.answer.replace(/\n\n/g, '<br>');

      // Change the start button text to 'Start'
      startStopButtonLabel.textContent = 'Start';

      // Append the paragraph to the body of the document
      const responseContainer = document.getElementById(
        'assistant-response-text'
      );
      responseContainer.innerHTML = ''; // Clear previous content
      responseContainer.appendChild(p);

      // Update the innerHTML of the response container with the paragraph's innerHTML
      document.getElementById('assistant-response-text').innerHTML =
        p.innerHTML;
      // END new code for this block:
    })
    .catch(error => {
      console.error('Error:', error);
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
  let csvContent = 'ss,root,,key,time,quality,date\n'; // Add 'date' to the header

  array.forEach(item => {
    csvContent += `${item.stringSet},${item.root},${item.key},${item.time},${item.quality},${item.date}\n`; // Add item.date to each row
  });

  return csvContent;
}

function handleSendButtonClick() {
  // Get the message from the input field
  const message = messageInput.value;

  // send the message to the server
  fetch('/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: message }),
  })
    .then(response => {
      console.log('Received response:', response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('Response is OK, parsing as JSON...');
      return response.json(); // Parse the response as JSON
    })
    .then(data => {
      console.log('Received data:', data);
      console.log(
        `logging the result promise from send-message-${data.answer}`
      ); // Access the message property of the data
      // Create a new paragraph element
      const p = document.createElement('p');

      // Set the text of the paragraph to the answer
      p.textContent = data.answer;

      // Append the paragraph to the body of the document
      document.getElementById('assistant-response-text').innerHTML =
        p.textContent;
      // Clear the input field
      messageInput.value = '';
    })
    .catch(error => {
      console.error('Error:', error);
    });

  // Clear the input field
  messageInput.value = '';
}

// Attach the handleButtonClick function to the button click event
startButton.addEventListener('click', handleStartButtonClick);

// Add keydown event listener to the document
document.addEventListener('keydown', handleSpacebarEvent);
