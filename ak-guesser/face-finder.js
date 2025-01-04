angular.module('app', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.tpls'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window, faceLocations) {
    var vm = this;

    var charactersCN
    var charactersEN
    var skinsCN
    var skinsEN
    vm.skins = []
    vm.faceLocations = _.cloneDeep(faceLocations)
    var skinHeight, skinWidth

    const windowSize = 1024

    const skinGroupIdFriendlyName = {
        'ILLUST_0': 'E0',
        'ILLUST_1': 'E1',
        'ILLUST_2': 'E2',
    }

    function init() {
        vm.isLoading = true
        vm.lang = 'zh_CN'
        var repo = vm.lang == 'zh_CN' ? 'ArknightsGameData' : 'ArknightsGameData_Yostar'
        var branch = vm.lang == 'zh_CN' ? 'master' : 'main'
        return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/character_table.json`, function(json) {
            charactersCN = json;
            console.log('charactersCN', Object.keys(charactersCN).length, charactersCN)
        })
        .then(function() {
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/skin_table.json`, function(json) {
                skinsCN = json;
                console.log('skinsCN', Object.keys(skinsCN.charSkins).length, skinsCN)
            })
        })
        .then(function() {
            vm.lang = 'en_US'
            repo = vm.lang == 'zh_CN' ? 'ArknightsGameData' : 'ArknightsGameData_Yostar'
            branch = vm.lang == 'zh_CN' ? 'master' : 'main'
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/character_table.json`, function(json) {
                charactersEN = json;
                console.log('charactersEN', Object.keys(charactersEN).length, charactersEN)
            })
        })
        .then(function() {
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/skin_table.json`, function(json) {
                skinsEN = json;
                console.log('skinsEN', Object.keys(skinsEN.charSkins).length, skinsEN)
            })
        })
        .then(function() {
            vm.isLoading = false;
        })
    }

    const setSkins = function() {
        vm.skins = []
        _.each(skinsCN.charSkins, skin => {
            const characterName = _.get(charactersEN, `${skin.charId}.name`) || _.get(charactersCN, `${skin.charId}.name`)
            const skinGroupId = _.get(skin, 'displaySkin.skinGroupId')
            const skinName = _.get(skinsEN.charSkins[skin.skinId], 'displaySkin.skinName') || _.get(skin, 'displaySkin.skinName')

            if (!_.get(skin, 'displaySkin.modelName')) {
                // skip traps, devices
                return
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
            if (skin.tmplId && skin.tmplId != 'char_002_amiya') {
                skin.searchableName = `${characterName} (${skinGroupIdFriendlyName[skinGroupId] || skinName}) {${skin.tmplId}}`
            } else {
                skin.searchableName = `${characterName} (${skinGroupIdFriendlyName[skinGroupId] || skinName})`
            }
            skin.url = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/refs/heads/cn/assets/torappu/dynamicassets/arts/characters/${skin.tmplId || skin.charId}/${portraitIdFixed}.png`;
            skin.charInfo = charactersCN[skin.charId]
            // console.log(skin)
            vm.skins.push(skin)
        })

        // console.log(_.shuffle(_.map(vm.skins, 'skinId')))
    }

    const normalizeString = function(string) {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ł', 'l')
    }

    vm.typeAheadFilter = function(viewValue) {
        return function(skin) {
            if (!viewValue) {
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

    vm.selectSkin = function(selectedSkin) {
        vm.skinInput = ''
        console.log(vm.skin)
        const toChange = _.filter(vm.skins, skin => skin.skinId == selectedSkin.skinId)[0]
        if (vm.skin != toChange) {
            vm.showSkin = false
            vm.skin = toChange
        }
    }

    vm.testOnLoad = function($event) {
        vm.showSkin = true
        skinHeight = $event.target.height
        skinWidth = $event.target.width

        vm.refreshBoxes()
    }

    vm.next = function() {
        for (var i = 0; i < vm.skins.length - 1; i++) {
            if (vm.skins[i].skinId == vm.skin.skinId) {
                vm.showSkin = false
                vm.skin = vm.skins[i + 1]
                return
            }
        }
    }

    vm.prev = function() {
        for (var i = 1; i < vm.skins.length; i++) {
            if (vm.skins[i].skinId == vm.skin.skinId) {
                vm.showSkin = false
                vm.skin = vm.skins[i - 1]
                return
            }
        }
    }

    vm.getFaceLocations = function() {
        return JSON.stringify(vm.faceLocations, null, 4)
    }

    vm.copy = function() {
        navigator.clipboard.writeText(vm.getFaceLocations())
    }

    vm.refreshBoxes = function() {
        vm.boxes = vm.getBoxes()
        console.log(vm.boxes)
        try {
            $scope.$digest()
        } catch (e) {}
    }

    vm.getBoxes = function() {
        if (!vm.showSkin) {
            return []
        }

        var xStretchFactor = (skinHeight > skinWidth) ? (skinHeight / skinWidth) : 1
        var yStretchFactor = (skinWidth > skinHeight) ? (skinWidth / skinHeight) : 1

        return _.map(vm.faceLocations[vm.skin.skinId] || [], (faceLocation) => {
            const {x, y, width, height} = faceLocation
            const finalWidth = width * xStretchFactor
            const finalHeight = height * yStretchFactor
            return {
                position: 'relative',
                border: '1px solid red',
                left: (x - finalWidth / 2) * windowSize + 'px',
                top: (y - finalHeight / 2) * windowSize + 'px',
                height: finalHeight * windowSize + 'px',
                width: finalWidth * windowSize + 'px',
                'z-index': 1,
                'pointer-events': 'none',
                'margin-bottom': '-' + finalHeight * windowSize + 'px',
            }
        })
    }

    vm.firstMissing = function() {
        for (var i = 0; i < vm.skins.length; i++) {
            if (!vm.faceLocations[vm.skins[i].skinId]?.length) {
                if (vm.skin != vm.skins[i]) {
                    vm.showSkin = false
                    vm.skin = vm.skins[i]
                }
                return
            }
        }
    }

    vm.getMessage1 = function() {
        const done = _.filter(vm.skins, skin => {
            return vm.faceLocations[skin.skinId]?.length
        }).length
        return `Done ${done} out of ${vm.skins.length}`
    }

    vm.getMessage2 = function() {
        return `Dimensions: ${skinWidth}w x ${skinHeight}h`
    }

    vm.getMessage2Style = function() {
        if (skinHeight == skinWidth) {
            return {}
        } else {
            return {
                border: '2px solid red'
            }
        }
    }

    init()
    .then(function() {
        vm.isLoading = false
        setSkins()
        vm.skin = vm.skins[0]

        console.log('vm.skins', vm.skins)
        console.log('vm.skin', vm.skin)

        document.getElementById('clickable').onclick = function($event) {
            const [x, y] = [$event.offsetX, $event.offsetY]
            // console.log('clicked', x, y)
            if (vm.faceLocations[vm.skin.skinId]?.length) {
                vm.faceLocations[vm.skin.skinId][0].x = Number((x/windowSize).toFixed(3))
                vm.faceLocations[vm.skin.skinId][0].y = Number((y/windowSize).toFixed(3))
            } else {
                vm.faceLocations[vm.skin.skinId] = [{
                    x: Number((x/windowSize).toFixed(3)),
                    y: Number((y/windowSize).toFixed(3)),
                    width: 0.08,
                    height: 0.04,
                }]
            }
            vm.refreshBoxes()
        }

        document.getElementById('clickable').addEventListener('auxclick', function(e) {
            if (e.button == 1) {
                if (vm.faceLocations[vm.skin.skinId]?.length) {
                    vm.faceLocations[vm.skin.skinId][0].height = vm.faceLocations[vm.skin.skinId][0].width
                    vm.refreshBoxes()
                }
            }
        })

        document.getElementById('clickable').onwheel = function($event) {
            const isScrollUp = $event.deltaY < 0
            // console.log('isScrollUp', isScrollUp)
            if (vm.faceLocations[vm.skin.skinId]?.length) {
                const curWidth = vm.faceLocations[vm.skin.skinId][0].width
                const newWidth = isScrollUp ? (curWidth + 0.005) : (Math.max(0.02, curWidth - 0.005))
                const newHeight = newWidth / 2
                vm.faceLocations[vm.skin.skinId][0].width = Number(newWidth.toFixed(3))
                vm.faceLocations[vm.skin.skinId][0].height = Number(newHeight.toFixed(3))
                vm.refreshBoxes()
            }
        }

        document.addEventListener('keydown', function($event) {
            // console.log($event.key)
            if ($event.key == 'Delete') {
                vm.faceLocations[vm.skin.skinId] = undefined
                vm.refreshBoxes()
            }
            if ($event.key == '=') {
                if (vm.faceLocations[vm.skin.skinId]?.length) {
                    vm.faceLocations[vm.skin.skinId][0].height += 0.005
                    vm.refreshBoxes()
                }
            }
            if ($event.key == '-') {
                if (vm.faceLocations[vm.skin.skinId]?.length) {
                    vm.faceLocations[vm.skin.skinId][0].height -= 0.005
                    vm.refreshBoxes()
                }
            }
        })

        $scope.$digest();
    })
});

