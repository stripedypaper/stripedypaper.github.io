angular.module('app', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.tpls'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window, translate) {
    var vm = this;

    vm.isLoading = true;
    vm.theme = 'dark'

    var assets = null
    var characters = null

    allowed_languages = {'en_US':true, 'ja_JP':true, 'ko_KR':true, 'zh_CN':false};

    allowedProfessions = {
        CASTER: true,
        MEDIC: true,
        PIONEER: true,
        SNIPER: true,
        SPECIAL: true,
        SUPPORT: true,
        TANK: true,
        WARRIOR: true,
    }
    disallowedProfessions = {
        TOKEN: true,
        TRAP: true,
    }

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
        hardMode: false,
    }

    function log(message) {
        if ($location.search().debug) {
            console.log(message);
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
        return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/skill_table.json`, function(json) {
            skills = json;
            log(skills);
        })
        .then(function() {
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/character_table.json`, function(json) {
                characters = json;
                log(characters);
            })
        })
        .then(function() {
            return $.getJSON(`https://raw.githubusercontent.com/Kengxxiao/${repo}/${branch}/${vm.lang}/gamedata/excel/char_patch_table.json`, function(json) {
                characters = _.merge(characters, json.patchChars)
                log(characters);
                log(_.groupBy(characters, 'profession'))
                log(_.groupBy(characters, 'subProfessionId'))
            })
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

    const processSkillDesc = function(skillLevel, charName) {
        var desc = skillLevel.description
        if (!desc) {
            console.log(skillLevel)
        }
        while (desc.search(/<.*?>(.*?)<\/>/g) >= 0) {
            //console.log(desc.search(/<.+?>(.+?)<\/>/g))
            desc = desc.replace(/<.*?>(.*?)<\/>/g, '$1')
        }
        while (desc.search(charName) >= 0) {
            desc = desc.replace(charName, '?')
        }
        return desc.replace(". \n", ". ").replace(".\n", ". ").replace("\n", ". ").replace(/\{(-?)(.+?)(:.+?)?\}/g, (match, negative, keyName, colonPart) => {
            // if (skillLevel.name == 'Waterless Dance of the Shattered Maelstrom') {
                // console.log(match, negative, keyName, colonPart)
            // }
            //console.log(match, capture1, capture2)
            var replacement = '?'
            _.each(skillLevel.blackboard, (blackboardEntry) => {
                if (blackboardEntry.key.toLowerCase() == keyName.toLowerCase()) {
                    const mult = negative ? -1 : 1
                    if (colonPart == ':0%') {
                        replacement = Math.round(mult * blackboardEntry.value * 100) + '%'
                    } else if (colonPart == ':0.0%') {
                        replacement = Math.round(mult * blackboardEntry.value * 1000) / 10 + '%'
                    } else {
                        replacement = negative ? (blackboardEntry.value * -1) : blackboardEntry.value
                    }
                }
            })
            if (replacement == '?') {
                if (skillLevel[keyName]) {
                    return skillLevel[keyName]
                }
            }
            return replacement
        })
    }

    const processSearchableName = function() {
        const skillIdToChars = {}
        const skillIconIdsToSkills = {}

        vm.assets = []
        _.each(characters, (value, key) => {
            const charId = key
            _.each(value.skills, skill => {
                const skillId = skill.skillId
                if (skillIdToChars[skillId]) {
                    skillIdToChars[skillId].push(value)
                } else {
                    skillIdToChars[skillId] = [value]
                }
            })
        })
        _.each(skills, (value, key) => {
            if (value.levels.length > 0 && value.levels[0].description) {
                const iconIdOrSkillId = value.iconId || value.skillId
                if (skillIconIdsToSkills[iconIdOrSkillId]) {
                    skillIconIdsToSkills[iconIdOrSkillId].push(value)
                } else {
                    skillIconIdsToSkills[iconIdOrSkillId] = [value]
                }
            }
        })
        const disallowedSkills = {
            skchr_baslin_1: true,
            skchr_demkni_1: true,
            skchr_aprot_1: true,
        }
        _.each(skillIconIdsToSkills, (value, key) => {
            var charName = null
            var skillIndex = null
            const skill = value[0]
            const skillName = skill.levels[0].name
            if (disallowedProfessions[skillIdToChars[skill.skillId][0].profession]) {
                // skip trap, token
                return
            }
            if (disallowedSkills[skill.skillId]) {
                // skip duplicate first aid
                return
            }
            if (value.length == 1) {
                const skillId = skill.skillId
                if (!skillIdToChars[skillId]) {
                    
                }
                if (skillIdToChars[skillId].length == 1) {
                    const char = skillIdToChars[skillId][0]
                    charName = skillIdToChars[skillId][0].name
                    if (char.potentialItemId == 'p_char_002_amiya' && char.subProfessionId == 'incantationmedic') {
                        charName = `${charName}-${vm.translate('medic')}`
                    } else if (char.potentialItemId == 'p_char_002_amiya' && char.subProfessionId == 'artsfghter') {
                        charName = `${charName}-${vm.translate('guard')}`
                    }
                    // find which skill number this is
                    _.each(char.skills, (skill, i) => {
                        if (skill.skillId == skillId) {
                            skillIndex = i + 1
                        }
                    })
                }
            }
            var searchableName = skillName + (charName ? ` (${charName}` : ' (Various') + (skillIndex ? ` S${skillIndex})` : ')')
            if (vm.options.hardMode) {
                searchableName = skillName
            }
            var filename = `skill_icon_${key}.png`
            if (filename.includes('[')) {
                filename = `skill_icon_${key}/skill_icon_${key}.png/skill_icon_${key}.png`
            }
            vm.assets.push({
                skillIconId: key,
                searchableName,
                description: processSkillDesc(_.last(skill.levels), charName),
                url: encodeURI(`https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/refs/heads/cn/assets/torappu/dynamicassets/arts/skills/${filename}`),
            })
        })
        console.log(_.sortBy(vm.assets, 'searchableName'))
    }

    init()
    .then(function() {
        translate.setLang(vm.lang)
        vm.translate = translate.translate

        vm.isLoading = false;

        $scope.$digest();
    });

    var timer = null
    vm.test = function(isSkip) {
        if (vm.questionIndex >= vm.questions) {
            console.log('resetting game')
            vm.questionIndex = -1
            vm.score = 0
            vm.errorOffset = 0
            vm.previousAsset = null
        }
        if (vm.questionIndex < 0) {
            processSearchableName()
            vm.assets = _.shuffle(vm.assets)
            log(vm.assets)
        }
        if (vm.questionIndex >= 0) {
            const currentAsset = vm.assets[vm.questionIndex + vm.errorOffset]
            vm.previousAsset = currentAsset
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
        console.log('image did not load, increasing errorOffset')
        vm.errorOffset += 1
    }

    vm.selectSkin = function(item) {
        vm.skinInput = null

        if (vm.questionIndex >= vm.questions) {
            return
        }
        
        const currentAsset = vm.assets[vm.questionIndex + vm.errorOffset]
        if (item.skillIconId == currentAsset.skillIconId) {
            vm.score += vm.scoreIfGuessed
            vm.test()
        } else {
            vm.viewPortInfo.guesses = vm.viewPortInfo.guesses + 1
            alreadyGuessed[item.skillIconId] = true
            updateScoreIfGuessed()
        }
    }

    const normalizeString = function(string) {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ł', 'l')
    }

    vm.typeAheadFilter = function(viewValue) {
        return function(asset) {
            if (!viewValue) {
                return false
            }
            if (alreadyGuessed[asset.skillIconId]) {
                return false
            }
            return normalizeString(asset.searchableName).toLowerCase().includes(normalizeString(viewValue).toLowerCase())
        }
    }

    vm.typeAheadOrderBy = function(viewValue) {
        return function(asset) {
            if (!viewValue) {
                return -1
            }
            if (_.startsWith(normalizeString(asset.searchableName).toLowerCase(), normalizeString(viewValue).toLowerCase())) {
                return asset.searchableName.length
            } else {
                return asset.searchableName.length + 1000
            }
        }
    }

    const updateScoreIfGuessed = () => {
        const guesses = vm.viewPortInfo.guesses
        var guessMultiplier = 1
        var hintMultiplier = vm.showHint ? 0.5 : 1
        var hardMultiplier = vm.options.hardMode ? 2 : 1
        if (guesses == 1) {
            guessMultiplier = 0.9
        } else if (guesses > 1) {
            guessMultiplier = Math.max(0.5, 1 - guesses * 0.1)
        }
        vm.scoreIfGuessed = Math.ceil(50 * guessMultiplier * hintMultiplier * hardMultiplier)
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

