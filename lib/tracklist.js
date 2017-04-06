(function (exports, undefined) {
    'use strict';

    const RepeatMode = require('../common/enums').RepeatMode;

    class Tracklist {
        constructor(list = [], current = -1, repeatmode = RepeatMode.OFF, order = 'tracknum') {
            this.list = list;
            this.currentindex = current;
            this.repeatmode = repeatmode;

            if (typeof order === 'function') {
                this.list.sort(order);
            } else {
                this.list.sort((a, b) => a[order] - b[order]);
            }
        }

        shuffle() {
            let j, x, i;
            for (i = this.length; i; i--) {
                j = Math.floor(Math.random() * i);
                x = this.list[i - 1];
                this.list[i - 1] = a[j];
                this.list[j] = x;
            }
        }

        get length() {
            return this.list.length;
        }

        get current() {
            return this.length < 1 ? undefined : this.list[this.currentindex];
        }

        get next() {
            if (this.length < 1) return undefined;
            if (this.repeatmode != RepeatMode.ONE && this.currentindex != this.length) {
                ++this.currentindex;
            } else if (this.repeatmode == RepeatMode.ALL) {
                this.currentindex = 0;
            } else {
                return undefined;
            }
            return this.list[this.currentindex];
        }

        get prev() {
            if (this.length < 1) return undefined;
            if (this.currentindex < 1) {
                this.currentindex = 0;
            } else {
                --this.currentindex;
            }
            return this.list[this.currentindex];
        }

        jump(track) {
            if (this.length < 1) return false;
            let ix = this.list.findIndex(p => track._id === p._id);
            if (ix > -1) {
                this.currentindex = ix;
                return true;
            } else {
                return false;
            }
        }
    }

    module.exports = Tracklist;
})(module.exports);