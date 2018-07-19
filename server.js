const express = require('express');
const app = express();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

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

app.post('/questans', express.urlencoded({extended: true}), (req,res) => {
  console.log(req.body);
  
  // check for required questans fields
  const requiredFields = ['question', 'answers'];
  for (let i = 0; i < requiredFields.length; i += 1) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing field: '${field}' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  // check for required questans.answers fields
  const requiredAnsFields = ['display', 'matches', 'pts'];
  for (let j = 0; j < req.body.answers.length; j += 1) {  
    for (let k = 0; k < requiredAnsFields; k += 1) {
      const ansField = requiredAnsFields[k];
      if(!(ansField in req.body.answers)) {
        const message = `Missing field: '${ansField}' in answers[${j}]`;
        console.error(message);
        return res.status(400).send(message);
      }
    }
  }
  
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

app.get('/dataentry', (req,res) => {
  res.sendFile(path.join(__dirname, '/dataentry/dataentry.html'));
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
