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
        PLAY_NEXT: 0x3,
        PLAY_PREV: 0x4,
        SET_VOLUME: 0x5,
        REQUEST_VIEW: 0x6,
        CREATE_NEW_PLAYLIST: 0x7,
        ADD_TO_PLAYLIST: 0x8,
        ADD_SCAN_DIRECTORY: 0x9,
        REMOVE_SCAN_DIRECTORY: 0xa,
        DISABLE_SCAN_DIRECTORY: 0xb,
        SET_EQ: 0xc
    };

    exports.ContextType = {
        ALL_ARTISTS: 0x1,
        ARTIST_DETAIL: 0x2,
        ALL_ALBUMS: 0x3,
        ALBUM_DETAIL: 0x4,
        ALL_TRACKS: 0x5,
        PLAYLIST: 0x6,
        PLAYLIST_DETAIL: 0x7
    };

    exports.RepeatMode = {
        OFF: 0x1,
        ONE: 0x2,
        ALL: 0x3
    };

    Object.freeze(exports.PlayStatEnum);
    Object.freeze(exports.MessageType);
    Object.freeze(exports.Command);
    Object.freeze(exports.ViewType);
    Object.freeze(exports.RepeatMode);
})(typeof exports === 'undefined' ? window.enums = {} : exports);