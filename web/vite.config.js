import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [tailwindcss(), vue()],
    build: {
      outDir: resolve(__dirname, '../app/public'),
      emptyOutDir: true,
    },
    server: {
      port: env.VITE_WEB_PORT,
      proxy: {
        '/api': {
          target: env.VITE_SERVER_HOST,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };
});
