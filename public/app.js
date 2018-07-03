'use strict';

const STORE = {
    round: 1,
    guesses: 3,
    totScore: 0,
}

// check and render total game score
function updateTotScore() {
    $('#js-tot-score').text(STORE.totScore);
}

// check and render remaining round guesses
function updateGuesses() {
    $('#js-guesses').text(STORE.guesses);
}

// check and render current game round
function updateRound() {
    $('#js-round').text(STORE.round);
}

function renderGame() {
    $('.front-header').hide();
    $('.game-header').show();
    $('.main').show();
    updateRound();
    updateGuesses();
    updateTotScore();
}

function handleStartBtn() {
    $('#js-start-btn').click((evt) => {
        renderGame();
    });
}

function initialize() {
    handleStartBtn();
}

$(initialize);