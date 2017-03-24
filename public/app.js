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
            url: 'ws://localhost:1776/ws',
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
        var CommandEnum = (window.enums || {}).CommandEnum || {};
        var PlayStateEnum = (window.enums || {}).PlayStateEnum || {};
        $scope.nowplaying = {};
        $scope.slider = { position: 0 };
        $scope.barStyle = {
            width: '0%'
        };

        // TODO: handle multiple message types
        $rootScope.$on('ws.message', function (evt, msg) {
            angular.merge($scope.nowplaying, msg);
            $scope.barStyle.width = ((msg.time.current / (msg.time.total || 0)) * 100) + '%';
            $scope.$apply();
        });

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
            naudio.cmd({ command: CommandEnum.SET_PLAYSTATE, data: PlayStateEnum.PLAYING });
        };

        $scope.randomVolume = function () {
            naudio.cmd({ command: CommandEnum.SET_VOLUME, data: Math.floor(Math.random() * 100) });
        };
        // TODO///////////////////////////
        // TODO     End Test Area     ////
        // TODO///////////////////////////

        naudio.connect();
    }
]);

app.directive('nPlayState', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: { playstate: '=' },
        template: '<i class="clickable fa fa-2x fa-{{ligature}}"></i>',
        link: function (scope) {
            scope.ligature = 'play';

            scope.$watch('playstate', function (newVal, oldVal) {
                if (oldVal !== newVal) {
                    scope.ligature = scope.playstate === window.enums.PlayStateEnum.PLAYING ? 'pause' : 'play';
                }
            });
        }
    };
});

app.filter('trackTime', function () {
    return function (val) {
        var dur = moment.duration(val * 1000);
        return moment(dur.asMilliseconds()).format('mm:ss');
    }
});