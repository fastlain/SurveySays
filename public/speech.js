const SpeechController = {};

if (annyang) {
    annyang.debug();
}

SpeechController.start = () => {
    if (annyang) {
        annyang.start({autorestart: true});
    }
}

SpeechController.simClick  = () => {
    if (annyang) {
        $(`#${SpeechController.clickTarget}`).click();
    }
}

SpeechController.addCommand = (cmdName) => {
    if (annyang) {
        if (cmdName.clickTarget) {
            SpeechController.clickTarget = cmdName.clickTarget;
        }
        annyang.addCommands(cmdName.command);
    }
}

SpeechController.removeCommand = (cmdName) => {
    if (annyang) {
        annyang.removeCommands(cmdName.command);
    }
}

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