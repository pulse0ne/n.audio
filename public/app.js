/**
 * Created by tsned on 3/21/17.
 */
'use strict';

var app = angular.module('n.audio', [
    'ngMaterial',
    'ngWebsocket',
    'n.audio.track.slider'
]);

app.service('n.audio.service', [
    '$websocket',
    '$rootScope',
    function ($websocket, $rootScope) {
        var self = this;

        var ws = $websocket.$new({
            url: 'ws://localhost:1777/ws',
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
        $scope.nowplaying = {
            playstate: $scope.PlayStateEnum.PAUSED,
            time: {
                current: 0,
                total: 0
            }
        };

        // TODO: handle multiple message types
        $rootScope.$on('ws.message', function (evt, msg) {
            angular.merge($scope.nowplaying, msg);
            $scope.$apply();
        });

        $scope.onSeek = function (percent) {
            naudio.cmd({ command: $scope.CommandEnum.SEEK_TO, data: percent });
        };

        // TODO///////////////////////////
        // TODO    Start Test Area    ////
        // TODO///////////////////////////
        $rootScope.$on('ws.open', function () {
            $scope.TEST_WS_CONNECTED = true;
            $scope.$apply();
        });

        $rootScope.$on('ws.close', function () {
            $scope.TEST_WS_CONNECTED = false;
            $scope.$apply();
        });

        $scope.togglePlaystate = function () {
            var newState = ($scope.nowplaying || {}).playstate === $scope.PlayStateEnum.PLAYING ? $scope.PlayStateEnum.PAUSED : $scope.PlayStateEnum.PLAYING;
            naudio.cmd({ command: $scope.CommandEnum.SET_PLAYSTATE, data: newState });
        };

        $scope.randomVolume = function () {
            naudio.cmd({ command: $scope.CommandEnum.SET_VOLUME, data: Math.floor(Math.random() * 100) });
        };
        // TODO///////////////////////////
        // TODO     End Test Area     ////
        // TODO///////////////////////////

        naudio.connect();
    }
]);

app.filter('trackTime', function () {
    return function (val) {
        var dur = moment.duration(val * 1000);
        return moment(dur.asMilliseconds()).format('mm:ss');
    }
});