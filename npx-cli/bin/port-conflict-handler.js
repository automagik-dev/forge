#!/usr/bin/env node

/**
 * Advanced port conflict handler with health checks and running task detection
 */

const http = require('http');

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
    return;
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
    return;
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
}

module.exports = { handlePortConflict };
