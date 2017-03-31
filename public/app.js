/**
 * Created by tsned on 3/21/17.
 */
(function (angular) {
    'use strict';
    const app = angular.module('n.audio', [
        'ngRoute',
        'ngAnimate',
        'ngMaterial',
        'ngWebsocket',
        'ngPopover',
        'ngIdle',
        'n.audio.track.slider'
    ]);

    app.constant('SVGs', {
        play: 'M 0 0 L 0 32 L 32 16 z',
        pause: 'M 2 0 L 2 32 L 12 32 L 12 0 L 2 0 M 20 0 L 20 32 L 30 32 L 30 0 L 20 0'
    });

    app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider.when('/', {
            templateUrl: 'views/nav/nav.html',
            controller: 'n.audio.controller.nav'
        });
        $routeProvider.when('/idle', {
            templateUrl: 'views/idle/idle.html',
            controller: 'n.audio.controller.idle'
        });
        $routeProvider.otherwise({
            redirectTo: '/'
        });

        $locationProvider.html5Mode(true);
    }]);

    app.service('n.audio.service', [
        '$websocket',
        '$rootScope',
        function ($websocket, $rootScope) {
            const self = this;

            const ws = $websocket.$new({
                url: 'ws://' + window.location.hostname + ':1777/ws',
                reconnect: true,
                reconnectInterval: 1000,
                maxReconnectInterval: 10000,
                doubleInterval: true,
                immediate: false
            });

            self.cmd = function (cmd) {
                ws.$send(cmd);
            };

            ws.$on('$message', function (message) {
                message = JSON.parse(message);
                $rootScope.$broadcast('ws.message', message);
            });

            ws.$on('$open', function () {
                $rootScope.$broadcast('ws.open');
            });

            ws.$on('$close', function (code) {
                $rootScope.$broadcast('ws.close', code);
            });

            ws.$on('$error', function () {
                $rootScope.$broadcast('ws.error');
            });

            self.connect = ws.$open;
        }
    ]);

    app.controller('n.audio.controller.main', [
        '$scope',
        '$timeout',
        '$location',
        'ngIdle',
        'n.audio.service',
        'SVGs',
        function ($scope, $timeout, $location, ngIdle, naudio, svg) {
            $scope.CommandEnum = (window.enums || {}).CommandEnum || {};
            $scope.PlayStateEnum = (window.enums || {}).PlayStateEnum || {};
            $scope.wsConnected = false;
            $scope.nowplaying = {
                playstate: $scope.PlayStateEnum.PAUSED,
                time: {
                    current: 0,
                    total: 0
                }
            };
            $scope.volumeSlider = 100;
            $scope.svgPath = svg.play;

            // TODO
            $scope.TEST = new Array(50).join().split(',').map(function(i,x){return ++x});
            ngIdle.setIdle(5);
            // TODO


            const debounce = function (func, wait, immediate) {
                let timeout;
                return function () {
                    let context = this;
                    let args = arguments;
                    let later = function () {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    let callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            };

            $scope.$watch('volumeSlider', debounce(function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    naudio.cmd({command: $scope.CommandEnum.SET_VOLUME, data: Math.floor(newVal)});
                }
            }, 250));

            $scope.$watch('nowplaying.volume', function (newVal) {
                if ($scope.volumeSlider !== newVal) {
                    $scope.volumeSlider = newVal;
                }
            });

            $scope.$watch('nowplaying.playstate', function (newVal) {
                $scope.svgPath = newVal !== $scope.PlayStateEnum.PLAYING ? svg.play : svg.pause;
            });

            $scope.$on('ngIdle', function () {
                if ($location.path() !== '/idle') {
                    console.log('ngIdle fired');
                    $location.path('/idle');
                }
            });

            // TODO: handle multiple message types
            $scope.$on('ws.message', function (evt, msg) {
                console.log(JSON.stringify(msg, null, 2));
                angular.merge($scope.nowplaying, msg.nowplaying);
                $scope.$apply();
            });

            $scope.onSeek = function (percent) {
                naudio.cmd({command: $scope.CommandEnum.SEEK_TO, data: percent});
            };

            $scope.togglePlaystate = function () {
                let newState = ($scope.nowplaying || {}).playstate === $scope.PlayStateEnum.PLAYING ? $scope.PlayStateEnum.PAUSED : $scope.PlayStateEnum.PLAYING;
                naudio.cmd({command: $scope.CommandEnum.SET_PLAYSTATE, data: newState});
            };

            naudio.connect();
            ngIdle.start();
        }
    ]);

    app.filter('trackTime', function () {
        return function (val) {
            let dur = moment.duration(val * 1000);
            return moment(dur.asMilliseconds()).format('mm:ss');
        }
    });
})(window.angular);
