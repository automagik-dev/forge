#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load .env from current working directory if present
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log("📝 Loaded environment from .env");
  }
}

// Read version from package.json and set FORGE_VERSION env var
// This enables zero-rebuild promotion: binary reads version at runtime
const packageJsonPath = path.join(__dirname, "..", "package.json");
try {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  process.env.FORGE_VERSION = pkg.version;
} catch (err) {
  console.warn("⚠️ Could not read package version, using 'unknown'");
  process.env.FORGE_VERSION = "unknown";
}

// Resolve effective arch for our published 64-bit binaries only.
// Any ARM → arm64; anything else → x64. On macOS, handle Rosetta.
function getEffectiveArch() {
  const platform = process.platform;
  const nodeArch = process.arch;

  if (platform === "darwin") {
    // If Node itself is arm64, we're natively on Apple silicon
    if (nodeArch === "arm64") return "arm64";

    // Otherwise check for Rosetta translation
    try {
      const translated = execSync("sysctl -in sysctl.proc_translated", {
        encoding: "utf8",
      }).trim();
      if (translated === "1") return "arm64";
    } catch {
      // sysctl key not present → assume true Intel
    }
    return "x64";
  }

  // Non-macOS: coerce to broad families we support
  if (/arm/i.test(nodeArch)) return "arm64";

  // On Windows with 32-bit Node (ia32), detect OS arch via env
  if (platform === "win32") {
    const pa = process.env.PROCESSOR_ARCHITECTURE || "";
    const paw = process.env.PROCESSOR_ARCHITEW6432 || "";
    if (/arm/i.test(pa) || /arm/i.test(paw)) return "arm64";
  }

  return "x64";
}

function isAndroid() {
  if (process.platform === "android") return true;

  if (process.env.TERMUX_VERSION) return true;
  if (process.env.ANDROID_ROOT || process.env.ANDROID_DATA) return true;

  try {
    if (fs.existsSync("/system/bin/getprop")) return true;
  } catch {
  }

  return false;
}

// Normalize platform - map Android to android-arm64 for native Termux support
const platform = isAndroid() ? "android" : process.platform;
const arch = getEffectiveArch();

// Map to our build target names
function getPlatformDir() {
  if (platform === "android" && arch === "arm64") return "android-arm64";
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "win32" && arch === "x64") return "windows-x64";
  if (platform === "win32" && arch === "arm64") return "windows-arm64";
  if (platform === "darwin" && arch === "x64") return "macos-x64";
  if (platform === "darwin" && arch === "arm64") return "macos-arm64";

  console.error(`❌ Unsupported platform: ${platform}-${arch}`);
  console.error("Supported platforms:");
  console.error("  - Android ARM64 (Termux)");
  console.error("  - Linux x64");
  console.error("  - Linux ARM64");
  console.error("  - Windows x64");
  console.error("  - Windows ARM64");
  console.error("  - macOS x64 (Intel)");
  console.error("  - macOS ARM64 (Apple Silicon)");
  process.exit(1);
}

function getBinaryName(base) {
  return platform === "win32" ? `${base}.exe` : base;
}

// ============================================================================
// Port Takeover Helpers
// ============================================================================

/**
 * Find the PID of a process using a given port
 * @param {number|string} port - Port number to check
 * @returns {number|null} - PID of the process using the port, or null
 */
