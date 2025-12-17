#!/usr/bin/env node
/**
 * sync-versions.js - Sync all package versions to a unified value
 *
 * Usage: node scripts/sync-versions.js [version]
 *
 * If no version is provided, uses the version from package.json
 *
 * Updates:
 *   - package.json
 *   - npx-cli/package.json
 *   - frontend/package.json
 *   - forge-app/Cargo.toml
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Validate semver format (with optional -rc.N suffix)
function isValidVersion(v) {
    return /^\d+\.\d+\.\d+(-rc\.\d+)?$/.test(v);
}

// Get version from package.json
function getPackageVersion() {
    const pkgPath = path.join(ROOT, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version;
    }
    return null;
}

// Update JSON file version
function updateJsonVersion(filePath, version) {
    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  Skipped ${path.relative(ROOT, filePath)} (not found)`);
        return false;
    }

    const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const oldVersion = pkg.version;

    if (oldVersion === version) {
        console.log(`  ✓ ${path.relative(ROOT, filePath)} already at ${version}`);
        return false;
    }

    pkg.version = version;
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✓ ${path.relative(ROOT, filePath)}: ${oldVersion} → ${version}`);
    return true;
}

// Update Cargo.toml version (first `version = "..."` line)
function updateCargoVersion(filePath, version) {
    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  Skipped ${path.relative(ROOT, filePath)} (not found)`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const oldMatch = content.match(/^version\s*=\s*"([^"]+)"/m);
    const oldVersion = oldMatch ? oldMatch[1] : null;

    if (oldVersion === version) {
        console.log(`  ✓ ${path.relative(ROOT, filePath)} already at ${version}`);
        return false;
    }

    // Replace first occurrence of version = "..."
    content = content.replace(/^(version\s*=\s*")[^"]+(")/m, `$1${version}$2`);
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ ${path.relative(ROOT, filePath)}: ${oldVersion || '?'} → ${version}`);
    return true;
}

// Main
function main() {
    let version = process.argv[2];

    // If no version provided, use package.json
    if (!version) {
        version = getPackageVersion();
        if (!version) {
            console.error('ERROR: No version provided and could not read package.json');
            process.exit(1);
        }
        console.log(`Using version from package.json: ${version}`);
    }

    // Validate format
    if (!isValidVersion(version)) {
        console.error(`ERROR: Invalid version format: ${version}`);
        console.error('Expected: X.Y.Z or X.Y.Z-rc.N');
        process.exit(1);
    }

    console.log(`\nSyncing all packages to version ${version}\n`);

    let updated = 0;

    // Package.json files
    console.log('Package.json files:');
    if (updateJsonVersion(path.join(ROOT, 'package.json'), version)) updated++;
    if (updateJsonVersion(path.join(ROOT, 'npx-cli/package.json'), version)) updated++;
    if (updateJsonVersion(path.join(ROOT, 'frontend/package.json'), version)) updated++;

    // Cargo.toml files
    console.log('\nCargo.toml files:');
    if (updateCargoVersion(path.join(ROOT, 'forge-app/Cargo.toml'), version)) updated++;

    // Summary
    console.log(`\n✅ Versions synced to ${version}`);
    if (updated > 0) {
        console.log(`   ${updated} file(s) updated`);
        console.log('\nNext steps:');
        console.log('  git add -A');
        console.log(`  git commit -m "chore: sync versions to ${version}"`);
    } else {
        console.log('   All files already at target version');
    }
}

main();
