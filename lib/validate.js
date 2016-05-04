"use strict";

import imageView from './imageView';
import helper from './helper';
import _debug from 'debug';

const debug = _debug('koa-file-server:validate');

/**
 * 验证静态文件是否存在
 * @param root 静态文件根目录
 * @param request 请求信息
 * @returns {object}
 */
export default async function validate(root, request) {
    var stats;

    debug('验证文件是否存在:' + (request.body.files || request.body.filePath));

    //判断请求功能 文件合并
    if (request.body.files) {
        request.body.stats = new Array(request.body.files.length);
        for (let i = request.body.files.length - 1; i >= 0; i--) {
            if (!(stats = await helper.isFile(request.body.files[i]))) {
                //如果文件不存在 就从数组移除
                request.body.files.splice(i, 1);
                request.body.stats.splice(i, 1);
            } else {
                request.body.stats[i] = stats;
            }
        }
        //文件数为0
        if (request.body.files.length === 0) {
            debug('所以文件都不存在');
            request.status = 404
        } else {
            debug('存在文件' + request.body.files.length + '个');
        }
    } else {
        if (!(stats = await helper.isFile(request.body.filePath))) {
            debug('目标文件不存在:' + request.body.filePath);
            //如果该文件是图片 并且目标地址和源地址不一致 进行2次处理
            if (request.body.imageView && request.body.filePath !== request.body.sourcePath) {
                stats = await helper.isFile(request.body.sourcePath);
                //源文件存在 进行处理生成新文件
                if (stats) {
                    debug('图片源文件存在,使用gm进行处理');
                    //使用gm进行处理文件
                    return await imageView.create(root, request.body.sourcePath, request.body.filePath, request.body.imageView);
                } else {
                    debug('目标文件是图片,并且源文件也不存在:' + request.body.sourcePath);
                    request.status = 404;
                }
            } else {
                request.status = 404;
            }
        }
        request.body.stats = stats;
    }

    return request;
};