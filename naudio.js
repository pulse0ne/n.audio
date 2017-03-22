/**
 * Created by tsned on 3/21/17.
 */
'use strict';

// var MPlayer = require('mplayer');
// var player = new MPlayer();
//
// player.on('start', console.log.bind(this, 'playback started'));
// player.on('time', console.log);
//
// player.openPlaylist('http://www.miastomuzyki.pl/n/rmfclassic.pls', {cache: 128, cacheMin: 1});
//
// setTimeout(player.volume.bind(player, 50), 10000);


var express = require('express');
var mplayer = require('mplayer');
var path = require('path');
var ws = require('ws');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.listen(8080);
