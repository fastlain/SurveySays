'use strict';

const STORE = {
    round: 1,
    roundScore: 0,
    guesses: 3,
    guessHistory: [],
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
                display: 'Mow Lawns/Yard Work',
                matches: ['mow', 'lawn', 'grass', 'lawncare', 'yard', 'yardwork'],
                pts: 20,
                guessed: false
            },
            {
                display: 'Newspaper Route',
                matches: ['newspaper', 'paper', 'route'],
                pts: 19,
                guessed: false
            },
            {
                display: 'Food Services',
                matches: ['restaurant', 'burgers', 'waiter', 'waitress', 'busboy', 'food'],
                pts: 18,
                guessed: false
            },
            {
                display: 'Babysitting',
                matches: ['babysit', 'childcare'],
                pts: 17,
                guessed: false
            },
            {
                display: 'Lemonade Stand',
                matches: ['lemonade'],
                pts: 9,
                guessed: false
            }
        ],
        remainingAns: 5 
    }
}

// update game data at start of a new game
Model.startNextGame = () => {
    Model.resetRounds();
    Model.resetRoundScore();
    Model.resetGuesses();
    Model.resetGuessHistory();
    Model.resetRoundHistory();
    Model.getNewQA();
}

// update game data at the end of each round
Model.endRound = () => {
    Model.storeRoundScore();
    Model.resetRoundScore();
    Model.storeRoundPossible();
    Model.resetGuesses();
    Model.resetGuessHistory();
    Model.incRound();
    Model.getNewQA();
} 

