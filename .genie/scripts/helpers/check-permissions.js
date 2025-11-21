#!/usr/bin/env node

/**
 * Check Agent Permission Settings
 *
 * Validates that all agents have proper dangerously_skip_permissions settings
 * in their CLAUDE_CODE executor configurations.
 *
 * Usage:
 *   node check-permissions.js [--fix]
 *
 * Options:
 *   --fix    Automatically fix missing permission settings
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const args = process.argv.slice(2);
const FIX_MODE = args.includes('--fix');

const results = {
  total: 0,
  correct: 0,
  missing: 0,
  fixed: 0,
  errors: [],
};

/**
 * Extract and parse frontmatter from markdown file
 */
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  if (lines[0] !== '---') {
    return { hasFrontmatter: false, content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { hasFrontmatter: false, content };
  }

  const yamlContent = lines.slice(1, endIndex).join('\n');
  const bodyContent = lines.slice(endIndex + 1).join('\n');

  try {
    const frontmatter = yaml.parse(yamlContent);
    return { hasFrontmatter: true, frontmatter, bodyContent, yamlContent };
  } catch (err) {
    return { hasFrontmatter: false, content, error: err.message };
  }
}

/**
 * Check if CLAUDE_CODE has dangerously_skip_permissions: true
 */
function checkPermissions(frontmatter) {
  if (!frontmatter.forge || typeof frontmatter.forge !== 'object') {
    return { status: 'no_forge_config' };
  }

  if (!frontmatter.forge.CLAUDE_CODE || typeof frontmatter.forge.CLAUDE_CODE !== 'object') {
    return { status: 'no_claude_code' };
  }

  if (frontmatter.forge.CLAUDE_CODE.dangerously_skip_permissions === true) {
    return { status: 'correct' };
  }

  if (frontmatter.forge.CLAUDE_CODE.dangerously_skip_permissions === false) {
    return { status: 'disabled', value: false };
  }

  return { status: 'missing' };
}

/**
 * Fix missing permission setting
 */
function fixPermissions(filePath, parsed) {
  if (!parsed.frontmatter.forge) {
    parsed.frontmatter.forge = {};
  }

  if (!parsed.frontmatter.forge.CLAUDE_CODE) {
    parsed.frontmatter.forge.CLAUDE_CODE = {};
  }

  parsed.frontmatter.forge.CLAUDE_CODE.dangerously_skip_permissions = true;

  const newYaml = yaml.stringify(parsed.frontmatter);
  const newContent = `---\n${newYaml}---\n${parsed.bodyContent}`;

  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

/**
 * Scan directory for agent files
 */
function scanDirectory(dir, baseDir = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (['node_modules', 'backups', 'upgrades', '.git'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, relativePath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Skip non-agent files
      if (entry.name === 'README.md' || entry.name === 'AGENTS.md') {
        continue;
      }

      // Only check files in agents/ or neurons/ directories
      if (!relativePath.includes('/agents/') && !relativePath.includes('/neurons/')) {
        continue;
      }

      checkFile(fullPath, relativePath);
    }
  }
}

/**
 * Check individual file
 */
function checkFile(filePath, relativePath) {
  results.total++;

  try {
    const parsed = parseFrontmatter(filePath);

    if (!parsed.hasFrontmatter) {
      return; // Skip files without frontmatter
    }

    const check = checkPermissions(parsed.frontmatter);

    if (check.status === 'correct') {
      results.correct++;
      console.log(`✅ ${relativePath}`);
    } else if (check.status === 'disabled') {
      console.log(`⚠️  ${relativePath} - dangerously_skip_permissions: false`);
    } else if (check.status === 'missing') {
      results.missing++;
      console.log(`❌ ${relativePath} - Missing dangerously_skip_permissions`);

      if (FIX_MODE) {
        try {
          fixPermissions(filePath, parsed);
          results.fixed++;
          console.log(`   ✅ Fixed!`);
        } catch (err) {
          results.errors.push({ file: relativePath, error: err.message });
          console.log(`   ❌ Fix failed: ${err.message}`);
        }
      }
    } else if (check.status === 'no_claude_code') {
      // Skip - no CLAUDE_CODE configuration
    }
  } catch (err) {
    results.errors.push({ file: relativePath, error: err.message });
    console.log(`❌ ${relativePath} - Error: ${err.message}`);
  }
}

// Main execution
console.log('Checking agent permission settings...\n');

const genieDir = path.join(process.cwd(), '.genie');
if (!fs.existsSync(genieDir)) {
  console.error('Error: .genie/ directory not found');
  process.exit(1);
}

scanDirectory(genieDir, '.genie');

console.log('\n=== Summary ===');
console.log(`Total agent files: ${results.total}`);
console.log(`✅ Correct: ${results.correct}`);
console.log(`❌ Missing: ${results.missing}`);
if (FIX_MODE) {
  console.log(`🔧 Fixed: ${results.fixed}`);
}
if (results.errors.length > 0) {
  console.log(`\n⚠️  Errors (${results.errors.length}):`);
  results.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
}

if (!FIX_MODE && results.missing > 0) {
  console.log('\nRun with --fix to automatically fix missing settings');
}

process.exit(results.missing > 0 && !FIX_MODE ? 1 : 0);
