/**
 * Created by tsned on 3/21/17.
 */
'use strict';

const express = require('express');
const ffmeta = require('ffmetadata');
const fs = require('fs-extra');
const klaw = require('klaw');
const mongoose = require('mongoose');
const path = require('path');
const ws = require('ws');

const mplayer = require('./lib/mplayer');
const enums = require('./common/enums.js');

const PlayStateEnum = enums.PlayStateEnum;
const CommandEnum = enums.CommandEnum;

// db models
const Track = require('./models/track');
const Playlist = require('./models/playlist');

const app = express();

const dbOpts = { server: { socketTimeoutMS: 0, connectionTimeoutMS: 0 } };

const audioCodecs = ['mp3', 'aac', 'wma', 'wav', 'alac', 'flac', 'ogg'];

app.use(express.static(path.join(__dirname, 'public')));
app.use('/common', express.static(path.join(__dirname, 'common')));

let config = {};
try {
    if (process.argv[2]) {
        config = JSON.parse(fs.readFileSync(process.argv[2]));
    } else {
        config = JSON.parse(fs.readFileSync(path.join(__dirname, 'default-config.json')));
    }
} catch (e) {
    console.error('Could not read the config file!', e);
    process.exit(1);
}

mongoose.Promise = global.Promise;
const db = mongoose.connect(config.dbUrl, dbOpts);

// globals
const nowplaying = {
    time: {
        total: 0,
        current: 0
    },
    playstate: PlayStateEnum.STOPPED,
    volume: 50,
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
    wsServer.broadcast({nowplaying: nowplaying});
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

const scanDirectory = function (dir, errCb) {
    fs.access(dir, fs.constants.R_OK, (err) => {
        if (err) {
            console.error('Could not scan directory. Does it exist?', err);
            errCb(err);
        } else {
            let count = 0;
            klaw(dir).on('data', item => {
                let ext = item.path.split('.').reverse()[0];
                if (!item.stats.isDirectory() && audioCodecs.indexOf(ext) > -1) {
                    count += 1;
                    Track.findOne( { filename: item.path }, (err, track) => {
                        if (!err && !track) {
                            ffmeta.read(item.path, (err, metadata) => {
                                let fnameParts = item.path.split('/');
                                let newTrack = Track({
                                    artist: metadata.artist,
                                    album: metadata.album,
                                    name: metadata.title,
                                    filename: fnameParts[fnameParts.length - 1],
                                    disklocation: item.path,
                                    scanroot: dir,
                                    playcount: 0,
                                    tracknum: (metadata.track || '').split('/')[0]
                                });
                                console.log('saving: ' + newTrack.filename);

                                newTrack.save((err) => {
                                    if (err) {
                                        console.error(err);
                                    }
                                });
                            });
                        }
                    });
                }
            }).on('end', () => {
                console.log('done scanning directory (' + count + ' files)');
            });
        }
    });
};

db.then(() => scanDirectory('/home/tsned/Music', () => {}));

wsServer.on('connection', function (websocket) {

    websocket.broadcast({nowplaying: nowplaying});

    db.then(() => {
        Track.distinct('artist', function (err, result) {
            if (!err) websocket.send(result);
        });
    });

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
                let currentPlaystate = nowplaying.playstate;
                player.volume(message.data);
                nowplaying.volume = message.data;
                // TODO: this is ugly...need to have a smart queue or something
                if (currentPlaystate !== PlayStateEnum.PLAYING) {
                    setTimeout(() => player.pause(), 100);
                }
                break;
            default:
                break;
        }
    });
});

setInterval(() => {
    if (nowplaying.playstate === PlayStateEnum.PLAYING) {
        wsServer.broadcast({nowplaying: nowplaying});
    }
}, 1000);

app.all('*', function (req, res) {
    res.redirect('/');
});

app.listen(8080, () => console.log('server started'));
