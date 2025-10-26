#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/.dev-logs"
BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"

# Create log directory
mkdir -p "${LOG_DIR}"

# Functions
print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
  echo -e "${GREEN}✓${NC} $1"
}

print_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo ""
    print_error "Development server setup failed!"
    echo ""
    echo "Recent backend logs:"
    tail -20 "${BACKEND_LOG}" 2>/dev/null || echo "(no backend logs yet)"
    echo ""
    echo "Recent frontend logs:"
    tail -20 "${FRONTEND_LOG}" 2>/dev/null || echo "(no frontend logs yet)"
  fi
  exit $exit_code
}

trap cleanup EXIT

# Main script
print_header "🚀 Automagik Forge Development Server Setup"

# Step 1: Check prerequisites
print_info "Checking prerequisites..."
if ! command -v node &> /dev/null; then
  print_error "Node.js not found. Please install Node.js 18+."
  exit 1
fi
print_step "Node.js found: $(node --version)"

if ! command -v pnpm &> /dev/null; then
  print_error "pnpm not found. Please install pnpm (npm install -g pnpm)."
  exit 1
fi
print_step "pnpm found: $(pnpm --version)"

if ! command -v cargo &> /dev/null; then
  print_error "Rust cargo not found. Please install Rust."
  exit 1
fi
print_step "Rust found: $(cargo --version)"

# Step 2: Initialize upstream submodule
print_header "📦 Initializing Upstream Submodule"
if [ ! -f "upstream/Cargo.toml" ]; then
  print_info "Upstream submodule not initialized. Initializing..."
  git submodule update --init --recursive
  print_step "Upstream submodule initialized"
else
  print_step "Upstream submodule already initialized"
fi

# Step 3: Install dependencies
print_header "📚 Installing Dependencies"
print_info "Installing pnpm workspace dependencies..."
pnpm install 2>&1 | tee -a "${LOG_DIR}/pnpm-install.log" || {
  print_error "Failed to install pnpm dependencies"
  exit 1
}
print_step "pnpm dependencies installed"

# Step 3.5: Create dummy frontend/dist for Rust compilation
print_header "🔨 Preparing Frontend Build"
if [ ! -d "frontend/dist" ]; then
  print_info "Creating frontend/dist directory..."
  mkdir -p frontend/dist
  # Create a minimal index.html for compilation
  cat > frontend/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automagik Forge</title>
</head>
<body>
    <div id="root"></div>
    <p style="text-align: center; margin-top: 50px; color: #666;">
        ⏳ Frontend is starting... Please wait or refresh the page.
    </p>
</body>
</html>
EOF
  print_step "Frontend/dist directory created with placeholder"
else
  print_step "Frontend/dist directory already exists"
fi

# Step 4: Allocate ports and setup dev environment
print_header "🔧 Setting Up Development Environment"
print_info "Allocating ports and copying dev assets..."
DEV_PORTS=$(node scripts/setup-dev-environment.js get 2>&1) || {
  print_error "Failed to setup development environment"
  exit 1
}
print_step "Development environment setup complete"
echo "$DEV_PORTS"

# Extract ports from JSON output
FRONTEND_PORT=$(echo "$DEV_PORTS" | jq -r '.frontend' 2>/dev/null || echo "3000")
BACKEND_PORT=$(echo "$DEV_PORTS" | jq -r '.backend' 2>/dev/null || grep "Backend:" <<< "$DEV_PORTS" | sed 's/.*: //' || echo "3001")

print_info "Frontend will run on: http://localhost:${FRONTEND_PORT}"
print_info "Backend will run on: http://localhost:${BACKEND_PORT}"

# Step 5: Start servers
print_header "🎯 Starting Development Servers"

# Check if cargo watch is installed
if ! command -v cargo-watch &> /dev/null; then
  print_info "Installing cargo-watch..."
  cargo install cargo-watch || {
    print_error "Failed to install cargo-watch"
    exit 1
  }
  print_step "cargo-watch installed"
fi

print_info "Starting backend server (logs: ${BACKEND_LOG})..."
BACKEND_PORT="${BACKEND_PORT}" cargo watch -w forge-app -x 'run -p forge-app --bin forge-app' > "${BACKEND_LOG}" 2>&1 &
BACKEND_PID=$!
print_step "Backend server started (PID: $BACKEND_PID)"

print_info "Waiting for backend to be ready..."
sleep 3

print_info "Starting frontend server (logs: ${FRONTEND_LOG})..."
(cd frontend && VITE_BACKEND_PORT="${BACKEND_PORT}" pnpm run dev -- --port "${FRONTEND_PORT}" --host) > "${FRONTEND_LOG}" 2>&1 &
FRONTEND_PID=$!
print_step "Frontend server started (PID: $FRONTEND_PID)"

# Final summary
print_header "✨ Automagik Forge is Ready!"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "${GREEN}⚙️  Backend:${NC}  http://localhost:${BACKEND_PORT}"
echo ""
echo -e "${BLUE}📝 Development Mode:${NC}"
echo "  • Frontend dev server runs on port ${FRONTEND_PORT} with hot reload"
echo "  • Backend API runs on port ${BACKEND_PORT}"
echo "  • Frontend automatically proxies API requests to backend"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "  Backend:  ${BACKEND_LOG}"
echo "  Frontend: ${FRONTEND_LOG}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Frontend changes auto-reload in browser"
echo "  • Backend changes trigger cargo watch recompile"
echo "  • Check logs if something goes wrong"
echo ""
echo -e "${YELLOW}🛑 To stop the servers, press Ctrl+C${NC}"
echo ""

# Keep both processes running
wait

