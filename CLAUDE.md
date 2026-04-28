# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

TMS (Translation Management System) 是一个翻译管理和自动化部署系统，支持多项目翻译扫描、打包部署到远程服务器。采用前后端分离架构：

- **app/** - 后端服务（Elysia + Bun），端口 3030
- **web/** - 前端界面（Vue 3 + Vite），开发端口 3031

## 开发命令

### 后端 (app/)
```bash
cd app
bun run dev      # 开发模式（热重载）
bun run start    # 生产模式
```

### 前端 (web/)
```bash
cd web
npm run dev      # 开发服务器（Vite）
npm run build    # 构建到 ../app/public
```

### PM2 部署
```bash
pm2 start ecosystem.config.js   # 启动后端服务
pm2 reload tms                  # 重启服务
```

## 架构说明

### 项目配置
- 项目配置存储在 `app/projects.toml`，包含各项目的路径、SSH 配置、翻译文件路径等
- 环境变量配置在根目录 `.env.development`

### WebSocket 通信
后端通过 WebSocket (`/chat`) 与前端实时通信，支持的消息类型：
- `scanTranslation` - 扫描项目中的中文翻译，自动调用百度 API 翻译并写入 TMS 文件
- `packaged` - 打包项目并部署到远程服务器（通过 SSH/SFTP）
- `asyncLanguage` - 同步语言文件
- `task-sync` - 任务同步（用于商城数据导入导出）

### TMS 翻译流程
1. 扫描项目文件中的 `$t('中文')` 模式
2. 调用百度翻译 API 获取英文翻译
3. 将翻译结果写入项目的 TMS 文件（zh.js/en.js/th.js）
4. 支持多个 TMS 文件合并（如 tms_01/zh.js, tms_02/zh.js, tms_03/zh.js）

### 打包部署流程
1. 使用 bun 执行项目的 build 命令
2. 将 dist 目录打包成 ZIP（存储在 `app/src/packages/YYYYMMDD/`）
3. 通过 SFTP 上传到远程服务器
4. SSH 解压并可选执行后置命令（如 pm2 reload）

## 前端路由
- `/` - 首页（项目列表）
- `/translation` - 翻译管理
- `/packaged` - 打包部署
- `/scheduledTask` - 定时任务

## 代码规范
- 中文内容使用 i18n：`$t('中文文本')`
- 前端使用 Element Plus 组件库和 Tailwind CSS
- 后端使用 Elysia 框架和 Bun 运行时
