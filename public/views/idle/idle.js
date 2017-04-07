(function (angular) {
    'use strict';
    const app = angular.module('n.audio');

    app.controller('n.audio.controller.idle', [
        '$scope',
        '$document',
        '$location',
        function ($scope, $document, $location) {
            $scope.viewClass = 'idle';

            angular.element('#sticky-footer').on('mousedown touchstart', function (e) {
                e.stopPropagation();
            });

            $document.on('mousedown touchstart keydown', function () {
                $location.path('/');
            });
        }
    ]);
})(window.angular);