// START THE SERVER WITH `node server.js`
import path from 'path';
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import csvParser from 'csv-parser';

const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

const PORT = process.env.PORT || 3000;
const SESSION_DATA_FILE = process.env.SESSION_DATA_FILE
  ? path.resolve(process.env.SESSION_DATA_FILE)
  : path.join(process.cwd(), 'session-data.csv');
const SESSION_DATA_LAST_10_FILE = process.env.SESSION_DATA_LAST_10_FILE
  ? path.resolve(process.env.SESSION_DATA_LAST_10_FILE)
  : path.join(process.cwd(), 'session-data-last-10.csv');

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Write an endpoint to handle data from the client
app.post('/append-session-data', (req, res) => {
  const { data } = req.body; //Assuming data is an array of objects
  const csvData = data
    .map(
      obj =>
        `${obj.stringSet},${obj.root},${obj.key},${obj.quality},${obj.time},${obj.date}`
    )
    .join('\n');

  const filePath = SESSION_DATA_FILE;
  const secondFilePath = SESSION_DATA_LAST_10_FILE;

  fs.access(filePath, fs.constants.F_OK, err => {
    // If file does not exist, write the headers
    if (err) {
      console.log('Received Post request to append session data to a NEW file');
      console.log(`File ${filePath} does not exist so creating it...`);
      fs.writeFile(filePath, 'SS,Root,Key,Quality,Time,Date\n', err => {
        // Add 'Date' here
        if (err) {
          console.log(err);
          res.status(500).send('Error writing to file');
          return;
        }
        // Headers have been written, now append the data
        appendData();
      });
    } else {
      // File exists, append the data
      console.log(
        'Received Post request to append session data to an existing file'
      );
      appendData();
    }
  });

  function appendData() {
    fs.appendFile(filePath, csvData + '\n', err => {
      if (err) {
        console.log(err);
        res.status(500).json({ message: 'Error writing to file' });
      } else {
        overwriteData();
      }
    });
  }
  function overwriteData() {
    const last10Rows = data
      .slice(-10)
      .map(
        obj =>
          `${obj.stringSet},${obj.root},${obj.key},${obj.quality},${obj.time},${obj.date}`
      )
      .join('\n');
    fs.writeFile(
      secondFilePath,
      'SS,Root,Key,Quality,Time,Date\n' + last10Rows + '\n',
      err => {
        if (err) {
          console.log(err);
          res.status(500).json({ message: 'Error writing to second file' });
        } else {
          res.status(200).json({
            message: 'Data appended successfully and second file overwritten',
          });
        }
      }
    );
  }
});


function analyzeChordProblems(filePath, topN = 3) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        // Only analyze the last 10 entries (most recent session)
        const lastTenResults = results.slice(-10);
        // Group by chord combination and calculate average time
        const chordGroups = {};
        
        lastTenResults.forEach(row => {
          const chordKey = `SS${row.SS}, R/${row.Root}, ${row.Key} ${row.Quality}`;
          const time = parseFloat(row.Time);
          
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
            timeInfo: `${avgTime.toFixed(1)}s`,
            avgTime: avgTime,
            maxTime: group.maxTime,
            attempts: group.attempts
          };
        });

        // Sort by average time descending and take top N
        aggregatedResults.sort((a, b) => b.avgTime - a.avgTime);
        const topResults = aggregatedResults.slice(0, topN);

        resolve(topResults);
      })
      .on('error', (error) => reject(error));
  });
}

// Example usage or endpoint
app.get('/analyze-session-data', async (req, res) => {
  try {
    const results = await analyzeChordProblems(SESSION_DATA_LAST_10_FILE);
    res.json({ results });
  } catch (error) {
    console.error('Error analyzing session data:', error);
    res.status(500).json({ error: 'Failed to analyze session data' });
  }
});

let serverInstance = null;

function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      return resolve(serverInstance);
    }

    serverInstance = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      resolve(serverInstance);
    });

    serverInstance.on('error', (err) => {
      serverInstance = null;
      reject(err);
    });
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (!serverInstance) {
      return resolve();
    }

    serverInstance.close((err) => {
      if (err) {
        reject(err);
      } else {
        serverInstance = null;
        resolve();
      }
    });
  });
}

if (!process.env.JAZZ_DISABLE_AUTO_LISTEN) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app, startServer, stopServer, analyzeChordProblems };
