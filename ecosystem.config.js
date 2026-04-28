module.exports = {
  apps: [
    {
      name: 'tms',
      script: './app/src/index.js', // 你的入口文件，可以是 .ts 或 .js
      interpreter: 'bun', // 核心配置：指定使用 bun 运行
      cwd: 'xxx', // 设置工作目录为项目根目录
      // watch: true,              // 可选：文件变动后自动重启
      env: {
        PORT: 3030,
        env: 'development',
      },
    },
  ],
};
