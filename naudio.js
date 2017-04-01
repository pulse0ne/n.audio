/**
 * Created by tsned on 3/21/17.
 */
'use strict';

const async = require('async');
const cookieParser = require('cookie-parser');
const express = require('express');
const fs = require('fs-extra');
const klaw = require('klaw');
const metadata = require('musicmetadata');
const mongoose = require('mongoose');
const path = require('path');
const ws = require('ws');

const EventEmitter = require('events');

const mplayer = require('./lib/mplayer');
const enums = require('./common/enums.js');

const PlayStateEnum = enums.PlayStateEnum;
const CommandEnum = enums.CommandEnum;
const ViewTypeEnum = enums.ViewTypeEnum;

// db models
const Track = require('./models/track');
const Playlist = require('./models/playlist');

const app = express();

const dbOpts = { server: { socketTimeoutMS: 0, connectionTimeoutMS: 0 } };
const supportedExts = ['.mp3', '.m4a', '.flac', '.ogg'];

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

app.use(cookieParser());
app.use((req, res, next) => {
    res.cookie('wsPort', config.wsPort);
    res.cookie('wsPath', config.wsPath);
    next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/common', express.static(path.join(__dirname, 'common')));

mongoose.Promise = global.Promise;
const db = mongoose.connect(config.dbUrl, dbOpts);
/*TODO:remove*/db.then(() => Track.remove({}));

class NAudioEmitter extends EventEmitter {}

const rootDir = config.rootDir;
const emitter = new NAudioEmitter();
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
const wsServer = new ws.Server({ port: config.wsPort, path: config.wsPath });
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

const metadataExtractor = function (scanRoot) {
    return function (item, cb) {
        let readStream = fs.createReadStream(item);
        metadata(readStream, (err, meta) => {
            readStream.close();
            let m = {
                artist: meta.artist[0],
                album: meta.album,
                name: meta.title,
                filename: path.basename(item),
                disklocation: item,
                scanroot: scanRoot,
                playcount: 0,
                year: meta.year,
                tracknum: (meta.track || {}).no,
                dateadded: new Date()
            };
            return cb(err, m);
        });
    }
};

const audioFileFilter = x => !x.stats.isDirectory() && supportedExts.indexOf(path.extname(x.path)) > -1;

const doBulkTrackSave = function (err, meta) {
    console.log('Found metadata for ' + meta.length + ' files');
    db.then(() => {
        let bulk = Track.collection.initializeUnorderedBulkOp();
        meta.forEach(r => bulk.find({match: 'disklocation'}).upsert().updateOne(r));
        bulk.execute((err, res) => {
            console.log('Bulk insert complete. isOk=' + res.isOk() + ' | nUpserted=' + res.nUpserted);
            emitter.emit('db.scan.complete');
        });
    });
};

const scanDirectory = function (dir, errCb) {
    fs.access(dir, fs.constants.R_OK, (err) => {
        if (err) {
            errCb(err);
        } else {
            let files = [];
            klaw(dir).on('data', item => {
                if (audioFileFilter(item)) {
                    files.push(item.path);
                }
            }).on('end', () => {
                console.log('Found ' + files.length + ' files');
                async.mapLimit(files, 500, metadataExtractor(dir), doBulkTrackSave);
            });
        }
    });
};

/*TODO:remove*/db.then(() => scanDirectory('/home/tsned/Music', () => {}));

wsServer.on('connection', function (websocket) {

    websocket.send(JSON.stringify({nowplaying: nowplaying}));

    db.then(() => {
        Track.distinct('artist', function (err, result) {
            if (!err) websocket.send(JSON.stringify({ view: ViewTypeEnum.ARTIST_VIEW, artists: result }));
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
                        player.openFile('/home/tsned/Documents/Perturbator/disco_inferno.mp3');
                    //player.openFile('/home/tsned/Documents/Perturbator/disco_inferno.flac');
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

app.listen(config.httpPort, () => console.log('server started'));
