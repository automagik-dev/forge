import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const PREVIEW_PORT = parseInt(process.env.PERF_PREVIEW_PORT ?? '4173', 10);
const PREVIEW_HOST = process.env.PERF_PREVIEW_HOST ?? '127.0.0.1';
const PREVIEW_URL =
  process.env.PERF_PREVIEW_URL ?? `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url: string, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        return;
      }
    } catch {
      // ignore until ready
    }
    await wait(500);
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: FRONTEND_ROOT,
      stdio: 'inherit',
      env,
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

async function main() {
  const tests = process.argv.slice(2);
  const targets = tests.length > 0 ? tests : ['lighthouse', 'load-time', 'animation-fps'];

  console.log(`Starting preview server on ${PREVIEW_URL}`);
  const preview = spawn(
    'pnpm',
    ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'],
    {
      cwd: FRONTEND_ROOT,
      stdio: 'inherit',
    }
  );

  preview.on('exit', code => {
    if (code !== null && code !== 0) {
      console.error(`Preview server exited with code ${code}`);
    }
  });

  try {
    await waitForServer(PREVIEW_URL);
    console.log('Preview server ready, running performance tests...');

    for (const testName of targets) {
      if (testName === 'lighthouse') {
        await runCommand(
          'pnpm',
          ['exec', 'lhci', 'autorun', '--config=performance-tests/lighthouserc.js'],
          {
            ...process.env,
            LHCI_TARGET_URL: PREVIEW_URL,
          }
        );
        continue;
      }

      const testFile = testName.endsWith('.ts')
        ? testName
        : `${testName}.test.ts`;
      await runCommand(
        'pnpm',
        ['exec', 'tsx', path.posix.join('performance-tests', testFile)],
        {
          ...process.env,
          TEST_URL: PREVIEW_URL,
        }
      );
    }
  } finally {
    preview.kill('SIGTERM');
    await new Promise(resolve => preview.once('close', resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
