angular.module('app', [])
.controller('MyController', function($scope, $timeout) {
    var vm = this;

    vm.isLoading = true;

    characters = null;
    stages = null;

    vm.characters = {}
    vm.rarities = [6, 5, 4, 3, 2, 1];
    vm.result = {}
    vm.randomize = randomize;
    vm.toggle_operator = toggle_operator;
    vm.randomize_stage = randomize_stage;

    var storage = window.localStorage;

    allowed_zones = {
        'main_5': true,
        'main_6': true,
        'main_8': true,
        'main_7': true
        //'main_4': true
    };

    vm.options = {
        'Max 6 stars': 2,
        'Operators': 12
    };

    function init() {
        return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/en_US/gamedata/excel/character_table.json", function(json) {
            characters = json;
        })
        .then(function() {
            return $.getJSON("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/en_US/gamedata/excel/stage_table.json", function(json) {
                stages = json;
            })
        })
        .then(function() {
            console.log(characters, stages);
            vm.isLoading = false;
        })
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

        for (var i = 0; i <= 5; i++) {
            vm.characters[i] = _.sortBy(vm.characters[i], 'name');
        }

        console.log(vm.characters);

        $scope.$digest();
    });

    function toggle_operator(operator) {
        operator.enabled = !operator.enabled;
    }

    function isvalid() {

    }

    function randomize_stage() {
        var s = _.filter(stages.stages, function(stage) {
            return (stage.stageType == 'MAIN' || stage.stageType == 'SUB') && stage.difficulty == 'NORMAL' && stage.canPractice == true && stage.isStoryOnly == false && allowed_zones[stage.zoneId];
        });

        //console.log(stages, s);

        vm.result.stage = _.shuffle(s)[0];
        //console.log(vm.result.stage)
    }

    function randomize() {
        var enabled_operators = _.filter(characters, 'enabled');

        var scramble = _.shuffle(enabled_operators);
        var result = []
        var six_stars = 0

        var i = 0;
        while (result.length < Math.min(enabled_operators.length, vm.options['Operators'])) {
            if (six_stars >= vm.options['Max 6 stars'] && scramble[i].rarity == 5) {
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

        var enabled_map = {};
        _.each(enabled_operators, function(operator) {
            enabled_map[operator.name] = true;
        });
        storage.setItem('enabled_operators', JSON.stringify(enabled_map));
    }
});

