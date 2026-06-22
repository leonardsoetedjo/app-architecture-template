import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'src', 'tests'),
      app: path.resolve(__dirname, 'src/app'),
      pages: path.resolve(__dirname, 'src/pages'),
      widgets: path.resolve(__dirname, 'src/widgets'),
      features: path.resolve(__dirname, 'src/features'),
      entities: path.resolve(__dirname, 'src/entities'),
      shared: path.resolve(__dirname, 'src/shared'),
      styles: path.resolve(__dirname, 'src/styles'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
  },
});
