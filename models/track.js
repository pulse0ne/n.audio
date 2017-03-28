'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = Schema({
    name: String,
    artist: String,
    album: String,
    trackNum: Number,
    filename: String,
    diskLocation: String,
    dateAdded: Date,
    lastPlayed: Date,
    playcount: Number
});

trackSchema.pre('save', (next) => {
    let now = new Date();

    if (!this.dateAdded) {
        this.dateAdded = now;
    }

    next();
});

const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
