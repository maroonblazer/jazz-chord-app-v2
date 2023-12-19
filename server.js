// START THE SERVER WITH `node server.js`
const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const req = require('express/lib/request');
const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Define routes here
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Write an endpoint to handle data from the client
app.post('/append-session-data', (req, res) => {
  const { data } = req.body; //Assuming data is an array of objects
  const csvData = data
    .map(obj => `${obj.cp},${obj.key},${obj.quality},${obj.time}`)
    .join('\n');

  const filePath = path.join(__dirname, 'session-data.csv');

  fs.access(filePath, fs.constants.F_OK, err => {
    // If file does not exist, write the headers
    if (err) {
      fs.writeFile(filePath, 'Problem,Key,Quality,Time\n', err => {
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
      console.log('Data written to file');
      res.send('Data written to file');
    });
  }
});
