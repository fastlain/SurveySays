const express = require('express');
const app = express();

app.use(express.static('public'));

// declare `server` here, assign a value in runServer, and access it in closeServer
let server;

// Starts server and return a Promise (asynchronous for test code)
function runServer() {
    const port = process.env.PORT || 8080;
    return new Promise((resolve, reject) => {
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve(server);
      }).on('error', err => {
        reject(err)
      });
    });
  }
  
// Closes server and return a Promise (asynchronous for test code)
  function closeServer() {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
  
  // call runServer if server.js is called directly (i.e. not from test code)
  if (require.main === module) {
    runServer().catch(err => console.error(err));
  };
  
  // exports for use in test code
  module.exports = {app, runServer, closeServer};
