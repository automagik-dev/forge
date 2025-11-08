#!/bin/bash

set -euo pipefail

echo "🚀 Starting Automagik Forge development environment..."
echo ""

# Check if upstream submodule is initialized
if [ ! -d "upstream/crates" ]; then
    echo "⚠️  Upstream submodule not initialized"
    echo "   Initializing upstream submodule..."
    git submodule update --init --recursive upstream

    # In git worktrees, submodule checkout can fail
    # Verify and fix if needed
    if [ ! -d "upstream/crates" ]; then
        echo "   Fixing submodule checkout for git worktree..."
        cd upstream
        git reset --hard HEAD
        cd ..
    fi

    if [ ! -d "upstream/crates" ]; then
        echo "❌ Failed to initialize upstream submodule"
        echo "   Please run: git submodule update --init --recursive upstream"
        exit 1
    fi

    echo "✅ Upstream submodule initialized"
    echo ""
fi

# Get ports from setup script
export FRONTEND_PORT=$(node scripts/setup-dev-environment.js frontend)
export BACKEND_PORT=$(node scripts/setup-dev-environment.js backend)

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
        echo "🔒 Running in worktree (sandbox mode) - using isolated dev_assets/ database"
    fi
fi

echo "📍 Configuration:"
echo "   Backend:  http://localhost:${BACKEND_PORT}"
echo "   Frontend: http://localhost:${FRONTEND_PORT}"
if [ -n "$DATABASE_URL" ]; then
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

# Ensure database exists for online mode (SQLx compile-time verification)
if [ "${SQLX_OFFLINE:-}" != "true" ]; then
    if [ -n "$DATABASE_URL" ]; then
        # Extract the path from sqlite:// URL
        DB_PATH="${DATABASE_URL#sqlite://}"

        if [ ! -f "$DB_PATH" ]; then
            echo "🔧 Database doesn't exist - creating for SQLx online mode..."

            # Create parent directory if needed
            DB_DIR=$(dirname "$DB_PATH")
            mkdir -p "$DB_DIR"

            # Create empty database
            sqlite3 "$DB_PATH" "SELECT 1;" > /dev/null 2>&1

            # Run migrations
            echo "   Running migrations..."
            (cd upstream/crates/db && DATABASE_URL="$DATABASE_URL" sqlx migrate run)

            echo "✅ Database created and migrated: $DB_PATH"
            echo ""
        fi
    fi
fi

# Check for pnpm
if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ Error: pnpm is required but not installed"
    echo "   Install with: npm install -g pnpm"
    exit 1
fi

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies with pnpm..."
    pnpm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Always rebuild frontend to ensure fresh build
# Delete dist folder to force clean rebuild
echo "🧹 Cleaning frontend build cache..."
rm -rf frontend/dist
echo "✅ Frontend cache cleared"
echo ""

echo "🔨 Building frontend (required for Rust compilation)..."
echo "   This is needed because the backend embeds frontend/dist at compile time."
(
    cd frontend
    pnpm run build
)
echo "✅ Frontend built successfully"
echo ""

# Always clean Rust build cache to ensure fresh compilation
# Incremental compilation was causing too many issues with stale binaries
echo "🧹 Cleaning Rust build cache..."
cargo clean
echo "✅ Build cache cleared - forcing fresh compilation"
echo ""

# Start backend in background
echo "⚙️  Starting backend server (this will take a while on first compile)..."
export DISABLE_BROWSER_OPEN=1
export DISABLE_WORKTREE_ORPHAN_CLEANUP=1
export RUST_LOG=debug

# Start backend with cargo watch
# Only load .env file for build-time variables if NOT in worktree (sandbox) mode
if [ "$IS_WORKTREE" = "false" ] && [ -f ".env" ]; then
    cargo watch --env-file .env -w upstream/crates -w forge-app/src -w forge-extensions -x 'run --bin forge-app' &
else
    cargo watch -w upstream/crates -w forge-app/src -w forge-extensions -x 'run --bin forge-app' &
fi
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
MAX_ATTEMPTS=180  # 3 minutes max wait (compilation can be slow)
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
BACKEND_PORT=${BACKEND_PORT} VITE_OPEN=true pnpm run dev -- --port ${FRONTEND_PORT} --host &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ Development environment is ready!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:${FRONTEND_PORT}"
echo "   Backend:  http://localhost:${BACKEND_PORT}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for frontend process (keeps script running)
wait $FRONTEND_PID
