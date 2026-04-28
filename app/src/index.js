import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import router from './router/index.js';
import ws from './router/ws.js';
import { file } from 'elysia';
import { resolve } from 'path';

const app = new Elysia()
console.log('ENV:'+Bun.env.VERSION)
// 获取项目根目录的绝对路径
const rootDir = resolve(import.meta.dir, '../..');

// 静态文件服务必须在路由之前注册
app.use(staticPlugin({
  assets: resolve(rootDir, 'app/public'),
  prefix: '/',
  indexHTML: false  // 禁用自动 index.html 处理
}))

// 手动处理根路径，返回 index.html
app.get('/', () => file(resolve(rootDir, 'app/public/index.html')))
app.onError((error) => {
  console.error(error);
});
app.use(router);
app.use(ws);
app.listen(Bun.env.PORT);
console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
