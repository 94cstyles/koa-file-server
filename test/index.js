"use strict";

import request from 'supertest';
import path from 'path';
import Koa from 'koa';
import serve, {staticCache} from '../index';

const app = new Koa();
app.use(serve(path.join(__dirname, 'public')));

if (typeof (describe) === "function") {
    describe('图片处理', function () {

        //根据设备采用最优图片格式
        it('根据设备采用最优图片格式', function (done) {
            request(app.listen())
                .get('/demo.jpg')
                .set('Accept', 'image/webp')
                .end(done);
        });

        //缩放
        it('等比缩小75%', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/75p')
                .end(done);
        });
        it('按原宽度75%等比缩小', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/75pw')
                .end(done);
        });
        it('按原高度75%等比缩小', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/75ph')
                .end(done);
        });
        it('生成320p的图片', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/320v')
                .end(done);
        });
        it('指定新宽度为700px', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/700x')
                .end(done);
        });
        it('指定新高度为467px', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/x467')
                .end(done);
        });
        it('限定长边，生成不超过300x300的缩略图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/300x300')
                .end(done);
        });
        it('限定短边，生成不小于200x200的缩略图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/200x200r')
                .end(done);
        });
        it('强制生成200x300的缩略图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/200x300!')
                .end(done);
        });
        it('原图大于指定长宽矩形，按长边自动缩小为200x133缩略图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/200x300>')
                .end(done);
        });
        it('原图小于指定长宽矩形，按长边自动拉伸为700x467放大图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/thumbnail/700x600<')
                .end(done);
        });

        //裁剪
        it('生成300x427裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/crop/300x')
                .end(done);
        });
        it('生成640x200裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/crop/x200')
                .end(done);
        });
        it('生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/crop/300x300')
                .end(done);
        });
        it('生成300x300裁剪图，偏移距离30x100', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/crop/300x300a30a100')
                .end(done);
        });
        it('锚点在左上角（NorthWest），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/NorthWest/crop/300x300')
                .end(done);
        });
        it('锚点在正上方（North），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/North/crop/300x300')
                .end(done);
        });
        it('锚点在右上角（NorthEast），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/NorthEast/crop/300x300')
                .end(done);
        });
        it('锚点在正左方（West），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/crop/gravity/West/crop/300x300')
                .end(done);
        });
        it('锚点在正中（Center），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/Center/crop/300x300')
                .end(done);
        });
        it('锚点在正右方（East），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/East/crop/300x300')
                .end(done);
        });
        it('锚点在左下角（SouthWest），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/SouthWest/crop/300x300')
                .end(done);
        });
        it('锚点在正下方（South），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/South/crop/300x300')
                .end(done);
        });
        it('锚点在右下角（SouthEast），生成300x300裁剪图', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/gravity/SouthEast/crop/300x300')
                .end(done);
        });

        //旋转
        it('顺时针旋转45度', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/rotate/45')
                .end(done);
        });

        //高斯模糊
        it('高斯模糊，半径为3，Sigma值为5', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/blur/3x5')
                .end(done);
        });

        //渐进显示图片
        it('渐进显示图片', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/interlace/1')
                .end(done);
        });

        //改变图片格式
        it('改变图片格式 svg', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/format/svg')
                .end(done);
        });

        //修改图片质量
        it('修改图片质量', function (done) {
            request(app.listen())
                .get('/demo.jpg?imageView/quality/10')
                .end(done);
        });
    });

    describe('文件合并请求', function () {
        it('a.js and b.js', function (done) {
            request(app.listen())
                .get('/??a.js,b.js')
                .end(done);
        });
    });

    describe('文件缓存', function () {
        it('清除前', function (done) {
            done();
            console.log('      ' + staticCache.keys().length + ' 条缓存');
        });
        it('清除后', function (done) {
            staticCache.reset();
            done();
            console.log('      ' + staticCache.keys().length + ' 条缓存');
        });
    });
} else {
    require('http').createServer(app.callback()).listen(3000);
}