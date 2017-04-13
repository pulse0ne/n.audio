(function (angular) {
    'use strict';
    const app = angular.module('n.audio');

    app.controller('n.audio.controller.nav', [
        '$scope',
        '$document',
        '$mdMedia',
        function ($scope, $document, $mdMedia) {
            $scope.viewClass = 'nav';
            $scope.$mdMedia = $mdMedia;
            $scope.sidenavWidth = { width: 0 };
            let sidenav = angular.element('#left-sidenav');
            let spacer = angular.element('#sidenav-spacer');

            $scope.$watch(
                function () { return sidenav.width() },
                function (nv) { spacer.width(nv) }
            );
        }
    ]);
})(window.angular);