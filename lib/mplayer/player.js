const spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter.prototype,
    _ = require('lodash');

const playingRE = /A:\s*(\d+)\.\d\s.*?\s(\d+)\.\d.*/;

const defaultArgs = ['-msglevel', 'global=6', '-msglevel', 'cplayer=4', '-idle', '-slave', '-vc', 'null', '-vo', 'null', '-volume', '50'];
const Player = function(options) {
    this.options = options;
    this.spawn();
};

Player.prototype = _.extend({
    spawn: function() {
        let args = [];

        if(typeof this.options.args === 'string') {
            args = this.options.args.split(' ');
        } else if(Array.isArray(this.options.args)) {
            args = this.options.args
        }

        let instance = spawn('mplayer', defaultArgs.concat(args));

        this.setStatus();

        let startTime = Date.now();

        instance.stdout.on('data', this.onData.bind(this));
        instance.stderr.on('data', this.onError.bind(this));

        instance.on('exit', function() {
            if(Date.now() - startTime < 3000) {
                // Process is erroring too close to start up, abort.
                process.exit(1);
            }
            if(this.options.debug) {
                console.log('mplayer process exited, restarting...');
            }
            this.emit('playstop');
            this.spawn();
        }.bind(this));

        this.instance = instance;
    },
    sendCommand: function(command, arguments) {
        arguments = arguments || [];
        if(typeof arguments.length === 'undefined') {
            arguments = [arguments];
        }
        if(this.options.debug) {
            console.log('>>>> COMMAND: ' + command, arguments);
        }
        this.instance.stdin.write([command].concat(arguments).join(' ') + '\n');
    },
    getStatus: function() {
        this.sendCommand('get_time_length');
    },
    setStatus: function(status) {
        let defaults = {
            duration: 0,
            filename: null,
            title: null
        };

        if(status) {
            this.status = _.defaults(_.extend(this.status || {}, status || {}), defaults);
        } else {
            this.status = _.defaults({}, defaults);
        }

        this.emit('statuschange', this.status);
    },
    onData: function(data) {
        if(this.options.debug) {
            console.log('stdout: ' + data);
        }

        data = data.toString();

        if(data.indexOf('MPlayer') === 0) {
            this.emit('ready');
            this.setStatus(false);
        }

        if(data.indexOf('StreamTitle') !== -1) {
            this.setStatus({
                title: data.match(/StreamTitle='([^']*)'/)[1]
            });
        }

        if(data.indexOf('Playing ') !== -1) {
            let file = data.match(/Playing\s(.+?)\.\s/)[1];
            this.setStatus(false);
            this.setStatus({
                filename: file
            });
            this.getStatus();
        }

        if(data.indexOf('Starting playback...') !== -1) {
            this.emit('playstart');
        }

        if(data.indexOf('EOF code:') > -1) {
            this.emit('playstop');
            this.setStatus();
        }

        if (playingRE.test(data)) {
            let time, duration;
            time = data.replace(playingRE, '$1').trim();
            duration = data.replace(playingRE, '$2').trim();
            this.emit('timechange', time);
            if (this.status.duration !== duration) {
                try {
                    duration = parseInt(duration);
                    this.setStatus({duration: duration});
                } catch (e) {
                    this.setStatus();
                }
            }
        }
    },
    onError: function(error) {
        if(this.options.debug) {
            console.log('stderr: ' + error);
        }
    }
}, EventEmitter);

module.exports = Player;
