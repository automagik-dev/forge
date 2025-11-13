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
} else {
  console.log(`📦 Extracting automagik-forge...`);
  extractAndRun("automagik-forge", [], (bin) => {
    // Log port configuration
    const backendPort = process.env.BACKEND_PORT || process.env.PORT;
    const displayPort = backendPort || "8887";
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

    const host = process.env.HOST || "127.0.0.1";
    console.log(`http://${host}:${displayPort}/`);
    console.log();

    if (platform === "win32") {
      execSync(`"${bin}"`, { stdio: "inherit" });
    } else {
      execSync(`"${bin}"`, { stdio: "inherit" });
    }
  });
}
