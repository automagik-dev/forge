#!/usr/bin/env node

/**
 * Syncs public assets from upstream to the frontend public directory
 * This ensures that IDE icons and other assets are available during development and builds
 */

const fs = require('fs');
const path = require('path');

// Define source and destination directories
const upstreamPublicDir = path.join(__dirname, '..', 'upstream', 'frontend', 'public');
const frontendPublicDir = path.join(__dirname, '..', 'frontend', 'public');

// Assets to sync from upstream
const assetsToSync = [
  'ide', // IDE icons directory
  // Add other directories or files as needed
];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('🔄 Syncing upstream assets to frontend public directory...');

assetsToSync.forEach((asset) => {
  const srcPath = path.join(upstreamPublicDir, asset);
  const destPath = path.join(frontendPublicDir, asset);

  if (fs.existsSync(srcPath)) {
    console.log(`  ✓ Syncing ${asset}...`);
    copyRecursiveSync(srcPath, destPath);
  } else {
    console.log(`  ⚠ Source not found: ${srcPath}`);
  }
});

console.log('✅ Asset sync complete!');