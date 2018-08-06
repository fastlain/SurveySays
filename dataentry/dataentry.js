 'use strict';

 const STORE = {
     user: null
 }

const Model = {};
const View = {};
const Controller = {};

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
        // check if user is an admin
        const isAdmin = data.user.admin;

        if (isAdmin) {
            STORE.user = data.user;
            localStorage.setItem('TOKEN', data.authToken);
            View.renderLoggedIn();
        } else {
            View.loginMessage('Sorry, only administrators can submit new questions.');
        }

	}

	function handleError(err) {
		console.log(err);
		View.loginMessage('Invalid username or password');
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

// log user out
Model.logOut = () => {
	// remove user from store
	STORE.user = null;
	// delete JWT
	localStorage.removeItem('TOKEN');
}

View.renderLoggedIn = () => {
	// hide log-in modal
	$('#login-modal').addClass('modal-background--hidden');

	// clear login-fields and message
	$('#username-inpt').val('');
	$('#password-inpt').val('');
	View.loginMessage('');

    // hide data entry page login btn
    $('#data-entry-login-btn').addClass('btn--hidden');

    // show question entry form
    $('#num-answers-form').removeClass('data-entry__form--hidden');

	const username = STORE.user.username;
	// update dropdown/login menu
	$('#user-notice').text(username).removeClass('dropdown__item--hidden');
	$('#nav-login-logout').html('Log&nbsp;Out');
			
	// notify user of success
	View.popUp(`Logged in as ${username}`);
}

View.renderLoggedOut = () => {
	// update dropdown/login menu
	$('#user-notice').text('').addClass('dropdown__item--hidden');
	$('#nav-login-logout').html('Log&nbsp;In');

    // show data entry page login btn
    $('#data-entry-login-btn').removeClass('btn--hidden');

    // hide data entry forms
    $('#num-answers-form, #data-entry-form').addClass('data-entry__form--hidden');

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

// show specified alert on the login modal
View.loginMessage = (message) => {
	$('#login-msg').text(message).removeClass('login__msg--hidden');
}

// generate data entry form for new question/answers
Controller.handleCreateForm = () => {
    $('#num-answers-form').submit((evt) => {
        evt.preventDefault();
        $('#data-entry-form').removeClass('data-entry__form--hidden');
        $('#data-entry-form').html(
            `<h3>Survey Question:</h3>
            <div class='data-entry__wrapper'>
                <label for='question-inpt'>Survey Question:</label>
                <textarea id='question-inpt' class='data-entry__input data-entry__input--tall' type='text'></textarea>
            </div>`
        );
        const numAns = $('#num-answers-inpt').val();
        for (let i = 1; i <= numAns; i += 1) {
            $('#data-entry-form').append(`
                <h3 class='answer'>Answer #${i}</h3>
                <div class='data-entry__wrapper'>
                    <label for='display-inpt${i}'>Answer to display:</label>
                    <input id='display-inpt${i}' class='data-entry__input' type='text' required>
                </div>
                <div class='data-entry__wrapper'>
                    <label for='matches-inpt${i}'>Answer matches:</label>
                    <input id='matches-input${i}' class='data-entry__input' type='text' required>
                </div>
                <div class='data-entry__wrapper'>
                    <label for='points-input${i}'>Points: </label>
                    <input id='points-input${i}' class='data-entry__input' type='number' required>
                </div>
            `);
        }
        $('#data-entry-form').append(`<button id='submit-questans' class='btn btn--centered btn--margins' type="submit">Submit</button>`);

        Controller.handleDataEntrySubmit();
    });
}

Controller.handleDataEntrySubmit = () => {
    $('#data-entry-form').submit((evt) => {
        evt.preventDefault();
        
        // ensure a user is logged in
        if (STORE.user == null) {
            View.popUp('You must be logged in as an administrator to submit questions');
        } else {

            // check if button is disabled (form has already been submitted)
            const submitted = $('#submit-questans').attr('disabled');
            if (submitted !== 'disabled') {
                
                // disable form submission button to prevent multiple submissions
                $('#submit-questans').attr('disabled','disabled');
                
                const formData = {
                    question: $('#question-inpt').val(),
                    answers: []
                };
                const numAns = $('.answer').length;
                for (let i = 0; i < numAns; i += 1) {
                    const ans = {
                        display: $(`#display-inpt${i+1}`).val(),
                        matches: $(`#matches-input${i+1}`).val().split(',').map((elem) => elem.trim()),
                        pts: $(`#points-input${i+1}`).val()
                    };
                    formData.answers.push(ans);
                }            

                const currentToken = localStorage.getItem('TOKEN');

                $.ajax({
                    url: '/questans',
                    method: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify(formData),
                    headers: {
                        Authorization: `Bearer ${currentToken}`
                    },
                    success: handleSuccess,
                    error: handleError
                });
            }
        }
       
        function handleSuccess(data) {
            $('#data-entry-form').html('');
            View.popUp('Form submitted successfully');

        }

        function handleError(err) {
            View.popUp('Form error, please try again');
            $('#submit-questans').removeAttr('disabled');
            console.log(err);
        }

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

Controller.handleNavLoginLogoutBtn = () => {
	$('#nav-login-logout, #data-entry-login-btn').click(() => {
		// close the dropdown menu
		$('#dropdown-content').addClass('dropdown__content--hidden');
		
		// check if user is currently logged in or out
		if (STORE.user === null) {
			// show login modal
			$('#login-modal').removeClass('modal-background--hidden');
		} else {
			// logout
			Model.logOut();
			View.renderLoggedOut();
		}
	});	
}

// Close login modal by clicking "x", pressing 'escape', or click outside modal
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

Controller.handleLoginBtn = () => {
	$('#login-btn').click(() => {
		// clear any existing login messages
		View.loginMessage('');

		const username = $('#username-inpt').val();
		const password = $('#password-inpt').val();

		Model.logIn(username, password);
	});
}


function initialize() {
    Controller.handleCreateForm();
    Controller.handleDropDownBtn();
	Controller.handleNavLoginLogoutBtn();
	Controller.handleCloseLoginModal();
    Controller.handleLoginBtn();
    
    // if localStorage contains a JWT, refresh it and log user in
	if (localStorage.getItem('TOKEN')) {
		Model.loginJWT();
	}
}

$(initialize);