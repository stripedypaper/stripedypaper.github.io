angular.module('app', [])
.controller('MyController', function($scope, $timeout) {
    var vm = this;
    var lineHeight = 17;
    var charWidth = 7.7;
    var tabSize = 4;
    var storage = window.localStorage;
    var storageKey = 'freeText';

    var checkboxElements = [];

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
    editor.setOption('fontSize', 14);
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
            loxic_kohl: 1,
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

        var longestLineLength = 0;
        var t0 = performance.now();
        var lines = editor.session.doc.$lines;
        adjustCheckboxElements(lines);

        lines.forEach((line) => longestLineLength = Math.max(line.length, longestLineLength));
        lines.forEach((line, i) => {
            var quantity = getQuantityFromString(line);
            var item = line.trim().split(' ')[1];
            var whitespacePrefix = line.match(/^\s*/)[0];

            var nextLine = i < lines.length - 1 ? lines[i + 1] : null;
            var isExpanded = nextLine != null && nextLine.match(/^\s*/)[0].length > whitespacePrefix.length;

            var checkbox = checkboxElements[i].checkbox;
            var checkState = getCheckState(quantity);
            var newInnerHtml = checkState ? '[x]' : '[ ]';
            if (checkbox.innerHTML != newInnerHtml) checkbox.innerHTML = newInnerHtml;
            checkbox.classList.remove('done', 'in-progress', 'invisible');
            if (checkState) {
                checkbox.classList.add('done');
            }
            else if (quantity.current && quantity.current > 0) {
                checkbox.classList.add('in-progress');
            }
            if (line.trim().length === 0) {
                checkbox.classList.add('invisible');
            }
            var newTop = lineHeight * i + 'px';
            var newLeft = '30px';
            if (checkbox.style.top != newTop) checkbox.style.top = newTop;
            if (checkbox.style.left != newLeft) checkbox.style.left = newLeft;
            checkbox.onclick = () => clickCheck(checkbox, line, i);

            var newPlus = checkboxElements[i].plus;
            newPlus.classList.add('invisible');
            if (quantity.goal) newPlus.classList.remove('invisible');
            newLeft = 60 + 45 + longestLineLength * charWidth + 'px';
            if (newPlus.style.top != newTop) newPlus.style.top = newTop;
            if (newPlus.style.left != newLeft) newPlus.style.left = newLeft;
            newPlus.onclick = () => clickQtyChange(checkbox, line, i, 1);

            var newMinus = checkboxElements[i].minus;
            newMinus.classList.add('invisible');
            if (quantity.goal) newMinus.classList.remove('invisible');
            newLeft = 60 + 70 + longestLineLength * charWidth + 'px';
            newMinus.style.left = 60 + 70 + longestLineLength * charWidth + 'px';
            if (newMinus.style.top != newTop) newMinus.style.top = newTop;
            if (newMinus.style.left != newLeft) newMinus.style.left = newLeft;
            newMinus.onclick = () => clickQtyChange(checkbox, line, i, -1);

            var newExpandBtn = checkboxElements[i].expandBtn;
            newInnerHtml = isExpanded ? '[shrink]' : '[expand]';
            if (newExpandBtn.innerHTML != newInnerHtml) newExpandBtn.innerHTML = newInnerHtml;
            newLeft = 60 + 95 + longestLineLength * charWidth + 'px';
            newExpandBtn.style.left = 60 + 95 + longestLineLength * charWidth + 'px';
            if (newExpandBtn.style.top != newTop) newExpandBtn.style.top = newTop;
            if (newExpandBtn.style.left != newLeft) newExpandBtn.style.left = newLeft;
            newExpandBtn.classList.add('invisible');
            if (isExpanded || expandMap[item]) newExpandBtn.classList.remove('invisible');
            newExpandBtn.onclick = !isExpanded ? (() => expandSubmaterials(i, item, quantity, whitespacePrefix)) : (() => shrinkLine(i, line, whitespacePrefix));
        });
        var t1 = performance.now();
        console.log('refresh took ' + (t1 - t0) + 'ms');
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

    function shrinkLine(i, line, whitespacePrefix) {
        var lines = editor.session.doc.$lines;
        var line;
        var prefix;
        var linesToDelete = [];
        for (++i; true; i++) {
            line = lines[i];
            prefix = line.match(/^\s*/)[0];
            if (prefix.length > whitespacePrefix.length) {
                linesToDelete.push(i);
            }
            else {
                break;
            }
        }
        editor.session.remove({
            start: { row: linesToDelete[0], column: 0 },
            end: { row: linesToDelete.pop() + 1, column: 0 }
        });
    }

    function adjustCheckboxElements(lines) {
        var diff = Math.abs(lines.length - checkboxElements.length);
        if (lines.length > checkboxElements.length) {
            while (lines.length > checkboxElements.length) {
                var newCheckBox = document.createElement('div');
                var newPlus = document.createElement('div');
                var newMinus = document.createElement('div');
                var newExpandBtn = document.createElement('div');
                newCheckBox.classList.add('akchecklist', 'akchecklist-checkbox', 'ace-dracula');
                newPlus.classList.add('akchecklist', 'akchecklist-checkbox', 'ace-dracula');
                newPlus.innerHTML = '[+]';
                newMinus.classList.add('akchecklist', 'akchecklist-checkbox', 'ace-dracula');
                newMinus.innerHTML = '[-]';
                newExpandBtn.classList.add('akchecklist', 'akchecklist-checkbox', 'ace-dracula');
                document.querySelector('.ak-container').appendChild(newCheckBox);
                document.querySelector('.ak-container').appendChild(newPlus);
                document.querySelector('.ak-container').appendChild(newMinus);
                document.querySelector('.ak-container').appendChild(newExpandBtn);
                addScrollOverride(newCheckBox);
                addScrollOverride(newPlus);
                addScrollOverride(newMinus);
                addScrollOverride(newExpandBtn);
                checkboxElements.push({
                    checkbox: newCheckBox,
                    plus: newPlus,
                    minus: newMinus,
                    expandBtn: newExpandBtn
                });
            }
            console.log('added ' + diff + ' lines', checkboxElements.length);
        }
        if (lines.length < checkboxElements.length) {
            while (lines.length < checkboxElements.length) {
                var elementMap = checkboxElements.pop();
                elementMap.checkbox.remove();
                elementMap.plus.remove();
                elementMap.minus.remove();
                elementMap.expandBtn.remove();
            }
            console.log('removed ' + diff + ' lines', checkboxElements.length);
        }
    }
});

