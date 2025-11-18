#!/usr/bin/env node
/**
 * Helper script: turn a git diff into a Forge task + Codex execution.
 *
 * It:
 *  1. Computes git diff between --base and --head (defaults: origin/dev...HEAD)
 *  2. Looks up a project by ID/path via Forge REST API
 *  3. Creates a task w/ description containing the diff
 *  4. Immediately starts an attempt using the requested executor (default CODEX)
 *
 * Usage:
 *   FORGE_API_URL=http://127.0.0.1:8887 node scripts/create-forge-task-from-diff.mjs \
 *     --project 123e4567-e89b-12d3-a456-426614174000 \
 *     --base origin/dev --head HEAD \
 *     --branch dev \
 *     --executor CODEX \
 *     --title "Codex: regenerate Cypress tests"
 *
 * The Forge server must be running locally (make dev / npx @automagik/forge).
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_BASE = 'origin/dev';
const DEFAULT_HEAD = 'HEAD';
const DEFAULT_BRANCH = 'dev';
const DEFAULT_EXECUTOR = 'CODEX';
const DEFAULT_API_URL = process.env.FORGE_API_URL || 'http://127.0.0.1:8887';
const DIFF_LIMIT = 15_000; // avoid blowing up request payloads

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    project: null,
    base: DEFAULT_BASE,
    head: DEFAULT_HEAD,
    branch: DEFAULT_BRANCH,
    executor: DEFAULT_EXECUTOR,
    title: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if ((arg === '--project' || arg === '-p') && next) {
      parsed.project = next;
      i += 1;
    } else if (arg === '--base' && next) {
      parsed.base = next;
      i += 1;
    } else if (arg === '--head' && next) {
      parsed.head = next;
      i += 1;
    } else if ((arg === '--branch' || arg === '-b') && next) {
      parsed.branch = next;
      i += 1;
    } else if (arg === '--executor' && next) {
      parsed.executor = next.toUpperCase();
      i += 1;
    } else if (arg === '--title' && next) {
      parsed.title = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/create-forge-task-from-diff.mjs --project <id|path|name> [options]

Options:
  --base <ref>       Base git ref (default origin/dev)
  --head <ref>       Head git ref (default HEAD)
  --branch <name>    Base branch for attempt (default dev)
  --executor <name>  Executor profile (default CODEX)
  --title <text>     Custom task title
  --help             Show this message

Env:
  FORGE_API_URL   (default http://127.0.0.1:8887)
`);
      process.exit(0);
    }
  }

  if (!parsed.project) {
    console.error('❌ Must provide --project (ID, repo path, or substring).');
    process.exit(1);
  }

  return parsed;
}

function runGitDiff(base, head) {
  try {
    return execSync(`git diff ${base}...${head} -- frontend src shared`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch (error) {
    console.error('❌ Failed to compute git diff. Ensure refs exist.', error.message);
    process.exit(1);
  }
}

async function fetchJson(url, init) {
  const resp = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${text}`);
  }
  return resp.json();
}

async function findProjectId(projectIdentifier) {
  const response = await fetchJson(`${DEFAULT_API_URL}/api/projects`);
  const projects = response?.data || [];
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error('No projects found via /api/projects. Is Forge running?');
  }

  const byExactId = projects.find((p) => p.id === projectIdentifier);
  if (byExactId) return byExactId.id;

  const normalized = projectIdentifier.toLowerCase();
  const byPath = projects.find(
    (p) =>
      p.name?.toLowerCase() === normalized ||
      p.git_repo_path?.toLowerCase() === normalized ||
      p.git_repo_path?.toLowerCase().includes(normalized)
  );
  if (byPath) return byPath.id;

  throw new Error(
    `Project "${projectIdentifier}" not found. Available:\n${projects
      .map((p) => `- ${p.id} :: ${p.git_repo_path}`)
      .join('\n')}`
  );
}

function buildDescription(diff, base, head) {
  const snippet =
    diff.length > DIFF_LIMIT ? `${diff.slice(0, DIFF_LIMIT)}\n...\n(truncated)` : diff;
  return [
    `Automated request: generate Cypress/regression tests for diff ${base}...${head}.`,
    '',
    'Focus on TaskActions/Kanban/mobile flows where applicable. Use existing helpers (cy.setMobileViewport, etc.).',
    '',
    'Diff:',
    '```diff',
    snippet,
    '```',
  ].join('\n');
}

async function main() {
  const { project, base, head, branch, executor, title } = parseArgs();
  const diff = runGitDiff(base, head);
  if (!diff) {
    console.error(`No diff between ${base} and ${head}. Aborting.`);
    process.exit(1);
  }

  const projectId = await findProjectId(project);
  const description = buildDescription(diff, base, head);
  const computedTitle =
    title || `Forge: ${executor} tests for ${head}`.replace(/\s+/g, ' ').slice(0, 80);

  const payload = {
    task: {
      project_id: projectId,
      title: computedTitle,
      description,
    },
    executor_profile_id: {
      executor,
      variant: null,
    },
    base_branch: branch,
    use_worktree: true,
  };

  console.log(`📡 Creating task for project ${projectId} via ${DEFAULT_API_URL}...`);
  const response = await fetchJson(`${DEFAULT_API_URL}/api/tasks/create-and-start`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response?.data) {
    throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
  }

  const task = response.data;
  console.log('✅ Forge task created & executor started.');
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Attempt branch: ${task.latest_attempt?.branch || 'n/a'}`);
  console.log(`   Executor: ${executor}`);
}

main().catch((error) => {
  console.error('❌ Failed:', error.message);
  process.exit(1);
});
