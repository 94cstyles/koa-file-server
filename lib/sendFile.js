"use strict";

import fs from 'mz/fs';
import mime from 'mime';
import calculate from 'etag';
import LRU from 'lru-cache';
import zlib from 'mz/zlib';
import _debug from 'debug';

const debug = _debug('koa-file-server:sendFile');

var cache = {
    __obj: null,
    __init: function (options) {
        this.__obj = LRU({
            max: options.maxSize,
            maxAge: options.maxAge,
            length: async function (n, key) {
                return n.size + 100;
            }
        });
    }
};

['set', 'get', 'peek', 'del', 'reset', 'keys', 'values', 'length', 'itemCount', 'dump', 'load', 'prune'].forEach(function (method) {
    cache[method] = function () {
        return this.__obj[method].apply(this.__obj, arguments);
    }
});

export var cache = cache;

/**
 * 请求响应文件
 * @param ctx
 * @param request 请求内容
 */
export default function sendFile(ctx, request, options) {
    var body, content, miniType, eTag, mTime, _cache;
    miniType = mime.lookup(request.filePath || request.files[0]);

    ctx.set('Cache-Control', 'public, max-age=' + parseInt(options.maxAge));
    ctx.type = miniType + ';charset=utf-8';

    if (request.files) {
        request.files.forEach(function (filePath, index) {
            if (!(_cache = cache.get(filePath))) {
                content = fs.readFileSync(filePath, 'utf8');

                cache.set(filePath, {
                    body: content,
                    size: request.stats[index].size
                });
            } else {
                content = _cache.body;
                debug('文件存在缓存:' + filePath);
            }
            mTime = mTime ? request.stats[index].mtime > mTime ? request.stats[index].mtime : mTime : request.stats[index].mtime;
            body += (index > 0 ? '\n' : '') + content;
        });
        eTag = calculate(body);
    } else {
        if (!(_cache = cache.get(request.filePath))) {
            body = fs.readFileSync(request.filePath);
            mTime = request.stats.mtime;
            eTag = calculate(request.stats, {
                weak: true
            });

            cache.set(request.filePath, {
                body: body,
                mTime: mTime,
                eTag: eTag,
                size: request.stats.size
            });
        } else {
            body = _cache.body;
            mTime = _cache.mTime;
            eTag = _cache.eTag;
            debug('文件存在缓存:' + request.filePath);
        }
    }


    ctx.response.lastModified = mTime.toUTCString();
    ctx.etag = eTag;

    if (options.compress.indexOf(miniType) !== -1) {
        debug('gzip压缩文件,' + miniType);
        let stream = zlib.createGzip({flush: zlib.Z_SYNC_FLUSH});
        ctx.set('Content-Encoding', 'gzip');
        stream.end(body);
        ctx.body = stream;
    } else {
        ctx.body = body;
    }

    debug('响应发送文件');
}
