angular.module('app')
.constant('strings', {
    'en_US': {
        loadingResources: 'Loading resources...',
        arknightsGuesserTitle: 'Arknights Guesser (beta)',
        darkMode: 'Dark mode',
        guessTheOperator: 'Guess the operator & skin',
        showMore: 'Show more',
        previousImage: 'Previous image',
        scoreIncreaseIfGuessed: 'Score increase if guessed',
        currentScore: 'Current score',
        timeRemaining: 'Time remaining',
        options: 'Options',
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
        dailyChallenge: 'Daily challenge',
        newChallenge: 'New challenge',
        optionsDesc1: 'These options don\'t affect the daily challenge.',
        guessesLeft: 'Guesses left',
        giveUp: 'Give up',
        challengeFailed: 'You didn\'t guess the operator and skin. 🥺',
        challengeWon1: 'You won in 1 guess!',
        challengeWon: 'You won in {} guesses!',
        dailyShareTitle: 'Arknights Guesser Daily Challenge {}',
        dailyShareOneGuess: 'Won on the first guess!',
        dailyShareMultipleGuesses:  'Won in {} guesses',
        copy: 'Copy',
        guard: 'Guard',
        medic: 'Medic',
        dateText: 'Current date for daily challenge: {} (resets at 11:00 UTC, next reset in {})',
    },
    'ja_JP': {
        guard: '前衛',
        medic: '医療',
    },
    'ko_KR': {
        guard: '가드',
        medic: '메딕',
    },
    'zh_CN': {
        loadingResources: '正在加载资源...',
        arknightsGuesserTitle: '明日方舟干员猜图 (测试版)',
        darkMode: '暗黑模式',
        guessTheOperator: 'Guess the operator & skin', // todo
        showMore: '显示更多',
        previousImage: '上一张图片',
        scoreIncreaseIfGuessed: '猜中时得分增加',
        currentScore: '当前得分',
        timeRemaining: '剩余时间',
        options: '选项',
        enableOperatorE0Art: '启用干员未精英化立绘',
        enableOperatorE2Art: '启用干员精英化二立绘',
        enableOperatorSkinArt: '启用干员皮肤立绘',
        endlessMode: '无尽模式',
        avoidBadZoomOption: '尝试避免放大空白区域（实验性）',
        newGame: '新游戏',
        skip: '跳过',
        skipped: '已跳过',
        e0: 'E0',
        e1: 'E1',
        e2: 'E2',
        // below 3 strings are used like this: `#x guess + #x zoom out = # points`
        guesses: '次猜测',
        zoomOuts: '次缩小',
        points: '分数',
        timesUp: '时间到！',
        dailyChallenge: '每日挑战', 
        newChallenge: '新挑战',
        optionsDesc1: '这些选项将不在每日挑战中生效', 
        guessesLeft: '剩余猜测次数', 
        giveUp: '放弃', 
        challengeFailed: '你没有猜中干员或皮肤哦🥺', 
        challengeWon1: '一发入魂！', 
        challengeWon: '你在第{}次猜测中猜中啦！', 
        dailyShareTitle: '明日方舟每日干员猜图挑战{}', 
        dailyShareOneGuess: '一发入魂！', 
        dailyShareMultipleGuesses:  '在第{}次猜测中猜中！', 
        copy: '复制到剪贴板', 
        guard: '近卫',
        medic: '医疗',
    }
})
.service('translate', function(strings) {
    var lang = 'en_US'
    this.setLang = function(newLang) {
        lang = newLang
    }
    this.translate = function(stringKey, args = []) {
        var string = (strings[lang] || strings['en_US'])[stringKey] || strings['en_US'][stringKey] || stringKey
        for (var arg of args) {
            string = string.replace('{}', arg)
        }
        return string
    }
})
