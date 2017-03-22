'use strict';

/**
 * A (nearly) drop-in replacement for ng-websocket-0.2.1. This provides the same
 * wrapping of the html5 WebSocket object, without the mock object and with
 * simplified handling, better private variable separation, and better configuration.
 * This service keeps track of multiple websocket connections, each individually
 * configurable.
 */

angular.module('ngWebsocket', []).service('$websocket', [function () {
    var self = this;
    var defaultConfig = {
        url: null,
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectInterval: 300000,
        doubleInterval: true,
        reconnectFn: null,
        protocols: null,
        immediate: true
    };
    var wsRegistry = {};

    self.CONNECTING = 0;
    self.OPEN = 1;
    self.CLOSING = 2;
    self.CLOSED = 3;

    /**
     * The main websocket object
     *
     * @param config
     * @returns {_websocket}
     * @private
     */
    function _websocket(config) {
        var sock = this;
        var events = {};
        var websocket = null;
        var reconnectIntervalId = null;
        var interval = config.reconnectInterval;

        var fireEvent = function fireEvent(event, data) {
            (events[event] || []).forEach(function (listener) {
                listener(data);
            });
        };

        var init = function init() {
            websocket = config.protocols ? new WebSocket(config.url, config.protocols) : new WebSocket(config.url);

            websocket.onmessage = function (message) {
                fireEvent('$message', message.data);
            };
            websocket.onerror = function (err) {
                fireEvent('$error', err);
            };

            websocket.onopen = function () {
                interval = config.reconnectInterval;
                if (reconnectIntervalId) {
                    clearInterval(reconnectIntervalId);
                    reconnectIntervalId = null;
                }
                fireEvent('$open');
            };

            websocket.onclose = function (close) {
                if (config.reconnect && config.reconnectFn && config.reconnectFn(close.code)) {
                    interval = config.doubleInterval ? Math.min(interval * 2, config.maxReconnectInterval) : interval;
                    reconnectIntervalId = setInterval(function () {
                        if (sock.$status() === self.CLOSED) {
                            sock.$open();
                        }
                    }, interval);
                }
                fireEvent('$close', close.code);
            };
        };

        /**
         * (Chainable) Handler registration for events
         * @param event in [$open, $message, $close, $error]
         * @param fn
         * @returns {_websocket}
         */
        sock.$on = function (event, fn) {
            if (!event || !fn) {
                throw '$on requires an event string and a function';
            }
            events[event] = events[event] || [];
            events[event].push(fn);

            return sock;
        };

        /**
         * (Chainable) De-registers a handler from an event
         * @param event in [$open, $message, $close, $error]
         * @returns {_websocket}
         */
        sock.$un = function (event) {
            if (events[event]) {
                delete events[event];
            }
            return sock;
        };

        /**
         * Stringifies message (if necessary) and sends it
         * @param message
         */
        sock.$send = function (message) {
            if (typeof message !== 'string') {
                message = JSON.stringify(message);
            }
            if (sock.$ready()) {
                websocket.send(message);
            }
        };

        /**
         * (Chainable) opens the websocket manually and initializes it
         * @returns {_websocket}
         */
        sock.$open = function () {
            if (sock.$status() !== self.OPEN) {
                init(config);
            }
            return sock;
        };

        /**
         * (Chainable) closes the websocket
         * @returns {_websocket}
         */
        sock.$close = function (code) {
            if (sock.$status() !== self.CLOSED) {
                websocket.close(code || 1000);
            }
            if (reconnectIntervalId) {
                clearInterval(reconnectIntervalId);
                reconnectIntervalId = null;
            }
            config.reconnect = false;
            return sock;
        };

        /**
         * Returns the status of this websocket
         * @returns {Number}
         */
        sock.$status = function () {
            return websocket ? websocket.readyState : self.CLOSED;
        };

        /**
         * Returns a boolean representing whether or not this websocket is open and ready
         * @returns {boolean}
         */
        sock.$ready = function () {
            return sock.$status() === self.OPEN;
        };

        if (config.immediate) {
            init();
        }
        return sock;
    }

    /**
     * Returns an existing websocket connection, if it exists.
     * @param url
     * @returns {*}
     */
    self.$get = function (url) {
        return wsRegistry[url];
    };

    /**
     * Creates, registers, and returns a new _websocket. The configuration options are as follows:
     *   - url                  (required) the ws or wss url of the remote endpoint
     *   - immediate            (default: true) immediate initialization. If set to false,
     *                            the _websocket#$open method must be called to open the websocket
     *                            and initialize it.
     *   - protocols            (optional) sub-protocols to indicate to the server
     *   - reconnect            (default: true) whether self-repair reconnect should be used
     *   - reconnectInterval    (default: 1000ms) reconnect delay
     *   - maxReconnectInterval (default: 300000ms) the maximum reconnect delay
     *   - doubleInterval       (default: true) doubles the interval on each failed reconnect attempt
     *   - reconnectFn          (optional) a callback that is passed the disconnect code, and must
     *                            return true or false to indicate whether or not the reconnect should
     *                            be attempted
     * @param config or url string
     */
    self.$new = function (config) {
        config = angular.merge({}, defaultConfig, typeof config === 'string' ? { url: config } : config || {});
        var w = self.$get(config.url);
        if (!w) {
            w = new _websocket(config);
            wsRegistry[config.url] = w;
        }
        return w;
    };
}]);
