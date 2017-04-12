(function (angular) {
    'use strict';
    const app = angular.module('n.audio');

    app.controller('n.audio.controller.nav', [
        '$scope',
        function ($scope) {
            $scope.viewClass = 'nav';

            $scope.artistLongPress = function (artist) {
                console.log(artist);
            };
        }
    ]);
})(window.angular);