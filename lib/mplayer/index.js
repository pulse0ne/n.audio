const Player = require('./player'),
    EventEmitter = require('events').EventEmitter.prototype,
    _ = require('lodash');

const defaults = {
    verbose: false,
    debug: false
};

const MPlayer = function(options) {
    options = _.defaults(options || {}, defaults);

    this.player = new Player(options);
    this.status = {
        muted: false,
        playing: false,
        volume: 50
    };

    this.player.once('ready', function() {
        if(options.verbose) {
            console.log('player.ready');
        }
        this.emit('ready');
    }.bind(this));

    this.player.on('statuschange', function(status) {
        this.status = _.extend(this.status, status);
        if(options.verbose) {
            console.log('player.status', this.status);
        }
        this.emit('status', this.status);
    }.bind(this));

    this.player.on('playstart', function() {
        if(options.verbose) {
            console.log('player.start');
        }
        this.emit('start');
    }.bind(this));

    this.player.on('playstop', function() {
        if(options.verbose) {
            console.log('player.stop');
        }
        this.emit('stop')
    }.bind(this));

    let pauseTimeout,
        paused = false;

    this.player.on('timechange', function(time) {
        clearTimeout(pauseTimeout);
        pauseTimeout = setTimeout(function() {
            paused = true;
            this.status.playing = false;
            this.emit('pause');
            if(options.verbose) {
                console.log('player.pause');
            }
        }.bind(this), 100);
        if(paused) {
            paused = false;
            this.status.playing = true;
            this.emit('play');
            if(options.verbose) {
                console.log('player.play');
            }
        }
        this.emit('time', time);
        if(options.verbose) {
            console.log('player.time', time);
        }
    }.bind(this));
};

MPlayer.prototype = _.extend({
    setOptions: function(options) {
        if(options && options.length) {
            options.forEach(function(value, key) {
                this.player.cmd('set_property', [key, value]);
            }.bind(this));
        }
    },
    openFile: function(file, options) {
        this.player.cmd('stop');

        this.setOptions(options);
        this.player.cmd('loadfile', ['"' + file + '"']);

        this.status.playing = true;
    },
    play: function() {
        if(!this.status.playing) {
            this.player.cmd('pause');
            this.status.playing = true;
        }
    },
    pause: function() {
        if(this.status.playing) {
            this.player.cmd('pause');
            this.status.playing = false;
        }
    },
    stop: function() {
        this.player.cmd('stop');
    },
    seek: function(seconds) {
        this.player.cmd('pausing_keep seek', [seconds, 2]);
    },
    seekPercent: function(percent) {
        this.player.cmd('pausing_keep seek', [percent, 1]);
    },
    volume: function(percent) {
        this.status.volume = percent;
        this.player.cmd('pausing_keep_force volume', [percent, 1]);
    },
    mute: function() {
        this.status.muted = !this.status.muted;
        this.player.cmd('pausing_keep mute');
    }
}, EventEmitter);

module.exports = MPlayer;
