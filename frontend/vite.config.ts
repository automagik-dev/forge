import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Overlay pattern: check forge-overrides first, fallback to upstream
      '@': [
        path.resolve(__dirname, '../forge-overrides/frontend/src'),
        path.resolve(__dirname, '../upstream/frontend/src'),
      ],
      'shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5174),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    reporters: 'default',
  },
});
