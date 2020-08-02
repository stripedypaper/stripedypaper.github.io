angular.module('app', [])
.controller('MyController', function($scope, $timeout) {
    var vm = this;
    var lineHeight = 17;
    var charWidth = 7.7;
    var storage = window.localStorage;
    var storageKey = 'freeText';

    var editor = ace.edit('editor');
    editor.setOption('showGutter', false);
    editor.setOption('showPrintMargin', false);
    editor.setOption('fontSize', 14);
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

    function parseText() {
        storage.setItem(storageKey, editor.session.getValue());

        document.querySelectorAll('.akchecklist').forEach((node) => node.remove());
        var longestLineLength = 0;
        editor.session.doc.$lines.forEach((line) => longestLineLength = Math.max(line.length, longestLineLength));
        editor.session.doc.$lines.forEach((line, i) => {
            if (line.trim().length === 0) return;

            var quantity = getQuantityFromString(line);

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
            newCheckBox.style.top = lineHeight * i + 'px';
            newCheckBox.style.left = '30px';
            newCheckBox.onclick = () => clickCheck(newCheckBox, line, i);
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
            document.querySelector('.ak-container').appendChild(newPlus);

            var newMinus = document.createElement('div');
            newMinus.innerHTML = '[-]';
            newMinus.classList.add('akchecklist');
            newMinus.classList.add('akchecklist-checkbox');
            newMinus.classList.add('ace-dracula');
            newMinus.style.top = lineHeight * i + 'px';
            newMinus.style.left = 60 + 70 + longestLineLength * charWidth + 'px';
            newMinus.onclick = () => clickQtyChange(newCheckBox, line, i, -1);
            document.querySelector('.ak-container').appendChild(newMinus);
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
});

