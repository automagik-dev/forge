#!/usr/bin/env node
/**
 * create-zip.js - Cross-platform ZIP creation using Node.js (adm-zip)
 *
 * Eliminates dependency on OS-level zip tools (zip command, PowerShell Compress-Archive)
 * Works consistently across Linux, macOS, and Windows.
 *
 * Usage: node scripts/build/create-zip.js <input-file> <output-zip>
 */

const path = require('path');
const fs = require('fs');

// Resolve adm-zip from npx-cli/node_modules
const rootDir = path.resolve(__dirname, '../..');
const admZipPath = path.join(rootDir, 'npx-cli', 'node_modules', 'adm-zip');
const AdmZip = require(admZipPath);

// Parse CLI arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node create-zip.js <input-file> <output-zip>');
  console.error('Example: node create-zip.js automagik-forge automagik-forge.zip');
  process.exit(1);
}

const [inputFile, outputZip] = args;

// Validate input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file does not exist: ${inputFile}`);
  process.exit(1);
}

try {
  // Create a new ZIP archive
  const zip = new AdmZip();

  // Add the file to the ZIP (preserve filename)
  const fileName = path.basename(inputFile);
  zip.addLocalFile(inputFile, '', fileName);

  // Write the ZIP file
  zip.writeZip(outputZip);

  console.log(`✅ Created ${outputZip} containing ${fileName}`);
} catch (error) {
  console.error(`❌ Failed to create ZIP: ${error.message}`);
  process.exit(1);
}
