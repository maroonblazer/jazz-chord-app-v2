// START THE SERVER WITH `node server.js`
import path from 'path';
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import { query } from './qa.js';

const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

const PORT = 3000;

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

  fs.access(filePath, fs.constants.F_OK, err => {
    // If file does not exist, write the headers
    if (err) {
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
      appendData();
    }
  });

  function appendData() {
    fs.appendFile(filePath, csvData + '\n', err => {
      if (err) {
        console.log(err);
        res.status(500).send('Error writing to file');
        return;
      }
    });
  }
});

app.post('/get-assistant-feedback', async (req, res) => {
  console.log('received request for assistant feedback');
  try {
    const data = await query();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error querying data');
  }
});
