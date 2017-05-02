/* eslint no-cond-assign: */

const path = require('path')
const helper = require('./helper')
const parseImage = require('./parseImage')
const debug = require('debug')('koa-file-server:parseUrl')

/**
 * 解析请求url
 * @param root 静态文件根目录
 * @param options 静态文件配置选项
 * @param url 请求地址
 * @param accept 请求accept
 * @returns {object}
 */
module.exports = function parseUrl (root, options, url, accept) {
  debug('解析请求:' + url)

  // 是否包含文件合并标识符
  if (url.indexOf(options.identifier) === -1) {
    const parts = url.match(/^(.*?)\?(.*?)$/) || [url, url, ''] // 拆分url
    const file = path.parse(parts[1])

    debug('单文件请求')

    // 对图片进行处理 (不能对Gif进行处理)
    if (helper.sourceImgExt.test(file.ext)) {
      debug('对非gif图片进行分析')
      return parseImage(root, file, parts[2], options.cache.dirName, !/^.webp$/i.test(file.ext) && options.webp && /image\/webp/.test(accept))
    } else {
      const sourcePath = path.join(root, parts[1])
      return {
        status: 200,
        body: {
          filePath: sourcePath,
          sourcePath: sourcePath,
          imageView: null
        }
      }
    }
  } else {
    let files, filePath, ext, _ext

    const parts = url.split(options.identifier) // 拆分url

    debug('多文件请求:' + parts[1])

    // 标识符只能有一个并且不是末尾 否则就解析失败
    if (parts.length === 2 && parts[1] !== '') {
      files = parts[1].split(',').map(function (value) {
        // 清除参数
        value = value.replace(/\?(.*?)$/, '')

        // 获取文件的绝对路径 并去除query string
        filePath = path.join(root, parts[0], value)

        // 获取文件的扩展名 不允许出现不同格式的文件
        if (_ext = path.extname(filePath)) {
          ext = ext ? ext !== _ext ? null : ext : ext === null ? null : _ext
        }

        return filePath
      })
    }

    if (!files || !ext || !/^.js|.css$/.test(ext)) debug('解析失败:Your browser sent a request that this server could not understand')

    return !files || !ext || !/^.js|.css$/.test(ext) ? {
      status: 400,
      body: {
        error: 'Your browser sent a request that this server could not understand'
      }
    } : {
      status: 200,
      body: {
        files: files
      }
    }
  }
}