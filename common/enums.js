(function (exports) {

    exports.PlayStateEnum = {
        STOPPED: 0,
        PLAYING: 1,
        PAUSED: 2
    };

    exports.CommandEnum = {
        SET_PLAYSTATE: 0,
        SEEK_TO: 1,
        SET_VOLUME: 2
    };

    Object.freeze(exports.PlayStatEnum);
    Object.freeze(exports.CommandEnum);

})(typeof exports === 'undefined' ? window.enums = {} : exports);