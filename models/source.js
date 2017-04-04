'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sourceSchema = Schema({
    root: String,
    enabled: Boolean
});

const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;
