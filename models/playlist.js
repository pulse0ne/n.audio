'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playlistSchema = Schema({
    name: String,
    tracks: [{ type: Schema.Types.ObjectId, ref: 'Track' }]
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
