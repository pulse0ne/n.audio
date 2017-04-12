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
        '$document',
        '$mdDialog',
        'ngIdle',
        'n.audio.service',
        'SVGs',
        function ($scope, $timeout, $location, $document, $mdDialog, ngIdle, naudio, svg) {
            const enums = window.enums || {};
            const Command = enums.Command || {};
            const PlayState = $scope.ps = enums.PlayState || {};
            const ContextType = $scope.context = enums.ContextType || {};
            const MessageType = enums.MessageType || {};

            let lastVolume = 50;
            let domSlider;

            $scope.wsConnected = false;
            $scope.nowplaying = {
                playstate: PlayState.PAUSED,
                time: {
                    current: 0,
                    total: 0
                },
                track: null,
                eq: [0,0,0,0,0,0,0,0,0,0]
            };
            $scope.view = {
                type: null,
                parent: null,
                data: []
            };
            $scope.svgPath = svg.play;

            // TODO: test code
            ngIdle.setIdle(5);
            // TODO

            $scope.openEqualizer = function () {
                $mdDialog.show({
                    templateUrl: 'views/equalizer/eq.tmpl.html',
                    clickOutsideToClose: false,
                    escapeToClose: true,
                    controller: function ($scope) {
                        $scope.sliders = [];
                        $scope.cancel = angular.bind(this, $mdDialog.hide);
                        $scope.okay = function () {
                            let vals = $scope.sliders.map(function (s) {
                                let v = s.noUiSlider.get().replace('+', '');
                                return parseFloat(v);
                            });
                            naudio.cmd({ type: MessageType.COMMAND, command: Command.SET_EQ, data: vals });
                            $mdDialog.hide();
                        };
                    },
                    onComplete: function (scope) {
                        for (let i = 0; i < 10; ++i) {
                            let slider = $document[0].getElementById('eq-slider-' + i);
                            noUiSlider.create(slider, {
                                start: $scope.nowplaying.eq[i] || 0.0,
                                connect: [true, false],
                                orientation: 'vertical',
                                range: { min: -12.0, max: 12.0 },
                                step: 0.1,
                                direction: 'rtl',
                                format: {
                                    to: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1) },
                                    from: Number
                                }
                            });
                            let val = $document[0].getElementById('eq-value-' + i);
                            slider.noUiSlider.on('update', function (values, handle) {
                                val.textContent = values[handle];
                            });
                            val.addEventListener('click', function () {
                                slider.noUiSlider.set(0);
                            });
                            scope.sliders.push(slider);
                        }
                    }
                });
            };

            $scope.$watch('nowplaying.volume', function (newVal) {
                if (newVal !== lastVolume) {
                    domSlider.noUiSlider.set(Math.max(Math.min(newVal, 100), 0));
                }
            });

            $scope.$watch('nowplaying.playstate', function (newVal) {
                $scope.svgPath = newVal !== PlayState.PLAYING ? svg.play : svg.pause;
            });

            $scope.$on('ngIdle', function () {
                if ($location.path() !== '/idle' && $scope.nowplaying.playstate === PlayState.PLAYING) {
                    $location.path('/idle');
                }
            });

            $scope.$on('ws.message', function (evt, msg) {
                switch(msg.type) {
                    case MessageType.VIEW_UPDATE:
                        $scope.view.type = msg.view;
                        $scope.view.data = msg.data;
                        break;
                    case MessageType.NOW_PLAYING:
                        $scope.nowplaying = msg.nowplaying;
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

            $scope.playNext = angular.bind(this, naudio.cmd, {type: MessageType.COMMAND, command: Command.PLAY_NEXT});
            $scope.playPrevious = angular.bind(this, naudio.cmd, {type: MessageType.COMMAND, command: Command.PLAY_PREV});

            domSlider = $document[0].getElementById('slider');
            noUiSlider.create(domSlider, {
                start: lastVolume,
                connect: [true, false],
                range: { min: 0, max: 100 }
            });

            domSlider.noUiSlider.on('start', function (val) {
                lastVolume = val;
            });

            domSlider.noUiSlider.on('end', function (val) {
                naudio.cmd({type: MessageType.COMMAND, command: Command.SET_VOLUME, data: Math.floor(val)});
            });

            // TODO
            let ignored = angular.element('#prev-ctrl #next-ctrl #play-ctrl .track-container #slider');

            naudio.connect();
            ngIdle.start();
        }
    ]);

    app.filter('trackTime', function () {
        return function (val) {
            let dur = moment.duration(val * 1000);
            let time = moment(dur.asMilliseconds()).format('mm:ss');
            return time === 'Invalid date' ? '00:00' : time;
        }
    });

    app.directive('longPress', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {
                let pressTimeout;

                elem.on('touchstart', function (event) {
                    scope.$event = event;
                    event.stopPropagation();
                    event.preventDefault();
                    elem.addClass('long-press-started');
                    pressTimeout = $timeout(function () {
                        elem.addClass('long-press-active');
                        elem.removeClass('long-press-started');
                        scope.$eval(attr.longPress);
                    }, 600);
                });

                elem.on('touchend', function (event) {
                    scope.$event = event;
                    elem.removeClass('long-press-active long-press-started');
                    $timeout.cancel(pressTimeout);
                    scope.$eval(attr.longPressEnd);
                });

                scope.$on('$destroy', function () {
                    elem.removeClass('long-press-active long-press-started');
                    elem.off('touchstart touchend');
                });
            }
        }
    }]);
})(window.angular);
