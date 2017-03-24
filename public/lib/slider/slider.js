/**
 * Created by tsned on 3/23/17.
 */
'use strict';

var _slider_tmpl = '' +
    '<div class="track-container">' +
    '  <div class="track-slider" layout="row" layout-align="center center">' +
    '    <span>{{track.current | trackTime}}</span>' +
    '    <div class="track-bar">' +
    '      <div class="track-progress" ng-style="progressStyle">' +
    '        <div class="track-thumb"></div>' +
    '      </div>' +
    '    </div>' +
    '    <span>{{track.total | trackTime}}</span>' +
    '  </div>' +
    '</div>';

var _slider = angular.module('n.audio.track.slider', ['ngMaterial']);

_slider.factory('nSliderFactory', [function () {
    return function (scope, elem) {
        var self = this;
        self.scope = scope;
        self.elem = elem;
        self.internal = false;
        self.scope.progressStyle = {
            width: '0%'
        };
        self.scope.track = {
            total: 0,
            current: 0
        };

        var updateProgress = function (curr, tot) {
            self.scope.progressStyle.width = ((curr / (tot || 1)) * 100) + '%';
        };

        self.scope.$watch('current', function (newVal, oldVal) {
            if (!self.internal && newVal !== oldVal) {
                // TODO
                console.log('current changed');
                self.scope.track.current = newVal;
                updateProgress(self.scope.track.current, self.scope.track.total);
            }
        });

        self.scope.$watch('total', function (newVal, oldVal) {
            if (!self.internal && newVal !== oldVal) {
                // TODO
                console.log('total changed');
                self.scope.track.total = newVal;
                updateProgress(self.scope.track.current, self.scope.track.total);
            }
        });

        self.scope.$on('$destroy', function () {
            self.unbindEvents();
        });

        self.initElementHandles = function () {

        };

        self.manageElementsStyle = function () {

        };

        self.initHandles = function () {

        };

        self.manageEventBindings = function () {

        };

        self.bindEvents = function () {

        };

        self.unbindEvents = function () {

        };

        self.initElementHandles();
        self.manageElementsStyle(); // TODO?
        self.initHandles();
        self.manageEventBindings();
    };
}]);

_slider.directive('nTrackSlider', ['nSliderFactory', function (Slider) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            current: '=',
            total: '=',
            callbacks: '=?'
        },
        template: _slider_tmpl,
        link: function (scope, elem) {
            scope.slider = new Slider(scope, elem);
        }
    }
}]);

_slider.filter('trackTime', function () {
    return function (val) {
        var dur = moment.duration(val * 1000);
        return moment(dur.asMilliseconds()).format('mm:ss');
    }
});