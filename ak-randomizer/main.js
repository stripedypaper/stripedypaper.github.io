angular.module('app', ['ngRoute'])
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.controller('MyController', function($scope, $timeout, $interval, $location, $window) {
    var vm = this;

    vm.isLoading = true;

    characters = null;
    stages = null;
    zones = null;

    allowed_languages = {'en_US':true, 'ja_JP':true, 'ko_KR':true, 'zh_CN':true};

    vm.characters = {}
    vm.rarities = [6, 5, 4, 3, 2, 1];
    vm.result = {}
    vm.showOptions = false;
    vm.mode = '0';
    vm.lang = 'en_US';
    if ($location.search().lang && allowed_languages[$location.search().lang]) {
        vm.lang = $location.search().lang;
    }
    vm.stats = {};

    var storage = window.localStorage;

    vm.options = {
        'Operators': [12, 1, 99]
    };
    vm.stageoptions = {
        'Number of stages': [1, 1, 12]
    };
    vm.otheroptions = {
        useE2art: false
    };
    vm.advancedoptions = {
        'Max 6* operators': [2, 0, 99, (op) => op.rarity == 5, true],
        'Min 6* operators': [null, 1, 99, (op) => op.rarity == 5, false],
        'Max 5* operators': [null, 0, 99, (op) => op.rarity == 4, true],
        'Min 5* operators': [null, 1, 99, (op) => op.rarity == 4, false],
        'Max 4* operators': [null, 0, 99, (op) => op.rarity == 3, true],
        'Min 4* operators': [null, 1, 99, (op) => op.rarity == 3, false],
        'Max 3* operators': [null, 0, 99, (op) => op.rarity == 2, true],
        'Min 3* operators': [null, 1, 99, (op) => op.rarity == 2, false],
        'Max 2* operators': [null, 0, 99, (op) => op.rarity == 1, true],
        'Min 2* operators': [null, 1, 99, (op) => op.rarity == 1, false],
        'Max 1* operators': [null, 0, 99, (op) => op.rarity == 0, true],
        'Min 1* operators': [null, 1, 99, (op) => op.rarity == 0, false],
        'Max Melee operators': [null, 0, 99, (op) => op.position == 'MELEE', true],
        'Min Melee operators': [null, 1, 99, (op) => op.position == 'MELEE', false],
        'Max Ranged operators': [null, 0, 99, (op) => op.position == 'RANGED', true],
        'Min Ranged operators': [null, 1, 99, (op) => op.position == 'RANGED', false],
        'Max Vanguard operators': [null, 0, 99, (op) => op.profession == 'PIONEER', true],
        'Min Vanguard operators': [null, 1, 99, (op) => op.profession == 'PIONEER', false],
        'Max Guard operators': [null, 0, 99, (op) => op.profession == 'WARRIOR', true],
        'Min Guard operators': [null, 1, 99, (op) => op.profession == 'WARRIOR', false],
        'Max Sniper operators': [null, 0, 99, (op) => op.profession == 'SNIPER', true],
        'Min Sniper operators': [null, 1, 99, (op) => op.profession == 'SNIPER', false],
        'Max Defender operators': [null, 0, 99, (op) => op.profession == 'TANK', true],
        'Min Defender operators': [null, 1, 99, (op) => op.profession == 'TANK', false],
        'Max Medic operators': [null, 0, 99, (op) => op.profession == 'MEDIC', true],
        'Min Medic operators': [null, 1, 99, (op) => op.profession == 'MEDIC', false],
        'Max Supporter operators': [null, 0, 99, (op) => op.profession == 'SUPPORT', true],
        'Min Supporter operators': [null, 1, 99, (op) => op.profession == 'SUPPORT', false],
        'Max Caster operators': [null, 0, 99, (op) => op.profession == 'CASTER', true],
        'Min Caster operators': [null, 1, 99, (op) => op.profession == 'CASTER', false],
        'Max Specialist operators': [null, 0, 99, (op) => op.profession == 'SPECIAL', true],
        'Min Specialist operators': [null, 1, 99, (op) => op.profession == 'SPECIAL', false]
    };

    advancedoptionsdefault = _.map(vm.advancedoptions, (v, k) => [k, v[0]]);
    classorder = {
        PIONEER: 7,
        WARRIOR: 0,
        SNIPER: 1,
        TANK: 2,
        MEDIC: 3,
        SUPPORT: 4,
        CASTER: 5,
        SPECIAL: 6
    };
    default_zones = {'main_5':true, 'main_6':true, 'main_7':true, 'main_8':true};

    function log(message) {
        if ($location.search().debug) {
            console.log(message);
        }
    }

    function getDangerLevelNum(dangerLevel) {
        if (dangerLevel == '-') {
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
        return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/" + vm.lang + "/gamedata/excel/character_table.json", function(json) {
            characters = json;
            _.each(characters, function(char, key) {
                char.characterPrefabKey = key;
                char.avatar = 'https://aceship.github.io/AN-EN-Tags/img/avatars/' + key;
            });
        })
        .then(function() {
            return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/" + vm.lang + "/gamedata/excel/zone_table.json", function(json) {
                zones = json;
            })
        })
        .then(function() {
            return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/" + vm.lang + "/gamedata/excel/stage_table.json", function(json) {
                stages = json;
                stages.stages = _.filter(stages.stages, function(stage) {
                    if (zones.zones[stage.zoneId] && zones.zones[stage.zoneId].type == 'MAINLINE' && stage.stageType == 'ACTIVITY') {

                        // todo: put these somewhere else instead of skipping
                        return false;
                    }
                    return stage.difficulty == 'NORMAL' && stage.canBattleReplay == true;
                });
                _.each(stages.stages, function(stage) {
                    stage.dangerLevelNum = getDangerLevelNum(stage.dangerLevel);
                })
            })
        })
        .then(function() {
            log(characters, stages, zones);
            $interval(save, 5000);
            vm.isLoading = false;
        })
    }

    function save() {
        var enabled_operators = _.filter(characters, 'enabled');
        var enabled_map = {};
        _.each(enabled_operators, function(operator) {
            enabled_map[operator.name] = true;
        });
        storage.setItem('enabled_operators' + vm.lang, JSON.stringify(enabled_map));

        var enabled_stages = _.filter(stages.stages, 'enabled');
        var enabled_stage_map = {};
        _.each(enabled_stages, function(stage) {
            enabled_stage_map[stage.stageId] = true;
        });
        storage.setItem('enabled_stages' + vm.lang, JSON.stringify(enabled_stage_map));
        console.info("saved", enabled_map, enabled_stages);
    }

    init()
    .then(function() {
        var blah = [];

        for (var i = 0; i <= 5; i++) {
            vm.characters[i] = [];
        }

        enabled_operators = undefined;
        try {
            enabled_operators = JSON.parse(storage.getItem('enabled_operators' + vm.lang));
        } catch(e) {
            log("you messed up", storage.getItem('enabled_operators' + vm.lang));
        }

        enabled_stages = undefined;
        try {
            enabled_stages = JSON.parse(storage.getItem('enabled_stages' + vm.lang));
        } catch(e) {
            log("you messed up", storage.getItem('enabled_stages' + vm.lang));
        }

        _.each(characters, function(value, key) {
            if (!value.isNotObtainable && value.profession != 'TRAP' && value.profession != 'TOKEN') {
                if (enabled_operators != undefined) {
                    value.enabled = !!enabled_operators[value.name];
                }
                else {
                    value.enabled = true;
                }
                
                value.long_name = (value.rarity + 1) + '* ' + value.name;
                vm.characters[value.rarity].push(value);
            }

        });

        log(enabled_stages);
        _.each(stages.stages, function(stage) {
            if (enabled_stages != undefined) {
                stage.enabled = !!enabled_stages[stage.stageId];
            }
            else {
                stage.enabled = !!default_zones[stage.zoneId] && stage.stageType != 'ACTIVITY';
            }
        });

        vm.stages = _.groupBy(stages.stages, function(stage) {
            return stage.zoneId;
        });

        for (var i = 0; i <= 5; i++) {
            vm.characters[i] = _.sortBy(vm.characters[i], 'name');
        }

        log(vm.characters, vm.stages);

        $scope.$digest();
    });

    vm.randomize_stage = function() {
        var s = _.filter(stages.stages, 'enabled');

        vm.result.stages = _.sortBy(_.shuffle(s).slice(0, vm.stageoptions['Number of stages'][0]), ['dangerLevelNum', 'stageId']);
    }

    vm.randomize = function() {
        var enabled_operators = _.filter(characters, 'enabled');

        var scramble = _.shuffle(enabled_operators);
        var result = [];
        var result_map = {};
        var six_stars = 0;
        var limit = vm.options['Operators'][0];

        /*function pick_units(list, num) {
            var units = [];
            var scrambled = _.shuffle(list);
            var i = 0;

            for (var k = 0; k < num; k++) {
                while (i < list.length) {
                    if (six_stars >= sixlimit && scrambled[i].rarity == 5) {
                        i++;
                        continue;
                    }
                    if (scrambled[i].rarity == 5) {
                        six_stars++;
                    }
                    units.push(scrambled[i]);
                    i++;
                    break;
                }
            }

            return units;
        }*/

        function pick_units2(list, restriction) {
            var eligible = _.shuffle(list);

            _.each(eligible, function(op) {
                if (result.length >= limit || restriction[0] <= 0) {
                    return
                }

                var allowed = !result_map[op.name];
                for (var max_restriction of max_restrictions) {
                    if (max_restriction[1](op) && max_restriction[0] <= 0) {
                        allowed = false;
                        break;
                    }
                }

                if (allowed) {
                    result.push(op);
                    result_map[op.name] = true;

                    for (var max_restriction of max_restrictions) {
                        if (max_restriction[1](op)) {
                            max_restriction[0] = max_restriction[0] - 1;
                        }
                    }

                    for (var min_restriction of min_restrictions) {
                        if (min_restriction[1](op)) {
                            min_restriction[0] = min_restriction[0] - 1;
                        }
                    }
                }
            });
        }

        var min_restrictions = _.map(_.filter(vm.advancedoptions, function(val) {
            return val[0] != null && val[0] > 0 && val[4] == false;
        }), function(val) {
            return [val[0], val[3]]
        });
        var max_restrictions = _.map(_.filter(vm.advancedoptions, function(val) {
            return val[0] != null && val[4] == true;
        }), function(val) {
            return [val[0], val[3]]
        });

        if (vm.mode == '1') {
            var classgroups = _.groupBy(enabled_operators, 'profession');
            var classes = _.shuffle(_.keys(classgroups));

            _.each(classes, function(cls) {
                if (result.length >= limit) {
                    return;
                }
                result = result.concat(pick_units(classgroups[cls], 1));
            });
        }
        else if (vm.mode == '2') {
            var classgroups = _.groupBy(enabled_operators, 'profession');
            var classes = _.shuffle(_.filter(_.keys(classgroups), function(k) {
                return k != 'MEDIC'
            }));

            result = pick_units(classgroups[classes[0]], limit);
        }
        else {
            _.each(min_restrictions, function(restriction) {
                pick_units2(_.filter(enabled_operators, restriction[1]), restriction);
            });

            pick_units2(enabled_operators, limit);
        }

        result = _.sortBy(result, a => -a.rarity, a => classorder[a.profession], a => a.name);

        _.each(result, function(op) {
            if (vm.stats[op.name] == undefined) {
                vm.stats[op.name] = 0;
            }
            vm.stats[op.name]++;
        });
        vm.result.operators = result;

        log(result);
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

