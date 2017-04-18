(function (angular) {
    'use strict';
    const app = angular.module('n.audio');

    app.controller('n.audio.controller.nav', [
        '$scope',
        '$document',
        '$mdMedia',
        'n.audio.service',
        function ($scope, $document, $mdMedia, naudio) {
            $scope.viewClass = 'nav';
            $scope.$mdMedia = $mdMedia;
            $scope.sidenavWidth = { width: 0 };
            const RequestViewType = ((window.enums || {}).Command || {}).REQUEST_VIEW;
            const ContextType = (window.enums || {}).ContextType || {};
            let sidenav = angular.element('#left-sidenav');
            let spacer = angular.element('#sidenav-spacer');

            $scope.$watch(
                function () { return sidenav.width() },
                function (nv) { spacer.width(nv) }
            );

            $scope.changeView = function (view) {
                switch(view) {
                    case ContextType.ALL_ARTISTS:
                    case ContextType.ALL_ALBUMS:
                    case ContextType.ALL_TRACKS:
                    case ContextType.PLAYLIST:
                        naudio.sendCommand(RequestViewType, view);
                        break;
                    default:
                        console.error('Unrecognized top-level view: ' + view);
                        break;
                }
            };
        }
    ]);
})(window.angular);