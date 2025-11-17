/**
 * Bundle Size Performance Test
 *
 * Validates that bundle sizes stay within acceptable limits.
 * Target: <500KB gzipped for main bundle
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface BundleMetrics {
  name: string;
  size: number;
  gzipSize: number;
}

const TARGET_GZIP_SIZE_KB = 500;
const DIST_PATH = join(__dirname, '../dist/assets');
const FRONTEND_ROOT = join(__dirname, '..');

function ensureDistBuild(): void {
  if (existsSync(DIST_PATH)) {
    return;
  }

  console.log('⚙️  No dist assets detected. Running `pnpm run build`...');
  execSync('pnpm run build', {
    cwd: FRONTEND_ROOT,
    stdio: 'inherit',
  });
}

/**
 * Calculate gzipped size of a file
 */
function getGzipSize(filePath: string): number {
  const content = readFileSync(filePath);
  const gzipped = gzipSync(content, { level: 9 });
  return gzipped.length;
}

/**
 * Analyze all bundle files in dist/assets
 */
function analyzeBundles(): BundleMetrics[] {
  const files = readdirSync(DIST_PATH);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.map'));

  return jsFiles.map(file => {
    const filePath = join(DIST_PATH, file);
    const stats = statSync(filePath);
    const gzipSize = getGzipSize(filePath);

    return {
      name: file,
      size: stats.size,
      gzipSize,
    };
  });
}

/**
 * Main test execution
 */
function runBundleSizeTest(): void {
  console.log('📦 Bundle Size Analysis\n');
  console.log('━'.repeat(80));

  ensureDistBuild();
  const bundles = analyzeBundles();
  let totalSize = 0;
  let totalGzipSize = 0;
  let hasFailures = false;

  bundles.forEach(bundle => {
    totalSize += bundle.size;
    totalGzipSize += bundle.gzipSize;

    const sizeKB = (bundle.size / 1024).toFixed(2);
    const gzipKB = (bundle.gzipSize / 1024).toFixed(2);
    const isOverLimit = bundle.gzipSize / 1024 > TARGET_GZIP_SIZE_KB;

    const status = isOverLimit ? '❌' : '✅';

    console.log(`${status} ${bundle.name}`);
    console.log(`   Size: ${sizeKB} KB | Gzip: ${gzipKB} KB`);

    if (isOverLimit) {
      hasFailures = true;
      const excess = (bundle.gzipSize / 1024 - TARGET_GZIP_SIZE_KB).toFixed(2);
      console.log(`   ⚠️  Exceeds limit by ${excess} KB`);
    }
    console.log();
  });

  console.log('━'.repeat(80));
  console.log(`Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`Total Gzip: ${(totalGzipSize / 1024).toFixed(2)} KB`);
  console.log(`Target: <${TARGET_GZIP_SIZE_KB} KB (gzipped per bundle)`);
  console.log('━'.repeat(80));

  if (hasFailures) {
    const enforce = process.env.PERF_ENFORCE === '1' || process.env.CI === 'true';
    console.error('\n❌ Bundle size test FAILED: One or more bundles exceed the limit');
    if (enforce) {
      process.exit(1);
    } else {
      console.warn('⚠️  PERF_ENFORCE is disabled - continuing with warnings only');
      process.exit(0);
    }
  } else {
    console.log('\n✅ Bundle size test PASSED: All bundles within limits');
    process.exit(0);
  }
}

// Run the test
runBundleSizeTest();
