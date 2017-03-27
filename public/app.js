/**
 * Created by tsned on 3/21/17.
 */
'use strict';

const app = angular.module('n.audio', [
    'ngMaterial',
    'ngWebsocket',
    'ngPopover',
    'n.audio.track.slider'
]);

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
            $rootScope.$emit('ws.message', message);
        });

        ws.$on('$open', function () {
            $rootScope.$emit('ws.open');
        });

        ws.$on('$close', function (code) {
            $rootScope.$emit('ws.close', code);
        });

        ws.$on('$error', function () {
            $rootScope.$emit('ws.error');
        });

        self.connect = ws.$open;
    }
]);

app.controller('n.audio.controller.main', [
    '$scope',
    '$rootScope',
    '$timeout',
    'n.audio.service',
    function ($scope, $rootScope, $timeout, naudio) {
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

        const debounce = function (func, wait, immediate) {
            let timeout;
            return function() {
                let context = this;
                let args = arguments;
                let later = function() {
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
                naudio.cmd({ command: $scope.CommandEnum.SET_VOLUME, data: Math.floor(newVal) });
            }
        }, 250));

        $scope.$watch('nowplaying.volume', function (newVal) {
            if ($scope.volumeSlider !== newVal) {
                $scope.volumeSlider = newVal;
            }
        });

        $rootScope.$on('ws.open', function () {
            $scope.wsConnected = true;
            $scope.$apply();
        });

        $rootScope.$on('ws.error', function () {
            $scope.wsConnected = false;
            $scope.$apply();
        });

        $rootScope.$on('ws.close', function () {
            $scope.wsConnected = false;
            $scope.$apply();
        });

        // TODO: handle multiple message types
        $rootScope.$on('ws.message', function (evt, msg) {
            angular.merge($scope.nowplaying, msg);
            $scope.$apply();
        });

        $scope.onSeek = function (percent) {
            naudio.cmd({ command: $scope.CommandEnum.SEEK_TO, data: percent });
        };

        $scope.togglePlaystate = function () {
            let newState = ($scope.nowplaying || {}).playstate === $scope.PlayStateEnum.PLAYING ? $scope.PlayStateEnum.PAUSED : $scope.PlayStateEnum.PLAYING;
            naudio.cmd({ command: $scope.CommandEnum.SET_PLAYSTATE, data: newState });
        };

        naudio.connect();
    }
]);

app.filter('trackTime', function () {
    return function (val) {
        let dur = moment.duration(val * 1000);
        return moment(dur.asMilliseconds()).format('mm:ss');
    }
});