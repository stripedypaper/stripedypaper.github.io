angular.module('app', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.tpls'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window) {
    var vm = this;

    vm.isLoading = true;
    vm.theme = 'dark'

    enemy = null;

    allowed_languages = {'en_US':true, 'ja_JP':true, 'ko_KR':true, 'zh_CN':false};

    vm.showOptions = false;
    vm.lang = 'en_US';
    vm.score = 0
    vm.maxScore = 1000
    vm.scoreIfGuessed = 0
    vm.timeLeftSeconds = -1
    vm.showHint = false

    vm.questionIndex = -1
    vm.questions = 20
    vm.errorOffset = 0

    var storage = window.localStorage;
    var alreadyGuessed = {}

    if ($location.search().lang && allowed_languages[$location.search().lang]) {
        vm.lang = $location.search().lang;
    }
    vm.stats = {};

    vm.options = {
        endless: false,
        enableE0: true,
        darkMode: storage.getItem("theme") == 'dark',
    }

    function log(...args) {
        if ($location.search().debug) {
            console.log(...args);
        }
    }

    function setImageDimension() {
        // big image should be 600px at window.innerHeight 875px or larger, shrinking by 1px per window pixel smaller
        // small image should be 300px at window.innerWidth 1255px or larger, shrinking by 0.5px per window pixel smaller
        // small image should be 300px at window.innerHeight 700px or larger, shrinking by 1px per window pixel smaller
        vm.bigImageDimension = Math.max(Math.min(600, window.innerHeight - 275), 300)
        vm.smallImageDimension = Math.max(Math.min(300, window.innerWidth / 2 - 327, window.innerHeight - 400), 150)
        vm.bigImageContainerStyle = {
            'height': vm.bigImageDimension + 'px',
            'width': vm.bigImageDimension + 'px'
        }
        vm.iconStyle = {
            'height': vm.bigImageDimension * 316/600 + 'px',
            'width': vm.bigImageDimension * 316/600 + 'px',
        }
        vm.smallImageContainerStyle = {
            'height': vm.smallImageDimension + 'px',
            'width': vm.smallImageDimension + 'px'
        }
        log('window', window.innerHeight, window.innerWidth)
        log('dimension', vm.bigImageDimension, vm.smallImageDimension)
        try {
            $scope.$digest()
        } catch (e) {}
    }

    function init() {
        const repo = vm.lang == 'zh_CN' ? 'ArknightsGameData' : 'ArknightsGameData_Yostar'
        const branch = vm.lang == 'zh_CN' ? 'master' : 'main'
        setImageDimension()
        window.addEventListener('resize', function(event) {
            setImageDimension()
        }, true)
        applyTheme()
        return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/levels/enemydata/enemy_database.json`, function(json) {
            enemy = json;
            log(enemy);
        })
        .then(function() {
            vm.isLoading = false;
        })
    }

    vm.getNextImageText = function() {
        if (vm.questionIndex < 0 || vm.questionIndex >= vm.questions) {
            return 'New game'
        } else {
            return 'Skip'
        }
    }

    const applyTheme = function() {
        const theme = vm.options.darkMode ? 'dark' : 'light'
        storage.setItem('theme', theme)
        $('body').attr("data-bs-theme", theme)
    }

    vm.toggleDarkMode = function() {
        vm.options.darkMode = !vm.options.darkMode
        applyTheme()
    }

    const processDesc = function(s) {
        var desc = s
        while (desc.search(/<.*?>(.*?)<\/>/g) >= 0) {
            //console.log(desc.search(/<.+?>(.+?)<\/>/g))
            desc = desc.replace(/<.*?>(.*?)<\/>/g, '$1')
        }
        return desc
    }

    init()
    .then(function() {
        vm.isLoading = false;

        const disallowed = {
            enemy_1540_wdncr: true,
            enemy_1313_wdfmr_2: true,
        }

        vm.enemies = []
        _.each(enemy.enemies, enemy => {
            if (!enemy.Value[0].enemyData.description.m_value) {
                return
            }
            if (disallowed[enemy.Key]) {
                return
            }
            enemy.searchableName = enemy.Value[0].enemyData.name.m_value
            enemy.description = processDesc(enemy.Value[0].enemyData.description.m_value)
            enemy.url = 'https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/refs/heads/cn/assets/torappu/dynamicassets/arts/enemies/' + enemy.Key + '.png'
            vm.enemies.push(enemy)
        })
        vm.enemies = _.uniqBy(vm.enemies, 'searchableName')
        console.log(vm.enemies)

        $scope.$digest();
    });

    var timer = null
    vm.test = function(isSkip) {
        if (vm.questionIndex >= vm.questions) {
            console.log('resetting game')
            vm.questionIndex = -1
            vm.score = 0
            vm.errorOffset = 0
            vm.previousEnemy = null
        }
        if (vm.questionIndex < 0) {
            vm.enemies = _.shuffle(vm.enemies)
            log(vm.enemies)
        }
        if (vm.questionIndex >= 0) {
            const currentEnemy = vm.enemies[vm.questionIndex + vm.errorOffset]
            vm.previousEnemy = currentEnemy
        }
        vm.questionIndex += 1

        if (isSkip) {
            vm.previousScore = 'Skipped'
        } else {
            var string = `${vm.viewPortInfo.guesses + 1}x guess`
            if (vm.showHint) {
                string += ' + hint'
            }
            string += ` = ${vm.scoreIfGuessed} points`
            vm.previousScore = string
        }
        vm.showSkin = false
        vm.skinInput = null
        vm.showHint = false
        alreadyGuessed = {}
    }

    vm.getTimeText = function() {
        if (vm.timeLeftSeconds < 0) {
            return 'Time\'s up!'
        } else {
            return moment.duration(vm.timeLeftSeconds * 1000).format('mm:ss', {
                trim: false
            })
        }
    }

    vm.testOnLoad = function($event) {
        vm.showSkin = true
        vm.viewPortInfo = {
            guesses: 0,
        }
        updateScoreIfGuessed()
    }

    vm.onError = function($event) {
        console.log(vm.enemies[vm.questionIndex + vm.errorOffset], 'image did not load, increasing errorOffset')
        vm.errorOffset += 1
    }

    vm.selectSkin = function(item) {
        vm.skinInput = null

        if (vm.questionIndex >= vm.questions) {
            return
        }
        
        const currentEnemy = vm.enemies[vm.questionIndex + vm.errorOffset]
        if (item.Key == currentEnemy.Key) {
            vm.score += vm.scoreIfGuessed
            vm.test()
        } else {
            vm.viewPortInfo.guesses = vm.viewPortInfo.guesses + 1
            alreadyGuessed[item.Key] = true
            updateScoreIfGuessed()
        }
    }

    const normalizeString = function(string) {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ł', 'l')
    }

    vm.typeAheadFilter = function(viewValue) {
        return function(enemy) {
            if (!viewValue) {
                return false
            }
            if (alreadyGuessed[enemy.Key]) {
                return false
            }
            return normalizeString(enemy.searchableName).toLowerCase().includes(normalizeString(viewValue).toLowerCase())
        }
    }

    vm.typeAheadOrderBy = function(viewValue) {
        return function(enemy) {
            if (!viewValue) {
                return -1
            }
            if (_.startsWith(normalizeString(enemy.searchableName).toLowerCase(), normalizeString(viewValue).toLowerCase())) {
                return enemy.searchableName.length
            } else {
                return enemy.searchableName.length + 1000
            }
        }
    }

    const updateScoreIfGuessed = () => {
        const guesses = vm.viewPortInfo.guesses
        var guessMultiplier = 1
        var hintMultiplier = vm.showHint ? 0.5 : 1
        if (guesses == 1) {
            guessMultiplier = 0.9
        } else if (guesses > 1) {
            guessMultiplier = Math.max(0.5, 1 - guesses * 0.1)
        }
        vm.scoreIfGuessed = Math.ceil(50 * guessMultiplier * hintMultiplier)
    }


    vm.toggleconfig = function() {
        vm.showOptions = !vm.showOptions;
    }

    vm.toggle = function(name) {
        vm[name] = !vm[name];
    }

    vm.selectlanguage = function() {
        log(vm.lang);
        $window.location.href = $location.path() + '?lang=' + vm.lang;
    }

    vm.toggleHint = function() {
        vm.showHint = true
        updateScoreIfGuessed()
    }
});

