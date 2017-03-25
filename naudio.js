/**
 * Created by tsned on 3/21/17.
 */
'use strict';

const express = require('express');
const ffmeta = require('ffmetadata');
const fs = require('fs-extra');
const mongoose = require('mongoose');
const path = require('path');
const ws = require('ws');

const mplayer = require('./lib/mplayer');
const enums = require('./common/enums.js');

const PlayStateEnum = enums.PlayStateEnum;
const CommandEnum = enums.CommandEnum;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/common', express.static(path.join(__dirname, 'common')));

let config = {};
try {
    if (process.argv[2]) {
        config = fs.readFileSync(process.argv[2]);
    } else {
        config = fs.readFileSync(path.join(__dirname, 'default-config.json'));
    }
} catch (e) {
    console.error('Could not read the config file!', e);
    process.exit(1);
}

// globals
const nowplaying = {
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
    context: null
};
const wsServer = new ws.Server({ port: 1777, path: '/ws' });
const player = new mplayer();

wsServer.broadcast = function (data) {
    data = typeof data === 'string' ? data : JSON.stringify(data);
    [...wsServer.clients].filter(client => client && client.readyState === 1)
        .forEach(client => client.send(data));
};

const updatePlaystate = function (state) {
    nowplaying.playstate = state;
    wsServer.broadcast(nowplaying);
};

player.on('status', status => {
    nowplaying.volume = status.volume;
    nowplaying.time.total = status.duration;
});

player.on('start', () => updatePlaystate(PlayStateEnum.PLAYING));
player.on('play', () => updatePlaystate(PlayStateEnum.PLAYING));
player.on('pause', () => updatePlaystate(PlayStateEnum.PAUSED));
player.on('stop', () => updatePlaystate(PlayStateEnum.STOPPED));
player.on('time', time => nowplaying.time.current = time);

wsServer.on('connection', function (websocket) {

    wsServer.broadcast(nowplaying);

    websocket.on('message', function (msg) {
        let message = {};
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
                      // player.openFile('/home/tsned/Documents/Perturbator/disco_inferno.mp3');
                    player.openFile('/home/tsned/Documents/Perturbator/disco_inferno.flac');
                } else if (nowplaying.playstate === PlayStateEnum.PAUSED) {
                    console.log('resuming');
                    player.play();
                } else if (nowplaying.playstate === PlayStateEnum.PLAYING) {
                    console.log('pausing');
                    player.pause();
                }
                break;
            case CommandEnum.SEEK_TO:
                player.seekPercent(message.data);
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

setInterval(() => {
    if (nowplaying.playstate === PlayStateEnum.PLAYING) {
        wsServer.broadcast(nowplaying);
    }
}, 1000);

app.listen(8080, () => console.log('server started'));
