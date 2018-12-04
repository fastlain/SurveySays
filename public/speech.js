const SpeechController = {};

// stop listening and remove commands
SpeechController.stop = () => {
    if (STORE.voiceSupport) {
        annyang.removeCommands();
        annyang.abort();
    }
}

// simulate a button click on the target
SpeechController.simClick  = () => {
    if (STORE.voiceSupport) {
        $(`#${SpeechController.clickTarget}`).click();
    }
}

// add a voice command and start listening
SpeechController.addCommand = (cmdName) => {
    if (STORE.voiceSupport) {
        if (cmdName.clickTarget) {
            SpeechController.clickTarget = cmdName.clickTarget;
        }
        annyang.addCommands(cmdName.command);
        annyang.start({autorestart: true});
    }
}

// data store for speech commands
const COMMANDS = {
    startGame: {
        command: {'start (game)': SpeechController.simClick },
        clickTarget: 'start-btn'
    },
    letsPlay: {
        command: {'(let\'s) play': SpeechController.simClick},
        clickTarget: 'lets-play-btn'
    },
    showMe: {
        command: {'show me *guess': Model.processGuess}
    },
    next: {
        command: {'next': SpeechController.simClick},
        clickTarget: 'next-btn'
    },
    newGame: {
        command: {'new game': SpeechController.simClick},
        clickTarget: 'new-game-btn'
    }
}