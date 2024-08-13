angular.module('app', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.tpls'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window) {
    var vm = this;

    vm.isLoading = true;

    characters = null;
    stages = null;
    zones = null;
    skins = null;
    enemy = null;

    allowed_languages = {'en_US':true, 'ja_JP':false, 'ko_KR':false, 'zh_CN':false};

    vm.characters = {}
    vm.rarities = [6, 5, 4, 3, 2, 1];
    vm.result = {}
    vm.showOptions = false;
    vm.mode = '0';
    vm.lang = 'en_US';
    vm.skins = []
    vm.score = 0
    vm.scoreIfGuessed = 0
    vm.timeLeftSeconds = 0

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

    if ($location.search().lang && allowed_languages[$location.search().lang]) {
        vm.lang = $location.search().lang;
    }
    vm.stats = {};

    var storage = window.localStorage;

    vm.options = {
        'Operators': [12, 1, 99]
    };

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

    function getDangerLevelNum(dangerLevel) {
        if (!dangerLevel || dangerLevel == '-') {
            return 999;
        }
        else if (dangerLevel[0] == 'L') {
            return Number(dangerLevel.split('.')[1])
        }
        else if (dangerLevel[6] == '1') {
            return 100 + Number(dangerLevel.split('.')[1])
        }
        else {
            return 200 + Number(dangerLevel.split('.')[1])
        }
    }

    function init() {
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
            return $.getJSON(`https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/${vm.lang}/gamedata/levels/enemydata/enemy_database.json`, function(json) {
                enemy = json;
                log(enemy);
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

    init()
    .then(function() {
        vm.isLoading = false;

        const validSkins = [];
        _.each(skins.charSkins, skin => {
            const characterName = _.get(characters, `${skin.charId}.name`)
            const skinGroupId = _.get(skin, 'displaySkin.skinGroupId')
            const skinName = _.get(skin, 'displaySkin.skinName')

            if (!_.get(skin, 'displaySkin.modelName')) {
                // skip traps, devices
                return
            }
            // if (skinGroupId == 'ILLUST_0') {
            //     // no elite0 art
            //     return
            // }

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
            validSkins.push(skin)
        })
        skins = validSkins

        $scope.$digest();
    });

    vm.test = function(isSkip) {
        const skinsArray = _.values(skins)
        const i = _.random(0, skinsArray.length - 1)
        if (skinsArray[i] == vm.skin) {
            vm.test()
        }
        if (vm.skin) {
            vm.previousSkin = vm.skin
            vm.previousScore = isSkip ? `Skipped` : `${vm.viewPortInfo.guesses + 1}x guess + ${vm.viewPortInfo.zoomStep}x zoom out = ${vm.scoreIfGuessed} points`
        }
        vm.skin = skinsArray[i]
        vm.showSkin = false
        vm.skinInput = null
        vm.timeLeftSeconds = 300
    }

    vm.testOnLoad = function($event) {
        const skinHeight = $event.target.height
        const skinWidth = $event.target.width
        vm.showSkin = true

        const centerPointX = _.random(0.4, 0.6)
        const centerPointY = _.random(0.25, 0.75)
        // const centerPointX = 0.5
        // const centerPointY = 0.5
        const zoomStep = 0

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

        if (item.portraitId == vm.skin.portraitId) {
            vm.score += vm.scoreIfGuessed
            vm.test()
        } else {
            vm.viewPortInfo.guesses = vm.viewPortInfo.guesses + 1
            updateScoreIfGuessed()
        }
    }

    const normalizeSearchableName = function(string) {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ł', 'l')
    }

    vm.typeAheadFilter = function(viewValue) {
        return function(skin) {
            if (!viewValue) {
                return false
            }
            return normalizeSearchableName(skin.searchableName).toLowerCase().includes(viewValue.toLowerCase())
        }
    }

    vm.typeAheadOrderBy = function(viewValue) {
        return function(skin) {
            if (!viewValue) {
                return -1
            }
            if (_.startsWith(normalizeSearchableName(skin.searchableName).toLowerCase(), viewValue.toLowerCase())) {
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

    vm.selectOps = function(enable, rarity) {
        _.each(vm.characters[rarity], function(char) {
            char.enabled = enable;
        })
    }

    vm.selectStages = function(enable, zoneId) {
        _.each(vm.stages[zoneId], function(stage) {
            stage.enabled = enable;
        })
    }

    vm.getZoneName = function(zoneId) {
        var r = '';
        var zoneInfo = zones.zones[zoneId];
        return zoneInfo.zoneNameFirst || zoneInfo.zoneNameSecond || 'Annihilation';
    }

    vm.getStageName = function(stage) {
        if (stage.zoneId.slice(0, 4) == 'camp') {
            return stage.name;
        }
        return stage.code;
    }

    vm.selectlanguage = function() {
        log(vm.lang);
        $window.location.href = $location.path() + '?lang=' + vm.lang;
    }

    vm.setdefault = function() {
        _.each(advancedoptionsdefault, function(option) {
            vm.advancedoptions[option[0]][0] = option[1];
        });
    }

    vm.presetbalanced = function() {
        var p = [["Max Melee operators",null],["Min Melee operators",null],["Max Ranged operators",null],["Min Ranged operators",null],["Max Vanguard operators",2],["Min Vanguard operators",2],["Max Guard operators",null],["Min Guard operators",1],["Max Sniper operators",null],["Min Sniper operators",1],["Max Defender operators",null],["Min Defender operators",1],["Max Medic operators",2],["Min Medic operators",2],["Max Supporter operators",null],["Min Supporter operators",null],["Max Caster operators",null],["Min Caster operators",1],["Max Specialist operators",null],["Min Specialist operators",null]];

        _.each(p, function(option) {
            vm.advancedoptions[option[0]][0] = option[1];
        });
    }

    vm.presethighlander = function() {
        var p = [["Max Melee operators",null],["Min Melee operators",null],["Max Ranged operators",null],["Min Ranged operators",null],["Max Vanguard operators",2],["Min Vanguard operators",2],["Max Guard operators",null],["Min Guard operators",1],["Max Sniper operators",null],["Min Sniper operators",1],["Max Defender operators",null],["Min Defender operators",1],["Max Medic operators",2],["Min Medic operators",2],["Max Supporter operators",null],["Min Supporter operators",1],["Max Caster operators",null],["Min Caster operators",1],["Max Specialist operators",null],["Min Specialist operators",1]];

        _.each(p, function(option) {
            vm.advancedoptions[option[0]][0] = option[1];
        });
    }
});

