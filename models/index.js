'use strict';

const Track = require('./track.js');
const Album = require('./album.js');
const Artist = require('./artist.js');
const Playlist = require('./playlist.js');

module.exports = Object.assign({}, Track, Album, Artist, Playlist);
