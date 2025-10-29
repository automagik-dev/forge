#!/usr/bin/env node

/**
 * Syncs public assets from upstream to the frontend public directory
 * This ensures that IDE icons and other assets are available during development and builds
 * Only syncs files that are missing or outdated (different content)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Define source and destination directories
const upstreamPublicDir = path.join(__dirname, '..', 'upstream', 'frontend', 'public');
const frontendPublicDir = path.join(__dirname, '..', 'frontend', 'public');

// Assets to sync from upstream
const assetsToSync = [
  'ide', // IDE icons directory
  // Add other directories or files as needed
];

// Calculate MD5 hash of a file
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (err) {
    return null;
  }
}

// Find all files that need to be synced (missing or different)
function findOutdatedFiles(src, dest, relativePath = '') {
  const outdated = [];

  if (!fs.existsSync(src)) {
    return outdated;
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      // Entire directory is missing
      const allFiles = getAllFilesRecursive(src, relativePath);
      return allFiles.map(f => ({ ...f, status: 'missing' }));
    }

    fs.readdirSync(src).forEach((childItemName) => {
      const childSrc = path.join(src, childItemName);
      const childDest = path.join(dest, childItemName);
      const childRelative = path.join(relativePath, childItemName);
      outdated.push(...findOutdatedFiles(childSrc, childDest, childRelative));
    });
  } else {
    // It's a file
    if (!fs.existsSync(dest)) {
      outdated.push({ path: relativePath, srcPath: src, destPath: dest, status: 'missing' });
    } else {
      const srcHash = getFileHash(src);
      const destHash = getFileHash(dest);
      if (srcHash !== destHash) {
        outdated.push({ path: relativePath, srcPath: src, destPath: dest, status: 'modified' });
      }
    }
  }

  return outdated;
}

// Get all files in a directory recursively
function getAllFilesRecursive(dir, relativePath = '') {
  const files = [];

  fs.readdirSync(dir).forEach((item) => {
    const fullPath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...getAllFilesRecursive(fullPath, relPath));
    } else {
      files.push({ path: relPath, srcPath: fullPath, destPath: path.join(frontendPublicDir, relPath) });
    }
  });

  return files;
}

// Copy a single file
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Ask user for confirmation
async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('🔍 Checking for outdated upstream assets...');

  const allOutdated = [];

  for (const asset of assetsToSync) {
    const srcPath = path.join(upstreamPublicDir, asset);
    const destPath = path.join(frontendPublicDir, asset);

    if (!fs.existsSync(srcPath)) {
      console.log(`  ⚠ Source not found: ${srcPath}`);
      continue;
    }

    const outdated = findOutdatedFiles(srcPath, destPath, asset);
    allOutdated.push(...outdated);
  }

  if (allOutdated.length === 0) {
    console.log('✅ All assets are up to date!');
    return;
  }

  console.log(`\n📋 Found ${allOutdated.length} file(s) that need updating:\n`);

  const missing = allOutdated.filter(f => f.status === 'missing');
  const modified = allOutdated.filter(f => f.status === 'modified');

  if (missing.length > 0) {
    console.log(`  Missing (${missing.length}):`);
    missing.forEach(f => console.log(`    + ${f.path}`));
  }

  if (modified.length > 0) {
    console.log(`  Modified (${modified.length}):`);
    modified.forEach(f => console.log(`    ~ ${f.path}`));
  }

  console.log('');
  const confirmed = await askConfirmation('Do you want to sync these files? (y/n): ');

  if (!confirmed) {
    console.log('❌ Sync cancelled by user.');
    process.exit(0);
  }

  console.log('\n🔄 Syncing files...');

  allOutdated.forEach(file => {
    copyFile(file.srcPath, file.destPath);
    console.log(`  ✓ ${file.path}`);
  });

  console.log(`\n✅ Synced ${allOutdated.length} file(s) successfully!`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});