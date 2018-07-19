const express = require('express');
const app = express();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const bodyParser = require('body-parser');
const path = require('path');

const {PORT, DATABASE_URL} = require('./config');
const {QuestAns} = require('./models');

app.use(express.static('public'));
app.use(express.static('dataentry'));

app.get('/questans', (req,res) => {  
  QuestAns
    .aggregate([{$sample: {size:3}}])
    .then(questans => {
      res.json(questans);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

app.get('/dataentry', (req,res) => {
  res.sendFile(path.join(__dirname, '/dataentry/dataentry.html'));
});

app.post('/dataentry', bodyParser.urlencoded(), (req,res) => {
  const newData = {
    question: req.body.question,    
    answers: req.body.answers,
  };
  
  QuestAns
    .create(newData)
    .then(res.status(201).json({message: 'Question/Answers added to database successfully'}))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });  
});

// declare `server` here, assign a value in runServer, and access it in closeServer
let server;

// Starts server and return a Promise (asynchronous for test code)
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
      });
  });
}
  
// Closes server and return a Promise (asynchronous for test code)
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}
  
// call runServer if server.js is called directly (i.e. not from test code)
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
};

// exports for use in test code
module.exports = {app, runServer, closeServer};
