import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_URL || 'http://127.0.0.1:8000';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/backend': { target, changeOrigin: true, rewrite: path => path.replace(/^\/backend/, '') },
        '/ws': { target: env.VITE_WS_URL || target.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
      },
    },
  };
});
