'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const albumSchema = Schema({
    name: String,
    tracks: [{type: Schema.Types.ObjectId, ref: 'Track'}]
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;
