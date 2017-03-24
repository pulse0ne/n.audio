/**
 * Created by tsned on 3/21/17.
 */
'use strict';

var app = angular.module('n.audio', ['ngMaterial', 'ngWebsocket']);

app.service('n.audio.service', [
    '$websocket',
    function ($websocket) {
        var self = this;
        var handlers = [];

        self.ws = $websocket.$new({ url: 'ws://localhost:1776/ws' });

        self.cmd = function (cmd) {
            self.ws.$send(cmd);
        };

        self.register = function (handler) {
            handlers.push(handler);
        };

        self.ws.$on('$message', function (message) {
            message = JSON.parse(message);
            handlers.forEach(function (handler) { handler(message) });
        });
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

        naudio.register(function (msg) {
            angular.merge($scope.nowplaying, msg);
            $scope.barStyle.width = ((msg.time.current / (msg.time.total || 0)) * 100) + '%';
            $scope.$apply();
        });

        $scope.togglePlaystate = function () {
            naudio.cmd({ command: CommandEnum.SET_PLAYSTATE, data: PlayStateEnum.PLAYING });
        };

        $scope.randomVolume = function () {
            naudio.cmd({ command: CommandEnum.SET_VOLUME, data: Math.floor(Math.random() * 100) });
        };
    }
]);

app.filter('trackTime', function () {
    return function (val) {
        var dur = moment.duration(val * 1000);
        return moment(dur.asMilliseconds()).format('mm:ss');
    }
});