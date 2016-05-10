"use strict";

const gm = require('gm').subClass({imageMagick: true});

//使用Promise包装gm对象方法
gm.prototype.writeSync = function (filePath) {
    return new Promise((resolve)=> {
        this.write(filePath, function (err) {
            resolve(err);
        });
    });
};
gm.prototype.sizeSync = function () {
    return new Promise((resolve)=> {
        this.size(function (err, size) {
            resolve(err ? null : size);
        });
    });
};

module.exports = gm;