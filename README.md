# 静态文件服务 for koa2
静态文件服务，除却基本文件服务，增加了图片处理(非gif)，请求合并，文本文件gzip压缩等功能。

## 安装使用
安装图片处理软件 [ImageMagick](http://www.imagemagick.org/script/index.php)

`npm install koa2-file-server --save`
```javascript
//app.js
"use strict";

const Koa = require('Koa');
const path = require('path');
const serve = require('koa2-file-server');

const app = new Koa();

app.use(serve(path.join(__dirname, 'public'),{
    webp: true,
    identifier: '??',
    maxAge: 60 * 60 * 24 * 30,
    cache: {
        dirName: '__cache',
        maxAge: 1000 * 60 * 60,
        maxSize: 1024 * 1024 * 500
    }
}));

app.listen(8000);
```

## 配置选项
- `root` 静态文件根目录，默认值: **process.cwd()**。
- `webp` 是否在支持webp的客户端下返回webp格式的图片，默认值: **true**。
- `identifier` 文件合并请求标识符，默认值: **??**。
- `maxAge` 浏览器缓存时间，单位秒，默认值: **2592000** s
- `cache` 服务器缓存
   - `dirName` 持久化文件存放目录名，默认: **__cache**
   - `maxAge` 缓存最高存放时间，单位毫秒，默认: **3600000** ms
   - `maxSize` 缓存总大小上限，当达到上限后会清理所以缓存，单位字节，默认: **524288000** Byte

## 文件合并接口
**说明**：只支持 `.js` 和 `.css` 文件

标识符: `??`

分隔符: `,`

合并请求: `http://localhost:3000/test/??a.js,b.js` or `http://localhost:3000/??test/a.js,test/b.js`

## 图片处理接口规格
**说明**：对`GIF图片`处理操作无效，会直接返回原图。

```javascript
imageView/auto-orient
         /thumbnail/<imageSizeGeometry>
         /strip
         /gravity/<gravityType>
         /crop/<imageSizeAndOffsetGeometry>
         /rotate/<rotateDegree>
         /format/<destinationImageFormat>
         /blur/<radius>x<sigma>
         /interlace/<Interlace>
         /quality/<quality>
```

参数名称                                 | 说明
------------------------------------ | ------------------------------------------------------------------------------------
`/auto-orient`                       | 建议放在首位，根据原图EXIF信息自动旋正，便于后续处理。
`/thumbnail/<imageSizeGeometry>`     | 参看[缩放操作参数表](#缩放操作参数表)，默认为不缩放。
`/strip`                             | 去除图片中的元信息去掉的信息有：**bKGD、cHRM、EXIF、gAMA、iCCP、iTXt、sRGB、tEXt、zCCP、zTXt、date**
`/gravity/<gravityType>`             | 参看[图片处理重心参数表](#图片处理重心参数表)，目前只影响其后的裁剪偏移参数，默认为左上角**NorthWest**。
`/crop/<imageSizeAndOffsetGeometry>` | 参看[裁剪操作参数表](#裁剪操作参数表)，默认为不裁剪。
`/rotate/<rotateDegree>`             | 旋转角度，取值范围为1-360，默认为不旋转。
`/format/<destinationImageFormat>`   | 图片格式，支持**jpeg、gif、png、webp、tiff、bmp、svg**，默认为原图格式。
`/blur/<radius>x<sigma>`             | 高斯模糊参数，`<radius>`是模糊半径，取值范围为1-50。`<sigma>`是正态分布的标准差，必须大于0。
`/interlace/<Interlace>`             | 取值1，创建一个交错PNG或渐进显示的JPEG图像。
`/quality/<Quality>`                 | 新图的图片质量，取值范围是[1, 100]。支持图片类型：**jpeg，png，tiff**。

### 缩放操作参数表

参数名称                           | 说明
------------------------------ | -------------------------------------------------------------------
/thumbnail/`<Scale>p`          | 基于原图大小，按指定百分比缩放。取值范围为0-1000。
/thumbnail/`<Scale>pw`         | 以百分比形式指定目标图片宽度，高度不变。
/thumbnail/`<Scale>ph`         | 以百分比形式指定目标图片高度，宽度不变。
/thumbnail/`<Width>v`          | 当原图宽度小于指定宽度则不变，反之按宽度等比例缩放。
/thumbnail/`<Width>x`          | 指定目标图片宽度后高度等比缩放。
/thumbnail/`x<Height>`         | 指定目标图片高度后宽度等比缩放。
/thumbnail/`<Width>x<Height>`  | 限定长边，短边自适应缩放，将目标图片限制在指定宽高矩形内。
/thumbnail/`<Width>x<Height>r` | 限定短边，长边自适应缩放，目标图片会延伸至指定宽高矩形外。
/thumbnail/`<Width>x<Height>!` | 限定目标图片宽高值，忽略原图宽高比例，按照指定宽高值强行缩略，可能导致目标图片变形。
/thumbnail/`<Width>x<Height>>` | 当原图尺寸大于给定的宽度或高度时，按照给定宽高值缩小。
/thumbnail/`<Width>x<Height><` | 当原图尺寸小于给定的宽度或高度时，按照给定宽高值放大。
/thumbnail/`<Area>@`           | 按原图高宽比例等比缩放，缩放后的像素数量不超过指定值。

### 图片处理重心参数表
**注意**：该选项只影响其后的裁剪操作，即裁剪操作以gravity为原点开始偏移后，进行裁剪操作。

参数名称 | 参数值
---- | ---------
左上角  | NorthWest
正上方  | North
右上角  | NorthEast
正左方  | West
正中   | Center
正右方  | East
左下角  | SouthWest
正下方  | South
右下角  | SouthEast

### 裁剪操作参数表

参数名称                             | 说明
-------------------------------- | -----------------------------------------------
`/crop/<Width>x`                 | 指定目标图片宽度，高度不变。
`/crop/x<Height>`                | 指定目标图片高度，宽度不变。
`/crop/<Width>x<Height>`         | 同时指定目标图片宽高。
`/crop/<Width>x<Height>a<x>a<y>` | 同时指定目标图片宽高。相对于偏移锚点，向右偏移**x**个像素，同时向下偏移**y**个像素。

## 缓存处理
为了减少磁盘io，对文件进行了缓存。如果文件在缓存有效期内被改变，只能清除缓存，否则请求没有任何改变。

[staticCache API](https://github.com/isaacs/node-lru-cache#api) 缓存key: **filePath**
```javascript
"use strict";

import path from 'path';
import Koa from 'koa';
import serve,{staticCache} from 'koa2-file-server';

const app = new Koa();

app.use(serve(path.join(__dirname, 'public')));
staticCache.reset(); //清除所有缓存
staticCache.del('key'); //清除指定缓存

app.listen(8000);
```

图片处理后的图片会持久化存放，只好定期清除`__cache`目录下的文件，不然磁盘占有量会越来越大。
