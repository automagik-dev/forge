#!/bin/bash

set -euo pipefail

echo "🚀 Starting Automagik Forge development environment..."
echo ""

# Check and install jq if needed
if ! command -v jq >/dev/null 2>&1; then
    echo "📦 jq is not installed. Installing to ~/.local/bin..."

    # Create ~/.local/bin if it doesn't exist
    mkdir -p ~/.local/bin

    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    # Map architecture names to jq naming convention
    case "$ARCH" in
        x86_64|amd64)
            JQ_ARCH="amd64"
            ;;
        aarch64|arm64)
            JQ_ARCH="arm64"
            ;;
        i386|i686)
            JQ_ARCH="i386"
            ;;
        *)
            echo "❌ Unsupported architecture: $ARCH"
            echo "   Please install jq manually: https://jqlang.github.io/jq/download/"
            exit 1
            ;;
    esac

    # Download jq binary
    JQ_URL="https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-${OS}-${JQ_ARCH}"

    if curl -fsSL "$JQ_URL" -o ~/.local/bin/jq; then
        chmod +x ~/.local/bin/jq
        echo "✅ jq installed successfully to ~/.local/bin/jq"
    else
        echo "❌ Failed to download jq from $JQ_URL"
        echo "   Please install manually: https://jqlang.github.io/jq/download/"
        exit 1
    fi
fi

# Ensure ~/.local/bin is in PATH (needed for jq)
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
fi

# Refresh command hash table to find newly installed jq
hash -r 2>/dev/null || true

# Get ports from setup script (single atomic call to prevent race conditions)
SETUP_JSON=$(node scripts/setup-dev-environment.js get 2>/dev/null | tail -1)
export FRONTEND_PORT=$(echo "$SETUP_JSON" | jq -r '.frontend')
export BACKEND_PORT=$(echo "$SETUP_JSON" | jq -r '.backend')

# Detect if we're in a git worktree (sandbox mode)
IS_WORKTREE=false
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    GIT_DIR=$(git rev-parse --git-common-dir 2>/dev/null || echo "")
    GIT_WORK_TREE=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

    # If .git is a file (not a directory), we're in a worktree
    if [ -f "$GIT_WORK_TREE/.git" ]; then
        IS_WORKTREE=true
    fi
fi

# Only load .env if we're NOT in a worktree (sandbox mode)
# Worktrees should use their own isolated database in dev_assets/
if [ "$IS_WORKTREE" = "false" ] && [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo "📝 Loaded configuration from .env (main repository mode)"
else
    if [ "$IS_WORKTREE" = "true" ]; then
        # Set DATABASE_URL to worktree's isolated database (absolute path requires 3 slashes)
        export DATABASE_URL="sqlite:///$(pwd)/dev_assets/db.sqlite"
        # Use SQLx offline mode in worktrees to avoid compile-time database verification issues
        export SQLX_OFFLINE=true
        echo "🔒 Running in worktree (sandbox mode) - using isolated dev_assets/ database"
    else
        # Main repo with no .env file - use default dev_assets location
        export DATABASE_URL="sqlite:///$(pwd)/dev_assets/db.sqlite"
        echo "📝 No .env file found - using default dev_assets/ database"
    fi
fi

echo "📍 Configuration:"
# Show actual HOST binding (not just localhost)
DISPLAY_HOST="${HOST:-127.0.0.1}"
if [ "$DISPLAY_HOST" = "0.0.0.0" ]; then
    echo "   Backend:  http://0.0.0.0:${BACKEND_PORT} (accessible from network)"
    echo "   Frontend: http://0.0.0.0:${FRONTEND_PORT} (accessible from network)"
else
    echo "   Backend:  http://${DISPLAY_HOST}:${BACKEND_PORT}"
    echo "   Frontend: http://${DISPLAY_HOST}:${FRONTEND_PORT}"
fi
if [ -n "${DATABASE_URL:-}" ]; then
    # Extract the path from sqlite:// URL
    DB_PATH="${DATABASE_URL#sqlite://}"
    echo "   Database: ${DB_PATH}"
else
    echo "   Database: dev_assets/db.sqlite (default)"
fi

# Show SQLx mode
if [ "${SQLX_OFFLINE:-}" = "true" ]; then
    echo "   SQLx:     offline (using .sqlx/ cache for compile-time verification)"
else
    echo "   SQLx:     online (will connect to database during compilation)"
fi
echo ""

# Note: Database creation and migrations are handled automatically by the Rust app at runtime
# See: db crate (create_if_missing + sqlx::migrate!)

# Check for pnpm
if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ Error: pnpm is required but not installed"
    echo "   Install with: npm install -g pnpm"
    exit 1
fi

# Always install dependencies (fast if already installed)
echo "📦 Installing dependencies with pnpm..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Always rebuild frontend to ensure fresh build
# Delete dist folder to force clean rebuild
echo "🧹 Cleaning frontend build cache..."
rm -rf frontend/dist
echo "✅ Frontend cache cleared"
echo ""

# Build frontend (required for Rust compilation - backend embeds frontend/dist at compile time)
# SKIP_FRONTEND_BUILD: Set to "true" to skip if frontend/dist already exists (used in CI)
if [ "${SKIP_FRONTEND_BUILD:-}" = "true" ] && [ -d "frontend/dist" ]; then
    echo "✅ Using cached frontend build (SKIP_FRONTEND_BUILD=true)"
else
    echo "🔨 Building frontend (required for Rust compilation)..."
    echo "   This is needed because the backend embeds frontend/dist at compile time."
    (
        cd frontend
        pnpm run build
    )
    echo "✅ Frontend built successfully"
fi
echo ""

# Cargo build cache handling
# FORCE_CLEAN: Set to "true" to force cargo clean (for debugging stale binary issues)
# Default: Preserve incremental compilation for faster subsequent builds
. "$HOME/.cargo/env"
if [ "${FORCE_CLEAN:-}" = "true" ]; then
    echo "🧹 Cleaning Rust build cache (FORCE_CLEAN=true)..."
    cargo clean
    echo "✅ Build cache cleared - forcing fresh compilation"
elif [ ! -d "target/debug" ]; then
    echo "🧹 First build: no existing cache"
else
    echo "♻️  Reusing Rust build cache for incremental compilation"
fi
echo ""

# Start backend in background
echo "⚙️  Starting backend server (this will take a while on first compile)..."

# Use SQLx offline mode for compilation (uses .sqlx/ metadata instead of live database)
# This prevents "unable to open database file" errors during compilation
# See: https://github.com/namastexlabs/automagik-forge/issues/86
export SQLX_OFFLINE=true

export DISABLE_BROWSER_OPEN=1
export DISABLE_WORKTREE_ORPHAN_CLEANUP=1
export RUST_LOG=debug

# Explicitly export HOST if set in .env (cargo watch doesn't always pass --env-file vars to child processes)
if [ -n "${HOST:-}" ]; then
    export HOST
    echo "🌐 HOST binding set to: $HOST"
else
    echo "🌐 HOST not set, will default to 127.0.0.1"
fi

# Start backend with cargo watch
# Note: We don't use --env-file flag because it doesn't reliably pass vars to child processes
# Instead, we rely on the shell environment (already loaded via source .env above)
# FORGE_WATCH_PATHS: Additional paths to watch (used by dev-core mode for forge-core)
watch_args=("-w" "forge-app/src" "-w" "forge-extensions")
if [[ -n "${FORGE_WATCH_PATHS:-}" ]]; then
    watch_args+=("-w" "${FORGE_WATCH_PATHS}")
    echo "📦 Also watching: ${FORGE_WATCH_PATHS}"
fi
cargo watch "${watch_args[@]}" -x 'run --bin forge-app' &
BACKEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."

    # Kill backend
    if [ ! -z "${BACKEND_PID:-}" ]; then
        echo "   Stopping backend (PID: $BACKEND_PID)..."
        kill -TERM $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi

    # Kill frontend (find by port)
    echo "   Stopping frontend..."
    pkill -f "vite.*--port ${FRONTEND_PORT}" 2>/dev/null || true

    echo "✅ Cleanup complete"
}

