const fs = require('mz/fs')
const mime = require('mime')
const calculate = require('etag')
const LRU = require('lru-cache')
const zlib = require('mz/zlib')
const debug = require('debug')('koa-file-server:sendFile')

const cache = {
  __obj: null,
  __init: function (options) {
    this.__obj = LRU({
      max: options.maxSize,
      maxAge: options.maxAge,
      length: async function (n, key) {
        return n.size + 100
      }
    })
  }
};

['set', 'get', 'peek', 'del', 'reset', 'keys', 'values', 'length', 'itemCount', 'dump', 'load', 'prune'].forEach(function (method) {
  cache[method] = function () {
    return this.__obj[method].apply(this.__obj, arguments)
  }
})

/**
 * 获取文件
 * @param filePath
 * @param stats
 * @returns {*}
 */
function loadFile (filePath, stats) {
  let fileCache = cache.get(filePath)
  if (!fileCache) {
    fileCache = {
      content: fs.readFileSync(filePath),
      mTime: stats.mtime,
      etag: calculate(stats, {
        weak: true
      }),
      size: stats.size
    }

    cache.set(filePath, fileCache)
  } else {
    debug('文件存在缓存:' + filePath)
  }
  return fileCache
}

/**
 * 请求响应文件
 * @param ctx
 * @param request 请求内容
 */
module.exports = function sendFile (ctx, request, options) {
  const miniType = mime.lookup(request.filePath || request.files[0])
  let fileCache

  ctx.set('Cache-Control', 'public, max-age=' + parseInt(options.maxAge))
  ctx.type = miniType + ';charset=utf-8'

  if (request.files) {
    fileCache = {}
    request.files.forEach(function (filePath, index) {
      const _obj = loadFile(filePath, request.stats[index])
      fileCache.mTime = fileCache.mTime ? Math.max(_obj.mTime, fileCache.mTime) : _obj.mTime
      fileCache.content += (index > 0 ? '\n' : '') + _obj.content
    })
    fileCache.eTag = calculate(fileCache.content)
  } else {
    fileCache = loadFile(request.filePath, request.stats)
  }

  ctx.response.lastModified = (new Date(fileCache.mTime)).toUTCString()
  ctx.etag = fileCache.eTag

  if (options.compress.indexOf(miniType) !== -1) {
    debug('gzip压缩文件,' + miniType)

    ctx.set('Content-Encoding', 'gzip')

    const stream = zlib.createGzip({flush: zlib.Z_SYNC_FLUSH})
    stream.end(fileCache.content)
    ctx.body = stream
  } else {
    ctx.body = fileCache.content
  }

  debug('响应发送文件')
}

module.exports.cache = cache