function findPidUsingPort(port) {
  try {
    if (platform === "linux" || platform === "android") {
      // Try ss first (more modern)
      try {
        const output = execSync(`ss -tulpn 2>/dev/null | grep ':${port} '`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const match = output.match(/pid=(\d+)/);
        if (match) return parseInt(match[1], 10);
      } catch {
        // ss failed or no match, try lsof
      }
      // Fallback to lsof
      try {
        const output = execSync(`lsof -i :${port} -t 2>/dev/null`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const pid = parseInt(output.trim().split("\n")[0], 10);
        if (!isNaN(pid)) return pid;
      } catch {
        // lsof failed
      }
    } else if (platform === "darwin") {
      // macOS uses lsof
      try {
        const output = execSync(`lsof -i :${port} -t 2>/dev/null`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const pid = parseInt(output.trim().split("\n")[0], 10);
        if (!isNaN(pid)) return pid;
      } catch {
        // lsof failed
      }
    } else if (platform === "win32") {
      // Windows uses netstat
      try {
        const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const lines = output.trim().split("\n");
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(pid)) return pid;
        }
      } catch {
        // netstat failed
      }
    }
  } catch {
    // Command execution failed
  }
  return null;
}

/**
 * Check if a process is an automagik-forge instance
 * @param {number} pid - Process ID to check
 * @returns {boolean} - True if the process is automagik-forge
 */
function isForgeProcess(pid) {
  try {
    if (platform === "linux" || platform === "android") {
      // Read /proc/{pid}/cmdline
      const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
      return cmdline.includes("automagik-forge");
    } else if (platform === "darwin") {
      // Use ps on macOS
      const output = execSync(`ps -p ${pid} -o command= 2>/dev/null`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return output.includes("automagik-forge");
    } else if (platform === "win32") {
      // Use wmic or tasklist on Windows
      const output = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH 2>nul`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return output.toLowerCase().includes("automagik-forge");
    }
  } catch {
    // Failed to check - assume it could be Forge
  }
  return false;
}

/**
 * Query existing Forge instance for running tasks
 * @param {string} host - Host address
 * @param {number|string} port - Port number
 * @returns {Promise<boolean>} - True if there are running tasks
 */
async function hasRunningTasks(host, port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    // First get all projects
    const projectsRes = await fetch(`http://${host}:${port}/api/projects`, {
      signal: controller.signal,
    });

    if (!projectsRes.ok) {
      clearTimeout(timeout);
      return false;
    }

    const projectsData = await projectsRes.json();
    const projects = projectsData.data || [];

    // Check tasks for each project
    for (const project of projects) {
      try {
        const tasksRes = await fetch(
          `http://${host}:${port}/api/tasks?project_id=${project.id}`,
          { signal: controller.signal }
        );

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasks = tasksData.data || [];
          if (tasks.some((t) => t.has_in_progress_attempt)) {
            clearTimeout(timeout);
            return true;
          }
        }
      } catch {
        // Skip this project if request fails
      }
    }

    clearTimeout(timeout);
    return false;
  } catch {
    // Can't connect or timeout - treat as no running tasks
    return false;
  }
}

/**
 * Prompt user for takeover confirmation
 * @param {number} pid - PID of the existing process
 * @param {boolean} hasRunning - Whether there are running tasks
 * @returns {Promise<boolean>} - True if user confirmed takeover
 */
async function promptTakeover(pid, hasRunning) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const warning = hasRunning
    ? "\n⚠️  WARNING: Running tasks will be terminated!"
    : "";

  return new Promise((resolve) => {
    rl.question(
      `🔒 Port in use by Forge instance (PID ${pid}).${warning}\nTake over? [y/N] `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "y");
      }
    );
  });
}

/**
 * Kill a process gracefully (SIGTERM first, then SIGKILL)
 * @param {number} pid - Process ID to kill
 * @returns {boolean} - True if process was killed successfully
 */
function killProcess(pid) {
  try {
    // Send SIGTERM for graceful shutdown
    process.kill(pid, "SIGTERM");

    // Wait up to 3 seconds for process to exit
    const startTime = Date.now();
    while (Date.now() - startTime < 3000) {
      try {
        // Check if process is still running (signal 0 doesn't kill, just checks)
        process.kill(pid, 0);
        // Still running, wait a bit
        execSync("sleep 0.1", { stdio: "ignore" });
      } catch {
        // Process no longer exists - success
        return true;
      }
    }

    // Process still running after 3s, force kill
    try {
      if (platform === "win32") {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      } else {
        process.kill(pid, "SIGKILL");
      }
    } catch {
      // Already dead or permission denied
    }
    return true;
  } catch (e) {
    if (e.code === "EPERM") {
      console.error(`❌ Permission denied: Cannot kill process ${pid}`);
      console.error("Try running with sudo or as the process owner.");
    } else if (e.code === "ESRCH") {
      // Process doesn't exist - that's fine
      return true;
    }
    return false;
  }
}

/**
 * Wait for a port to become available
 * @param {number|string} port - Port number
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>} - True if port is available
 */