# Register cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for backend to be ready (HTTP server + database)
echo "⏳ Waiting for backend to be ready..."
echo "   (This may take a while on first run due to Rust compilation)"
MAX_ATTEMPTS=1800  # 30 minutes max wait (compilation can be very slow on limited hardware)
ATTEMPT=0
HTTP_READY=false
DB_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # First check if HTTP server is responding
    if [ "$HTTP_READY" = "false" ]; then
        if curl -sf -o /dev/null http://localhost:${BACKEND_PORT}/ 2>/dev/null; then
            echo "   HTTP server is up"
            HTTP_READY=true
        fi
    fi

    # Once HTTP is ready, check if database is initialized by hitting /api/projects
    if [ "$HTTP_READY" = "true" ] && [ "$DB_READY" = "false" ]; then
        # Try to hit an endpoint that requires database access
        HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT}/api/projects 2>/dev/null || echo "000")

        # Accept 200 (success) or 401/403 (auth required but DB working)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
            echo "   Database is initialized"
            DB_READY=true
            break
        fi
    fi

    ATTEMPT=$((ATTEMPT + 1))

    # Show progress every 5 seconds
    if [ $((ATTEMPT % 5)) -eq 0 ]; then
        echo "   Still waiting... (${ATTEMPT}s)"
    fi

    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Backend failed to start within ${MAX_ATTEMPTS} seconds"
    echo "   HTTP ready: $HTTP_READY"
    echo "   Database ready: $DB_READY"
    exit 1
fi

echo "✅ Backend is ready (HTTP + Database)!"
echo ""

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
# HOST is already exported and will be read by vite.config.ts
BACKEND_PORT=${BACKEND_PORT} VITE_OPEN=true pnpm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ Development environment is ready!"
echo ""
echo "📍 Access points:"
if [ "$DISPLAY_HOST" = "0.0.0.0" ]; then
    echo "   Frontend: http://0.0.0.0:${FRONTEND_PORT} (or http://localhost:${FRONTEND_PORT})"
    echo "   Backend:  http://0.0.0.0:${BACKEND_PORT} (or http://localhost:${BACKEND_PORT})"
else
    echo "   Frontend: http://${DISPLAY_HOST}:${FRONTEND_PORT}"
    echo "   Backend:  http://${DISPLAY_HOST}:${BACKEND_PORT}"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for frontend process (keeps script running)
wait $FRONTEND_PID
