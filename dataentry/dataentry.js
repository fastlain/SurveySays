function handleCreateForm() {
    $('#num-answers-form').submit((evt) => {
        evt.preventDefault();
        $('#data-entry-form').removeClass('data-entry__form--hidden');
        $('#data-entry-form').html(
            `<h3>Survey Question:</h3>
            <div class='data-entry__wrapper'>
                <label for='question-inpt'>Survey Question:</label>
                <input id='question-inpt' class='data-entry__input' type='text' value='test'>
            </div>`
        );
        const numAns = $('#num-answers-inpt').val();
        for (let i = 0; i < numAns; i += 1) {
            $('#data-entry-form').append(`
                <h3 class='answer'>Answer #${i+1}</h3>
                <div class='data-entry__wrapper'>
                    <label for='display-inpt${i+1}'>Answer to display:</label>
                    <input id='display-inpt${i+1}' class='data-entry__input' type='text' required value='test${i+1}'>
                </div>
                <div class='data-entry__wrapper'>
                    <label for='matches-inpt${i+1}'>Answer matches:</label>
                    <input id='matches-input${i+1}' class='data-entry__input' type='text' placeholder='apple, banana' required value='test${i+1}, test${i+2}, test${i+3}'>
                </div>
                <div class='data-entry__wrapper'>
                    <label for='points-input${i+1}'>Points: </label>
                    <input id='points-input${i+1}' class='data-entry__input' type='number' required value='${25-i}'>
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
            method: 'POST',
            dataType: 'json',
            data: formData,
            success: handleSuccess,
            error: handleError
        });
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