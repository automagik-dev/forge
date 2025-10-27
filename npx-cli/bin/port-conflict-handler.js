#!/usr/bin/env node

/**
 * Advanced port conflict handler with health checks and running task detection
 */

const http = require('http');
const net = require('net');
const readline = require('readline');
const { exec } = require('child_process');

/**
 * Check if the service on the port is a healthy Forge instance
 */
function checkForgeHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/projects`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            healthy: json.success === true,
            projects: json.data || []
          });
        } catch {
          resolve({ healthy: false });
        }
      });
    });

    req.on('error', () => resolve({ healthy: false }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ healthy: false });
    });
  });
}

/**
 * Get running tasks from Forge instance
 */
function getRunningTasks(port) {
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
    req.setTimeout(3000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

/**
 * Get task details by attempt ID
 */
function getTaskAttemptDetails(port, attemptId) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/task-attempts/${attemptId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && json.data) {
            resolve(json.data);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Format duration from start time
 */
function formatDuration(startedAt) {
  const now = new Date();
  const start = new Date(startedAt);
  const diffMs = now - start;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Main port conflict handler
 */
async function handlePortConflict(port) {
  console.error('\n⚠️  Port conflict detected!\n');
  console.error(`🔍 Checking port ${port}...\n`);

  // Check if it's a Forge instance
  const health = await checkForgeHealth(port);

  if (!health.healthy) {
    console.error(`❌ Port ${port} is occupied by another service (not Forge)\n`);
    console.error('💡 Solutions:');
    console.error(`   1. Stop the service using port ${port}`);
    console.error(`   2. Use a different port: BACKEND_PORT=8888 npx automagik-forge`);
    console.error(`   3. Use dynamic port allocation: make dev (auto-assigns from 13000+)\n`);
    return { action: 'cancel' };
  }

  console.error(`✅ Found a healthy Forge instance on port ${port}`);

  // Show project info
  if (health.projects && health.projects.length > 0) {
    console.error(`📁 Projects: ${health.projects.length} configured`);
  }

  // Check for running tasks
  const runningProcesses = await getRunningTasks(port);

  if (runningProcesses.length === 0) {
    console.error(`\n📭 No active tasks running\n`);
    console.error(`🌐 Access the running instance: http://localhost:${port}`);
    console.error('\n💡 Options:');
    console.error('   1. Use the existing instance (recommended)');
    console.error('   2. Stop it and start a new one');
    console.error(`   3. Use a different port: BACKEND_PORT=8888 npx automagik-forge\n`);
    const takeover = await promptForTakeover();
    if (!takeover) {
      return { action: 'cancel' };
    }

    const takeoverResult = await attemptTakeover(port);
    if (takeoverResult.success) {
      console.error(`\n✅ Existing process terminated. Retrying launch...\n`);
      return { action: 'retry' };
    }

    console.error('\n❌ Unable to terminate the existing Forge instance automatically.');
    if (takeoverResult.reason) {
      console.error(`   ${takeoverResult.reason}`);
    }
    console.error(`\n🔁 Please stop the process manually or choose a different port before retrying.\n`);
    return { action: 'cancel' };
  }

  // Show running tasks with details
  console.error(`\n⚠️  ${runningProcesses.length} active task${runningProcesses.length > 1 ? 's' : ''} currently running!\n`);
  console.error('🏃 Running Tasks:\n');

  // Get detailed info for each running task
  for (let i = 0; i < Math.min(runningProcesses.length, 5); i++) {
    const process = runningProcesses[i];
    const attemptDetails = await getTaskAttemptDetails(port, process.task_attempt_id);

    const taskNum = i + 1;
    const duration = formatDuration(process.started_at);
    const executor = attemptDetails?.executor || 'Unknown';
    const branch = attemptDetails?.branch || attemptDetails?.target_branch || 'Unknown';
    const projectId = attemptDetails?.project_id;
    const taskId = attemptDetails?.task_id;

    console.error(`   ${taskNum}. Task Execution`);
    console.error(`      Executor: ${executor}`);
    console.error(`      Branch: ${branch}`);
    console.error(`      Status: Running for ${duration}`);
    console.error(`      Started: ${new Date(process.started_at).toLocaleString()}`);

    if (projectId && taskId && process.task_attempt_id) {
      const taskUrl = `http://localhost:${port}/projects/${projectId}/tasks/${taskId}/attempts/${process.task_attempt_id}`;
      console.error(`      🔗 View: ${taskUrl}`);
    }
    console.error('');
  }

  if (runningProcesses.length > 5) {
    console.error(`   ... and ${runningProcesses.length - 5} more active tasks\n`);
  }

  // Show warning and recommendations
  console.error('⚠️  WARNING: Starting a new instance will NOT stop these tasks!');
  console.error('   The running tasks will continue in the background.\n');

  console.error(`🌐 Main UI: http://localhost:${port}`);
  console.error('\n💡 Recommended Actions:\n');
  console.error('   1. Review running tasks at the URLs above');
  console.error('   2. Wait for tasks to complete or stop them manually');
  console.error('   3. Then start a new instance if needed\n');
  console.error('   Alternative:');
  console.error(`   - Use a different port: BACKEND_PORT=8888 npx automagik-forge`);
  console.error('   - Use dynamic ports: make dev (for parallel instances)\n');
  return { action: 'cancel' };
}

function promptForTakeover() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('➡️  Press Enter to take over (terminate existing process) or type "n" to cancel: ', (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === '' || trimmed === 'y' || trimmed === 'yes');
    });
  });
}

function getPortPids(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          return resolve([]);
        }
        const lines = stdout.split(/\r?\n/).filter(Boolean);
        const pids = new Set();
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && /^\d+$/.test(pid)) {
            pids.add(pid);
          }
        }
        resolve(Array.from(pids));
      });
      return;
    }

    // Only get the process LISTENING on the specific port, not connections
    exec(`lsof -ti :${port} -sTCP:LISTEN`, (error, stdout) => {
      if (error || !stdout) {
        return resolve([]);
      }
      const pids = stdout.split(/\r?\n/).filter(Boolean);
      resolve(pids);
    });
  });
}

function terminatePid(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`taskkill /PID ${pid} /T /F`, (error) => {
        resolve(!error);
      });
      return;
    }

    exec(`kill -TERM ${pid}`, (error) => {
      if (!error) {
        return resolve(true);
      }
      exec(`kill -KILL ${pid}`, (forceError) => {
        resolve(!forceError);
      });
    });
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '127.0.0.1');
  });
}

async function waitForPortRelease(port) {
  const retries = 10;
  const delay = 300;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const free = await isPortFree(port);
    if (free) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
}

async function attemptTakeover(port) {
  const pids = await getPortPids(port);
  if (pids.length === 0) {
    return { success: false, reason: `No process IDs found for port ${port}.` };
  }

  console.error(`\n🔪 Attempting to terminate Forge process${pids.length > 1 ? 'es' : ''}: ${pids.join(', ')}`);

  let terminated = 0;
  for (const pid of pids) {
    const success = await terminatePid(pid);
    if (success) {
      terminated += 1;
    } else {
      console.error(`   ⚠️  Failed to terminate PID ${pid}`);
    }
  }

  if (terminated === 0) {
    return { success: false, reason: 'Process termination failed.' };
  }

  const released = await waitForPortRelease(port);
  if (!released) {
    return { success: false, reason: `Port ${port} is still in use after attempting termination.` };
  }

  return { success: true };
}

module.exports = { handlePortConflict };
