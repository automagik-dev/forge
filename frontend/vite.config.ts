import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { builtinModules } from 'module';

const nodeEmptyShim = path.resolve(__dirname, 'src/shims/node-empty.ts');
const nodePathShim = path.resolve(__dirname, 'src/shims/node-path.ts');

// Custom resolver plugin for forge overlay pattern
function forgeOverlayResolver(): Plugin {
  const overridePath = path.resolve(__dirname, '../forge-overrides/frontend/src');
  const upstreamPath = path.resolve(__dirname, '../upstream/frontend/src');

  function tryResolve(basePath: string, relativePath: string): string | null {
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
    const indexFiles = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

    // Try direct file with extensions
    for (const ext of extensions) {
      const filePath = path.resolve(basePath, relativePath + ext);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return filePath;
      }
    }

    // Try index files in directory
    for (const indexFile of indexFiles) {
      const filePath = path.resolve(basePath, relativePath + indexFile);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    return null;
  }

  return {
    name: 'forge-overlay-resolver',
    enforce: 'pre', // Run before other resolvers
    resolveId(id) {
      // Only handle @/ imports
      if (!id.startsWith('@/')) return null;

      const relativePath = id.slice(2); // Remove '@/'

      // Try forge-overrides first
      const overrideResult = tryResolve(overridePath, relativePath);
      if (overrideResult) {
        if (relativePath === 'main' || relativePath === 'App.tsx') {
          console.log(`[forge-overlay] ✅ Using forge override: @/${relativePath} -> ${overrideResult}`);
        }
        return overrideResult;
      }

      // Fallback to upstream
      const upstreamResult = tryResolve(upstreamPath, relativePath);
      if (upstreamResult) {
        if (relativePath === 'main' || relativePath === 'App.tsx') {
          console.log(`[forge-overlay] ⬇️  Using upstream: @/${relativePath} -> ${upstreamResult}`);
        }
        return upstreamResult;
      }

      // Log for debugging (can be removed later)
      console.warn(`Could not resolve @/${relativePath}`);
      return null;
    },
  };
}

// Virtual module plugin for executor schemas (from upstream)
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

function stripPosthogNodeBuiltins(): Plugin {
  const targetPattern = /posthog-js\/dist\/module(?:\.(?:full|no-external))?\.js$/;
  const stripPattern = /(?:import|require)\(["']node:(?:child_process|fs|path)["']\);?/g;

  return {
    name: 'strip-posthog-node-builtins',
    enforce: 'pre',
    load(id) {
      const normalizedId = id.split('?')[0]?.replace(/\\/g, '/');
      if (!normalizedId || !targetPattern.test(normalizedId)) {
        return null;
      }

      const source = fs.readFileSync(normalizedId, 'utf8');
      if (!stripPattern.test(source)) {
        return null;
      }

      const cleaned = source.replace(stripPattern, '');
      return {
        code: cleaned,
        map: null,
      };
    },
  };
}

// Force all bare imports to resolve from workspace root
function forceWorkspaceResolution(): Plugin {
  const buildRoot = path.resolve(__dirname, 'package.json');
  const nodeBuiltinSpecifiers = new Set([
    ...builtinModules,
    ...builtinModules.map((name) => `node:${name}`),
  ]);

  return {
    name: 'force-workspace-resolution',
    enforce: 'pre',
    async resolveId(source) {
      if (nodeBuiltinSpecifiers.has(source)) {
        return null;
      }
      // Only handle bare imports (not relative/absolute paths, not aliases)
      if (!source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@/') && source !== 'shared' && !source.startsWith('shared/')) {
        // Force resolution from workspace root via frontend/package.json
        const resolved = await this.resolve(source, buildRoot, {
          skipSelf: true,
        });
        return resolved;
      }
      return null; // Let other resolvers handle relative/alias imports
    },
  };
}

export default defineConfig({
  plugins: [react(), stripPosthogNodeBuiltins(), executorSchemasPlugin(), forgeOverlayResolver(), forceWorkspaceResolution()],
  resolve: {
    alias: {
      'shared': path.resolve(__dirname, '../shared'),
      'node:child_process': nodeEmptyShim,
      'node:fs': nodeEmptyShim,
      'node:path': nodePathShim,
    },
  },
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5174),
    proxy: {
      '/api': {
        target: `http://${process.env.HOST || 'localhost'}:${process.env.BACKEND_PORT || '8887'}`,
        changeOrigin: true,
        ws: true,
      },
    },
    fs: {
      // Allow serving files from parent directories (forge-overrides, upstream)
      allow: [
        path.resolve(__dirname, '..'),
      ],
    },
    open: process.env.VITE_OPEN === 'true',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      // Ensure lodash and other CJS modules are properly resolved
      include: [/node_modules/],
    },
    rollupOptions: {
      // Suppress false warnings from @types/node in dependencies
      onwarn(warning, warn) {
        // Ignore externalized module warnings for Node built-ins from type definitions
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          /^node:/.test(warning.exporter || '')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  test: {
    environment: 'node',
    reporters: 'default',
  },
});
