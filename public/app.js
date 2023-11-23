const maxIterations = 10; // Maximum number of iterations for a session
    let cpsAndTimes = []; // Array to store CPs and their solve times
    let isSessionRunning = false;
    let sessionCount = 0; // Variable to store the session count

    // Get the button, text field, and elapsed time elements
    const sessionButton = document.getElementById('sessionButton');
    const startButton = document.getElementById('startButton');
    startButton.disabled = true; // disable the Start button
    const textField = document.getElementById('textField');
    const elapsedTime = document.getElementById('elapsedTime');

    let timerId; // Variable to store the timer ID
    let startTime; // Variable to store the start time
    let chordsToForget = []; // Queue to store the last two strings

    // Function to choose a string at random from an array
    function chooseRandomString(strings) {
      return strings[Math.floor(Math.random() * strings.length)];
    }

    // Function to concatenate two strings returned from chooseRandomString. If 'SS1' is chosen, then 'R/5' should not be chosen. If 'SS2' is chosen, then 'R/1' should not be chosen.
    function selectStringAndRootWithKey() {
      const stringSet = ['SS1', 'SS2'];
      const roots = ['R/1', 'R/2', 'R/3', 'R/4', 'R/5'];
      const musicalKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C#', 'D#', 'F#', 'G#', 'A#'];
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

      return {
        cp: chosenString + ' ' + chosenRoot,
        key: chosenKey
      }
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
       if (event.keyCode === 32) { // Check if the pressed key is the spacebar5
        handleStartButtonClick();
  }
}

    // Function to handle the session button click event
    function handleSessionButtonClick() {
      if (sessionButton.textContent === 'Begin Session') {
        // clear the results container
        document.getElementById('resultsContainer').innerHTML = '';
        // Reset the elapsed time and CP display
        elapsedTime.textContent = '';
        textField.value = '';
        cpsAndTimes = []; // Reset the array
        sessionButton.textContent = 'End';
        // Code to start a session goes here
        console.log('Session started!');
        isSessionRunning = true;
        startButton.disabled = false; // enable the Start button
        document.addEventListener('keydown', handleSpacebarEvent);
      } else if (sessionButton.textContent === 'End') {
        sessionButton.textContent = 'Begin Session';
        // Code to end a session goes here
        console.log('Session ended!');
        startButton.disabled = true; // disable the Start button
        isSessionRunning = false;
        sessionCount = 0; // Reset the session count
        document.removeEventListener('keydown', handleSpacebarEvent);
        // Create and display a table of CPs and their solve times
        let resultsHTML = '<table><tr><th>CP</th><th>Key</th><th>Time (seconds)</th></tr>';
          cpsAndTimes.forEach(item => {
            resultsHTML += `<tr><td>${item.cp}</td><td>${item.key}</td><td>${item.time}</td></tr>`;
          });
          resultsHTML += '</table>';
          document.getElementById('resultsContainer').innerHTML = resultsHTML;

          // // Code to send the session data to the server goes here
          fetch('http://localhost:3000/append-session-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: cpsAndTimes })
          })
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.log('Error', error));
        }
        sessionButton.blur(); // Remove focus from the button
        
          // REMOVE: Convert session data to CSV and create a download link 
          // const csvContent = convertArrayToCSV(cpsAndTimes);
          // console.log(csvContent);

          // // Rewrite the below code to use a Blob instead of a data URI 
          // const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });    

          // // Create a link for downloading the CSV file
          // // Get current date and time
          // let now = new Date();

          // // Format date and time as 'YYYY-MM-DD_HH-MM'
          // let dateTime = now.getFullYear() + '-' +
          //   ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
          //   ('0' + now.getDate()).slice(-2) + '_' +
          //   ('0' + now.getHours()).slice(-2) + '-' +
          //   ('0' + now.getMinutes()).slice(-2);

          // // Create a link for downloading the CSV file
          // let link = document.createElement('a');
          // link.href = URL.createObjectURL(blob);
          // link.setAttribute('download', 'zig-zag-log_' + dateTime + '.csv');
          // document.body.appendChild(link);
          // link.click();
          // document.body.removeChild(link);
    }

    // Function to handle the button click event
    function handleStartButtonClick() {
      if (startButton.textContent === 'Start') {
         const cpData = selectStringAndRootWithKey();
        startButton.textContent = 'Stop';
        textField.value = cpData.cp + "  " + cpData.key;
        startTimer();
        startButton.dataset.cp = cpData.cp;
        startButton.dataset.key = cpData.key; // Store the CP and its key in the dataset
      
      } else if (startButton.textContent === 'Stop') {
        startButton.textContent = 'Start';
        stopTimer();
        const currentTime = new Date().getTime();
        const elapsedTimeInMilliseconds = currentTime - startTime;
      const elapsedTimeInSeconds = (elapsedTimeInMilliseconds / 1000).toFixed(1);
      const cp = startButton.dataset.cp;
      const key = startButton.dataset.key;  
      
      // Store the CP and its solve time in the array
        cpsAndTimes.push({
          cp: cp,
          key: key,
          time: elapsedTimeInSeconds
        });
        sessionCount++;
      if (sessionCount >= maxIterations) {
        handleSessionButtonClick();
      }
      // add a short delay before allowing the next iteration to start
      startButton.disabled = true;
      setTimeout(() => {
        startButton.disabled = false;
      }, 50);
      }
    }

    // Function to convert data to CSV format
    function convertArrayToCSV(array) {
      let csvContent = "CP, Key, Time (seconds)\r\n";
      array.forEach(function(rowArray) {
        let row = rowArray.cp + "," + rowArray.key + "," + rowArray.time;
        csvContent += row + "\r\n";
      });
      return csvContent;
    }

// Attach the handleSessionButtonClick function to the button click event
sessionButton.addEventListener('click', handleSessionButtonClick);

    // Attach the handleButtonClick function to the button click event
    startButton.addEventListener('click', handleStartButtonClick);
