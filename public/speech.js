annyang.debug();

Controller.pauseListening = () => {
    annyang.pause()
}

Controller.clearSpeechCommands = () => {
    annyang.removeCommands();
}

Controller.listenFrontPage = () => {
    const startGameCommand = {
        'start (game)': simClickStart,
    };
    annyang.addCommands(startGameCommand);
    annyang.start();
}

Controller.listenShowMe = () => {
    console.log('listening for show me');
    
    const showMeCommand = {
        'show me *guess': Model.processGuess
    };
    annyang.addCommands(showMeCommand);
    annyang.resume();
}

Controller.listenNext = () => {
    console.log('listening for next)');
    const nextCommand = {
        'next': simClickNext
    };
    annyang.addCommands(nextCommand);
    annyang.resume();
}

Controller.listenNewGame = () => {
    const newGameCommand = {
        'new game': simClickNewGame
    };
    annyang.addCommands(newGameCommand);
    annyang.resume();
}

function simClickStart() {
    annyang.pause();
    annyang.removeCommands();
    $('#start-btn').click();
}

function simClickNext() {
    annyang.pause();
    annyang.removeCommands();
    $('#next-btn').click();
}

function simClickNewGame() {
    annyang.pause();
    annyang.removeCommands();
    $('#new-game-btn').click();
}

// function simClickNext() {
//     $('#next-btn').click();
//     annyang.pause();
//     annyang.removeCommands();
// }

// const startGameCommand = {
//     'start (game)': simClickStart,
//     'next': simClickNext
// };

// annyang.addCommands(startGameCommand);
// annyang.start({autoRestart: true});
