#!/usr/bin/env node

/**
 * Check for port conflicts and offer takeover for running Forge instances
 */

const net = require('net');
const { execSync } = require('child_process');
const http = require('http');

const PORT = process.env.BACKEND_PORT || process.env.PORT || '8887';

/**
 * Check if port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Check if the service on the port is a healthy Forge instance
 */
async function checkForgeHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/projects`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ healthy: json.success === true, data: json });
        } catch {
          resolve({ healthy: false });
        }
      });
    });

    req.on('error', () => resolve({ healthy: false }));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ healthy: false });
    });
  });
}

/**
 * Get running tasks from Forge instance
 */
async function getRunningTasks(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/execution-processes?status=running`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && Array.isArray(json.data)) {
            resolve(json.data);
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

/**
 * Main check
 */
async function main() {
  const inUse = await isPortInUse(PORT);

  if (!inUse) {
    console.log(`✅ Port ${PORT} is available`);
    process.exit(0);
  }

  console.log(`\n⚠️  Port ${PORT} is already in use`);
  console.log(`🔍 Checking if it's a Forge instance...\n`);

  const health = await checkForgeHealth(PORT);

  if (!health.healthy) {
    console.error(`❌ Port ${PORT} is occupied by another service (not Forge)`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Stop the service using port ${PORT}`);
    console.error(`   2. Or set a different port: BACKEND_PORT=8888 npx automagik-forge`);
    console.error(`   3. Or use make dev for auto port allocation\n`);
    process.exit(1);
  }

  console.log(`✅ Found a healthy Forge instance on port ${PORT}`);

  const runningTasks = await getRunningTasks(PORT);

  if (runningTasks.length > 0) {
    console.log(`\n🏃 Active tasks (${runningTasks.length}):\n`);
    runningTasks.slice(0, 5).forEach((task, i) => {
      console.log(`   ${i + 1}. Task Attempt: ${task.task_attempt_id}`);
      console.log(`      Status: ${task.status}`);
      console.log(`      Started: ${new Date(task.started_at).toLocaleString()}`);
      console.log();
    });

    if (runningTasks.length > 5) {
      console.log(`   ... and ${runningTasks.length - 5} more\n`);
    }
  } else {
    console.log(`\n📭 No active tasks running\n`);
  }

  console.log(`🌐 Forge UI: http://localhost:${PORT}`);
  console.log(`\n💡 Options:`);
  console.log(`   1. Use the running instance at http://localhost:${PORT}`);
  console.log(`   2. Stop it and start a new one (Ctrl+C in the running terminal)`);
  console.log(`   3. Use a different port: BACKEND_PORT=8888 npx automagik-forge`);
  console.log(`   4. Use dynamic ports: make dev (auto-assigns from port 13000+)`);
  console.log();

  process.exit(1);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
