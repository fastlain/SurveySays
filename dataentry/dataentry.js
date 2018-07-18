function handleCreateForm() {
    $('#num-answers-form').submit((evt) => {
        evt.preventDefault();
        $('#data-entry-form').show();
        $('#data-entry-form').html(
            `<h3>Survey Question:</h3>
            <label for='question-inpt'>Survey Question: (String)</label>
            <input id='question-inpt' type='text' value='test'>`
        );
        const numAns = $('#num-answers-inpt').val();
        for (let i = 0; i < numAns; i += 1) {
            $('#data-entry-form').append(`
                <h3 class='answer'>Answer #${i+1}</h3>
                <label for='display-inpt${i+1}'>Answer to display: (String)</label>
                <input id='display-inpt${i+1}' type='text' required value='test${i+1}'>
                <br>
                <label for='matches-inpt${i+1}'>Answer matches: (Comma-separated list of strings)</label>
                <input id='matches-input${i+1}' type='text' placeholder='apple, banana' required value='test${i+1}, test${i+2}, test${i+3}'>
                <br>
                <label for='points-input${i+1}'>Points: (Number)</label>
                <input id='points-input${i+1}' type='number' required value='${25-i}'>
            `);
        }
        $('#data-entry-form').append(`<button id='submit-questans' type="submit">Submit</button>`);

        handleDataEntrySubmit();
    });
}

function handleDataEntrySubmit() {
    $('#data-entry-form').submit((evt) => {
        evt.preventDefault();
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
    alert('form submitted successfully');
    $('#data-entry-form').html('');
}

function handleError(data) {
    alert('form error, please try again');
    console.log(data);
}

function initialize() {
    handleCreateForm();
}

$(initialize);