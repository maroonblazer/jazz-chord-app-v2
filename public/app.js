const maxIterations = 10; // Maximum number of iterations for a session
let cpsAndTimes = []; // Array to store CPs and their solve times; we'll use these to create a table of results and send to the server to write out to the csv file.
let isSessionRunning = false;
let iterationCount = 0; // Variable to store the session count

// Get the button, text field, and elapsed time elements
const sessionButton = document.getElementById('sessionButton');
const startButton = document.getElementById('startButton');
// startButton.disabled = true; // disable the Start button
const textField = document.getElementById('textField');
const elapsedTime = document.getElementById('elapsedTime');

let timerId; // Variable to store the timer ID
let startTime; // Variable to store the start time
let chordsToForget = []; // Queue to store the last two strings

// select the div container that will hold the svg image
const fretboardContainer = document.getElementById('fretboardContainer');

function chooseRandomString(strings) {
  return strings[Math.floor(Math.random() * strings.length)];
}

// Function to concatenate two strings returned from chooseRandomString. If 'SS1' is chosen, then 'R/5' should not be chosen. If 'SS2' is chosen, then 'R/1' should not be chosen.
function selectStringAndRootWithKey() {
  const stringSet = ['SS1', 'SS2'];
  const roots = ['R/1', 'R/2', 'R/3', 'R/4', 'R/5'];
  // prettier-ignore
  const musicalKeys = ['C','D','E','F','G','A','B','Db','Eb','Gb','Ab','Bb','C#','D#','F#','G#','A#'];
  const chosenKey = chooseRandomString(musicalKeys);
  let chosenString, chosenRoot;
  do {
    chosenString = chooseRandomString(stringSet);
    chosenRoot = chooseRandomString(roots);

    if (chosenString === 'SS1' && chosenRoot === 'R/5') {
      chosenRoot = 'R/4';
    } else if (chosenString === 'SS2' && chosenRoot === 'R/1') {
      chosenRoot = 'R/2';
    }
  } while (chordsToForget.includes(chosenString + ' ' + chosenRoot));

  // Update the queue of the last two strings
  if (chordsToForget.length >= 5) {
    chordsToForget.shift();
  }
  chordsToForget.push(chosenString + ' ' + chosenRoot);

  // Randomly choose between Major and Minor
  const majorOrMinor = Math.random() < 0.5 ? 'Major' : 'Minor';
  // const majorOrMinor = 'Major';

  return {
    cp: chosenString + ' ' + chosenRoot,
    key: chosenKey,
    type: majorOrMinor,
  };
}

// Function to start the timer
function startTimer() {
  startTime = new Date().getTime();
  timerId = setInterval(updateElapsedTime, 100);
}

// Function to update the elapsed time
function updateElapsedTime() {
  const currentTime = new Date().getTime();
  const elapsedTimeInMilliseconds = currentTime - startTime;
  const elapsedTimeInSeconds = (elapsedTimeInMilliseconds / 1000).toFixed(1);
  elapsedTime.textContent = `Elapsed Time: ${elapsedTimeInSeconds} seconds`;
}

// Function to stop the timer
function stopTimer() {
  clearInterval(timerId);
}

function handleSpacebarEvent(event) {
  if (event.keyCode === 32) {
    // Check if the pressed key is the spacebar5
    handleStartButtonClick();
  }
}

