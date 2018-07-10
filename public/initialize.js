'use strict';

const STORE = {
    round: 1,
    roundScore: 0,
    guesses: 3,
    QA: {},
    roundHistory: [
        {
            score:0,
            possible:0
        },
        {
            score:0,
            possible:0
        },
        {
            score:0,
            possible:0
        }
    ]
}

const Model = {};
const View = {};
const Controller = {};

// get new question and answers/points from server
Model.getNewQA = () => {
    // temp: currently just provides dummy data
    STORE.QA = {
        question: 'Name a part time job that kids do to make money',
        answers: [
            {
                ans: 'Mow Lawns/Yard Work',
                pts: 20
            },
            {
                ans: 'Newspaper Route',
                pts: 19
            },
            {
                ans: 'Food Services',
                pts: 18
            },
            {
                ans: 'Babysitting',
                pts: 17
            },
            {
                ans: 'Lemonade Stand',
                pts: 9
            }
        ]
    }
}

// update game data at the end of each round
Model.endRound = () => {
    STORE.round += 1;
    Model.storeRoundScore();
    Model.storeRoundPossible();
    Model.resetGuesses();
    Model.getNewQA();
} 

// decrease remaining guesses in current round
Model.decGuesses = () => {
    STORE.guesses -= 1;
}

// reset available guesses to 3
Model.resetGuesses = () => {
    STORE.guesses = 3;
}

// store the current round score in roundHistory and zero roundScore
Model.storeRoundScore = () => {
    STORE.roundHistory[STORE.round - 1].score = STORE.roundScore;
    STORE.roundScore = 0;
}

// calculate and store the total possible round score in roundHistory
Model.storeRoundPossible = () => {
    STORE.roundHistory[STORE.round - 1].possible = 
        STORE.QA.answers.reduce((accum, elem) => (accum + elem.pts),0);
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
    $('#question-text').text(STORE.QA.question);
}

View.updateAnswers = () => {

}

// set up game screen by showing hiding elements and setting game variables
View.renderGame = () => {
    View.renderNewRound();
    $('.front-header').addClass('front-header--hidden');
    $('.game-header').removeClass('game-header--hidden');
    $('.main').removeClass('main--hidden');
    $('.game-container').removeClass('game-container--hidden');
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
    $('.game-container').addClass('game-container--hidden');
    $('.results-container').removeClass('results-container--hidden');
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
        Model.getNewQA();
        View.renderGame();        
    });
}

function initialize() {
    Controller.handleStartBtn();
    Controller.handleShowMeBtn();
    Controller.handleNextBtn();
    // $('#start-btn').click() //temp to skip front screen
    // View.renderResults(); // temp to skip to results screen
}

$(initialize);