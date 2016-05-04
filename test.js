"use strict";

import path from 'path';
import Koa from 'koa';
import serve,{staticCache} from 'koa2-file--serve';

const app = new Koa();

app.use(serve(path.join(__dirname, 'public')));
staticCache.reset(); //清除所有缓存
staticCache.del('key'); //清除指定缓存

app.listen(8000);