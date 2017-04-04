'use strict';

const merge = (function () {

    const isObject = function( value) { return value !== null && typeof value === 'object' };
    const isDate = function (value) { return Object.prototype.toString.call(value) === '[object Date]' };
    const isFunction = function (value) { return typeof value === 'function' };
    const isRegExp = function (value) { return Object.prototype.toString.call(value) === '[object RegExp]' };

    const merge = function (dst) {
        let objs = [].slice.call(arguments, 1);
        for (let i = 0, ii = objs.length; i < ii; ++i) {
            let obj = objs[i];
            if (!isObject(obj) && !isFunction(obj)) continue;
            let keys = Object.keys(obj);
            for (let j = 0, jj = keys.length; j < jj; j++) {
                let key = keys[j];
                let src = obj[key];

                if (isObject(src)) {
                    if (isDate(src)) {
                        dst[key] = new Date(src.valueOf());
                    } else if (isRegExp(src)) {
                        dst[key] = new RegExp(src);
                    } else {
                        if (!isObject(dst[key])) dst[key] = Array.isArray(src) ? [] : {};
                        merge(dst[key], [src], true);
                    }
                } else {
                    dst[key] = src;
                }
            }
        }

        return dst;
    };

    return { merge: merge };
})();

module.exports = merge;
