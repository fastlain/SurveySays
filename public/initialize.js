'use strict';

const STORE = {
    round: 1,
    guesses: 3,
    totScore: 0,
}

const Model = {};
const View = {};
const Controller = {};

// check and render total game score
View.updateTotScore = () => {
    $('#js-tot-score').text(STORE.totScore);
}

// check and render remaining round guesses
View.updateGuesses = () => {
    $('#js-guesses').text(STORE.guesses);
}

// check and render current game round
View.updateRound = () => {
    $('#js-round').text(STORE.round);
}

// set up game screen by showing hiding elements and setting game variables
View.renderGame = () => {
    $('.front-header').toggleClass('front-header--hidden');
    $('.game-header').toggleClass('game-header--hidden');
    $('.main').toggleClass('main--hidden');
    View.updateRound();
    View.updateGuesses();
    View.updateTotScore();
}

Controller.handleStartBtn = () => {
    $('#js-start-btn').click((evt) => {
        View.renderGame();
    });
}

function initialize() {
    Controller.handleStartBtn();
    // $('#js-start-btn').click() //temp
}

$(initialize);