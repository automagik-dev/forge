#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const net = require("net");

const PORTS_FILE = path.join(__dirname, "..", ".dev-ports.json");
const DEV_ASSETS_SEED = path.join(__dirname, "..", "dev_assets_seed");
const DEV_ASSETS = path.join(__dirname, "..", "dev_assets");
const ENV_FILE = path.join(__dirname, "..", ".env");

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ port, host: "localhost" });
    sock.on("connect", () => {
      sock.destroy();
      resolve(false);
    });
    sock.on("error", () => resolve(true));
  });
}

/**
 * Find a free port starting from a given port
 */
async function findFreePort(startPort = 3000) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
    if (port > 65535) {
      throw new Error("No available ports found");
    }
  }
  return port;
}

/**
 * Load ports from .env file
 */
function loadEnvPorts() {
  try {
    if (fs.existsSync(ENV_FILE)) {
      const envContent = fs.readFileSync(ENV_FILE, "utf8");
      const frontendMatch = envContent.match(/^FRONTEND_PORT=(\d+)/m);
      const backendMatch = envContent.match(/^BACKEND_PORT=(\d+)/m);

      if (frontendMatch && backendMatch) {
        const ports = {
          frontend: parseInt(frontendMatch[1], 10),
          backend: parseInt(backendMatch[1], 10),
          source: "env",
        };

        if (process.argv[2] === "get") {
          console.log(`Found ports in .env: frontend=${ports.frontend}, backend=${ports.backend}`);
        }

        return ports;
      }
    }
  } catch (error) {
    console.warn("Failed to load ports from .env:", error.message);
  }
  return null;
}

/**
 * Load existing ports from file
 */
function loadPorts() {
  try {
    if (fs.existsSync(PORTS_FILE)) {
      const data = fs.readFileSync(PORTS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("Failed to load existing ports:", error.message);
  }
  return null;
}

/**
 * Save ports to file
 */
function savePorts(ports) {
  try {
    fs.writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2));
  } catch (error) {
    console.error("Failed to save ports:", error.message);
    throw error;
  }
}

/**
 * Verify that saved ports are still available
 */
async function verifyPorts(ports) {
  const frontendAvailable = await isPortAvailable(ports.frontend);
  const backendAvailable = await isPortAvailable(ports.backend);

  if (process.argv[2] === "get" && (!frontendAvailable || !backendAvailable)) {
    console.log(
      `Port availability check failed: frontend:${ports.frontend}=${frontendAvailable}, backend:${ports.backend}=${backendAvailable}`
    );
  }

  return frontendAvailable && backendAvailable;
}

/**
 * Allocate ports for development
 */
async function allocatePorts() {
  // Priority 1: Check .env file for configured ports
  const envPorts = loadEnvPorts();
  if (envPorts) {
    // Verify .env ports are available
    if (await verifyPorts(envPorts)) {
      if (process.argv[2] === "get") {
        console.log("Using ports from .env:");
        console.log(`Frontend: ${envPorts.frontend}`);
        console.log(`Backend: ${envPorts.backend}`);
      }
      return envPorts;
    } else {
      if (process.argv[2] === "get") {
        console.log(
          "Ports from .env are not available, falling back to automatic allocation..."
        );
      }
    }
  }

  // Priority 2: Try to load existing allocated ports
  const existingPorts = loadPorts();

  if (existingPorts) {
    // Verify existing ports are still available
    if (await verifyPorts(existingPorts)) {
      if (process.argv[2] === "get") {
        console.log("Reusing existing dev ports:");
        console.log(`Frontend: ${existingPorts.frontend}`);
        console.log(`Backend: ${existingPorts.backend}`);
      }
      return existingPorts;
    } else {
      if (process.argv[2] === "get") {
        console.log(
          "Existing ports are no longer available, finding new ones..."
        );
      }
    }
  }

  // Priority 3: Find new free ports automatically
  const frontendPort = await findFreePort(3000);
  const backendPort = await findFreePort(frontendPort + 1);

  const ports = {
    frontend: frontendPort,
    backend: backendPort,
    timestamp: new Date().toISOString(),
    source: "auto",
  };

  savePorts(ports);

  if (process.argv[2] === "get") {
    console.log("Allocated new dev ports:");
    console.log(`Frontend: ${ports.frontend}`);
    console.log(`Backend: ${ports.backend}`);
  }

  return ports;
}

/**
 * Get ports (allocate if needed)
 */
async function getPorts() {
  const ports = await allocatePorts();
  copyDevAssets();
  return ports;
}

/**
 * Copy dev_assets_seed to dev_assets
 */
function copyDevAssets() {
  try {
    if (!fs.existsSync(DEV_ASSETS)) {
      // Copy dev_assets_seed to dev_assets
      fs.cpSync(DEV_ASSETS_SEED, DEV_ASSETS, { recursive: true });

      if (process.argv[2] === "get") {
        console.log("Copied dev_assets_seed to dev_assets");
      }
    }
  } catch (error) {
    console.error("Failed to copy dev assets:", error.message);
  }
}

/**
 * Read saved ports without verifying availability
 * This is used when you want to know what ports are configured,
 * even if they're currently in use (e.g., backend is already running)
 */
function readPorts() {
  // Priority 1: Check .env file for configured ports
  const envPorts = loadEnvPorts();
  if (envPorts) {
    return envPorts;
  }

  // Priority 2: Load from .dev-ports.json
  const savedPorts = loadPorts();
  if (savedPorts) {
    return savedPorts;
  }

  // Priority 3: Return defaults
  return {
    frontend: 3000,
    backend: 3001,
    source: "default",
  };
}

/**
 * Clear saved ports
 */
function clearPorts() {
  try {
    if (fs.existsSync(PORTS_FILE)) {
      fs.unlinkSync(PORTS_FILE);
      console.log("Cleared saved dev ports");
    } else {
      console.log("No saved ports to clear");
    }
  } catch (error) {
    console.error("Failed to clear ports:", error.message);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "get":
      getPorts()
        .then((ports) => {
          console.log(JSON.stringify(ports));
        })
        .catch(console.error);
      break;

    case "clear":
      clearPorts();
      break;

    case "frontend":
      getPorts()
        .then((ports) => {
          console.log(ports.frontend);
        })
        .catch(console.error);
      break;

    case "backend":
      getPorts()
        .then((ports) => {
          console.log(ports.backend);
        })
        .catch(console.error);
      break;

    case "read-frontend":
      // Read saved frontend port without verifying availability
      copyDevAssets();
      const frontendPorts = readPorts();
      console.log(frontendPorts.frontend);
      break;

    case "read-backend":
      // Read saved backend port without verifying availability
      copyDevAssets();
      const backendPorts = readPorts();
      console.log(backendPorts.backend);
      break;

    default:
      console.log("Usage:");
      console.log(
        "  node setup-dev-environment.js get            - Setup dev environment (ports + assets)"
      );
      console.log(
        "  node setup-dev-environment.js frontend       - Get frontend port (allocate if needed)"
      );
      console.log(
        "  node setup-dev-environment.js backend        - Get backend port (allocate if needed)"
      );
      console.log(
        "  node setup-dev-environment.js read-frontend  - Read saved frontend port (no allocation)"
      );
      console.log(
        "  node setup-dev-environment.js read-backend   - Read saved backend port (no allocation)"
      );
      console.log(
        "  node setup-dev-environment.js clear          - Clear saved ports"
      );
      break;
  }
}

module.exports = { getPorts, clearPorts, findFreePort };
