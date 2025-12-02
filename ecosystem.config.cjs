// ===================================================================
// 🔨 Automagik Forge - PM2 Configuration
// ===================================================================
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = __dirname;

// Load environment variables from .env if it exists
const envPath = path.join(PROJECT_ROOT, '.env');
let envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

// Create logs directory
const logsDir = path.join(PROJECT_ROOT, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
  apps: [
    {
      name: '8887: Forge',
      cwd: PROJECT_ROOT,
      script: 'make',
      args: 'prod',
      interpreter: 'none',
      env: {
        ...envVars,
        NODE_ENV: 'production',
        RUST_LOG: 'info',
        PROCESS_TITLE: 'Automagik Forge'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      kill_timeout: 10000,
      error_file: path.join(PROJECT_ROOT, 'logs/forge-err.log'),
      out_file: path.join(PROJECT_ROOT, 'logs/forge-out.log'),
      log_file: path.join(PROJECT_ROOT, 'logs/forge-combined.log'),
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
