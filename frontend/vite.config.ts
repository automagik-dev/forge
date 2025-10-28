import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const nodeEmptyShim = path.resolve(__dirname, 'src/shims/node-empty.ts');
const nodePathShim = path.resolve(__dirname, 'src/shims/node-path.ts');

// Virtual module plugin for executor schemas
function executorSchemasPlugin(): Plugin {
  const VIRTUAL_ID = 'virtual:executor-schemas';
  const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

  return {
    name: 'executor-schemas-plugin',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;

      const schemasDir = path.resolve(__dirname, '../shared/schemas');
      const files = fs.existsSync(schemasDir)
        ? fs.readdirSync(schemasDir).filter((f) => f.endsWith('.json'))
        : [];

      const imports: string[] = [];
      const entries: string[] = [];

      files.forEach((file, i) => {
        const varName = `__schema_${i}`;
        const importPath = `shared/schemas/${file}`;
        const key = file.replace(/\.json$/, '').toUpperCase();
        imports.push(`import ${varName} from "${importPath}";`);
        entries.push(`  "${key}": ${varName}`);
      });

      const code = `
${imports.join('\n')}

export const schemas = {
${entries.join(',\n')}
};

export default schemas;
`;
      return code;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), executorSchemasPlugin()],
  resolve: {
    alias: {
      // Simple alias - @/ resolves to ./src/ (NO MORE OVERLAY COMPLEXITY!)
      '@': path.resolve(__dirname, './src'),

      // Node shims for browser compatibility (both bare and node: protocol)
      path: nodePathShim,
      'node:path': nodePathShim,
      fs: nodeEmptyShim,
      'node:fs': nodeEmptyShim,
      os: nodeEmptyShim,
      'node:os': nodeEmptyShim,
      child_process: nodeEmptyShim,
      'node:child_process': nodeEmptyShim,

      // Shared types and schemas from parent directory
      'shared/types': path.resolve(__dirname, '../shared/types.ts'),
      'shared/forge-types': path.resolve(__dirname, '../shared/forge-types.ts'),
      'shared/schemas': path.resolve(__dirname, '../shared/schemas'),
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
