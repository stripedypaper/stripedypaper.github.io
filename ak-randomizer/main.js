angular.module('app', [])
.controller('MyController', function($scope, $timeout, $interval) {
    var vm = this;

    vm.isLoading = true;

    characters = null;
    stages = null;
    zones = null;

    vm.characters = {}
    vm.rarities = [6, 5, 4, 3, 2, 1];
    vm.result = {}
    vm.showOptions = false;

    var storage = window.localStorage;

    vm.options = {
        'Max 6 stars': [2, 0, 12],
        'Operators': [12, 1, 12]
    };
    vm.stageoptions = {
        'Number of stages': [1, 1, 12]
    };

    default_zones = {'main_5':true, 'main_6':true, 'main_7':true, 'main_8':true, 'camp_zone_1':true, 'camp_zone_3':true, 'camp_zone_4':true};

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

        return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/en_US/gamedata/excel/character_table.json", function(json) {
            characters = json;
        })
        .then(function() {
            return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/en_US/gamedata/excel/stage_table.json", function(json) {
                stages = json;
                stages.stages = _.filter(stages.stages, function(stage) {
                    if (default_zones[stage.zoneId] && stage.stageType == 'ACTIVITY') {
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
            return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/en_US/gamedata/excel/zone_table.json", function(json) {
                zones = json;
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
        storage.setItem('enabled_operators', JSON.stringify(enabled_map));

        var enabled_stages = _.filter(stages.stages, 'enabled');
        var enabled_stage_map = {};
        _.each(enabled_stages, function(stage) {
            enabled_stage_map[stage.stageId] = true;
        });
        storage.setItem('enabled_stages', JSON.stringify(enabled_stage_map));
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
            enabled_operators = JSON.parse(storage.getItem('enabled_operators'));
        } catch(e) {
            console.log("you messed up", storage.getItem('enabled_operators'));
        }

        enabled_stages = undefined;
        try {
            enabled_stages = JSON.parse(storage.getItem('enabled_stages'));
        } catch(e) {
            console.log("you messed up", storage.getItem('enabled_stages'));
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

        vm.result.stages = _.sortBy(_.shuffle(s).slice(0, vm.stageoptions['Number of stages'][0]), ['code', 'dangerLevelNum']);
    }

    vm.randomize = function() {
        var enabled_operators = _.filter(characters, 'enabled');

        var scramble = _.shuffle(enabled_operators);
        var result = []
        var six_stars = 0

        var i = 0;
        while (result.length < Math.min(enabled_operators.length, vm.options['Operators'][0])) {
            if (six_stars >= vm.options['Max 6 stars'][0] && scramble[i].rarity == 5) {
                i++;
                continue;
            }
            if (scramble[i].rarity == 5) {
                six_stars++;
            }
            result.push(scramble[i]);
            i++;
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
});

