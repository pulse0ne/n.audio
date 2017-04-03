(function (exports) {

    exports.PlayState = {
        STOPPED: 0x1,
        PLAYING: 0x2,
        PAUSED: 0x3
    };

    exports.MessageType = {
        NOW_PLAYING: 0x1,
        VIEW_UPDATE: 0x2,
        COMMAND: 0x3
    };

    exports.Command = {
        SET_PLAYSTATE: 0x1,
        SEEK_TO: 0x2,
        SET_VOLUME: 0x3,
        REQUEST_VIEW: 0x4,
        CREATE_NEW_PLAYLIST: 0x5,
        ADD_TO_PLAYLIST: 0x6,
        ADD_SCAN_DIRECTORY: 0x7,
        REMOVE_SCAN_DIRECTORY: 0x8,
        DISABLE_SCAN_DIRECTORY: 0x9
    };

    exports.ViewType = {
        ARTIST_VIEW: 0x1,
        ALBUM_VIEW: 0x2,
        ALL_TRACKS_VIEW: 0x3,
        PLAYLIST_VIEW: 0x4
    };

    Object.freeze(exports.PlayStatEnum);
    Object.freeze(exports.MessageType);
    Object.freeze(exports.Command);
    Object.freeze(exports.ViewType);
})(typeof exports === 'undefined' ? window.enums = {} : exports);