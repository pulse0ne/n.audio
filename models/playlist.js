'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playlistSchema = Schema({
    title: String,
    artist: String,
    album: String,
    filename: String,
    diskLocation: String,
    dateAdded: Date,
    lastPlayed: Date,
    playcount: Number
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
