(function (exports) {

    exports.PlayStateEnum = {
        STOPPED: 0,
        PLAYING: 1,
        PAUSED: 2
    };

    exports.CommandEnum = {
        SET_PLAYSTATE: 0,
        SEEK_TO: 1,
        SET_VOLUME: 2,
        REQUEST_VIEW: 3,
        CREATE_NEW_PLAYLIST: 4,
        ADD_TO_PLAYLIST: 5,
        ADD_SCAN_DIRECTORY: 6,
        REMOVE_SCAN_DIRECTORY: 7,
        DISABLE_SCAN_DIRECTORY: 8
    };

    exports.ViewTypeEnum = {
        ARTIST_VIEW: 0,
        ALBUM_VIEW: 1,
        ALL_TRACKS_VIEW: 2,
        PLAYLIST_VIEW: 3
    };

    Object.freeze(exports.PlayStatEnum);
    Object.freeze(exports.CommandEnum);
    Object.freeze(exports.ViewTypeEnum);
})(typeof exports === 'undefined' ? window.enums = {} : exports);