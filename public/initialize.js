'use strict';

const STORE = {
    muted: false,
    round: 1,
    roundScore: 0,
    guesses: 3,
    guessHistory: [],
    QA: [],
    roundHistory: [
        {
            score:0,
			possible:0,
			QAId: 0
        },
        {
            score:0,
			possible:0,
			QAId: 0
        },
        {
            score:0,
			possible:0,
			QAId: 0
        }
	],
	user: null
}

const Model = {};
const View = {};
const Controller = {};

// get new question and answers/points from server
Model.getNewQAs = () => {
	
	$.getJSON('/questans', (data) => {
		//console.log(data);
		STORE.QA = data;
		View.renderGameScreen();
		SpeechController.listen(COMMANDS.showMe); 
	})
}

// update game data at start of a new game
Model.startNextGame = () => {
	Model.resetRounds();
	Model.resetRoundScore();
	Model.resetGuesses();
	Model.resetGuessHistory();
	Model.resetRoundHistory();
	Model.getNewQAs();
}

// update game data at the end of each round
Model.endRound = () => {
	Model.storeRoundScore();
	Model.resetRoundScore();
	Model.storeRoundPossible();
	Model.storeRoundQAId();
	Model.resetGuesses();
	Model.resetGuessHistory();
	Model.incRound();
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
		STORE.QA[STORE.round - 1].answers.reduce((accum, elem) => (accum + elem.pts),0);
}

