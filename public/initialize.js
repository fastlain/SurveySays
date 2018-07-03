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

View.renderGame = () => {
    $('.front-header').hide();
    $('.game-header').show();
    $('.main').show();
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