'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = Schema({
    name: String,
    artist: String,
    album: String,
    tracknum: Number,
    filename: String,
    disklocation: String,
    scanroot: String,
    dateadded: Date,
    lastplayed: Date,
    playcount: Number
});

trackSchema.pre('save', (next) => {
    let now = new Date();

    if (!this.dateadded) {
        this.dateadded = now;
    }

    next();
});

const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
