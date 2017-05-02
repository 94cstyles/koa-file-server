const {extend} = require('lodash')
const parseUrl = require('./lib/parseUrl')
const validate = require('./lib/validate')
const sendFile = require('./lib/sendFile')
const cache = sendFile.cache
const debug = require('debug')('koa-file-server')

module.exports = (root, options) => {
  if (typeof root === 'object') {
    options = root
    root = null
  }

  options = extend({
    root: process.cwd(),
    webp: true,
    identifier: '??',
    maxAge: 60 * 60 * 24 * 30,
    cache: {
      dirName: '__cache',
      maxAge: 1000 * 60 * 60,
      maxSize: 1024 * 1024 * 500
    },
    compress: [
      'application/javascript',
      'application/rss+xml',
      'application/vnd.ms-fontobject',
      'application/x-font',
      'application/x-font-opentype',
      'application/x-font-otf',
      'application/x-font-truetype',
      'application/x-font-ttf',
      'application/x-javascript',
      'application/xhtml+xml',
      'application/xml',
      'font/opentype',
      'font/otf',
      'font/ttf',
      'image/svg+xml',
      'image/x-icon',
      'text/css',
      'text/html',
      'text/javascript',
      'text/plain',
      'text/xml'
    ]
  }, options)
  root = root || options.root

  cache.__init(options.cache)

  return async function serve (ctx, next) {
    await next()

    // 请求过滤
    if (!/^GET|HEAD$/.test(ctx.method) || ctx.status !== 404 || ctx.body) return

    // 解析请求
    let request = parseUrl(root, options, decodeURIComponent(ctx.url), ctx.request.header.accept)

    // 解析成功验证文件是否存在
    if (/^20[0-7]$/.test(request.status)) request = await validate(root, request)

    debug('解析结束:' + JSON.stringify(request, null, 4))

    // 请求状态
    ctx.status = request.status

    if (/^20[0-7]$/.test(request.status)) {
      sendFile(ctx, request.body, options)
    } else if (/^400|500$/.test(request.status)) {
      ctx.body = request.body.error
    }
  }
}

module.exports.staticCache = cache
