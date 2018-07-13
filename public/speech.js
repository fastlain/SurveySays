annyang.debug();

const SpeechController = {};

SpeechController.simClick  = () => {
    $(`#${SpeechController.clickTarget}`).click();
}

SpeechController.listen = (cmdName) => {
    if (cmdName.clickTarget) {
        SpeechController.clickTarget = cmdName.clickTarget;
    }
    annyang.addCommands(cmdName.command);
    annyang.resume();
}

SpeechController.pauseListening = () => {
    annyang.pause()
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