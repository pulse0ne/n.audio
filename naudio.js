/**
 * Created by tsned on 3/21/17.
 */
'use strict';

var express = require('express');
var ffmeta = require('ffmetadata');
var path = require('path');
var ws = require('ws');

var mplayer = require('./lib/mplayer');
var enums = require('./common/enums.js');

var PlayStateEnum = enums.PlayStateEnum;
var CommandEnum = enums.CommandEnum;

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/common', express.static(path.join(__dirname, 'common')));

// globals
var nowplaying = {
    time: {
        total: 0,
        current: 0
    },
    playstate: PlayStateEnum.STOPPED,
    volume: 0,
    title: null,
    artist: null,
    album: null,
    filename: null,
    upnext: null,
    playlist: null
};
var wsServer = new ws.Server({ port: 1776, path: '/ws' });
var player = new mplayer();

wsServer.broadcast = function (data) {
    data = typeof data === 'string' ? data : JSON.stringify(data);
    [...wsServer.clients].filter(client => client && client.readyState === 1)
        .forEach(client => client.send(data));
};

var updatePlaystate = function (state) {
    nowplaying.playstate = state;
    wsServer.broadcast(nowplaying);
};

player.on('status', status => {
    console.log(status);
    nowplaying.volume = status.volume;
    nowplaying.time.total = status.duration;
});

player.on('start', () => updatePlaystate(PlayStateEnum.PLAYING));
player.on('play', () => updatePlaystate(PlayStateEnum.PLAYING));
player.on('pause', () => updatePlaystate(PlayStateEnum.PAUSED));
player.on('stop', () => updatePlaystate(PlayStateEnum.STOPPED));
player.on('time', time => nowplaying.time.current = time);

wsServer.on('connection', function (websocket) {

    websocket.on('message', function (msg) {
        var message = {};
        try {
            message = JSON.parse(msg);
        } catch (e) {
            console.error('Could not parse message!');
        }

        // TODO: refactor below
        switch(message.command) {
            case CommandEnum.SET_PLAYSTATE:
                if (nowplaying.playstate === PlayStateEnum.STOPPED) {
                    console.log('opening file');
                    player.openFile('/home/tsned/Documents/Perturbator/disco_inferno.mp3');
                } else if (nowplaying.playstate === PlayStateEnum.PAUSED) {
                    console.log('resuming');
                    player.play();
                } else if (nowplaying.playstate === PlayStateEnum.PLAYING) {
                    console.log('pausing');
                    player.pause();
                }
                break;
            case CommandEnum.SEEK_TO:
                break;
            case CommandEnum.SET_VOLUME:
                player.volume(message.data);
                nowplaying.volume = message.data;
                break;
            default:
                break;
        }
    });
});

setInterval(() => { wsServer.broadcast(nowplaying) }, 1000);

app.listen(8080, () => console.log('server started'));
