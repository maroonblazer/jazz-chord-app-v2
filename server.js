// START THE SERVER WITH `node server.js`
import path from 'path';
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import { query } from './qa.js';

const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), 'public')));

// Define routes here
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Write an endpoint to handle data from the client
app.post('/append-session-data', (req, res) => {
  const { data } = req.body; //Assuming data is an array of objects
  const csvData = data
    .map(obj => `${obj.cp},${obj.key},${obj.quality},${obj.time},${obj.date}`)
    .join('\n');

  const filePath = path.join(process.cwd(), 'session-data.csv');
  const secondFilePath = path.join(process.cwd(), 'session-data-last-10.csv');

  fs.access(filePath, fs.constants.F_OK, err => {
    // If file does not exist, write the headers
    if (err) {
      console.log('Received Post request to append session data to a NEW file');
      console.log(`File ${filePath} does not exist so creating it...`);
      fs.writeFile(filePath, 'Problem,Key,Quality,Time,Date\n', err => {
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
      .map(obj => `${obj.cp},${obj.key},${obj.quality},${obj.time},${obj.date}`)
      .join('\n');
    fs.writeFile(
      secondFilePath,
      'Problem,Key,Quality,Time,Date\n' + last10Rows + '\n',
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

app.post('/get-assistant-feedback', async (req, res) => {
  console.log('Received Post request for assistant feedback');
  try {
    const data = await query('session-data-last-10.csv', 10);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error querying data' });
  }
});

app.post('/send-message', async (req, res) => {
  console.log('Received Post request for follow-up feedback...');
  try {
    const rows = fs
      .readFileSync('session-data.csv', 'utf8')
      .split('\n')
      .filter(row => row !== '').length;
    const question = req.body.message;
    console.log('Question from client:', question);
    const data = await query('session-data.csv', rows, question);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error querying data' });
  }
});
