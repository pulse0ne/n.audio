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
    'n.audio.service',
    function ($scope, $rootScope, naudio) {
        var CommandEnum = (window.enums || {}).CommandEnum || {};
        var PlayStateEnum = (window.enums || {}).PlayStateEnum || {};
        $scope.nowplaying = {};
        $scope.slider = {};

        naudio.register(function (msg) {
            $scope.nowplaying = msg;
            $scope.slider.position = (msg.time.current / (msg.time.total || 1)) * 100;
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