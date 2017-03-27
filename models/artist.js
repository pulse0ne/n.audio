'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const artistSchema = Schema({
    name: String,
    albums: [{type: Schema.Types.ObjectId, ref: 'Album'}],
    orphanTracks: [{type: Schema.Types.ObjectId, ref: 'Track'}]
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
