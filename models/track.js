'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = Schema({
    title: String,
    artist: String,
    album: String,
    tracknum: Number,
    filename: String,
    disklocation: String,
    scanroot: String,
    year: String,
    dateadded: Date,
    lastplayed: Date,
    playcount: Number
});

trackSchema.methods.updatePlaycount = function () {
    lastplayed = new Date();
};

const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
