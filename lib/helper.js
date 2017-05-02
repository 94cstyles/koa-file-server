const path = require('path')
const fs = require('mz/fs')
const debug = require('debug')('koa-file-server:helper')

const helper = {
  // 图片处理 支持原图片格式
  sourceImgExt: /^\.(jpe?g|tif?f|png(8|24|32|48|64)?|webp|bmp|svg)$/i,
  // 图片处理 支持参数名
  paramNameList: /^auto-orient|thumbnail|strip|gravity|crop|rotate|format|blur|interlace|quality$/,
  // 图片处理 参数无值
  paramValueNull: /^auto-orient|strip$/,
  // 图片处理 参数值的规则
  paramValueRules: {
    'thumbnail': [
      /^(\d+\.\d+|\d+)?x(\d+\.\d+|\d+)?$/,
      /^(\d+\.\d+|\d+)x(\d+\.\d+|\d+)([r|!|<|>])$/,
      /^(\d+\.\d+|\d+)p([w|h]?)$/,
      /^(\d+\.\d+|\d+)([@|v])$/
    ],
    'gravity': [/^NorthWest|North|NorthEast|West|Center|East|SouthWest|South|SouthEast$/],
    'crop': [
      /^(\d+\.\d+|\d+)?x(\d+\.\d+|\d+)?$/,
      /^(\d+\.\d+|\d+)x(\d+\.\d+|\d+)a(\d+\.\d+|\d+)a(\d+\.\d+|\d+)$/
    ],
    'rotate': [/^(\d+\.\d+|\d+)$/],
    'format': [/^(jpe?g|tif?f|png(8|24|32|48|64)?|gif|webp|svg|bmp)$/],
    'blur': [/^(\d+\.\d+|\d+)x(\d+\.\d+|\d+)$/],
    'interlace': [/^0|1$/],
    'quality': [/^([1-9]|[1-9]\d|100)$/]
  },
  /**
   * 图片处理 值有效验证
   * @param name 参数名
   * @param value 值
   */
  validateParam: function (name, value) {
    const rules = this.paramValueRules[name]
    for (const rule of rules) {
      if (rule.test(value)) {
        return true
      }
    }
    return false
  },
  /**
   * 解析路径
   * @param 路径
   * @param 判断类型(是否为文件 或者 文件夹)
   * @returns {null|解析信息}
   */
  parsePath: function (p, type) {
    return fs.stat(p).then(function (stats) {
      if (!stats || !stats[type]()) return null
      return stats
    }, function (err) {
      if (err.code !== 'ENOENT' && err.code !== 'ENAMETOOLONG' && err.code !== 'ENOTDIR') {
        throw err
      }
    })
  },
  /**
   * 判断该路径是否为文件
   * @param filePath 文件路径
   * @returns {null|解析信息}
   */
  isFile: async function (filePath) {
    const isFile = await this.parsePath(filePath, 'isFile')
    return isFile
  },
  /**
   * 判断该路径是否为文件夹
   * @param dirPath 目录路径
   * @returns {null|解析信息}
   */
  isDirectory: async function (dirPath) {
    const isDirectory = this.parsePath(dirPath, 'isDirectory')
    return isDirectory
  },
  /**
   * 判断文件目录是否存在 不存在则创建
   * @param root 起始目录
   * @param filePath 文件路径
   * @returns {boolean} 是否创建成功
   */
  mk: function (root, filePath) {
    let dirPath = root
    const fileDir = path.parse(filePath).dir
    debug('判断目标文件目录是否存在,不存在则创建' + fileDir)
    // 先验证文件目录是否存在
    if (!fs.existsSync(fileDir)) {
      const dirNames = fileDir.replace(root, '').split(path.sep)

      for (const dirName of dirNames) {
        if (!dirName) continue
        dirPath = path.join(dirPath, dirName)

        // 创建目录失败 返回false
        if (!fs.existsSync(dirPath) && fs.mkdirSync(dirPath) !== undefined) {
          debug('创建目录失败')
          return false
        }
      }
    }
    return true
  }
}

module.exports = helper
