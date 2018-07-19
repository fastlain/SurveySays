function handleCreateForm() {
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

        handleDataEntrySubmit();
    });
}

function handleDataEntrySubmit() {
    $('#data-entry-form').submit((evt) => {
        evt.preventDefault();
        
        // check if button is disabled (form has already been submitted)
        const submitted = $('#submit-questans').attr('disabled');
        if (submitted !== 'disabled') {
            
            // disable form submission button
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

            $.ajax({
                url: '/questans',
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(formData),
                success: handleSuccess,
                error: handleError
            });
        }
    });   
}

function handleSuccess(data) {
    console.log(data);
    $('#data-entry-form').html('');
    alert('form submitted successfully');

}

function handleError(data) {
    alert('form error, please try again');
    $('#submit-questans').removeAttr('disabled');
    console.log(data);
}

function initialize() {
    handleCreateForm();
}

$(initialize);