angular.module('app', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.tpls'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window, strings, translate, dailySequence, faceLocations) {
    var vm = this;

    vm.isLoading = true;
    vm.theme = 'dark'

    characters = null;
    stages = null;
    zones = null;
    skins = null;

    allowed_languages = {'en_US':true, 'ja_JP':true, 'ko_KR':true, 'zh_CN':true};

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
    vm.challengeStep = 0
    vm.gameType = 0
    vm.isDailyChallenge = false

    const currentDay = new Date()
    const seed = `${currentDay.getMonth() + 1}/${currentDay.getDate()}/${currentDay.getFullYear()}`
    currentDay.setHours(0, 0, 0, 0)
    const baseDay = new Date('12/31/2024')
    const diffDays = Math.round((currentDay - baseDay) / 86400000) // this probably handles daylight savings
    const dailySkinId = dailySequence[diffDays]
    const seededRng = new Chance(seed)
    console.log('seed', seed, seededRng)

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
        enableE2: true,
        enableSkin: true,
        darkMode: storage.getItem("theme") == 'dark',
        enableBadZoomCheck: true,
    }

    const skinGroupIdFriendlyName = {
        'ILLUST_0': 'E0',
        'ILLUST_1': 'E1',
        'ILLUST_2': 'E2',
    };

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
        vm.smallImageContainerStyle = {
            'height': vm.smallImageDimension + 'px',
            'width': vm.smallImageDimension + 'px'
        }
        vm.extraSmallImageContainerStyle = {
            'height': vm.bigImageDimension/3 + 'px',
            'width': vm.bigImageDimension/3 + 'px',
        }
        log('window', window.innerHeight, window.innerWidth)
        log('dimension', vm.bigImageDimension, vm.smallImageDimension)
    }

    function log(message) {
        if ($location.search().debug) {
            console.log(message);
        }
    }

    function init() {
        translate.setLang(vm.lang)
        vm.translate = translate.translate

        const repo = vm.lang == 'zh_CN' ? 'ArknightsGameData' : 'ArknightsGameData_Yostar'
        const branch = vm.lang == 'zh_CN' ? 'master' : 'main'
        setImageDimension()
        window.addEventListener('resize', function(event) {
            setImageDimension()
        }, true)
        applyTheme()
        return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/character_table.json`, function(json) {
            characters = json;
            log(characters);
        })
        .then(function() {
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/skin_table.json`, function(json) {
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
            return vm.translate('newGame')
        } else {
            return vm.translate('skip')
        }
    }

    vm.getDailyButtonText = function() {
        if (vm.isDailyChallenge)
            return vm.translate('dailyChallenge')
        else
            return vm.translate('newChallenge')
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
            const isSkin = !skinGroupIdFriendlyName[skinGroupId]

            if (!_.get(skin, 'displaySkin.modelName')) {
                // skip traps, devices
                return
            }
            if (vm.gameType == 0 || !vm.isDailyChallenge) {
                if (skinGroupId == 'ILLUST_0' && vm.options.enableE0 == false) {
                    // no elite0 art
                    return
                }
                if (skinGroupId == 'ILLUST_2' && vm.options.enableE2 == false) {
                    // no elite2 art
                    return
                }
                if (!skinGroupIdFriendlyName[skinGroupId] && vm.options.enableSkin == false) {
                    // no skin art
                    return
                }
            }

            if (skin.skinId == 'char_512_aprot#1') {
                // shalem has 2 identical e0 arts, this and char_4025_aprot2#1
                return
            }

            if (skin.charId.includes('amiya')) {
                // console.log(skin)
            } else {
                // console.log(skin)
            }

            var portraitIdFixed = skin.portraitId.replace('#', '%23')
            // if (portraitIdFixed == 'char_298_susuro_summer%236') {
            //     portraitIdFixed = 'char_298_susuro_summer%236unsus'
            // }
            // if (portraitIdFixed == 'char_1001_amiya2_2') {
            //     skin.searchableName = `${characterName}* (${skinGroupIdFriendlyName[skinGroupId] || skinName})`
            // } else {
            //     skin.searchableName = `${characterName} (${skinGroupIdFriendlyName[skinGroupId] || skinName})`
            // }
            var characterNameFixed = characterName
            if (skin.tmplId && skin.tmplId.includes('amiya2')) {
                characterNameFixed = `${characterName}-${vm.translate('guard')}`
            } else if (skin.tmplId && skin.tmplId.includes('amiya3')) {
                characterNameFixed = `${characterName}-${vm.translate('medic')}`
            }
            skin.searchableName = `${characterNameFixed} (${skinGroupIdFriendlyName[skinGroupId] || skinName})`
            skin.searchIndex = `${characterNameFixed}_${isSkin ? 'ZZ' : 'AA'}_${skinGroupIdFriendlyName[skinGroupId] || skinName}`
            skin.url = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/refs/heads/cn/assets/torappu/dynamicassets/arts/characters/${skin.tmplId || skin.charId}/${portraitIdFixed}.png`;
            skin.charInfo = characters[skin.charId]
            // console.log(skin)
            vm.skins.push(skin)
        })

        // console.log(_.map(vm.skins, 'searchIndex').sort())
    }

    init()
    .then(function() {
        vm.isLoading = false;

        const lastDailyCompleted = storage.getItem('dailyChallengeCompleted')
        if (lastDailyCompleted != currentDay) {
            vm.isDailyChallenge = true
        }

        $scope.$digest();
    })

    var timer = null
    vm.test = function(isSkip, setGameType) {
        if (setGameType != undefined) {
            vm.gameType = setGameType
        }
        if (vm.timeLeftSeconds < 0) {
            setSkins()
        }

        const skinsArray = _.values(vm.skins)
        // console.log(skinsArray)
        var i = _.random(0, skinsArray.length - 1)
        while (skinsArray[i] == vm.skin) {
            i = _.random(0, skinsArray.length - 1)
        }
        if (vm.skin) {
            vm.previousSkin = vm.skin
        }
        if (isSkip) {
            vm.previousScore = vm.translate('skipped')
            vm.previousViewPortInfo = null
        } else {
            vm.previousScore = `${vm.viewPortInfo.guesses + 1}x ${vm.translate('guesses')} + ${vm.viewPortInfo.zoomStep}x ${vm.translate('zoomOuts')} = ${vm.scoreIfGuessed} ${vm.translate('points')}`
            // calculate zoom for smaller viewport
            
            vm.previousViewPortInfo = _.clone(vm.viewPortInfo)
            const isLast = vm.viewPortInfo.zoomStep >= 4
            vm.previousViewPortInfo.maxDimension = vm.previousViewPortInfo.maxDimension * vm.smallImageDimension / vm.bigImageDimension
            const centerPointX = isLast ? 0.5 : vm.viewPortInfo.centerPointX
            const centerPointY = isLast ? 0.5 : vm.viewPortInfo.centerPointY
            const scale = vm.previousViewPortInfo.maxDimension / Math.max(vm.viewPortInfo.originalHeight, vm.viewPortInfo.originalWidth)
            const scaledHeight = scale * vm.viewPortInfo.originalHeight
            const scaledWidth = scale * vm.viewPortInfo.originalWidth
            const rightOffset = centerPointX * scaledWidth - 0.5 * vm.smallImageDimension
            const bottomOffset = centerPointY * scaledHeight - 0.5 * vm.smallImageDimension
            vm.previousViewPortInfo.style = {
                'height': scaledHeight + 'px',
                'width': scaledWidth + 'px',
                'right': rightOffset + 'px',
                'bottom': bottomOffset + 'px'
            }
        }
        if (vm.isDailyChallenge && vm.gameType == 1) {
            vm.skin = _.filter(skinsArray, skin => skin.skinId == dailySkinId)[0]
        } else {
            vm.skin = skinsArray[i]
            // vm.skin = _.filter(skinsArray, skin => skin.skinId == 'char_102_texas#1')[0] // todo remove
        }
        vm.showSkin = false
        vm.skinInput = null
        alreadyGuessed = {}

        if (vm.timeLeftSeconds < 0) {
            vm.timeLeftSeconds = 300
            vm.score = 0
            vm.previousSkin = null
            vm.challengeStep = 0
            if (timer) {
                $interval.cancel(timer)
            }
            if (vm.options.endless || vm.gameType == 1) {
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
            return vm.translate('timesUp')
        } else {
            return moment.duration(vm.timeLeftSeconds * 1000).format('mm:ss', {
                trim: false
            })
        }
    }

    function zoomBlankPixelRatio(
        $event,
        centerPointX,
        centerPointY
    ) {
        const skinHeight = $event.target.height
        const skinWidth = $event.target.width
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
        // console.log(blankPixels, totalPixels, centerPointX, centerPointY, blankPixels / totalPixels < 0.5)
        return blankPixels / totalPixels
    }

    vm.testOnLoad = function($event) {
        const skinHeight = $event.target.height
        const skinWidth = $event.target.width
        vm.showSkin = true

        const zoomStep = 0
        var centerPointX = _.random(0.4, 0.6)
        var centerPointY = _.random(0.20, 0.75)
        // var centerPointX = _.random(0.20, 0.80)
        // var centerPointY = _.random(0.10, 0.90)
        if (vm.options.enableBadZoomCheck) {
            centerPointX = _.random(0.20, 0.80)
            centerPointY = _.random(0.10, 0.90)

            // try to find a zoom that isn't mostly blank pixels
            var acceptableZoom = false
            var retries = 0
            const maxRetries = 20
            while (!acceptableZoom && retries < maxRetries) {
                if (zoomBlankPixelRatio($event, centerPointX, centerPointY) > 0.5) {
                    centerPointX = _.random(0.20, 0.80)
                    centerPointY = _.random(0.20, 0.80)
                    retries += 1
                } else {
                    acceptableZoom = true
                }
            } 
        }

        if (vm.gameType == 1) {
            // challenge mode
            // create a grid of possible zooms
            // discard zooms which are unacceptable (too many blank pixels)
            // create a random sequence to proceed through the zooms
            // for the daily, this randomness should be seeded by the browser's current date

            const minX = 0.3
            const maxX = 0.7
            const minY = 0
            const maxY = 1
            var pairs = []
            const gridLength = 16
            for (var i = 0; i <= gridLength; i++) {
                for(var j = 0; j <= gridLength; j++) {
                    const x = minX + i/gridLength * (maxX - minX)
                    const y = minY + j/gridLength * (maxY - minY)
                    pairs.push([x, y])
                }
            }
            const totalPairs = pairs.length
            if (vm.isDailyChallenge) {
                // use seeded shuffle
                pairs = seededRng.shuffle(pairs)
            } else {
                pairs = _.shuffle(pairs)
            }
            pairs = _.filter(pairs, ([x, y]) => {
                const ratio = zoomBlankPixelRatio($event, x, y)
                return ratio < 0.5
            })
            const goodPairs = pairs.length
            const isE0 = vm.skin.displaySkin.skinGroupId == 'ILLUST_0'
            console.log(`discarded ${totalPairs - goodPairs}/${totalPairs} bad zooms`)
            var finalPairs = []
            var finalPairIdxs = []
            const maxDimensionAtImage = {
                0: 12000,
                1: isE0 ? 12000 : 6000,
                2: isE0 ? 12000 : 6000,
                3: 6000,
                4: 6000,
                5: 6000,
                6: 4000,
                7: 4000,
                8: 4000
            }
            const faceBoxes = faceLocations[vm.skin.skinId] || []
            var xStretchFactor = 1
            var yStretchFactor = 1
            if (skinHeight > skinWidth) {
                xStretchFactor = skinHeight / skinWidth
            } else if (skinWidth > skinHeight) {
                yStretchFactor = skinWidth / skinHeight
            }

            var hasEasyZoom = true
            if (!isE0) {
                // for e2/skin, enforce that at least one zoom is around the below-face area
                hasEasyZoom = false
            }

            for (var i = 0; i < pairs.length; i++) {
                const [x, y] = pairs[i]
                var overlaps = false
                // facebox overlap check
                for (var k = 0; k < faceBoxes.length; k++) {
                    const faceBox = faceBoxes[k]
                    const boxWidth = (600 / maxDimensionAtImage[finalPairs.length] + faceBox.width) * xStretchFactor
                    const boxHeight = (600 / maxDimensionAtImage[finalPairs.length] + faceBox.height) * yStretchFactor
                    const boxLeft = faceBox.x - boxWidth / 2
                    const boxRight = faceBox.x + boxWidth / 2
                    const boxTop = faceBox.y - boxHeight / 2
                    const boxBottom = faceBox.y + boxHeight / 2
                    if (x > boxLeft && x < boxRight && y > boxTop && y < boxBottom) {
                        // console.log(x, y, 'overlapping face box', faceBox, boxWidth, boxHeight)
                        overlaps = true
                        break
                    }
                }
                if (overlaps) {
                    continue
                }
                if (finalPairs.length == 0) {
                    finalPairs.push([x, y])
                    continue
                }
                // already picked zooms overlap check
                for (var j = 0; j < finalPairs.length; j++) {
                    const [fx, fy] = finalPairs[j]
                    // if we are running out of zooms, gradually allow more overlap
                    const boxLengthModifier = (pairs.length - i) / pairs.length
                    const boxLength = (600 / maxDimensionAtImage[j] + 600 / maxDimensionAtImage[finalPairs.length]) * boxLengthModifier
                    const boxWidth = boxLength * xStretchFactor
                    const boxHeight = boxLength * yStretchFactor
                    const boxLeft = fx -  boxWidth / 2
                    const boxRight = fx + boxWidth / 2
                    const boxTop = fy - boxHeight / 2
                    const boxBottom = fy + boxHeight / 2
                    if (x > boxLeft && x < boxRight && y > boxTop && y < boxBottom) {
                        // console.log(x, y, 'is overlapping', fx, fy)
                        overlaps = true
                        break
                    }
                }
                if (overlaps) {
                    continue
                }
                // easy zoom check
                const easyX = faceBoxes[0].x
                const easyY = faceBoxes[0].y
                const boxWidth = 0.06 * xStretchFactor + 600 / maxDimensionAtImage[finalPairs.length]
                const boxHeight = 0.06 * yStretchFactor + 600 / maxDimensionAtImage[finalPairs.length]
                const boxLeft = easyX -  boxWidth / 2
                const boxRight = easyX + boxWidth / 2
                const boxTop = easyY - boxHeight / 2
                const boxBottom = easyY + boxHeight / 2 + 0.2
                if (x > boxLeft && x < boxRight && y > boxTop && y < boxBottom) {
                    console.log('found easy zoom on zoom #', finalPairs.length + 1)
                    hasEasyZoom = true
                }

                if (finalPairs.length == 7 && hasEasyZoom == false && i < pairs.length - 1) {
                    console.log('trying to find an easy zoom for zoom #8...')
                    continue
                }

                finalPairs.push([x, y])
                finalPairIdxs.push(i)
                if (finalPairs.length == 8) {
                    console.log(`found 8 non-overlapping zooms in ${i + 1} out of ${pairs.length} zooms`, finalPairIdxs)
                    break
                }
            }

            if (finalPairs.length < 8) {
                console.log('unable to find 8 non-overlapping zooms')
                finalPairs = pairs
            }

            // last image is fixed
            var giveawayX = 0.5
            var giveawayY = 0.33
            if (faceBoxes.length) {
                giveawayX = faceBoxes[0].x
                giveawayY = faceBoxes[0].y
            }
            finalPairs.push([giveawayX, giveawayY])

            // console.log(finalPairs)

            vm.challengeViewPortInfos = _.map(finalPairs, ([centerPointX, centerPointY], i) => {
                var maxDimensionBase = maxDimensionAtImage[i]
                const maxDimension = maxDimensionBase * vm.bigImageDimension / 600 / 3
                const scale = maxDimension / Math.max(skinHeight, skinWidth)
                const scaledHeight = scale * skinHeight
                const scaledWidth = scale * skinWidth
                const rightOffset = centerPointX * scaledWidth - 0.5 * vm.bigImageDimension / 3
                const bottomOffset = centerPointY * scaledHeight - 0.5 * vm.bigImageDimension / 3
                const style = {
                    'height': scaledHeight + 'px',
                    'width': scaledWidth + 'px',
                    'right': rightOffset + 'px',
                    'bottom': bottomOffset + 'px'
                }
                return {
                    originalHeight: skinHeight,
                    originalWidth: skinWidth,
                    maxDimension: maxDimensionAtZoom[1] * vm.bigImageDimension / 600 / 3,
                    centerPointX,
                    centerPointY,
                    zoomStep,
                    guesses: 0,
                    style,
                }
            })
        }

        vm.viewPortInfo = {
            originalHeight: skinHeight,
            originalWidth: skinWidth,
            maxDimension: maxDimensionAtZoom[0] * vm.bigImageDimension / 600,
            centerPointX,
            centerPointY,
            zoomStep,
            guesses: 0,
        }

        // console.log(centerPointX, centerPointY)

        const scale = vm.viewPortInfo.maxDimension / Math.max(vm.viewPortInfo.originalHeight, vm.viewPortInfo.originalWidth)
        const scaledHeight = scale * vm.viewPortInfo.originalHeight
        const scaledWidth = scale * vm.viewPortInfo.originalWidth
        const rightOffset = centerPointX * scaledWidth - 0.5 * vm.bigImageDimension
        const bottomOffset = centerPointY * scaledHeight - 0.5 * vm.bigImageDimension
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
            if (vm.gameType == 1) {
                vm.challengeStop()
            } else {
                vm.score += vm.scoreIfGuessed
                vm.test()
            }
        } else {
            vm.viewPortInfo.guesses = vm.viewPortInfo.guesses + 1
            alreadyGuessed[item.portraitId] = true
            updateScoreIfGuessed()
            if (vm.gameType == 1) {
                vm.challengeStep += 1
                if (vm.challengeStep > 4)
                    vm.challengeStop()
            }
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
                return skin.searchIndex
            } else if (normalizeString(skin.charInfo.name).toLowerCase().includes(normalizeString(viewValue).toLowerCase())) {
                return "Z" + skin.searchIndex
            } else {
                return "ZZ" + skin.searchIndex
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
            vm.viewPortInfo.maxDimension = maxDimensionAtZoom[vm.viewPortInfo.zoomStep] * vm.bigImageDimension / 600
            const centerPointX = isLast ? 0.5 : vm.viewPortInfo.centerPointX
            const centerPointY = isLast ? 0.5 : vm.viewPortInfo.centerPointY
            const scale = vm.viewPortInfo.maxDimension / Math.max(vm.viewPortInfo.originalHeight, vm.viewPortInfo.originalWidth)
            const scaledHeight = scale * vm.viewPortInfo.originalHeight
            const scaledWidth = scale * vm.viewPortInfo.originalWidth
            const rightOffset = centerPointX * scaledWidth - 0.5 * vm.bigImageDimension
            const bottomOffset = centerPointY * scaledHeight - 0.5 * vm.bigImageDimension
            vm.viewPortInfo.style = {
                'height': scaledHeight + 'px',
                'width': scaledWidth + 'px',
                'right': rightOffset + 'px',
                'bottom': bottomOffset + 'px'
            }

            updateScoreIfGuessed()
        }
    }

    vm.showMoreChallenge = function() {
        vm.challengeStep += 1
    }

    vm.challengeStop = function(giveUp) {
        vm.challengeWonAt = giveUp ? 6 : (vm.challengeStep + 1)
        if (giveUp) {
            vm.challengeStep = 5
        }
        if (vm.isDailyChallenge) {
            storage.setItem('dailyChallengeCompleted', currentDay)
            vm.dailyShareText = getDailyShareText()
        } else {
            vm.dailyShareText = null
        }
        if (vm.challengeWonAt == 1) {
            vm.previousScore = vm.translate('challengeWon1')
        } else if (vm.challengeWonAt < 6) {
            vm.previousScore = vm.translate('challengeWon', [vm.challengeWonAt])
        } else {
            vm.previousScore = vm.translate('challengeFailed')
        }
        // console.log(vm.previousScore)
        vm.isDailyChallenge = false
        vm.previousSkin = vm.skin
        vm.previousViewPortInfo = null
        if (vm.options.endless) {
            vm.test()
            vm.challengeStep = 0
            vm.previousViewPortInfo = null
        } else {
            vm.timeLeftSeconds = -1
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

    vm.toggleArt = function(n) {
        $timeout(() => {
            const allDisabled = !vm.options.enableE0 && !vm.options.enableE2 && !vm.options.enableSkin
            if (n == 1 && allDisabled) {
                vm.options.enableE0 = true
            } else if (allDisabled) {
                vm.options.enableE2 = true
            }
        }, 0)
    }

    vm.getStatus = function() {
        if (vm.timeLeftSeconds < 0) {
            return 0 // no game in progress
        }
        return 1
    }

    const getDailyShareText = function() {
        /*
        Arknights Guesser Daily Challenge 12/31/2024
        ⬜⬜⬜
        ⬛⬛⬛
        ⬛⬛⬛
        ⬜⬜⬜
        ⬜⬜⬜
        ⬜⬜⬛
        Won on the first guess!
        Won in # guesses
        https://stripedypaper.github.io/ak-guesser/
        */
        var dateString = currentDay.toLocaleString().split(',')[0]
        // console.log(dateString)
        var stringLines = [vm.translate('dailyShareTitle', [dateString])]

        if (vm.challengeWonAt == 1) {
            stringLines.push('⬜⬛⬛')
            stringLines.push('⬛⬛⬛')
            stringLines.push('⬛⬛⬛')
            stringLines.push(vm.translate('dailyShareOneGuess'))
        } else if (vm.challengeWonAt == 2) {
            stringLines.push('⬜⬜⬛')
            stringLines.push('⬜⬛⬛')
            stringLines.push('⬛⬛⬛')
            stringLines.push(vm.translate('dailyShareMultipleGuesses', [vm.challengeWonAt]))
        } else if (vm.challengeWonAt == 3) {
            stringLines.push('⬜⬜⬜')
            stringLines.push('⬜⬜⬛')
            stringLines.push('⬜⬛⬛')
            stringLines.push(vm.translate('dailyShareMultipleGuesses', [vm.challengeWonAt]))
        } else if (vm.challengeWonAt == 4) {
            stringLines.push('⬜⬜⬜')
            stringLines.push('⬜⬜⬜')
            stringLines.push('⬜⬜⬛')
            stringLines.push(vm.translate('dailyShareMultipleGuesses', [vm.challengeWonAt]))
        } else if (vm.challengeWonAt == 5) {
            stringLines.push('⬜⬜⬜')
            stringLines.push('⬜⬜⬜')
            stringLines.push('⬜⬜⬜')
            stringLines.push(vm.translate('dailyShareMultipleGuesses', [vm.challengeWonAt]))
        }
        stringLines.push('https://stripedypaper.github.io/ak-guesser/')
        return stringLines.join('\n')
    }

    vm.clickShareButton = function() {
        navigator.clipboard.writeText(getDailyShareText())
    }
});

