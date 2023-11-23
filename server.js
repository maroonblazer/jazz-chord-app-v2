const express = require('express');
const fs = require('fs');
const cors = require('cors');
const req = require('express/lib/request');
const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

const PORT = 3000;

// Define routes here
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Write an endpoint to handle data from the client
app.post('/append-session-data', (req, res) => {
  const { data } = req.body; //Assuming data is an array of objects
  const csvData = data.map(obj => `${obj.cp},${obj.key},${obj.time}`).join('\n');
  fs.appendFile('session-data.csv', csvData + '\n', (err) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error writing to file');
      return;
    }
    res.send('Data written to file');
  });
});