// store the database id for the question/answers
Model.storeRoundQAId = () => {
	STORE.roundHistory[STORE.round - 1].QAId = STORE.QA[STORE.round - 1]._id;
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
    // clear prior messages
	View.message('');
	// place cursor focus in guess input
	Controller.focusGuessInput();
    
    console.log(`User guessed: ${guess}`);
    
    SpeechController.pauseListening();
    guess = guess.toLowerCase();

    // if user submits empty string, display error message
    if (guess === '') {
        View.message('Please enter an answer');
        View.playAudio('sounds/notice.wav');
        SpeechController.listen(COMMANDS.showMe);
        return;
    }
    
    const ansArr = STORE.QA[STORE.round - 1].answers;

    // loop through each answer's match options
    for (let i = 0; i < ansArr.length; i += 1) {
        for (let j = 0; j < ansArr[i].matches.length; j += 1) {
            if (guess.includes(ansArr[i].matches[j])) {
                console.log(`matched ${ansArr[i].display}`);
                
                // check if answer has already been guessed
                if (ansArr[i].guessed === true) {
                    View.message('That answer was already guessed, try again');
                    SpeechController.listen(COMMANDS.showMe);
                    View.playAudio('sounds/notice.wav');
                } else {                   
                    // set answer guessed state to true
                    ansArr[i].guessed = true;
                    
                    // add points to round score
                    STORE.roundScore += ansArr[i].pts;
                    
                    // show correct answer and points on screen
                    View.revealAnswer(i, true);
                    View.updateRoundScore();
                    
                    // decrement remainingAns and check if no more to guess
                    STORE.QA[STORE.round - 1].remainingAns -= 1;
                    if (STORE.QA[STORE.round - 1].remainingAns === 0) {
                        View.toggleEndRound();
                        SpeechController.listen(COMMANDS.next);
                        View.playAudio('sounds/allcorrect.wav');
                    } else {
                        SpeechController.listen(COMMANDS.showMe);
                        View.playAudio('sounds/correctanswer.wav');
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
            View.playAudio('sounds/notice.wav');
            SpeechController.listen(COMMANDS.showMe);
            return;
        }
    }
    
    // add guess to guessHistory
    STORE.guessHistory.push(guess);

    // process incorrect guess
    console.log('incorrect guess');
    View.message(`Sorry, "${guess}" is not correct`)
    View.removeGuess();
    Model.decGuesses();
    if (STORE.guesses === 0) {
        View.revealMissedAnswers();
        View.toggleEndRound();
        View.playAudio('sounds/buzzer.mp3');
        SpeechController.listen(COMMANDS.next);
    } else {
        View.playAudio('sounds/wronganswer.wav');
        SpeechController.listen(COMMANDS.showMe);
    }
}

View.playAudio = (url) => {
    if (!STORE.muted) {
        const myAudio = new Audio(url);
        myAudio.play();
    }
}

// show all the correct answers at the end of a round
View.revealMissedAnswers = () => {
	for (let i = 0; i < STORE.QA[STORE.round - 1].answers.length; i += 1) {
		if (STORE.QA[STORE.round - 1].answers[i].guessed === false) {
			View.revealAnswer(i, false);
		}
	}
}

// show correct answer and corresponding points from specified index
View.revealAnswer = (i, guessed) => {  
	const $correctElem = $(`.answers div:nth-child(${2*i+1})`);
	$correctElem.text(STORE.QA[STORE.round - 1].answers[i].display);
	$correctElem.next().text(STORE.QA[STORE.round - 1].answers[i].pts);

	if (guessed) {
		$correctElem.addClass('answers__text--guessed');
	} else {
		$correctElem.addClass('answers__text--revealed');
		$correctElem.next().addClass('answers__points--revealed')
	}
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
	$('#question-text').text(STORE.QA[STORE.round - 1].question);
}

// todo: create function(s) to update the answer grid after each round
View.resetAnswerBoard = () => {
	const numAnswers = STORE.QA[STORE.round - 1].answers.length;
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
	$('.message').text(message);
} 

// set up game screen by showing and hiding elements
View.renderGameScreen = () => {
	$('.front-header').addClass('front-header--hidden');
	$('.game-header').removeClass('game-header--hidden');
	$('.main').removeClass('main--hidden');
	$('.game-container').removeClass('game-container--hidden');
	View.updateQuestion();
	Controller.focusGuessInput();
}

// update DOM elements from STORE at beginning of new round
View.renderNewRound = () => {
	View.updateRound();
	View.updateTotScore();
	View.resetGuesses();
	View.updateQuestion();
	View.resetAnswerBoard();
	View.message('');
	Controller.focusGuessInput();
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

// check voice support and render message in instructions modal
View.checkVoiceSupport = () => {
    // check if browser supports Web Speech API (and thus, annyang)
    if (annyang) {
        $('#voice-support').text(`All aspects of the game can be controlled with your voice! Submit answers by saying "Show me" followed by your answer. Buttons can be activated by saying the words in quotes. Try it below...`);
        
        // check if micophone is enabled
        navigator.getUserMedia({audio:true}, 
            // success callback: clear any prior message
            function() {
                $('#mic-status').text('');
            }, 
            // error callback: notify that microphone is turned off
            function() {
                $('#mic-status').text('Voice recognition is supported, but your microphone is disabled');
            }
        );
    } else {
        $('#voice-support').text(`Speech Recognition is not currently supported by your browser. You can play the game without voice control or try using Google Chrome.`);
    }  
}

View.loginMessage = (message) => {
	$('#login-msg').text(message).removeClass('login__msg--hidden');
}

// place cursor focus in guess input
Controller.focusGuessInput = () => {	
	$('#guess-input').focus();
}

Controller.handleNewGameBtn = () => {
	$('#new-game-btn').click(() => {
		Model.startNextGame();
		View.toggleResultsScreen();
		View.renderNewRound();
		View.toggleEndRound();
		SpeechController.listen(COMMANDS.showMe);
	});
}

Controller.handleNextBtn = () => {
	$('#next-btn').click(() => {
		Model.endRound();
		if (STORE.round <= 3) {
			View.toggleEndRound();
			View.renderNewRound();
			SpeechController.listen(COMMANDS.showMe);
		} else {
			View.generateResults();
			View.toggleResultsScreen();
			SpeechController.listen(COMMANDS.newGame);
		}
	});
}

Controller.handleShowMeBtn = () => {
	$('#showme-btn').click((evt) => {
		evt.preventDefault();
		// get guess from input and convert to lower case
		let guess = $('#guess-input').val();
		// clear guess input
		$('#guess-input').val('');
		// check guess against possible answer matches
		Model.processGuess(guess);        
	});
}

Controller.handleLetsPlayBtn = () => {
	$('#lets-play-btn').click(() => {        
		$('#instructions-modal').addClass('modal-background--hidden');
		Model.getNewQAs();  
	});
}

Controller.handleStartBtn = () => {
	$('#start-btn').click((evt) => {
        View.checkVoiceSupport();
        $('#instructions-modal').removeClass('modal-background--hidden');
		SpeechController.listen(COMMANDS.letsPlay);
	});
}

Controller.handleMuteBtn = () => {
    $('#mute-container').click(() => {
        $('.audio-ctrl__icon').toggleClass('audio-ctrl__icon--hidden');
        STORE.muted = !STORE.muted;
    });
}

Controller.handleDropDownBtn = () => {
	// toggle drop down on click
	$('#dropdown-btn').click(() => {
		$('#dropdown-content').toggleClass('dropdown__content--hidden');
	});

	// hide on click outside
	$(document).on('click', (evt) => {
		if (!$(evt.target).closest('#dropdown-container').length) {
			$('#dropdown-content').addClass('dropdown__content--hidden');
		}
	});	
}

Controller.handleNavLoginBtn = () => {
	$('#nav-login').click(() => {
		$('#dropdown-content').addClass('dropdown__content--hidden');
		$('#login-modal').removeClass('modal-background--hidden');

		// // hide on click outside
		// $(document).on('click', (evt) => {
		// 	console.log(evt.target);
		// 	console.log($(evt.target));
		// });
	});	
}

// Close login/create acct modal by clicking "x", pressing 'escape', or click outside modal
Controller.handleCloseLoginModal = () => {
	$('#close-login-btn').click(() => {
		$('#login-modal').addClass('modal-background--hidden');
	});

	$('#login-modal').click((evt) => {	
		if ($(evt.target).is($('#login-modal'))) {
			$('#login-modal').addClass('modal-background--hidden');
		}
	});

	$(document).keydown(function(evt) { 	
		if (evt.keyCode === 27) { 			
			$('#login-modal').addClass('modal-background--hidden');
		}
	});
}

// reconfigure modal to accept login information vs new account information
Controller.handleSwapLoginCreateBtn = () => {

	$('#swap-login-create').click((evt) => {
		// check data attribute for current state of modal
		const modalState = $('#login-modal').data('login-create');
		
		if (modalState === 'login') {
			// swap state to create
			$('#login-modal').data('login-create', 'create');
			// change heading to create user
			$('#login-heading').text('Create New User');
			// change text of swap-login-create
			$('#swap-login-create').text('Already have an account?');
		} else {
			// swap state to login
			$('#login-modal').data('login-create', 'login');
			// change heading to login
			$('#login-heading').text('Log In');
			// change text of swap-login-create
			$('#swap-login-create').text('Create a new user account');
		}

		// toggle visibility of password re-entry lable/input and login/create buttons
		$('#re-password-lbl').toggleClass('login__lbl--hidden');
		$('#re-password-inpt').toggleClass('login__inpt--hidden');
		$('#create-user-btn').toggleClass('btn--hidden');
		$('#login-btn').toggleClass('btn--hidden');
	});
}

function initialize() {
    SpeechController.start();
    Controller.handleMuteBtn();
    SpeechController.listen(COMMANDS.startGame);
	Controller.handleStartBtn();
	Controller.handleLetsPlayBtn();
	Controller.handleShowMeBtn();
	Controller.handleNextBtn();
	Controller.handleNewGameBtn();
	Controller.handleDropDownBtn();
	Controller.handleNavLoginBtn();
	Controller.handleCloseLoginModal();
	Controller.handleSwapLoginCreateBtn();
}

$(initialize);