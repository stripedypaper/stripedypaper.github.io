angular.module('app', [])
.controller('MyController', function($scope, $timeout) {
    var vm = this;
    var lineHeight = 17;
    var charWidth = 7.7;
    var tabSize = 4;
    var storage = window.localStorage;
    var storageKey = 'freeText';

    var editor = ace.edit('editor');
    editor.setOption('showGutter', false);
    editor.setOption('showPrintMargin', false);
    editor.setOption('fontSize', 14);
    editor.setOption('enableBasicAutocompletion', true);
    editor.setOption('enableLiveAutocompletion', true);
    editor.setTheme("ace/theme/dracula");

    if (storage.getItem(storageKey)) {
        editor.session.setValue(storage.getItem(storageKey));
    }
    else {
        editor.selection.moveTo(999, 999);
    }

    $timeout(parseText);
    editor.session.on('change', function(delta) {
        $timeout(parseText);
    });
    editor.session.on('changeScrollTop', function(event) {
        document.querySelector('.ak-container').scrollTop = event;
    });

    // highlight rules
    var oop = ace.require("ace/lib/oop");
    var TextMode = ace.require("ace/mode/text").Mode;
    var TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;

    var CustomHighlightRules = function(){
        this.$rules = {
            start: [
                {
                  regex: /\b(.)\b/,
                  next: 'otherRules'
                }
            ],
            otherRules: [
                {
                  regex: /\b(polymerization_preparation|bipolar_nanoflake|d32_steel)\b/,
                  caseInsensitive: true,
                  token: "material_t5"
                },
                {
                  regex: /\b(chip_catalyst|[a-zA-Z]+_chip_pack|rma70\-24|grindstone_pentahydrate|manganese_trihydrate|white_horse_kohl|optimized_device|keton_colloid|oriron_block|polyester_lump|sugar_lump|orirock_concentration|polymerized_gel|incandescent_alloy_block)\b/,
                  caseInsensitive: true,
                  token: "material_t4"
                },
                {
                  regex: /\b([a-zA-Z]+_chip|manganese_ore|grindstone|integrated_device|aketon|oriron_cluster|polyester_pack|sugar_pack|orirock_cluster|loxic_kohl|rma70\-12|incandescent_alloy|coagulating_gel)\b/,
                  caseInsensitive: true,
                  token: "material_t3"
                },
                {
                  regex: /\b(device|polyketon|polyester|sugar|orirock_cube)\b/,
                  caseInsensitive: true,
                  token: "material_t2"
                },
                {
                  regex: /\b(ester|damaged_device|oriron_shard|orirock|sugar_substitute|diketon)\b/,
                  caseInsensitive: true,
                  token: "material_t1"
                },
                {
                  regex: /\b(oriron)\b/,
                  caseInsensitive: true,
                  token: "material_t2"
                }
            ]
        };
    };

    oop.inherits(CustomHighlightRules, TextHighlightRules);

    var Mode = function() {
        this.HighlightRules = CustomHighlightRules;
    };
    oop.inherits(Mode,TextMode);

    (function() {
        this.$id = "ace/mode/custom";
    }).call(Mode.prototype);

    editor.session.setMode(new Mode);
    // end highlight rules

    var expandMap = {
        bipolar_nanoflake: {
            'optimized_device': 1,
            'white_horse_kohl': 2
        },
        polymerization_preparation: {
            'orirock_concentration': 1,
            'oriron_block': 1,
            'keton_colloid': 1
        },
        d32_steel: {
            'RMA70-24': 1,
            'grindstone_pentahydrate': 1,
            'manganese_trihydrate': 1
        },
        incandescent_alloy_block: {
            integrated_device: 1,
            grindstone: 1,
            incandescent_alloy: 1
        },
        polymerized_gel: {
            oriron_cluster: 1,
            coagulating_gel: 1,
            incandescent_alloy: 1
        },
        'RMA70-24': {
            'RMA70-12': 1,
            orirock_cluster: 2,
            aketon: 1
        },
        grindstone_pentahydrate: {
            grindstone: 1,
            oriron_cluster: 1,
            integrated_device: 1
        },
        manganese_trihydrate: {
            manganese_ore: 2,
            polyester_pack: 1,
            loxic_kohl: 1
        },
        white_horse_kohl: {
            loxic_kohl: 2,
            sugar_pack: 1,
            'RMA70-12': 1
        },
        keton_colloid: {
            aketon: 2,
            sugar_pack: 1,
            manganese_ore: 1
        },
        optimized_device: {
            integrated_device: 1,
            orirock_cluster: 2,
            grindstone: 1
        },
        oriron_block: {
            oriron_cluster: 2,
            integrated_device: 1,
            polyester_pack: 1
        },
        polyester_lump: {
            polyester_pack: 2,
            aketon: 1,
            loxic_kohl: 1
        },
        sugar_lump: {
            sugar_pack: 2,
            oriron_cluster: 1,
            manganese_ore: 1
        },
        orirock_concentration: {
            orirock_cluster: 4
        }
    };

    function parseText() {
        storage.setItem(storageKey, editor.session.getValue());

        document.querySelectorAll('.akchecklist').forEach((node) => node.remove());
        var longestLineLength = 0;
        editor.session.doc.$lines.forEach((line) => longestLineLength = Math.max(line.length, longestLineLength));
        editor.session.doc.$lines.forEach((line, i) => {
            var quantity = getQuantityFromString(line);
            var item = line.trim().split(' ')[1];
            var whitespacePrefix = line.match(/^\s*/)[0];

            // add checkbox
            var newCheckBox = document.createElement('div');
            var checkState = getCheckState(quantity);
            newCheckBox.innerHTML = checkState ? '[x]' : '[ ]';
            newCheckBox.classList.add('akchecklist');
            newCheckBox.classList.add('akchecklist-checkbox');
            newCheckBox.classList.add('ace-dracula');
            if (checkState) {
                newCheckBox.classList.add('done');
            }
            else if (quantity.current && quantity.current > 0) {
                newCheckBox.classList.add('in-progress');
            }
            if (line.trim().length === 0) {
                newCheckBox.classList.add('invisible');
            }
            newCheckBox.style.top = lineHeight * i + 'px';
            newCheckBox.style.left = '30px';
            newCheckBox.onclick = () => clickCheck(newCheckBox, line, i);
            addScrollOverride(newCheckBox);
            document.querySelector('.ak-container').appendChild(newCheckBox);

            if (!quantity.goal) return;

            // add right side buttons
            var newPlus = document.createElement('div');
            newPlus.innerHTML = '[+]';
            newPlus.classList.add('akchecklist');
            newPlus.classList.add('akchecklist-checkbox');
            newPlus.classList.add('ace-dracula');
            newPlus.style.top = lineHeight * i + 'px';
            newPlus.style.left = 60 + 45 + longestLineLength * charWidth + 'px';
            newPlus.onclick = () => clickQtyChange(newCheckBox, line, i, 1);
            addScrollOverride(newPlus);
            document.querySelector('.ak-container').appendChild(newPlus);

            var newMinus = document.createElement('div');
            newMinus.innerHTML = '[-]';
            newMinus.classList.add('akchecklist');
            newMinus.classList.add('akchecklist-checkbox');
            newMinus.classList.add('ace-dracula');
            newMinus.style.top = lineHeight * i + 'px';
            newMinus.style.left = 60 + 70 + longestLineLength * charWidth + 'px';
            newMinus.onclick = () => clickQtyChange(newCheckBox, line, i, -1);
            addScrollOverride(newMinus);
            document.querySelector('.ak-container').appendChild(newMinus);

            var newExpandBtn = document.createElement('div');
            newExpandBtn.innerHTML = '[sub]';
            newExpandBtn.classList.add('akchecklist');
            newExpandBtn.classList.add('akchecklist-checkbox');
            newExpandBtn.classList.add('ace-dracula');
            newExpandBtn.style.top = lineHeight * i + 'px';
            newExpandBtn.style.left = 60 + 95 + longestLineLength * charWidth + 'px';
            if (!expandMap[item]) {
                newExpandBtn.classList.add('invisible');
            }
            newExpandBtn.onclick = () => expandSubmaterials(i, item, quantity, whitespacePrefix);
            addScrollOverride(newExpandBtn);
            document.querySelector('.ak-container').appendChild(newExpandBtn);
        });
    }

    function getQuantityFromString(line) {
        var patternBothNumbers = /^(\s*)([0-9]+)\/([0-9]+)\s(.*)/;
        var patternOneNumber = /^(\s*)([0-9]+)\s(.*)/;
        var patternNoNumbers = /^(\s*)(.*)/;
        var current, goal, prefix, rest;

        var match1 = line.match(patternBothNumbers);
        var match2 = line.match(patternOneNumber);
        var match3 = line.match(patternNoNumbers);

        if (match1) {
            prefix = match1[1];
            current = match1[2];
            goal = match1[3];
            rest = match1[4];
        }
        else if (match2) {
            prefix = match2[1];
            goal = match2[2];
            rest = match2[3];
        }
        else {
            prefix = match3[1];
            rest = match3[2];
        }

        return {
            prefix: prefix,
            current: parseInt(current),
            goal: parseInt(goal),
            rest: rest
        };
    }

    function clickCheck(element, line, index) {
        var quantity = getQuantityFromString(line);
        if (!quantity.goal) {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}1/1 ${quantity.rest}`);
        }
        else if (!quantity.current || quantity.current < quantity.goal) {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}${quantity.goal}/${quantity.goal} ${quantity.rest}`);
        }
        else if (quantity.current < quantity.goal) {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}${quantity.goal}/${quantity.goal} ${quantity.rest}`);
        }
        else {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}0/${quantity.goal} ${quantity.rest}`);
        }
    }

    function clickQtyChange(element, line, index, delta) {
        var quantity = getQuantityFromString(line);
        if (!quantity.goal) {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}${Math.max(0, 0 + delta)}/1 ${quantity.rest}`);
        }
        else if (!quantity.current) {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}${Math.max(0, 0 + delta)}/${quantity.goal} ${quantity.rest}`);
        }
        else {
            editor.session.replace({
                start: { row: index, column: 0 },
                end: { row: index, column: 9999 }
            }, `${quantity.prefix}${Math.max(0, quantity.current + delta)}/${quantity.goal} ${quantity.rest}`);
        }
    }

    function getCheckState(quantity) {
        if (quantity.current && quantity.goal && quantity.current >= quantity.goal) return true;
        return false;
    }

    function addScrollOverride(element) {
        element.addEventListener('mousewheel', function (e) {
            e.preventDefault();
            editor.session.setScrollTop(editor.session.getScrollTop() + e.deltaY);
        }, { passive: false });
    }

    function expandSubmaterials(lineIndex, item, quantity, whitespacePrefix) {
        var stringToInsert = '';
        for (var submaterial in expandMap[item]) {
            var requiredQuantity = expandMap[item][submaterial];
            stringToInsert += `${whitespacePrefix}${' '.repeat(tabSize)}${quantity.current*requiredQuantity || 0}/${quantity.goal*requiredQuantity} ${submaterial}\n`;
        }
        editor.session.insert({
            row: lineIndex + 1,
            column: 0
        }, stringToInsert);
        editor.focus();
    }
});

