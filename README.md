# Survey Says

A Family Feud-style quiz game which utilizes speech recognition in gameplay and site navigation. 

### **_[Live link](https://surveysaysgame.herokuapp.com/)_**
[![Build Status](https://travis-ci.org/fastlain/SurveySays.svg?branch=master)](https://travis-ci.org/fastlain/SurveySays)

## Introduction

Speech recognition is an exciting technology making its way into every area of software and hardware development. Survey Says uses the experimental "Web Speech API" to introduce voice-to-text to a fun and light-hearted game. Based on the ever-popular [Family Feud](https://www.familyfeud.com/) game show, this responsive full-stack web application also incorporates user authentication, continuous integration & testing, and a database for storing questions/answers and user data.  

## Screenshots
#### Start screen:
![Survey Says start screen](public/screenshots/startscreen.png)

#### Game in-progress:
![Game in-progress](public/screenshots/ingame.png)

#### Results screen:
![Results](public/screenshots/results.png)

#### Log In screen:
![Log in](public/screenshots/login.png)

## Pre-requisites
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/en/)
* npm
  
## Installation
* Clone this repository:
    * `git clone https://github.com/fastlain/SurveySays.git`
* cd into folder:
    * `cd SurveySays/`
* Run npm install:
    * `npm install`

## Running / Testing


## Technology

### Front End
* HTML/CSS/JavaScript

* JavaScript Libraries
    * [jQuery](http://jquery.com/)
    * [annyang](https://www.talater.com/annyang/)
        * Annyang is a small Speech Recognition library built for use with the experimental [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### Back End

* [Node](https://nodejs.org/en/) and [Express](https://expressjs.com/)
    * [Passport](http://www.passportjs.org/) authentication
    * [Mocha](https://mochajs.org/) test framework and [Chai](http://www.chaijs.com/) assertion library
    * [Mongoose](http://mongoosejs.com/) for MongoDB object modeling

* [MongoDB](https://www.mongodb.com/)
    * NoSQL (document-based) database
    * Hosted on the cloud with [mLab](https://mlab.com/)

* [Travis](https://travis-ci.org/) Continuous Integration
  
* [Heroku](https://www.heroku.com/) Cloud Application Platform

## Future Features
* Multiplayer
* Global High Scores
* Speech synthesis (game talks to you!)
* Increased robustness of answer matching (e.g. common misspellings and mispronunciations)
* Performance feedback (e.g. graph of scores over time, achievements/badges, etc.)