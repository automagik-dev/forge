import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const nodeEmptyShim = path.resolve(__dirname, 'src/shims/node-empty.ts');
const nodePathShim = path.resolve(__dirname, 'src/shims/node-path.ts');

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      // Simple alias - @/ resolves to ./src/ (NO MORE OVERLAY COMPLEXITY!)
      '@': path.resolve(__dirname, './src'),

      // Node shims for browser compatibility
      path: nodePathShim,
      fs: nodeEmptyShim,
      os: nodeEmptyShim,
      child_process: nodeEmptyShim,

      // Shared types from parent directory
      'shared/types': path.resolve(__dirname, '../shared/types.ts'),
      'shared/forge-types': path.resolve(__dirname, '../shared/forge-types.ts'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:18887',
        changeOrigin: false,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['@ebay/nice-modal-react'],
  },
});
