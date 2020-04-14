angular.module('app', [])
.controller('MyController', function($scope, $interval) {
    var vm = this;

    vm.fps = 60;
    vm.curFrame = 0;

    var width = 400;
    var height = 400;

    vm.grid = _.chunk(_.range(1, height * width), width);

    function advanceFrame() {
        vm.curFrame++;
    }

    $interval(advanceFrame, 1000/vm.fps);
    console.info(123);
});