// Function to handle the Start button click event
function handleStartButtonClick() {
  if (startButton.textContent === 'Start' && iterationCount < maxIterations) {
    // clear the results container
    document.getElementById('resultsContainer').innerHTML = '';
    // clear the fretboard svg container
    fretboardContainer.innerHTML = '';

    const cpData = selectStringAndRootWithKey();

    textField.style.display = 'block';
    elapsedTime.style.display = 'block';
    textField.value = cpData.cp + '  ' + cpData.key + '  ' + cpData.type;

    startButton.textContent = 'Stop';
    startTimer();
    startButton.dataset.cp = cpData.cp;
    startButton.dataset.key = cpData.key; // Store the CP and its key in the dataset
    startButton.dataset.quality = cpData.type;
    iterationCount++;
    console.log('Iteration count:', iterationCount);
  } else if (
    startButton.textContent === 'Stop' &&
    iterationCount <= maxIterations
  ) {
    if (iterationCount === maxIterations) {
      startButton.textContent = 'See Results';
    } else {
      startButton.textContent = 'Start';
    }
    stopTimer();
    const currentTime = new Date().getTime();
    const elapsedTimeInMilliseconds = currentTime - startTime;
    const elapsedTimeInSeconds = (elapsedTimeInMilliseconds / 1000).toFixed(1);
    const cp = startButton.dataset.cp;
    const key = startButton.dataset.key;
    const quality = startButton.dataset.quality;

    // Store the CP, its solve time, and the current date and time in the array
    cpsAndTimes.push({
      cp: cp,
      key: key,
      time: elapsedTimeInSeconds,
      quality: quality,
      date: new Date().toISOString(), // This will store the current date and time
    });

    // Determine which cp and quality was chosen and display the appropriate svg
    let cpAndQuality = cp + '-' + quality;
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

    fretboardContainer.innerHTML = `
      <svg class="${svgClass}" width="60" height="150">
        <use xlink:href='#${svgClass}'></use>
      </svg>
      <svg class="${otherSvgClass}" width="60" height="150">
        <use xlink:href='#${otherSvgClass}'></use>
      </svg>
    `;
    fretboardContainer.style.display = 'flex';

    // add a short delay before allowing the next iteration to start
    startButton.disabled = true;
    setTimeout(() => {
      startButton.disabled = false;
    }, 50);
  } else {
    console.log('Max iterations reached!', iterationCount);
    startButton.textContent = 'See Results';
    endSessionAndDisplayAndStoreResultsOnServer();
    cpsAndTimes = []; // Reset the array so that the results don't get appended to the previous session's results
    document.addEventListener('keydown', handleSpacebarEvent);
  }
}

function endSessionAndDisplayAndStoreResultsOnServer() {
  console.log('Iteration count:', iterationCount);
  // Set the text field and elapsed time to empty strings
  document.removeEventListener('keydown', handleSpacebarEvent); //why is this here? To prevent the user from starting a new session by pressing the spacebar before we display and store the results.

  textField.value = '';
  elapsedTime.textContent = '';

  // hide the text field and elapsed time elements
  textField.style.display = 'none';
  elapsedTime.style.display = 'none';

  // hide the fretboard svg container
  fretboardContainer.innerHTML = '';

  isSessionRunning = false;
  iterationCount = 0; // Reset the session count

  // Create and display a table of CPs and their solve times
  let resultsHTML =
    '<table class="myTable"><tr><th>CP</th><th>Key</th><th>Quality</th><th>Time (seconds)</th><th>Date</th></tr>';
  cpsAndTimes.forEach(item => {
    let rowColor = item.quality.includes('Minor')
      ? ' style="background-color: #efeded;"'
      : '';
    resultsHTML += `<tr${rowColor}><td>${item.cp}</td><td>${item.key}</td><td>${item.quality}</td><td>${item.time}</td><td>${item.date}</td></tr>`;
  });
  resultsHTML += '</table>';
  console.log(resultsHTML);
  document.getElementById('resultsContainer').innerHTML = resultsHTML;

  document.getElementById(
    'assistant-response-text'
  ).innerHTML = `Generating feedback from the assistant...`;

  // Code to send the session data to the server goes here
  console.log('Making fetch request...');
  fetch('http://localhost:3000/append-session-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: cpsAndTimes }),
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
      console.log(`logging the result promise-${data.message}`); // Access the message property of the data
    })
    .then(() => {
      // This fetch call will be executed after the first one completes
      return fetch('http://localhost:3000/get-assistant-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    })
    .then(response => response.json())
    .then(data => {
      // Create a new paragraph element
      const p = document.createElement('p');

      // Set the text of the paragraph to the answer
      p.textContent = data.answer;

      // Append the paragraph to the body of the document
      document.getElementById('assistant-response-text').innerHTML =
        p.textContent;
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
  let csvContent = 'cp,key,time,quality,date\n'; // Add 'date' to the header

  array.forEach(item => {
    csvContent += `${item.cp},${item.key},${item.time},${item.quality},${item.date}\n`; // Add item.date to each row
  });

  return csvContent;
}

// Attach the handleButtonClick function to the button click event
startButton.addEventListener('click', handleStartButtonClick);
document.addEventListener('keydown', handleSpacebarEvent);
