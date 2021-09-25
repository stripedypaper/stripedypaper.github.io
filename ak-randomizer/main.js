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

    var storage = window.localStorage;

    vm.options = {
        'Max 6 stars': [2, 0, 99],
        'Operators': [12, 1, 99]
    };
    vm.stageoptions = {
        'Number of stages': [1, 1, 12]
    };

    default_zones = {'main_5':true, 'main_6':true, 'main_7':true, 'main_8':true};

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
        $interval(save, 5000);

        return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/" + vm.lang + "/gamedata/excel/character_table.json", function(json) {
            characters = json;
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
            console.log(characters, stages, zones);
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
        console.log("saved", enabled_map, enabled_stages);
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
            console.log("you messed up", storage.getItem('enabled_operators' + vm.lang));
        }

        enabled_stages = undefined;
        try {
            enabled_stages = JSON.parse(storage.getItem('enabled_stages' + vm.lang));
        } catch(e) {
            console.log("you messed up", storage.getItem('enabled_stages' + vm.lang));
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

        console.log(enabled_stages);
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

        console.log(vm.characters, vm.stages);

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
        var six_stars = 0;
        var limit = vm.options['Operators'][0];
        var sixlimit = vm.options['Max 6 stars'][0];

        function pick_units(list, num) {
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
        }

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
            result = pick_units(enabled_operators, limit);
        }

        result = _.sortBy(result, function(a) {
            return -a.rarity;
        });
        vm.result.operators = result;
    }

    vm.toggleconfig = function() {
        vm.showOptions = !vm.showOptions;
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
        console.log(vm.lang);
        $window.location.href = $location.path() + '?lang=' + vm.lang;
    }
});

