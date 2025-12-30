import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/editor/',
  server: {
    port: 5173,
    proxy: {
      '/editor-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/editor-api/, '/api')
      }
    }
  }
});
