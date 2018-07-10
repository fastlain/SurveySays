'use strict';

const STORE = {
    round: 1,
    roundScore: 0,
    guesses: 3,
    question: 'This is a placeholder question for the Survey Says game',
    roundHistory: [
        {
            score:0,
            possible:95
        },
        {
            score:0,
            possible:100
        },
        {
            score:0,
            possible:92
        }
    ]
}

const Model = {};
const View = {};
const Controller = {};

Model.endRound = () => {
    Model.storeRoundScore();
    Model.resetGuesses();
    Model.incRound();
} 

// decrease remaining guesses in current round
Model.decGuesses = () => {
    STORE.guesses -= 1;
}

// reset available guesses to 3
Model.resetGuesses = () => {
    STORE.guesses = 3;
}

// increment the current round
Model.incRound = () => {
    STORE.round += 1;
}

// store the current round score in roundHistory and zero roundScore
Model.storeRoundScore = () => {
    STORE.roundHistory[STORE.round - 1].score = STORE.roundScore;
    STORE.roundScore = 0;
}

// get the total score for all combined rounds
Model.getTotScore = () => {
    return STORE.roundHistory.reduce((accum, elem) => (accum + elem.score), 0);
}

// get the total possible score for all combined rounds
Model.getTotPossible = () => {
    return STORE.roundHistory.reduce((accum, elem) => (accum + elem.possible), 0);
}

// check and render total game score
View.updateTotScore = () => {
    $('#tot-score').text(Model.getTotScore());
}

// check and render remaining round guesses
View.updateGuesses = () => {
    $('#guesses').text(STORE.guesses);
}

// check and render current game round
View.updateRound = () => {
    $('#round').text(STORE.round);
}

View.updateQuestion = () => {
    $('#question-text').text(STORE.question);
}

View.updateAnswers = () => {

}

// set up game screen by showing hiding elements and setting game variables
View.renderGame = () => {
    View.renderNewRound();
    $('.front-header').toggleClass('front-header--hidden');
    $('.game-header').toggleClass('game-header--hidden');
    $('.main').toggleClass('main--hidden');
}

// update DOM elements from STORE at beginning of new round
View.renderNewRound = () => {
    View.updateRound();
    View.updateGuesses();
    View.updateTotScore();
    View.updateQuestion();
    View.updateAnswers();
}

View.renderResults = () => {
    
} 

// show/hide "Show Me..." and "Next" buttons
View.toggleEndRound = () => {
    $('#guess-form').toggleClass('guess-form--hidden');
    $('#next-btn').toggleClass('btn--hidden');
}

Controller.handleNextBtn = () => {
    $('#next-btn').click((evt) => {
        Model.endRound();
        if (STORE.round < 3) {
            View.toggleEndRound();
            View.renderNewRound();
        } else {
            View.renderResults();
        }
    });
}

Controller.handleShowMeBtn = () => {
    $('#showme-btn').click((evt) => {
        evt.preventDefault();
    });
}

Controller.handleStartBtn = () => {
    $('#start-btn').click((evt) => {
        View.renderGame();        
    });
}

function initialize() {
    Controller.handleStartBtn();
    Controller.handleShowMeBtn();
    Controller.handleNextBtn();
    // $('#js-start-btn').click() //temp to skip front screen
}

$(initialize);