Model.resetRoundHistory = () => {
    STORE.roundHistory = [
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

// reset round number to 1
Model.resetRounds = () => {
    STORE.round = 1;
}

// increment round number
Model.incRound = () => {
    STORE.round += 1;
}

// decrease remaining guesses in current round
Model.decGuesses = () => {
    STORE.guesses -= 1;
}

// reset available guesses to 3
Model.resetGuesses = () => {
    STORE.guesses = 3;
}

// reset score of current round
Model.resetRoundScore = () => {
    STORE.roundScore = 0;
}

// store the current round score in roundHistory
Model.storeRoundScore = () => {
    STORE.roundHistory[STORE.round - 1].score = STORE.roundScore;
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

// reset user's guess history
Model.resetGuessHistory = () => {
    STORE.guessHistory = [];
}

// evaluate whether user guess is correct and process result
Model.processGuess = (guess) => {
    console.log(`User guessed: ${guess}`);

    // if user submits empty string, display error message
    if (guess === '') {
        View.message('Please enter an answer');
        return;
    }
    
    const ansArr = STORE.QA.answers;

    // loop through each answer's match options
    for (let i = 0; i < ansArr.length; i += 1) {
        for (let j = 0; j < ansArr[i].matches.length; j += 1) {
            if (guess.includes(ansArr[i].matches[j])) {
                console.log(`matched ${ansArr[i].display}`);
                
                // check if answer has already been guessed
                if (ansArr[i].guessed === true) {
                    View.message('That answer was already guessed, try again');
                } else {                   
                    // set answer guessed state to true
                    ansArr[i].guessed = true;
                    
                    // add points to round score
                    STORE.roundScore += ansArr[i].pts;
                    
                    // show correct answer and points on screen
                    View.renderCorrect(i);
                    View.updateRoundScore();
                    
                    // decrement remainingAns and check if no more to guess
                    STORE.QA.remainingAns -= 1;
                    if (STORE.QA.remainingAns === 0) {
                        View.toggleEndRound()
                    }
                }
                return;
            }   
        }
    }

    // check if incorrect guess has already been guessed
    for (let k = 0; k < STORE.guessHistory.length; k += 1) {
        if (guess.includes(STORE.guessHistory[k])) {
            View.message('You already tried that, try again');
            return;
        }
    }
    
    // add guess to guessHistory
    STORE.guessHistory.push(guess);

    // process incorrect guess
    console.log('incorrect guess');
    View.message(`Sorry, ${guess} is not correct`)
    View.removeGuess();
    Model.decGuesses();
    if (STORE.guesses === 0) {
        View.toggleEndRound()
    }
}

// show correct answer and corresponding points from specified index
View.renderCorrect = (i) => {  
    const $correctElem = $(`.answers div:nth-child(${2*i+1})`);
    $correctElem.text(STORE.QA.answers[i].display);
    $correctElem.addClass('answers__text--guessed');
    $correctElem.next().text(STORE.QA.answers[i].pts);
}

// check and render total game score
View.updateTotScore = () => {
    $('#tot-score').text(Model.getTotScore());
}

// render next unused guess to 'guessed' state
View.removeGuess = () => {
    // get position of next unused guess from number of available guesses
    const toRemove = STORE.guesses;
    $(`.guesses__icon:nth-child(${toRemove})`)
        .addClass('guesses__icon--x')
        .removeClass('guesses__icon--checked')
        .text('\u2716');
}

// show all guesses in 'unused' state
View.resetGuesses = () => {
    console.log('resetting guesses');
    
    $('.guesses__icon')
        .addClass('guesses__icon--checked')
        .removeClass('guesses__icon--x')
        .text('\u2714');
}

// check and render current round score
View.updateRoundScore = () => {
    $('.answers__sum').text(STORE.roundScore);
}

// check and render current game round
View.updateRound = () => {
    $('#round').text(STORE.round);
}

// check and render the question for the current round
View.updateQuestion = () => {
    $('#question-text').text(STORE.QA.question);
}

// todo: create function(s) to update the answer grid after each round
View.resetAnswerBoard = () => {
    const numAnswers = STORE.QA.answers.length;
    let answerBoard = '';
    for (let i = 0; i < numAnswers; i += 1) {
        answerBoard += 
            `<div class="answers__text">${i+1}</div>
            <div class="answers__points"></div>`;
    }
    answerBoard += '<div class="answers__sum">0</div>';
    $('.answers').html(answerBoard);
}

// todo: create a user message on screen
View.message = (message) => {
    console.log(message);
} 

// set up game screen by showing and hiding elements
View.renderGameScreen = () => {
    $('.front-header').addClass('front-header--hidden');
    $('.game-header').removeClass('game-header--hidden');
    $('.main').removeClass('main--hidden');
    $('.game-container').removeClass('game-container--hidden');
}

// update DOM elements from STORE at beginning of new round
View.renderNewRound = () => {
    View.updateRound();
    View.updateTotScore();
    View.resetGuesses();
    View.updateQuestion();
    View.resetAnswerBoard();
}

// generate final results screen with game data for each round
View.generateResults = () => {
    // get and show data for each round
    for (let i = 0; i < 3; i += 1) {
        $(`.results__score-box:nth-child(${2*(i+1)})`)
            .text(`${STORE.roundHistory[i].score} / ${STORE.roundHistory[i].possible}`);
    }
    

    // get and show total score data
    const totScore = Model.getTotScore();
    const totPossible = Model.getTotPossible();
    $('#total-score').text(`${totScore} / ${totPossible} (${Math.round(totScore/totPossible*100)}%)`);
} 

// show/hide "Show Me..." and "Next" buttons
View.toggleEndRound = () => {
    $('#guess-form').toggleClass('guess-form--hidden');
    $('#next-btn').toggleClass('btn--hidden');
}

// show/hide Results screen
View.toggleResultsScreen = () => {
    $('.game-container').toggleClass('game-container--hidden');
    $('.results-container').toggleClass('results-container--hidden');
}

Controller.handleNewGameBtn = () => {
    $('#new-game-btn').click(() => {
        Model.startNextGame();
        View.toggleResultsScreen();
        View.renderNewRound();
        View.toggleEndRound();
    });
}

Controller.handleNextBtn = () => {
    $('#next-btn').click(() => {
        Model.endRound();
        if (STORE.round <= 3) {
            View.toggleEndRound();
            View.renderNewRound();
        } else {
            View.generateResults();
            View.toggleResultsScreen();
        }
    });
}

Controller.handleShowMeBtn = () => {
    $('#showme-btn').click((evt) => {
        evt.preventDefault();
        // get guess from input and convert to lower case
        let guess = $('#guess-input').val().toLowerCase();
        // clear guess input
        $('#guess-input').val('');
        // check guess against possible answer matches
        Model.processGuess(guess);        
    });
}

Controller.handleStartBtn = () => {
    $('#start-btn').click((evt) => {
        Model.getNewQA();
        View.renderGameScreen();        
    });
}

function initialize() {
    Controller.handleStartBtn();
    Controller.handleShowMeBtn();
    Controller.handleNextBtn();
    Controller.handleNewGameBtn();
}

$(initialize);