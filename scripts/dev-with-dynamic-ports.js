#!/usr/bin/env node

/**
 * Development server launcher with dynamic port allocation
 * Finds available ports starting from 13000 and launches frontend + backend
 */

const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT_START = 12000;
const FRONTEND_PORT_START = 13000;
const PORT_RANGE = 100; // Search up to 12100/13100

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find next available port pair (backend, frontend)
 * Backend: 12000, 12001, 12002...
 * Frontend: 13000, 13001, 13002...
 */
async function findAvailablePortPair() {
  for (let i = 0; i < PORT_RANGE; i++) {
    const backendPort = BACKEND_PORT_START + i;
    const frontendPort = FRONTEND_PORT_START + i;

    const backendAvailable = await isPortAvailable(backendPort);
    const frontendAvailable = await isPortAvailable(frontendPort);

    if (backendAvailable && frontendAvailable) {
      return { backend: backendPort, frontend: frontendPort };
    }
  }

  throw new Error(`No available port pairs found (Backend: ${BACKEND_PORT_START}-${BACKEND_PORT_START + PORT_RANGE}, Frontend: ${FRONTEND_PORT_START}-${FRONTEND_PORT_START + PORT_RANGE})`);
}

/**
 * Save port allocation to file for reference
 */
function savePortAllocation(ports) {
  const allocFile = path.join(__dirname, '../.dev-ports.json');
  let allocations = [];

  // Handle existing file - ensure it's an array
  if (fs.existsSync(allocFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(allocFile, 'utf8'));
      // If it's an array, use it; otherwise start fresh
      allocations = Array.isArray(data) ? data : [];
    } catch (err) {
      // Invalid JSON, start fresh
      allocations = [];
    }
  }

  allocations.push({
    ...ports,
    pid: process.pid,
    timestamp: new Date().toISOString()
  });

  // Keep only last 10 allocations
  if (allocations.length > 10) {
    allocations.shift();
  }

  fs.writeFileSync(allocFile, JSON.stringify(allocations, null, 2));
}

/**
 * Check if backend is ready by attempting to connect
 */
async function waitForBackend(port, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await new Promise((resolve) => {
      const client = net.createConnection({ port, host: '127.0.0.1' }, () => {
        client.end();
        resolve(true);
      });
      client.on('error', () => resolve(false));
      client.setTimeout(1000, () => {
        client.destroy();
        resolve(false);
      });
    });

    if (ready) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
}

/**
 * Start backend server
 */
function startBackend(port) {
  console.log(`🔨 Compiling and starting backend on port ${port}...`);
  console.log('');

  const backend = spawn('cargo', ['run', '-p', 'forge-app', '--bin', 'forge-app'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      BACKEND_PORT: port.toString(),
      RUST_LOG: process.env.RUST_LOG || 'info',
      DISABLE_WORKTREE_ORPHAN_CLEANUP: '1'
    },
    stdio: ['ignore', 'inherit', 'inherit']
  });

  backend.on('exit', (code) => {
    console.log(`\n❌ Backend exited with code ${code}`);
    process.exit(code || 0);
  });

  return backend;
}

/**
 * Start frontend server
 */
function startFrontend(frontendPort, backendPort) {
  const frontend = spawn('pnpm', ['run', 'dev', '--', '--port', frontendPort.toString(), '--host'], {
    cwd: path.join(__dirname, '../frontend'),
    env: {
      ...process.env,
      FRONTEND_PORT: frontendPort.toString(),
      BACKEND_PORT: backendPort.toString()
    },
    stdio: ['ignore', 'inherit', 'inherit']
  });

  frontend.on('exit', (code) => {
    console.log(`\n❌ Frontend exited with code ${code}`);
    process.exit(code || 0);
  });

  return frontend;
}

/**
 * Main entry point
 */
async function main() {
  console.log('🔍 Finding available ports...');

  const ports = await findAvailablePortPair();
  console.log(`✅ Allocated ports: Backend=${ports.backend}, Frontend=${ports.frontend}`);

  savePortAllocation(ports);

  console.log('\n📦 Syncing assets...');
  const syncAssets = spawn('node', ['scripts/sync-upstream-assets.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  await new Promise((resolve) => {
    syncAssets.on('exit', resolve);
  });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Starting Backend Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const backend = startBackend(ports.backend);

  console.log('');
  console.log('⏳ Waiting for backend to be ready...');

  const backendReady = await waitForBackend(ports.backend);

  if (!backendReady) {
    console.error('\n❌ Backend failed to start within 60 seconds');
    backend.kill();
    process.exit(1);
  }

  console.log('✅ Backend is ready!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 Starting Frontend Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const frontend = startFrontend(ports.frontend, ports.backend);

  // Give frontend a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Development Environment Ready');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   🌐 Frontend: http://localhost:${ports.frontend}`);
  console.log(`   ⚙️  Backend:  http://localhost:${ports.backend}`);
  console.log('');
  console.log('   Press Ctrl+C to stop');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
