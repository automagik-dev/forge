#!/usr/bin/env node
/**
 * Diff-aware Cypress test generator.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-cypress-tests.mjs --base origin/dev --head HEAD
 *
 * The script:
 *  1. Collects the git diff between --base and --head (defaults: origin/dev...HEAD)
 *  2. Sends the diff plus guidance to an LLM
 *  3. Expects JSON describing Cypress files to create
 *  4. Writes the generated files to disk (default folder: cypress/e2e/generated)
 *
 * The model is configurable via OPENAI_MODEL (defaults to gpt-4o-mini).
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

const DEFAULT_BASE = 'origin/dev';
const DEFAULT_HEAD = 'HEAD';
const DEFAULT_OUT_DIR = 'cypress/e2e/generated';

/**
 * Minimal CLI arg parser (supports --base, --head, --out).
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    base: DEFAULT_BASE,
    head: DEFAULT_HEAD,
    outDir: DEFAULT_OUT_DIR,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--base' && next) {
      parsed.base = next;
      i += 1;
    } else if (arg === '--head' && next) {
      parsed.head = next;
      i += 1;
    } else if (arg === '--out' && next) {
      parsed.outDir = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/generate-cypress-tests.mjs [--base origin/dev] [--head HEAD] [--out cypress/e2e/generated]

Environment variables:
  OPENAI_API_KEY   Required. API key for OpenAI-compatible endpoint.
  OPENAI_MODEL     Optional. Defaults to gpt-4o-mini.
  OPENAI_BASE_URL  Optional. Defaults to https://api.openai.com/v1
`);
      process.exit(0);
    }
  }

  return parsed;
}

function runGitDiff(base, head) {
  try {
    return execSync(`git diff ${base}...${head} -- frontend/src frontend/package.json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch (error) {
    console.error('❌ Failed to compute git diff. Ensure the base/head refs exist.', error.message);
    process.exit(1);
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFilesFromResponse(baseDir, files) {
  if (!Array.isArray(files)) {
    throw new Error('LLM response missing "files" array');
  }
  for (const file of files) {
    if (!file?.path || !file?.contents) {
      console.warn('Skipping malformed file entry:', file);
      continue;
    }
    const targetPath = path.isAbsolute(file.path)
      ? file.path
      : path.join(baseDir, file.path);
    await ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, file.contents, 'utf8');
    console.log(`📝 Wrote ${targetPath}`);
  }
}

async function main() {
  const { base, head, outDir } = parseArgs();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is required.');
    process.exit(1);
  }

  const diff = runGitDiff(base, head).trim();
  if (!diff) {
    console.log(`No frontend diff between ${base} and ${head}. Nothing to do.`);
    process.exit(0);
  }

  console.log(`📄 Collected diff between ${base}...${head} (length: ${diff.length} chars)`);

  const systemPrompt = `
You are an expert Cypress test author for Automagik Forge.
Always emit deterministic tests that use existing helpers:
  - cy.setMobileViewport, cy.waitForAppReady, cy.checkTouchTarget, etc (see cypress/support/e2e.ts and commands.ts)
Prefer TypeScript (.ts) output with ES module imports.
Respond with valid JSON matching: { "files": [ { "path": "<relative path>", "contents": "<file contents>" } ] }.
`.trim();

  const userPrompt = `
Generate Cypress page objects and/or specs that validate the behavior implied by this diff.
Focus on data-testid changes, new components, and regressions.
Each file should live under ${outDir}/ (you may create subfolders).
Include meaningful describe/it blocks and leverage the custom commands when interacting with the UI.
If the diff references translation files, ensure tests assert localized labels via cy.contains.

Git diff:
${'```diff'}
${diff}
${'```'}
`.trim();

  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('❌ OpenAI API error:', resp.status, errText);
    process.exit(1);
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    console.error('❌ LLM response missing content:', JSON.stringify(json));
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to parse JSON from LLM response:', error.message);
    console.error('Raw content:', content);
    process.exit(1);
  }

  await writeFilesFromResponse(outDir, parsed.files);
  console.log('✅ Generation complete.');
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
