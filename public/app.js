/**
 * Created by tsned on 3/21/17.
 */
'use strict';

var app = angular.module('n.audio', ['ngMaterial', 'ngWebsocket']);

app.service('n.audio.service', [
    '$websocket',
    function () {
        setTimeout(function () { console.log('service')}, 4000);
    }
]);

app.controller('n.audio.controller.main', [
    '$scope',
    '$rootScope',
    'n.audio.service',
    function ($scope, $rootScope, naudio) {
        setTimeout(function () { console.log('controller')}, 2000);
    }
]);