'use strict';

function renderGame() {
    console.log('rendering game');
    $('.front-header').hide();
    $('.game-header').show();
    $('.main').show();
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