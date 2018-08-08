'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const passport = require('passport');
const path = require('path');

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

// routers
const questAnsRouter = require('./questans/router');
const usersRouter = require('./users/router');
const authRouter = require('./auth/router');
app.use('/questans', questAnsRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);


// passport strategies
const {localStrategy, jwtStrategy} = require('./auth/strategies');
passport.use(localStrategy);
passport.use(jwtStrategy);

// expose public assets on static server
app.use(express.static('public'));
app.use(express.static('dataentry'));


// declare `server` here, assign a value in runServer, and access it in closeServer
let server;

// Starts server and return a Promise (asynchronous for test code)
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, { useNewUrlParser: true }, err => {
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
