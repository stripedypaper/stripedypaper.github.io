angular.module('app', ['ng-sortable'])

.constant("dailyTasks", {
    NZAK: { // <- task ID must be globally unique
        index: 100, // index determines default displayed order
        friendlyName: "Zakum (Normal)"
    },
    PB: {
        index: 200,
        friendlyName: "Pink Bean (Normal/Chaos)"
    },
    VJ: {
        index: 1000,
        friendlyName: "Vanishing Journey Daily Quests"
    },
    CCPQ: {
        index: 1100,
        friendlyName: "Hungry Muto Party Quest"
    }
})

.constant("weeklyTasks", {
    HMAG: {
        index: 100,
        friendlyName: "Magnus (Hard)"
    },
    NCYG: {
        index: 200,
        friendlyName: "Empress Cygnus (Normal)"
    }
})

.controller("MainController", function($interval, $window, dailyTasks, weeklyTasks) {
    var vm = this;
    var currentDay;
    var customTasks = {};
    var checkMap = {};
    var hiddenMap = {};
    var dailyTaskOrder = [];
    var weeklyTaskOrder = [];
    var sortedDefaultDailyTasks = [];
    var sortedDefaultWeeklyTasks = [];
    var customTaskPrefix = "_CT";

    vm.customTaskInput = "";
    vm.useLocalTime = true;
    vm.dailyTasks = [];
    vm.weeklyTasks = [];
    vm.hiddenTasks = [];
    vm.customTaskDropdownOptions = [
        {id: 1, name: "Daily"},
        {id: 2, name: "Weekly"}
    ];
    vm.customTaskDropdownSelectedType = vm.customTaskDropdownOptions[0];
    vm.sortableConfigDaily = {
        handle: '.sortable-handle',
        animation: 100,
        onUpdate: function(event) {
            updateDailyTaskOrderInLocalStorage();
        }
    };
    vm.sortableConfigWeekly = {
        handle: '.sortable-handle',
        animation: 100,
        onUpdate: function(event) {
            updateWeeklyTaskOrderInLocalStorage();
        }
    };

    // public functions

    vm.momentNow = momentNow;
    vm.momentNextDailyReset = momentNextDailyReset;
    vm.momentNextWeeklyReset = momentNextWeeklyReset;
    vm.momentTimeUntilNextDailyReset = momentTimeUntilNextDailyReset;
    vm.momentTimeUntilNextWeeklyReset = momentTimeUntilNextWeeklyReset;
    vm.doCheck = doCheck;
    vm.getChecked = getChecked;
    vm.addCustomTask = addCustomTask;
    vm.deleteCustomTask = deleteCustomTask;
    vm.showTask = showTask;
    vm.hideTask = hideTask;
    vm.trueGetterSetter = () => true;
    vm.falseGetterSetter = () => false;
    vm.resetDailyTaskOrder = resetDailyTaskOrder;
    vm.resetWeeklyTaskOrder = resetWeeklyTaskOrder;

    init();

    function init() {
        // add id field to tasks
        _.forEach(dailyTasks, (task, id) => {
            task.id = id;
        });
        _.forEach(weeklyTasks, (task, id) => {
            task.id = id;
        });

        sortedDefaultDailyTasks = _.sortBy(dailyTasks, 'index');
        sortedDefaultWeeklyTasks = _.sortBy(weeklyTasks, 'index');

        loadCustomTasksFromLocalStorage();
        loadCheckMapFromLocalStorage();
        loadHiddenMapFromLocalStorage();
        populateTaskLists();

        currentDay = moment().utc().day();
        $interval(() => {
            // detect day (and week) changes here
            // this has a side effect of making angular update the page every second
            var updatedCurrentDay = moment().utc().day();
            if (currentDay < updatedCurrentDay) {
                clearDailyChecklists();

                if (updatedCurrentDay === 4) { // thursday utc
                    clearWeeklyChecklists();
                }

                updateCheckMapInLocalStorage();
                currentDay = updatedCurrentDay;
            }
            else if (currentDay > updatedCurrentDay) {
                currentDay = updatedCurrentDay;
            }
        }, 1000);
    }

    function momentNow() {
        return moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
    }

    function momentNextDailyReset() {
        var now = moment();
        var nextDailyReset = moment().utc().set({
            millisecond: 0,
            second: 0,
            minute: 0,
            hour: 0
        }).add(1, 'day');

        return nextDailyReset.local().format('dddd, MMMM Do YYYY, h:mm:ss a');
    }

    function momentTimeUntilNextDailyReset() {
        var now = moment();
        var nextDailyReset = moment().utc().set({
            millisecond: 0,
            second: 0,
            minute: 0,
            hour: 0
        }).add(1, 'day');

        return moment.duration(+nextDailyReset - +now).format();
    }

    function momentNextWeeklyReset() {
        var now = moment();
        var nextWeeklyReset = moment().utc().set({
            millisecond: 0,
            second: 0,
            minute: 0,
            hour: 0,
            day: 4
        });
        if (+nextWeeklyReset - +now < 0) {
            nextWeeklyReset.add(7, 'day');
        }

        return nextWeeklyReset.local().format('dddd, MMMM Do YYYY, h:mm:ss a');
    }

    function momentTimeUntilNextWeeklyReset() {
        var now = moment();
        var nextWeeklyReset = moment().utc().set({
            millisecond: 0,
            second: 0,
            minute: 0,
            hour: 0,
            day: 4
        });
        if (+nextWeeklyReset - +now < 0) {
            nextWeeklyReset.add(7, 'day');
        }

        return moment.duration(+nextWeeklyReset - +now).format();
    }

    function clearDailyChecklists() {
        _.forEach(vm.dailyTasks, task => {
            if (checkMap[task.id]) {
                checkMap = _.omit(checkMap, task.id);
            }
        });
    }

    function clearWeeklyChecklists() {
        _.forEach(vm.weeklyTasks, task => {
            if (checkMap[task.id]) {
                checkMap = _.omit(checkMap, task.id);
            }
        });
    }

    function updateCheckMapInLocalStorage() {
        var checkMapArray = _.keys(checkMap);
        $window.localStorage.setItem('checkMap', JSON.stringify(checkMapArray));
    }

    function loadCheckMapFromLocalStorage() {
        var checkMapArray = JSON.parse($window.localStorage.getItem('checkMap'));
        if (Array.isArray(checkMapArray)) {
            _.forEach(checkMapArray, taskId => {
                if (!getTaskFromTaskId(taskId)) {
                    checkMap = _.omit(checkMap, taskId);
                }
                else {
                    checkMap[taskId] = true;
                }
            });
        }
        updateCheckMapInLocalStorage();
    }

    function doCheck(taskId) {
        var mapEntry = checkMap[taskId];
        if (angular.isDefined(mapEntry)) {
            if (!mapEntry) {
                checkMap[taskId] = true;
            }
            else {
                checkMap = _.omit(checkMap, taskId);
            }
        }
        else {
            checkMap[taskId] = true;
        }
        updateCheckMapInLocalStorage();
    }

    function getChecked(taskId) {
        return checkMap[taskId];
    }

    function addCustomTask() {
        var newTaskName = vm.customTaskInput;
        if (newTaskName === 0) {
            return;
        }

        var newTaskId = getUniqueCustomTaskId();
        customTasks[newTaskId] = {
            id: newTaskId,
            friendlyName: newTaskName,
            type: vm.customTaskDropdownSelectedType.id,
            isCustom: true
        };
        updateCustomTasksInLocalStorage();
        populateTaskLists();

        vm.customTaskInput = "";
    }

    function deleteCustomTask(taskId) {
        customTasks = _.omit(customTasks, taskId);
        updateCustomTasksInLocalStorage();
        loadHiddenMapFromLocalStorage();
        loadCheckMapFromLocalStorage();
        populateTaskLists();
    }

    function getUniqueCustomTaskId() {
        var i = 0;
        while (_.indexOf(_.keys(customTasks), customTaskPrefix + i) > -1) {
            i++;
        }
        return customTaskPrefix + i;
    }

    function showTask(taskId) {
        if (hiddenMap[taskId]) {
            hiddenMap = _.omit(hiddenMap, taskId);
        }
        updateHiddenMapInLocalStorage();
        populateTaskLists();
    }

    function hideTask(taskId) {
        hiddenMap[taskId] = true;
        if (checkMap[taskId]) {
            checkMap = _.omit(checkMap, taskId);
            updateCheckMapInLocalStorage();
        }
        updateHiddenMapInLocalStorage();
        populateTaskLists();
    }

    function updateHiddenMapInLocalStorage() {
        var hiddenMapArray = _.keys(hiddenMap);
        $window.localStorage.setItem('hiddenTaskMap', JSON.stringify(hiddenMapArray));
    }

    function loadHiddenMapFromLocalStorage() {
        var hiddenMapArray = JSON.parse($window.localStorage.getItem('hiddenTaskMap'));
        if (Array.isArray(hiddenMapArray)) {
            _.forEach(hiddenMapArray, taskId => {
                if (!getTaskFromTaskId(taskId)) {
                    hiddenMap = _.omit(hiddenMap, taskId);
                }
                else {
                    hiddenMap[taskId] = true;
                }
            });
        }
        updateHiddenMapInLocalStorage();
    }

    function populateTaskLists() {
        vm.dailyTasks = [];
        vm.weeklyTasks = [];
        vm.hiddenTasks = [];

        vm.hiddenTasks = _.map(_.keys(hiddenMap), taskId => {
            return getTaskFromTaskId(taskId);
        });

        var storedDailyOrder = JSON.parse($window.localStorage.getItem('dailyTaskOrder'));
        if (Array.isArray(storedDailyOrder) && storedDailyOrder.length > 0) {
            var allValidTaskIds = _.filter(
                _.map(sortedDefaultDailyTasks, 'id')
                    .concat(_.map(_.filter(customTasks, ['type', 1]), 'id')),
                taskId => {
                    return !hiddenMap[taskId];
                });
            _.forEach(storedDailyOrder, taskId => {
                var index = _.indexOf(allValidTaskIds, taskId);
                if (index > -1) {
                    vm.dailyTasks.push(getTaskFromTaskId(taskId));
                    allValidTaskIds.splice(index, 1);
                }
            });
            _.forEach(allValidTaskIds, taskId => {
                vm.dailyTasks.push(getTaskFromTaskId(taskId));
            });
        }
        else {
            vm.dailyTasks = _.filter(
                angular.copy(sortedDefaultDailyTasks)
                    .concat(_.filter(customTasks, ['type', 1])),
                task => {
                    return !hiddenMap[task.id];
                });
        }

        var storedWeeklyOrder = JSON.parse($window.localStorage.getItem('weeklyTaskOrder'));
        if (Array.isArray(storedWeeklyOrder) && storedWeeklyOrder.length > 0) {
            var allValidTaskIds = _.filter(
                _.map(sortedDefaultWeeklyTasks, 'id')
                    .concat(_.map(_.filter(customTasks, ['type', 2]), 'id')),
                taskId => {
                    return !hiddenMap[taskId];
                });
            _.forEach(storedWeeklyOrder, taskId => {
                var index = _.indexOf(allValidTaskIds, taskId);
                if (index > -1) {
                    vm.weeklyTasks.push(getTaskFromTaskId(taskId));
                    allValidTaskIds.splice(index, 1);
                }
            });
            _.forEach(allValidTaskIds, taskId => {
                vm.weeklyTasks.push(getTaskFromTaskId(taskId));
            });
        }
        else {
            vm.weeklyTasks = _.filter(
                angular.copy(sortedDefaultWeeklyTasks)
                    .concat(_.filter(customTasks, ['type', 2])),
                task => {
                    return !hiddenMap[task.id];
                });
        }

        updateDailyTaskOrderInLocalStorage();
        updateWeeklyTaskOrderInLocalStorage();
    }

    function getTaskFromTaskId(taskId) {
        // may return a hidden task
        return dailyTasks[taskId] || weeklyTasks[taskId] || customTasks[taskId] || undefined;
    }

    function updateDailyTaskOrderInLocalStorage() {
        var order = _.map(vm.dailyTasks, task => task.id);
        if (order.length > 0) {
            $window.localStorage.setItem('dailyTaskOrder', JSON.stringify(order));
        }
    }

    function updateWeeklyTaskOrderInLocalStorage() {
        var order = _.map(vm.weeklyTasks, task => task.id);
        if (order.length > 0) {
            $window.localStorage.setItem('weeklyTaskOrder', JSON.stringify(order));
        }
    }

    function resetDailyTaskOrder() {
        $window.localStorage.removeItem('dailyTaskOrder');
        populateTaskLists();
    }

    function resetWeeklyTaskOrder() {
        $window.localStorage.removeItem('weeklyTaskOrder');
        populateTaskLists();
    }

    function loadCustomTasksFromLocalStorage() {
        var tasks = JSON.parse($window.localStorage.getItem('customTasks'));
        if (_.isObject(tasks)) {
            customTasks = {};
            _.forEach(tasks, task => {
                customTasks[task.a] = {
                    id: task.a,
                    friendlyName: task.b,
                    type: task.c,
                    isCustom: true
                };
            });
        }
        else {
            updateCustomTasksInLocalStorage();
        }
    }

    function updateCustomTasksInLocalStorage() {
        var tasks = {};
        _.forEach(customTasks, task => {
            tasks[task.id] = {
                a: task.id,
                b: task.friendlyName,
                c: task.type
            };
        });
        $window.localStorage.setItem('customTasks', JSON.stringify(tasks));
    }

});
