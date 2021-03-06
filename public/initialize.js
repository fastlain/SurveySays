'use strict';

// create data store for global state variables
const STORE = {
    muted: false,
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
	],
	sessionQuestLog: [],
	sessionGameScores: [],
	user: null
}

// declare MVC namespaces
const Model = {};
const View = {};
const Controller = {};

// get new question/answers from server
// question log is sent along to prevent seeing duplicates
Model.getNewQA = () => {
	
	// get question history for user (if logged in) or for current session
	let questHist = [];
	if (STORE.user) {
		questHist = STORE.user.questionLog;
	} else {
		questHist = STORE.sessionQuestLog;
	}

	$.ajax({
		method: 'GET',
		dataType: 'json',
		url: '/questans',
		data: {questHist},
		success: handleSuccess
	});

	function handleSuccess(res) {
		// add new question to the data store
		STORE.QA = res;
		
		// add question id to session log in data store
		Model.storeQuestionId();

		// if user is logged in, add question to user's questionLog and save to server
		if (STORE.user) {
			STORE.user.questionLog.push(STORE.QA._id);
			Model.saveUserData();
		}

		View.renderNewRound();
		SpeechController.addCommand(COMMANDS.showMe); 
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
	
	if (STORE.user) {
		Model.saveUserData();
	}
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

// store the database id for the question/answers
Model.storeQuestionId = () => {
	STORE.sessionQuestLog.push(STORE.QA._id);
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
	$('#guess-input').focus();
    
	SpeechController.stop();
    guess = guess.toLowerCase();

    // if user submits empty string, display error message
    if (guess === '') {
        View.message('Please enter an answer');
        View.playAudio('sounds/notice.mp3');
        SpeechController.addCommand(COMMANDS.showMe);
        return;
    }
    
    const ansArr = STORE.QA.answers;

    // loop through each answer's match options
    for (let i = 0; i < ansArr.length; i += 1) {
        for (let j = 0; j < ansArr[i].matches.length; j += 1) {
            if (guess.includes(ansArr[i].matches[j])) {
                
                // check if answer has already been guessed
                if (ansArr[i].guessed === true) {
                    View.message('That answer was already guessed, try again');
					View.playAudio('sounds/notice.mp3');
					SpeechController.addCommand(COMMANDS.showMe);
                } else {                   
                    // set answer guessed state to true
                    ansArr[i].guessed = true;
                    
                    // add points to round score
                    STORE.roundScore += ansArr[i].pts;
                    
                    // show correct answer and points on screen
                    View.revealAnswer(i, true);
                    View.updateRoundScore();
                    
                    // decrement remainingAns and check if no more to guess
                    STORE.QA.remainingAns -= 1;
                    if (STORE.QA.remainingAns === 0) {
                        View.toggleEndRound();
                        SpeechController.addCommand(COMMANDS.next);
                        View.playAudio('sounds/allcorrect.mp3');
                    } else {
                        SpeechController.addCommand(COMMANDS.showMe);
                        View.playAudio('sounds/correctanswer.mp3');
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
            View.playAudio('sounds/notice.mp3');
            SpeechController.addCommand(COMMANDS.showMe);
            return;
        }
    }
    
    // add guess to guessHistory
    STORE.guessHistory.push(guess);

    // process incorrect guess
    View.message(`Sorry, "${guess}" is not correct`)
    View.removeGuess();
    Model.decGuesses();
    if (STORE.guesses === 0) {
        View.revealMissedAnswers();
        View.toggleEndRound();
        View.playAudio('sounds/buzzer.mp3');
        SpeechController.addCommand(COMMANDS.next);
    } else {
        View.playAudio('sounds/wronganswer.mp3');
        SpeechController.addCommand(COMMANDS.showMe);
    }
}

// Create a new user
Model.createNewUser = (username, password) => {
	const userData = {username, password};
	
	$.ajax({
		url: '/users',
		method: 'POST',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(userData),
		success: handleSuccess,
		error: handleError
	});

	function handleSuccess(data) {
		Model.logIn(username, password);
	}

	function handleError(err) {
		const errField = err.responseJSON.location;
		const errMessage = err.responseJSON.message;
		
		// Capitalize error field name
		const errFieldCap = errField.charAt(0).toUpperCase() + errField.slice(1);
		
		View.loginMessage(`${errFieldCap} ${errMessage}`);
		$('#username-inpt').focus();
	}
}

// request user data and a JWT from the server
Model.logIn = (username, password) => {
	const userData = {username, password};

	$.ajax({
		url: '/auth/loginlocal',
		method: 'POST',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(userData),
		success: handleSuccess,
		error: handleError
	});

	function handleSuccess(data) {	
		STORE.user = data.user;
		localStorage.setItem('TOKEN', data.authToken);

		// if a session question history already exists, it is added to the user's log
		if (STORE.sessionQuestLog !== null) {
			STORE.user.questionLog = [...STORE.user.questionLog, ... STORE.sessionQuestLog];
			Model.saveUserData();
		}

		// if a session score history already exists, it is added to the user's log
		if (STORE.sessionGameScores !== null) {
			STORE.user.scores = [...STORE.user.scores, ... STORE.sessionGameScores];
			Model.saveUserData();
		}	

		View.renderLoggedIn();
	}

	function handleError(err) {
		View.loginMessage('Invalid username or password');
		$('#username-inpt').focus();
	}
}

// refresh JWT and login if not already
Model.loginJWT = () => {
	const currentToken = localStorage.getItem('TOKEN');
	
	$.ajax({
		url: '/auth/loginjwt',
		method: 'POST',
		contentType: 'application/json',
		dataType: 'json',
		headers: {
			Authorization: `Bearer ${currentToken}`
		},
		success: handleSuccess
	});

	function handleSuccess(data) {		
		// update new JWT
		localStorage.setItem('TOKEN', data.authToken);
		// set user data in STORE to user data pulled from server
		STORE.user = data.user;
		View.renderLoggedIn();
	}
}

Model.storeGameScore = () => {
	const totScore = Model.getTotScore();
	const totPossible = Model.getTotPossible();
	// calculate and store game score (as percent)
	const gameScore = totScore/totPossible*100;
	
	// save score to session history
	STORE.sessionGameScores.push(gameScore);

	// if user is logged in, add game score to user's scores and save to server
	if (STORE.user) {
		STORE.user.scores.push(gameScore);
		Model.saveUserData();
	}
}

// update user data to server and refresh JWT
Model.saveUserData = () => {
	const userId = STORE.user.id;
	const currentToken = localStorage.getItem('TOKEN');
	
	$.ajax({
		url: `/users/${userId}`,
		method: 'PUT',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(STORE.user),
		headers: {
			Authorization: `Bearer ${currentToken}`
		},
		success: handleSuccess
	});

	function handleSuccess(data) {				
		// update new JWT
		localStorage.setItem('TOKEN', data.authToken);
	}
}

// log user out
Model.logOut = () => {
	// remove user from store
	STORE.user = null;
	// clear session score history
	STORE.sessionGameScores = [];
	// delete JWT
	localStorage.removeItem('TOKEN');
}

// test if user agent supports Web Speech API
Model.checkVoiceSupport = () => {
	const ua = navigator.userAgent;

	// first, test if user is on a mobile platform
		// Web Speech is technically supported by Chrome Mobile, but bugs prevent it from being usable as of app development
	// then check if annyang is successfully running
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
		STORE.voiceSupport = false;
	} else if (annyang) {
		STORE.voiceSupport = true;
	} else {
		STORE.voiceSupport = false;
	}
}

View.renderLoggedIn = () => {
	// hide log-in modal
	$('#login-modal').addClass('modal-background--fadeout');
	setTimeout(() => {
		$('#login-modal').addClass('modal-background--hidden').removeClass('modal-background--fadeout');
	}, 350);

	// clear login-fields and message
	$('#username-inpt').val('');
	$('#password-inpt').val('');
	$('#re-password-inpt').val('');
	View.loginMessage('');

	const username = STORE.user.username;
	// update dropdown/login menu
	$('#user-notice').text(username).removeClass('dropdown__item--hidden');
	$('#nav-login-logout').html('Log&nbsp;Out');

	// hide login-promo in results
	$('#login-promo').addClass('login-promo--hidden');

	// show user scoreboard in results
	$('#user-scoreboard').removeClass('scoreboard--hidden');

	// if user is already at the results screen (STORE.round === 4), generate a scoreboard
	if (STORE.round === 4) {
		View.generateUserScoreBoard();
	}
			
	// notify user of success
	View.popUp(`Logged in as ${username}`);
}

View.renderLoggedOut = () => {
	// update dropdown/login menu
	$('#user-notice').text('').addClass('dropdown__item--hidden');
	$('#nav-login-logout').html('Log&nbsp;In');

	// show login-promo in results
	$('#login-promo').removeClass('login-promo--hidden');

	// hide user scoreboard in results
	$('#user-scoreboard').addClass('scoreboard--hidden');

	// notify user of success
	View.popUp(`Logged out`);
}

// display and then remove pop-up message
View.popUp = (message) => {
	const popUp = `<div class='pop-up' hidden>${message}</div>`;
	$('body').prepend(popUp);
	$('.pop-up').slideDown(300).delay(2000).slideUp(300);
	// remove pop-up from DOM
	setTimeout(function() {
		$('.pop-up').remove();
	  }, 2600);
}

View.playAudio = (url) => {
    if (!STORE.muted) {
        const myAudio = new Audio(url);
        myAudio.play();
    }
}

// show all the correct answers at the end of a round
View.revealMissedAnswers = () => {
	for (let i = 0; i < STORE.QA.answers.length; i += 1) {
		if (STORE.QA.answers[i].guessed === false) {
			View.revealAnswer(i, false);
		}
	}
}

// show correct answer and corresponding points from specified index
View.revealAnswer = (i, guessed) => {  
	const $correctElem = $(`.answers div:nth-child(${i+1}) .answers__text`);
	
	if (guessed) {
		$correctElem.addClass('answers__text--guessed');
	} else {
		$correctElem.addClass('answers__text--revealed');
		$correctElem.next().addClass('answers__points--revealed')
	}

	$correctElem.text(STORE.QA.answers[i].display);
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
		.removeClass('guesses__icon--checked')
		.addClass('guesses__icon--x')
		.attr('aria-label', 'guess used')
		.children()
		.removeClass('fa-check')	
		.addClass('fa-times');
}

// show all guesses in 'unused' state
View.resetGuesses = () => {	
	$('.guesses__icon')
		.addClass('guesses__icon--checked')
		.removeClass('guesses__icon--x')
		.attr('aria-label', 'guess remaining')
		.children()
		.removeClass('fa-times')	
		.addClass('fa-check');
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

// clear and regenerate the game answer board
View.resetAnswerBoard = () => {
	const numAnswers = STORE.QA.answers.length;
	$('.answers').removeClass('answers--slideright').html('');
	let answer = '';
	// generate answer board rows, with timeout delay for animation effect
	for (let i = 0; i <= numAnswers; i += 1) {
		setTimeout(() => {
			if (i === numAnswers) {
				answer = 
				`<div class='answers__wrapper answers__wrapper--sum' aria-live='polite'>
					<div class='answers__blank'></div>
				 	<div class='answers__sum' aria-label='points'>0</div>
				</div>`;
			} else {
				answer = 
				`<div class='answers__wrapper' aria-live='polite'>
					<div class='answers__text'>${i+1}</div>
					<div class='answers__points'></div>
				</div>`;
			}
			$(answer).appendTo('.answers');
		}, 175*i);
	}	
}

// show user a message on the game screen
View.message = (message) => {
	$('.message').text(message);
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
	View.message('');
	$('#guess-input').focus();
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

	// if user is logged in, generate their scoreboard
	if (STORE.user) {
		View.generateUserScoreBoard();
	}
} 

// show/hide 'Show Me...' and 'Next' buttons and focus on 'Next'
View.toggleEndRound = () => {
	const $guessform = $('#guess-form');
	const $nextbtn = $('#next-btn');

	if ($guessform.hasClass('guess-form--hidden')) {
		$guessform.removeClass('guess-form--hidden');
		$nextbtn.addClass('btn--hidden');
	} else {
		$nextbtn.removeClass('btn--hidden').focus();
		$guessform.addClass('guess-form--hidden');
	}
}

// show/hide Results screen
View.toggleResultsScreen = () => {
	$('.game-container').toggleClass('game-container--hidden');
	$('.results-container').toggleClass('results-container--hidden');

	// if results container is visible, focus on "new game" btn
	if (!$('.results-container').hasClass('results-container--hidden')) {
		$('#new-game-btn').focus();
	}
}

// check voice support and render message in instructions modal
View.displayVoiceSupport = () => {

    if (STORE.voiceSupport) {
		$('#voice-support').text(
			`All aspects of the game can be controlled with your voice! Submit answers by saying "Show me" followed by your guess. Buttons can be activated by saying the words in quotes. Try it below...`);
		
		// create a microphone indicator icon
		$('.guess-form__flex-wrapper').append(`<i id='mic' class='fas fa-microphone mic' aria-hidden='true'></i>`);
		// continuously check for annyang listening and adjust mic classes
		setInterval(() => {
			if (annyang.isListening()) {
				$('#mic').removeClass('fa-microphone-slash mic--off').addClass('fa-microphone mic--on');
			} else {
				$('#mic').removeClass('fa-microphone mic--on').addClass('fa-microphone-slash mic--off');
			}
		}, 100);

		// check if micophone is enabled
        navigator.mediaDevices.getUserMedia({ audio: true },
			// success callback: clear any prior message
			function() {
				$('#mic-status').text('');
			}, 
			// error callback: notify that microphone is turned off
			function() {
				$('#mic-status').text('Voice recognition is supported, but your microphone is disabled');
			});
	} else {
		$('#voice-support').text(`Sorry, Speech Recognition is experimental and currently only supported on Google Chrome for Desktop.`);
	}
}

// show message to user in the login modal
View.loginMessage = (message) => {
	$('#login-msg').text(message).removeClass('login__msg--hidden');
}

// get user score history, sort scores, generate html for top 10 
View.generateUserScoreBoard = () => {
	let scoreboardHTML = '';
	let userScores = STORE.user.scores;
	userScores.sort((a,b) => b-a);

	let max = userScores.length;
	// show only up to top 10 scores
	if (max > 10) {
		max = 10;
	}

	for (let i = 0; i < max; i += 1) {
		scoreboardHTML += `
			<div class='scoreboard__wrapper'>
				<div class='scoreboard__num'>${i+1}.</div>
				<div class='scoreboard__score'>${userScores[i].toFixed(2)}%</div>
			</div>
		`;
	}
	$('#scoreboard-username').text(STORE.user.username);
	$('#user-scoreboard-grid').html(scoreboardHTML);
}

Controller.handleNewGameBtn = () => {
	$('#new-game-btn').click(() => {
		View.playAudio('sounds/startsound.mp3');
		SpeechController.stop();
		Model.startNextGame();
		View.toggleResultsScreen();
		View.toggleEndRound();
		SpeechController.addCommand(COMMANDS.showMe);
	});
}

Controller.handleNextBtn = () => {
	$('#next-btn').click(() => {
		SpeechController.stop();
		$('.answers').addClass('answers--slideright');
		setTimeout(() => {
			Model.endRound();
			if (STORE.round <= 3) {
				View.playAudio('sounds/startsound.mp3');
				Model.getNewQA();
				View.toggleEndRound();
			} else {
				View.playAudio('sounds/endgame.mp3');
				Model.storeGameScore();
				View.generateResults();
				View.toggleResultsScreen();
				SpeechController.addCommand(COMMANDS.newGame);
			}
		}, 300);
	});
}

Controller.handleShowMeBtn = () => {
	$('#showme-btn').click((evt) => {
		evt.preventDefault();
		let guess = $('#guess-input').val();
		// clear guess input
		$('#guess-input').val('');
		// check guess against possible answer matches
		Model.processGuess(guess);        
	});
}

Controller.handleLetsPlayBtn = () => {
	$('#lets-play-btn').click(() => {        
		View.playAudio('sounds/startsound.mp3');
		$('#instructions-modal').addClass('modal-background--fadeout');
		setTimeout(() => {
			$('#instructions-modal').addClass('modal-background--hidden').removeClass('modal-background--fadeout');
		}, 350);
		SpeechController.stop();
		View.renderGameScreen();
		Model.getNewQA();  
	});
}

Controller.handleStartBtn = () => {
	$('#start-btn').click((evt) => {
		SpeechController.stop();
		View.displayVoiceSupport();
		$('#instructions-modal').removeClass('modal-background--hidden');
		$('#lets-play-btn').focus();
		SpeechController.addCommand(COMMANDS.letsPlay);
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

	// hide on press 'esc'
	$(document).keydown(function(evt) { 	
		if (evt.which === 27) { 			
			$('#dropdown-content').addClass('dropdown__content--hidden');
		}
	});
}

Controller.handleNavLoginLogoutBtn = () => {
	$('#nav-login-logout').click(() => {
		// close the dropdown menu
		$('#dropdown-content').addClass('dropdown__content--hidden');
		
		// check if user is currently logged in or out
		if (STORE.user === null) {
			// show login modal
			$('#login-modal').removeClass('modal-background--hidden');
			$('#username-inpt').focus();
		} else {
			// logout
			Model.logOut();
			View.renderLoggedOut();
		}
	});	
}

Controller.handleCloseLoginModal = () => {
	// close on click 'x' btn
	$('#close-login-btn').click(() => {
		successCallback();
	});

	// close on click outside modal window
	$('#login-modal').click((evt) => {	
		if ($(evt.target).is($('#login-modal'))) {
			successCallback();
		}
	});
	
	// close on press 'esc'
	$(document).keydown(function(evt) { 	
		if (evt.which === 27) { 			
			successCallback();
		}
	});

	function successCallback() {
		$('#login-modal').addClass('modal-background--fadeout');
		setTimeout(() => {
			$('#login-modal').addClass('modal-background--hidden').removeClass('modal-background--fadeout');
		}, 350);
	}
}

// reconfigure modal to accept login information vs create new user information
Controller.handleSwapLoginCreateBtn = () => {

	$('#swap-login-create').click((evt) => {
		// check data attribute for current state of modal
		const modalState = $('#login-modal').data('login-create');
		
		if (modalState === 'login') {
			// swap state to 'create'
			$('#login-modal').data('login-create', 'create');
			// change heading to 'Create New User'
			$('#login-heading').text('Create New User');
			// change text of swap-login-create btn
			$('#swap-login-create').text('Already have an account?');
		} else {
			// swap state to login
			$('#login-modal').data('login-create', 'login');
			// change heading to 'Log In'
			$('#login-heading').text('Log In');
			// change text of swap-login-create
			$('#swap-login-create').text('Create a new user account');
		}

		// toggle visibility of password re-entry label/input and login/create buttons
		$('#re-password-lbl').toggleClass('login__lbl--hidden');
		$('#re-password-inpt').toggleClass('login__inpt--hidden');
		$('#create-user-btn').toggleClass('btn--hidden');
		$('#login-btn').toggleClass('btn--hidden');

		$('#username-inpt').focus();
	});
}

// attempt to creat new user with username and password input
Controller.handleCreateUserBtn = () => {
	$('#create-user-btn').click(() => {		
		const username = $('#username-inpt').val();
		const password = $('#password-inpt').val();
		const rePassword = $('#re-password-inpt').val();
		
		// check if entered password match
		if (password !== rePassword) {
			View.loginMessage('Entered passwords do not match');
			return;
		} 

		Model.createNewUser(username, password);
	});
}

// attempt to log user in with username and password input
Controller.handleLoginBtn = () => {
	$('#login-btn').click(() => {
		// clear any existing login messages
		View.loginMessage('');

		const username = $('#username-inpt').val();
		const password = $('#password-inpt').val();

		Model.logIn(username, password);
	});
}

// show login modal
Controller.handlePromoLoginBtn = () => {
	$('#login-promo-btn').click(() => {
		$('#login-modal').removeClass('modal-background--hidden');
		$('#username-inpt').focus();
	});
}

// toggle between showing full scoreboard vs round results
Controller.handleResultsScoreboardToggle = () => {
	$('#user-scoreboard').click(() => {
		successCallback();
	});

	$('#user-scoreboard').keydown((evt) => {
		if (evt.which === 13 || evt.which === 32) {
			successCallback();
		}
	});

	function successCallback() {
		if ($('#user-scoreboard-grid').is(':visible')) {
			$('#user-scoreboard-grid').slideUp(300);
			$('.results').slideDown(300);
		} else {
			$('#user-scoreboard-grid').slideDown(300);
			$('.results').slideUp(300);
		}
		$('#scoreboard__caret').toggleClass('fa-caret-left fa-caret-down');
	}
}

// initialize game and event handlers on document ready
function initialize() {
	Model.checkVoiceSupport();
    Controller.handleMuteBtn();
    SpeechController.addCommand(COMMANDS.startGame);
	Controller.handleStartBtn();
	Controller.handleLetsPlayBtn();
	Controller.handleShowMeBtn();
	Controller.handleNextBtn();
	Controller.handleNewGameBtn();
	Controller.handleDropDownBtn();
	Controller.handleNavLoginLogoutBtn();
	Controller.handleCloseLoginModal();
	Controller.handleSwapLoginCreateBtn();
	Controller.handleCreateUserBtn();
	Controller.handleLoginBtn();
	Controller.handlePromoLoginBtn();
	Controller.handleResultsScoreboardToggle();

	// if localStorage contains a JWT, refresh it and log user in
	if (localStorage.getItem('TOKEN')) {
		Model.loginJWT();
	}
}

$(initialize);