async function waitForPort(port, timeout = 2000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (!findPidUsingPort(port)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

/**
 * Handle port takeover logic
 * @param {string} host - Host address
 * @param {number|string} port - Port number
 * @param {boolean} isMcp - Whether running in MCP mode (no interactive prompts)
 * @returns {Promise<boolean>} - True if can proceed with startup
 */
async function handlePortConflict(host, port, isMcp) {
  const pid = findPidUsingPort(port);
  if (!pid) {
    return true; // Port is free
  }

  const isForge = isForgeProcess(pid);

  if (!isForge) {
    // Non-Forge process - don't auto-kill, show error
    console.error(`❌ Port ${port} is in use by another process (PID ${pid})`);
    console.error("Please stop the process or use a different port:");
    console.error(`  BACKEND_PORT=8888 npx automagik-forge`);
    return false;
  }

  // It's a Forge process - check for running tasks
  const hasRunning = await hasRunningTasks(host, port);

  if (hasRunning && !isMcp) {
    // Interactive prompt when there are running tasks
    const proceed = await promptTakeover(pid, true);
    if (!proceed) {
      console.log("👋 Aborted. Existing instance kept running.");
      return false;
    }
  } else if (!hasRunning) {
    // No running tasks - automatic takeover
    console.log(`🔄 Taking over from existing Forge instance (PID ${pid})...`);
  } else {
    // MCP mode with running tasks - proceed anyway (no stdin)
    console.log(`🔄 Taking over from existing Forge instance (PID ${pid})...`);
    console.log("⚠️  Note: Running tasks may be interrupted.");
  }

  // Kill the existing process
  if (!killProcess(pid)) {
    console.error("❌ Failed to stop existing instance.");
    return false;
  }

  // Wait for port to be released
  console.log("⏳ Waiting for port to be released...");
  const portFree = await waitForPort(port, 3000);
  if (!portFree) {
    console.error(`❌ Port ${port} still in use after stopping process.`);
    console.error("This may be due to TIME_WAIT state. Try again in a few seconds.");
    return false;
  }

  console.log("✅ Port released, starting new instance...\n");
  return true;
}

const platformDir = getPlatformDir();
const extractDir = path.join(__dirname, "..", "dist", platformDir);
const isMcpMode = process.argv.includes("--mcp");

// ensure output dir
fs.mkdirSync(extractDir, { recursive: true });

function extractAndRun(baseName, args, launch) {
  const binName = getBinaryName(baseName);
  const binPath = path.join(extractDir, binName);
  const zipName = `${baseName}.zip`;
  const zipPath = path.join(extractDir, zipName);

  // clean old binary
  if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
  if (!fs.existsSync(zipPath)) {
    console.error(`❌ ${zipName} not found at: ${zipPath}`);
    console.error(`Current platform: ${platform}-${arch} (${platformDir})`);
    process.exit(1);
  }

  // extract
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);
  } catch (err) {
    console.error("❌ Failed to extract automagik-forge archive:", err.message);
    if (process.env.AUTOMAGIK_FORGE_DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }

  if (!fs.existsSync(binPath)) {
    console.error(`❌ Extracted binary not found at: ${binPath}`);
    console.error("This usually indicates a corrupt download. Please reinstall the package.");
    process.exit(1);
  }

  // perms & launch
  if (platform !== "win32") {
    try {
      fs.chmodSync(binPath, 0o755);
    } catch { }
  }
  return launch(binPath, args);
}

if (isMcpMode) {
  // MCP mode: handle port conflicts silently (no interactive prompts)
  (async () => {
    const backendPort = process.env.BACKEND_PORT || process.env.PORT;
    const displayPort = backendPort || "8887";
    const host = process.env.HOST || "127.0.0.1";

    // Check for port conflicts (MCP mode = true, no interactive prompts)
    const canProceed = await handlePortConflict(host, displayPort, true);
    if (!canProceed) {
      process.exit(1);
    }

    extractAndRun("automagik-forge", ["--mcp"], (bin, args) => {
      const proc = spawn(bin, args, { stdio: "inherit" });
      proc.on("exit", (c) => process.exit(c || 0));
      proc.on("error", (e) => {
        console.error("❌ MCP server error:", e.message);
        process.exit(1);
      });
      process.on("SIGINT", () => {
        console.error("\n🛑 Shutting down MCP server...");
        proc.kill("SIGINT");
      });
      process.on("SIGTERM", () => proc.kill("SIGTERM"));
    });
  })();
} else {
  // Wrap in async IIFE to support port conflict handling
  (async () => {
    // Get port configuration early for conflict detection
    const backendPort = process.env.BACKEND_PORT || process.env.PORT;
    const displayPort = backendPort || "8887";
    const host = process.env.HOST || "127.0.0.1";

    // Check for port conflicts before extraction
    const canProceed = await handlePortConflict(host, displayPort, false);
    if (!canProceed) {
      process.exit(1);
    }

    console.log(`📦 Extracting automagik-forge...`);
    extractAndRun("automagik-forge", [], (bin) => {
      // Log port configuration
      if (backendPort) {
        console.log(`🔌 Using port: ${backendPort}`);
      } else {
        console.log(`🔌 Using default port: 8887`);
      }

      console.log(`🚀 Launching automagik-forge...`);
      console.log();

      // Ensure RUST_LOG is set to show logs (default to info level)
      if (!process.env.RUST_LOG) {
        process.env.RUST_LOG = "info";
      }

      console.log(`http://${host}:${displayPort}/`);
      console.log();

      if (platform === "win32") {
        execSync(`"${bin}"`, { stdio: "inherit" });
      } else {
        execSync(`"${bin}"`, { stdio: "inherit" });
      }
    });
  })();
}
