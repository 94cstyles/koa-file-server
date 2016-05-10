"use strict";

const mime = require('mime');
const gm = require('./gm');
const helper = require('./helper');
const debug = require('debug')('koa-file-server:imageView');

const imageView = {
    /**
     * 图片处理 根据选项创建新图
     * @param root 静态文件根目录
     * @param sourcePath 源文件路径
     * @param filePath 目标文件路径
     * @param options 图片处理信息
     * @returns {{status: number, body: {object}}}
     */
    create: async function (root, sourcePath, filePath, options) {
        //判断目标文件夹是否存在 不存在创建
        //创建目录成功 则继续处理图片 反之返回源文件地址
        if (helper.mk(root, filePath)) {
            let file = gm(sourcePath);
            let size = await file.sizeSync();
            let mimeType = mime.lookup(filePath);
            let gravity = 'NorthWest';

            debug('对图片进行处理,处理选项:' + JSON.stringify(options));

            options.forEach((obj) => {
                switch (obj.key) {
                    case 'auto-orient':
                        file = file.autoOrient(); // --> /auto-orient
                        break;
                    case 'thumbnail':
                        file = file.coalesce().resize.apply(file, typeof(obj.value) === "string" ? this.getThumbnailParam(obj.value, size) : obj.value); // --> /thumbnail/<imageSizeGeometry>
                        break;
                    case 'strip':
                        file = file.strip(); // --> /strip
                        break;
                    case 'gravity':
                        gravity = obj.value; // --> /gravity/<gravityType>
                        break;
                    case 'crop':
                        file = file.gravity(gravity).crop.apply(file, typeof(obj.value) === "string" ? this.getCropParam(obj.value, size) : obj.value); // --> /crop/<imageSizeAndOffsetGeometry>
                        break;
                    case 'rotate':
                        file = file.rotate('#ffffff', parseFloat(obj.value) % 360);  // --> /rotate/<rotateDegree>
                        break;
                    case 'format':
                        file = file.setFormat(obj.value); // --> /format/<destinationImageFormat>
                        break;
                    case 'blur':
                        file = file.blur.apply(file, typeof(obj.value) === "string" ? this.getBlurParam(obj.value) : obj.value); // --> /blur/<radius>x<sigma>
                        break;
                    case 'interlace':
                        if (/jpe?g|png/.test(mimeType)) file = file.interlace(obj.value ? 'Line' : 'None'); // --> /interlace/<Interlace>
                        break;
                    case 'quality':
                        if (/jpe?g|png|tif?f/.test(mimeType)) file = file.quality(obj.value); // --> /quality/<Quality>
                        break;
                }
            });

            //输出文件
            let err = await file.writeSync(filePath);
            let stats = err ? null : await helper.isFile(filePath);
            debug(err ? '处理图片失败:' + err : '处理图片成功:' + filePath);
            return {
                status: err ? 500 : 200,
                body: err ? {
                    error: err
                } : {
                    filePath: filePath,
                    sourcePath: sourcePath,
                    stats: stats
                }
            }
        } else {
            //创建文件失败
            return {
                status: 500,
                body: {
                    error: 'failed to create the folder'
                }
            };
        }
    },
    /**
     * 提取缩略图参数值
     * @param paramStr 字符串型值
     * @param size 原图大小
     * @returns {*[]}
     */
    getThumbnailParam: function (paramStr, size) {
        var width, height, option, result;

        //解析参数字符串
        if (result = paramStr.match(helper.paramValueRules.thumbnail[0])) {
            //文档5 6 7
            width = Number(result[1]);
            height = Number(result[2]);
        } else if (result = paramStr.match(helper.paramValueRules.thumbnail[1])) {
            //文档8 9 10 11
            width = Number(result[1]);
            height = Number(result[2]);
            option = result[3].replace('r', '^');
        } else if (result = paramStr.match(helper.paramValueRules.thumbnail[2])) {
            //文档1 2 3
            let ratio = Math.min(Number(result[1] / 100), 10);
            width = result[2] != 'h' ? Math.round(size.width * ratio) : size.width;
            height = result[2] != 'w' ? Math.round(size.height * ratio) : size.height;
            option = '!';
        } else if (result = paramStr.match(helper.paramValueRules.thumbnail[3])) {
            if (result[2] === '@') {
                //文档12
                width = Number(result[1]);
                option = '@';
            } else {
                //文档4
                width = Math.min(Number(result[1]), size.width);
            }
        }
        return [width || null, height || null, option || null];
    },
    /**
     * 提取裁剪参数值
     * @param paramStr 字符串型值
     * @param size 原图大小
     * @returns {*[]}
     */
    getCropParam: function (paramStr, size) {
        var width, height, x, y, result;

        if (result = paramStr.match(helper.paramValueRules.crop[0])) {
            width = Number(result[1]);
            height = Number(result[2]);
        } else if (result = paramStr.match(helper.paramValueRules.crop[1])) {
            width = Number(result[1]);
            height = Number(result[2]);
            x = Number(result[3]);
            y = Number(result[4]);
        }

        return [width || size.width, height || size.height, x || 0, y || 0];
    },
    /**
     * 提取高斯模糊参数值
     * @param paramStr 字符串型值
     * @returns {*[]}
     */
    getBlurParam: function (paramStr) {
        var radius, sigma, result;

        if (result = paramStr.match(helper.paramValueRules.blur[0])) {
            radius = Number(result[1]);
            sigma = Number(result[2]);
        }

        return [radius, sigma];
    }
};

module.exports = imageView;
