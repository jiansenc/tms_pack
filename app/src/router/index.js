import { Elysia } from 'elysia';
import projects from './projects.js';

const app = new Elysia();

// 根路径由静态文件服务处理
app.use(projects);

export default app;
