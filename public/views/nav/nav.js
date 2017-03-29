(function (angular) {
    'use strict';
    const app = angular.module('n.audio');

    app.controller('n.audio.controller.nav', [
        '$scope',
        function ($scope) {
            $scope.viewClass = 'nav';
        }
    ]);
})(window.angular);