"use strict";

import path from 'path';
import helper from './helper';
import _debug from 'debug';

const debug = _debug('koa-file-server:parseImage');

function getUrlParams(paramsStr) {
    var urlParams = {};
    var match,
        pl = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {
            return decodeURIComponent(s.replace(pl, " "));
        },
        query = paramsStr;

    while (match = search.exec(query)) {
        urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
}

/**
 * 解析图片请求 分析图片处理信息
 * @param root 静态文件根目录
 * @param sourceFile 源文件信息
 * @param optionsStr 图片处理选项
 * @param cacheDirName 图片缓存目录名
 * @param webp 是否启用webp格式
 * @returns {object}
 */
export default function parseImage(root, sourceFile, optionsStr, cacheDirName, webp) {
    var options = [];
    let optionsMatch = optionsStr.match(/([^&=]+)=?([^&]*)/g);
    if (optionsMatch) {
        for (let str of optionsMatch) {
            //是否有图片处理
            if (/^imageView\/.{1,}$/.test(str)) {
                let key, value, error, optionsArr;
                optionsArr = str.replace('imageView/', '').split('/');

                debug('图片解析,读取处理选项:' + JSON.stringify(optionsArr, null, 4));

                //读取图片处理选项
                for (let i = 0; i < optionsArr.length; i++) {
                    key = optionsArr[i];
                    value = null;

                    //验证参数名有效性
                    if (helper.paramNameList.test(key)) {
                        //验证选项是否为有值类型
                        if (!helper.paramValueNull.test(key)) {
                            if (i < optionsArr.length - 1) {
                                value = optionsArr[i + 1];
                                //验证数据格式是否正确
                                if (!helper.validateParam(key, value)) {
                                    //产生错误:值无效
                                    error = "invalid " + key + ": " + (helper.paramNameList.test(value) ? 'null' : value);
                                }
                                i++; //跳过value
                            } else {
                                //产生错误:值为null
                                error = key + " param value is null";
                            }
                        }
                        //遇到错误 抛出
                        if (error) {
                            debug('图片解析失败:' + error);
                            return {
                                status: 400,
                                body: {
                                    error: error
                                }
                            }
                        } else {
                            options.push({
                                key: key,
                                value: value
                            });
                        }
                    }
                }

                debug('图片解析,处理选项结果:' + JSON.stringify(options, null, 4));
            } else {
                debug('没有读取到图片处理操作');
            }
        }
    }
    //创建目标文件信息
    let targetFile = {
        dir: sourceFile.dir,
        name: sourceFile.name,
        ext: sourceFile.ext
    };
    let format = '';

    //根据图片处理选项 以及 客户端的是否支持webp 返回目标文件地址
    if (options.length > 0) {
        targetFile.name += '_';
        //拼接出 目标文件名
        options.forEach(function (obj, index) {
            targetFile.name += (index == 0 ? '' : '_') + obj.key[0] + (obj.value ? '@' + obj.value.replace(/\./g, '-') : '');
            if (obj.key === 'format') format = obj.value;
        });
        //根据客户端以及参数确定目标文件扩展名
        targetFile.ext = format ? '.' + format.replace(/^png\d{1,2}$/, 'png') : targetFile.ext;
        targetFile.ext = webp ? targetFile.ext.replace('.', '_') + '.webp' : targetFile.ext;
        //根据参数确定目标文件路径
        targetFile.dir = path.join(path.sep + cacheDirName, targetFile.dir);
    } else {
        targetFile.ext = webp ? targetFile.ext.replace('.', '_') + '.webp' : targetFile.ext;
        targetFile.dir = webp ? path.join(path.sep + cacheDirName, targetFile.dir) : targetFile.dir;
    }

    //加入webp格式转换
    if (!format && webp) {
        debug('客户端支持webp格式');
        options.push({
            key: 'format',
            value: 'webp'
        });
    }

    return {
        status: 200,
        body: {
            filePath: path.join(root, targetFile.dir, targetFile.name + targetFile.ext),
            sourcePath: path.join(root, sourceFile.dir, sourceFile.name + sourceFile.ext),
            imageView: options
        }
    }
}
