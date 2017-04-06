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
        'ngFitText',
        'n.audio.track.slider'
    ]);

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

    app.constant('SVGs', {
        play: 'M 0 0 L 0 32 L 32 16 z',
        pause: 'M 2 0 L 2 32 L 12 32 L 12 0 L 2 0 M 20 0 L 20 32 L 30 32 L 30 0 L 20 0'
    });

    app.constant('$cookies', function ($$document) {
        return (($$document || {}).cookie || '').split(';').reduce(function (a, c) {
            let ix = c.indexOf('=');
            if (ix > -1 && ix < c.length - 1) a[c.substr(0, ix).trim()] = c.substr(ix + 1).trim();
            return a;
        }, {});
    });

    app.constant('$debounce', function (func, wait, immediate) {
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
    });

    app.service('n.audio.service', [
        '$websocket',
        '$rootScope',
        '$document',
        '$cookies',
        function ($websocket, $rootScope, $document, $cookies) {
            const self = this;
            const wsCookie = $cookies($document[0]);

            const ws = $websocket.$new({
                url: 'ws://' + window.location.hostname + ':' + wsCookie.wsPort + decodeURIComponent(wsCookie.wsPath),
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
        '$debounce',
        'ngIdle',
        'n.audio.service',
        'SVGs',
        function ($scope, $timeout, $location, $debounce, ngIdle, naudio, svg) {
            const enums = window.enums || {};
            const Command = enums.Command || {};
            const PlayState = enums.PlayState || {};
            const ContextType = enums.ContextType || {};
            const MessageType = enums.MessageType || {};
            $scope.wsConnected = false;
            $scope.nowplaying = {
                playstate: PlayState.PAUSED,
                time: {
                    current: 0,
                    total: 0
                }
            };
            $scope.view = {
                type: null,
                parent: null,
                data: []
            };
            $scope.volumeSlider = 100;
            $scope.svgPath = svg.play;

            // TODO: test code
            $scope.TEST = new Array(50).join().split(',').map(function(i,x){return ++x});
            ngIdle.setIdle(5);
            // TODO


            $scope.$watch('volumeSlider', $debounce(function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    naudio.cmd({type: MessageType.COMMAND, command: Command.SET_VOLUME, data: Math.floor(newVal)});
                }
            }, 250));

            $scope.$watch('nowplaying.volume', function (newVal) {
                if ($scope.volumeSlider !== newVal) {
                    $scope.volumeSlider = newVal;
                }
            });

            $scope.$watch('nowplaying.playstate', function (newVal) {
                $scope.svgPath = newVal !== PlayState.PLAYING ? svg.play : svg.pause;
            });

            $scope.$on('ngIdle', function () {
                if ($location.path() !== '/idle' && $scope.nowplaying.playstate === PlayState.PLAYING) {
                    console.log('ngIdle fired');
                    $location.path('/idle');
                }
            });

            $scope.$on('ws.message', function (evt, msg) {
                console.log(JSON.stringify(msg, null, 2));
                switch(msg.type) {
                    case MessageType.VIEW_UPDATE:
                        $scope.view.data = msg.data;
                        break;
                    case MessageType.NOW_PLAYING:
                        angular.merge($scope.nowplaying, msg.nowplaying);
                        break;
                    default:
                        break;
                }
                $scope.$apply();
            });

            $scope.onSeek = function (percent) {
                naudio.cmd({type: MessageType.COMMAND, command: Command.SEEK_TO, data: percent});
            };

            $scope.togglePlaystate = function () {
                let newState = ($scope.nowplaying || {}).playstate === PlayState.PLAYING ? PlayState.PAUSED : PlayState.PLAYING;
                naudio.cmd({type: MessageType.COMMAND, command: Command.SET_PLAYSTATE, data: newState});
            };

            $scope.playNext = function () {
                naudio.cmd({type: MessageType.COMMAND, command: Command.PLAY_NEXT});
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
