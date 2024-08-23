angular.module('app', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.tpls'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window) {
    var vm = this;

    vm.isLoading = true;
    vm.theme = 'dark'

    characters = null;
    stages = null;
    zones = null;
    skins = null;

    allowed_languages = {'en_US':true, 'ja_JP':true, 'ko_KR':true, 'zh_CN':false};

    vm.characters = {}
    vm.rarities = [6, 5, 4, 3, 2, 1];
    vm.result = {}
    vm.showOptions = false;
    vm.mode = '0';
    vm.lang = 'en_US';
    vm.skins = []
    vm.score = 0
    vm.scoreIfGuessed = 0
    vm.timeLeftSeconds = -1

    const scoreAtZoom = {
        0: 50,
        1: 30,
        2: 15,
        3: 10,
        4: 5,
    }
    const maxDimensionAtZoom = {
        0: 12000, // 9600 12800
        1: 5600, // 4800 6400
        2: 2600, // 2400 3200
        3: 1200, // 1200 1600
        4: 600, // 600 800
    }
    var alreadyGuessed = {}

    if ($location.search().lang && allowed_languages[$location.search().lang]) {
        vm.lang = $location.search().lang;
    }
    vm.stats = {};

    var storage = window.localStorage;

    vm.options = {
        endless: false,
        enableE0: true,
        darkMode: storage.getItem("theme") == 'dark',
        enableBadZoomCheck: false,
    }

    const skinGroupIdFriendlyName = {
        'ILLUST_0': 'E0',
        'ILLUST_1': 'E1',
        'ILLUST_2': 'E2',
    };

    function log(message) {
        if ($location.search().debug) {
            console.log(message);
        }
    }

    function init() {
        applyTheme()
        return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/${vm.lang}/gamedata/excel/character_table.json`, function(json) {
            characters = json;
            log(characters);
        })
        .then(function() {
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/${vm.lang}/gamedata/excel/skin_table.json`, function(json) {
                skins = json;
                log(skins);
            })
        })
        .then(function() {
            vm.isLoading = false;
        })
    }

    function save() {
        var enabled_operators = _.filter(characters, 'enabled');
        var enabled_map = {};
        _.each(enabled_operators, function(operator) {
            enabled_map[operator.name] = true;
        });
        // storage.setItem('enabled_operators' + vm.lang, JSON.stringify(enabled_map));

        var enabled_stages = _.filter(stages.stages, 'enabled');
        var enabled_stage_map = {};
        _.each(enabled_stages, function(stage) {
            enabled_stage_map[stage.stageId] = true;
        });
        // storage.setItem('enabled_stages' + vm.lang, JSON.stringify(enabled_stage_map));
        console.info("saved", enabled_map, enabled_stages);
    }

    vm.getNextImageText = function() {
        if (!vm.skin || vm.timeLeftSeconds < 0) {
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

    const setSkins = function() {
        vm.skins = []
        _.each(skins.charSkins, skin => {
            const characterName = _.get(characters, `${skin.charId}.name`)
            const skinGroupId = _.get(skin, 'displaySkin.skinGroupId')
            const skinName = _.get(skin, 'displaySkin.skinName')

            if (!_.get(skin, 'displaySkin.modelName')) {
                // skip traps, devices
                return
            }
            if (skinGroupId == 'ILLUST_0' && vm.options.enableE0 == false) {
                // no elite0 art
                return
            }

            if (skin.skinId == 'char_512_aprot#1') {
                // shalem has 2 identical e0 arts, this and char_4025_aprot2#1
                return
            }

            var portraitIdFixed = skin.portraitId.replace('#', '%23')
            if (portraitIdFixed == 'char_298_susuro_summer%236') {
                portraitIdFixed = 'char_298_susuro_summer%236unsus'
            }
            if (portraitIdFixed == 'char_1001_amiya2_2') {
                skin.searchableName = `${characterName}* (${skinGroupIdFriendlyName[skinGroupId] || skinName})`
            } else {
                skin.searchableName = `${characterName} (${skinGroupIdFriendlyName[skinGroupId] || skinName})`
            }
            skin.url = 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/' + portraitIdFixed + '.png';
            vm.skins.push(skin)
        })
    }

    init()
    .then(function() {
        vm.isLoading = false;

        $scope.$digest();
    });

    var timer = null
    vm.test = function(isSkip) {
        if (vm.timeLeftSeconds < 0) {
            setSkins()
        }

        const skinsArray = _.values(vm.skins)
        const i = _.random(0, skinsArray.length - 1)
        if (skinsArray[i] == vm.skin) {
            vm.test(isSkip)
            return
        }
        if (vm.skin) {
            vm.previousSkin = vm.skin
        }
        if (isSkip) {
            vm.previousScore = 'Skipped'
            vm.previousViewPortInfo = null
        } else {
            vm.previousScore = `${vm.viewPortInfo.guesses + 1}x guess + ${vm.viewPortInfo.zoomStep}x zoom out = ${vm.scoreIfGuessed} points`
            // calculate zoom for smaller viewport
            
            vm.previousViewPortInfo = _.clone(vm.viewPortInfo)
            const isLast = vm.viewPortInfo.zoomStep >= 4
            vm.previousViewPortInfo.maxDimension = maxDimensionAtZoom[vm.viewPortInfo.zoomStep] / 2 // half size
            const centerPointX = isLast ? 0.5 : vm.viewPortInfo.centerPointX
            const centerPointY = isLast ? 0.5 : vm.viewPortInfo.centerPointY
            const scale = vm.previousViewPortInfo.maxDimension / Math.max(vm.viewPortInfo.originalHeight, vm.viewPortInfo.originalWidth)
            const scaledHeight = scale * vm.viewPortInfo.originalHeight
            const scaledWidth = scale * vm.viewPortInfo.originalWidth
            const rightOffset = centerPointX * scaledWidth - 150
            const bottomOffset = centerPointY * scaledHeight - 150
            vm.previousViewPortInfo.style = {
                'height': scaledHeight + 'px',
                'width': scaledWidth + 'px',
                'right': rightOffset + 'px',
                'bottom': bottomOffset + 'px'
            }
        }
        vm.skin = skinsArray[i]
        vm.showSkin = false
        vm.skinInput = null
        alreadyGuessed = {}

        if (vm.timeLeftSeconds < 0) {
            vm.timeLeftSeconds = 300
            vm.score = 0
            vm.previousSkin = null
            if (timer) {
                $interval.cancel(timer)
            }
            if (vm.options.endless) {
                return
            }
            timer = $interval(() => {
                // pause timer when loading
                if (vm.showSkin) {
                    vm.timeLeftSeconds = vm.timeLeftSeconds - 0.25
                }
            }, 250)
        }
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
        const skinHeight = $event.target.height
        const skinWidth = $event.target.width
        vm.showSkin = true

        const zoomStep = 0
        // var centerPointX = _.random(0.4, 0.6)
        // var centerPointY = _.random(0.20, 0.75)
        var centerPointX = _.random(0.20, 0.80)
        var centerPointY = _.random(0.10, 0.90)
        if (vm.options.enableBadZoomCheck) {
            centerPointX = _.random(0.20, 0.80)
            centerPointY = _.random(0.10, 0.90)

            // try to find a zoom that isn't mostly blank pixels
            var acceptableZoom = false
            var retries = 0
            const maxRetries = 10
            while (!acceptableZoom && retries < maxRetries) {
                const canvas = document.getElementById('canvas')
                const ctx = canvas.getContext('2d', { willReadFrequently: true })
                const viewPortSize = maxDimensionAtZoom[4] / maxDimensionAtZoom[0] * Math.max(skinHeight, skinWidth)
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage($event.target, centerPointX * skinWidth - viewPortSize / 2, centerPointY * skinHeight - viewPortSize / 2, viewPortSize, viewPortSize, 0, 0, 32, 32)
                const totalPixels = 32 * 32
                var blankPixels = 0
                for (var i = 0; i < 32; i++) {
                    for (var j = 0; j < 32; j++) {
                        const data = ctx.getImageData(i, j, 1, 1).data
                        if (data[0] == 0 && data[1] == 0 && data[2] == 0 & data[3] == 0) {
                            blankPixels += 1
                        }
                    }
                }
                if (blankPixels / totalPixels > 0.5) {
                    console.log('Image was too many blank pixels, picking another zoom', blankPixels, totalPixels)
                    const canvas2 = document.getElementById('canvas2')
                    const ctx2 = canvas2.getContext('2d', { willReadFrequently: true })
                    ctx2.clearRect(0, 0, canvas2.width, canvas2.height)
                    ctx2.drawImage($event.target, centerPointX * skinWidth - viewPortSize / 2, centerPointY * skinHeight - viewPortSize / 2, viewPortSize, viewPortSize, 0, 0, 32, 32)
                    centerPointX = _.random(0.20, 0.80)
                    centerPointY = _.random(0.20, 0.80)
                    retries += 1
                } else {
                    acceptableZoom = true
                }

            } 
        }

        // make the image's largest dimension = 12800

        vm.viewPortInfo = {
            originalHeight: skinHeight,
            originalWidth: skinWidth,
            maxDimension: maxDimensionAtZoom[0],
            centerPointX,
            centerPointY,
            zoomStep,
            guesses: 0,
        }

        const scale = vm.viewPortInfo.maxDimension / Math.max(vm.viewPortInfo.originalHeight, vm.viewPortInfo.originalWidth)
        const scaledHeight = scale * vm.viewPortInfo.originalHeight
        const scaledWidth = scale * vm.viewPortInfo.originalWidth
        const rightOffset = centerPointX * scaledWidth - 300
        const bottomOffset = centerPointY * scaledHeight - 300
        vm.viewPortInfo.style = {
            'height': scaledHeight + 'px',
            'width': scaledWidth + 'px',
            'right': rightOffset + 'px',
            'bottom': bottomOffset + 'px'
        }

        updateScoreIfGuessed()
    }

    vm.selectSkin = function(item) {
        vm.skinInput = null

        if (vm.timeLeftSeconds < 0) {
            return
        }
        
        if (item.portraitId == vm.skin.portraitId) {
            vm.score += vm.scoreIfGuessed
            vm.test()
        } else {
            vm.viewPortInfo.guesses = vm.viewPortInfo.guesses + 1
            alreadyGuessed[item.portraitId] = true
            updateScoreIfGuessed()
        }
    }

    const normalizeString = function(string) {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ł', 'l')
    }

    vm.typeAheadFilter = function(viewValue) {
        return function(skin) {
            if (!viewValue) {
                return false
            }
            if (alreadyGuessed[skin.portraitId]) {
                return false
            }
            return normalizeString(skin.searchableName).toLowerCase().includes(normalizeString(viewValue).toLowerCase())
        }
    }

    vm.typeAheadOrderBy = function(viewValue) {
        return function(skin) {
            if (!viewValue) {
                return -1
            }
            if (_.startsWith(normalizeString(skin.searchableName).toLowerCase(), normalizeString(viewValue).toLowerCase())) {
                return skin.searchableName.length
            } else {
                return skin.searchableName.length + 1000
            }
        }
    }

    vm.showMore = function() {
        if (vm.viewPortInfo) {
            vm.viewPortInfo.zoomStep += 1

            if (vm.viewPortInfo.zoomStep > 4) {
                return
            }

            const isLast = vm.viewPortInfo.zoomStep >= 4
            vm.viewPortInfo.maxDimension = maxDimensionAtZoom[vm.viewPortInfo.zoomStep]
            const centerPointX = isLast ? 0.5 : vm.viewPortInfo.centerPointX
            const centerPointY = isLast ? 0.5 : vm.viewPortInfo.centerPointY
            const scale = vm.viewPortInfo.maxDimension / Math.max(vm.viewPortInfo.originalHeight, vm.viewPortInfo.originalWidth)
            const scaledHeight = scale * vm.viewPortInfo.originalHeight
            const scaledWidth = scale * vm.viewPortInfo.originalWidth
            const rightOffset = centerPointX * scaledWidth - 300
            const bottomOffset = centerPointY * scaledHeight - 300
            vm.viewPortInfo.style = {
                'height': scaledHeight + 'px',
                'width': scaledWidth + 'px',
                'right': rightOffset + 'px',
                'bottom': bottomOffset + 'px'
            }

            updateScoreIfGuessed()
        }
    }

    const updateScoreIfGuessed = () => {
        const guesses = vm.viewPortInfo.guesses
        var guessMultiplier = 1
        if (guesses == 1) {
            guessMultiplier = 0.9
        } else if (guesses > 1) {
            guessMultiplier = Math.max(0.5, 1 - guesses * 0.1)
        }
        vm.scoreIfGuessed = Math.ceil(scoreAtZoom[vm.viewPortInfo.zoomStep] * guessMultiplier)
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
});

