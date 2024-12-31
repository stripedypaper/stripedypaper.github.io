angular.module('app')
.constant('strings', {
    'en_US': {
        loadingResources: 'Loading resources...',
        arknightsGuesserTitle: 'Arknights Guesser (beta)',
        darkMode: 'Dark mode',
        showMore: 'Show more',
        previousImage: 'Previous image',
        scoreIncreaseIfGuessed: 'Score increase if guessed',
        currentScore: 'Current score',
        timeRemaining: 'Time remaining',
        enableOperatorE0Art: 'Enable operator E0 art',
        enableOperatorE2Art: 'Enable operator E2 art',
        enableOperatorSkinArt: 'Enable operator skin art',
        endlessMode: 'Endless mode',
        avoidBadZoomOption: 'Try to avoid zooming in on blank area (experimental)',
        newGame: 'New game',
        skip: 'Skip',
        skipped: 'Skipped',
        e0: 'E0',
        e1: 'E1',
        e2: 'E2',
        // below 3 strings are used like this: `#x guess + #x zoom out = # points`
        guesses: 'guess',
        zoomOuts: 'zoom out',
        points: 'points',
        timesUp: 'Time\'s up!',
    }
})
