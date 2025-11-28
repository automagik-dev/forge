#!/bin/bash

set -euo pipefail  # Exit on error, unset var, or failed pipe

# Load .env file if it exists
if [ -f .env ]; then
  echo "📝 Loading environment from .env..."
  set -a  # automatically export all variables
  source .env
  set +a
fi

# Incremental build detection (Phase 3 optimization)
NEEDS_FRONTEND_BUILD=true
NEEDS_BACKEND_BUILD=true
FORCE_REBUILD="${GENIE_FORCE_REBUILD:-0}"
BUILD_MARKER=".build_commit"

if [ "$FORCE_REBUILD" = "1" ]; then
  echo "🔁 Force rebuild requested (GENIE_FORCE_REBUILD=1)"
else
  # Check if binaries already exist
  if [ -f "npx-cli/dist/linux-x64/automagik-forge.zip" ] && [ -f "npx-cli/dist/linux-x64/automagik-forge-mcp.zip" ]; then
    echo "📊 Checking for code changes since last build..."

    # Check for changes using git diff against last build commit
    if git rev-parse HEAD >/dev/null 2>&1; then
      CURRENT_COMMIT=$(git rev-parse HEAD)
      LAST_BUILD_COMMIT=""

      # Read last build commit if marker exists
      if [ -f "$BUILD_MARKER" ]; then
        LAST_BUILD_COMMIT=$(cat "$BUILD_MARKER" 2>/dev/null || echo "")
      fi

      if [ -n "$LAST_BUILD_COMMIT" ] && [ "$CURRENT_COMMIT" = "$LAST_BUILD_COMMIT" ]; then
        # Same commit - check for uncommitted changes
        FRONTEND_CHANGES=$(git diff --name-only HEAD -- frontend/ 2>/dev/null | wc -l || echo "1")
        BACKEND_CHANGES=$(git diff --name-only HEAD -- upstream forge-app/ Cargo.toml Cargo.lock 2>/dev/null | wc -l || echo "1")
      elif [ -n "$LAST_BUILD_COMMIT" ]; then
        # Different commit - check changes between commits
        echo "   Last build: $LAST_BUILD_COMMIT"
        echo "   Current:    $CURRENT_COMMIT"
        FRONTEND_CHANGES=$(git diff --name-only "$LAST_BUILD_COMMIT" HEAD -- frontend/ 2>/dev/null | wc -l || echo "1")
        BACKEND_CHANGES=$(git diff --name-only "$LAST_BUILD_COMMIT" HEAD -- upstream forge-app/ Cargo.toml Cargo.lock 2>/dev/null | wc -l || echo "1")
      else
        # No marker - binaries exist but we don't know when they were built
        # Force rebuild to be safe
        echo "   No build marker found - forcing rebuild"
        FRONTEND_CHANGES=1
        BACKEND_CHANGES=1
      fi

      if [ "$FRONTEND_CHANGES" -eq 0 ]; then
        echo "✅ No frontend changes detected"
        NEEDS_FRONTEND_BUILD=false
      else
        echo "📝 Frontend changes detected ($FRONTEND_CHANGES files)"
      fi

      if [ "$BACKEND_CHANGES" -eq 0 ]; then
        echo "✅ No backend changes detected"
        NEEDS_BACKEND_BUILD=false
      else
        echo "📝 Backend changes detected ($BACKEND_CHANGES files)"
      fi

      # If nothing changed, skip entire build
      if [ "$NEEDS_FRONTEND_BUILD" = "false" ] && [ "$NEEDS_BACKEND_BUILD" = "false" ]; then
        echo "🎉 No code changes detected - skipping build"
        echo "   Binaries already exist from previous build"
        echo "   Use GENIE_FORCE_REBUILD=1 to force rebuild"
        exit 0
      fi
    fi
  else
    echo "📦 First build or binaries missing - building everything"
  fi
fi

echo "🧹 Cleaning previous builds..."
if [ "$NEEDS_FRONTEND_BUILD" = "true" ] && [ "$NEEDS_BACKEND_BUILD" = "true" ]; then
  rm -rf npx-cli/dist
elif [ "$FORCE_REBUILD" = "1" ]; then
  rm -rf npx-cli/dist
fi

# Detect current platform (normalize msys/mingw/cygwin to windows)
UNAME_S=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$UNAME_S" in
  linux*)   PLATFORM_OS="linux" ;;
  darwin*)  PLATFORM_OS="darwin" ;;
  msys*|mingw*|cygwin*) PLATFORM_OS="windows" ;;
  *)        PLATFORM_OS="$UNAME_S" ;;
esac
ARCH=$(uname -m)

# Map to NPM package platform names
case "$PLATFORM_OS-$ARCH" in
  linux-x86_64)   PLATFORM_DIR="linux-x64" ;;
  linux-aarch64)  PLATFORM_DIR="linux-arm64" ;;
  darwin-x86_64)  PLATFORM_DIR="macos-x64" ;;
  darwin-arm64)   PLATFORM_DIR="macos-arm64" ;;
  windows-x86_64) PLATFORM_DIR="windows-x64" ;;
  windows-arm64)  PLATFORM_DIR="windows-arm64" ;;
  *)
    echo "⚠️  Unknown platform: ${PLATFORM_OS}-${ARCH}, defaulting to linux-x64"
    PLATFORM_DIR="linux-x64"
    ;;
esac

# Check if running on Android/Termux
IS_ANDROID=false
if [ -n "${TERMUX_VERSION:-}" ] || [ -n "${ANDROID_ROOT:-}" ] || [ -f "/system/bin/getprop" ]; then
  IS_ANDROID=true
  echo "📱 Android/Termux detected"
fi

# Binary extension per OS
BIN_EXT=""
if [ "$PLATFORM_OS" = "windows" ]; then
  BIN_EXT=".exe"
fi

echo "📦 Building for platform: $PLATFORM_DIR"
mkdir -p "npx-cli/dist/$PLATFORM_DIR"

echo "🔄 Syncing upstream assets..."
node scripts/sync-upstream-assets.js

# Ensure all dependencies are installed
echo "📦 Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  echo "⚠️  pnpm not found, using npm"
  npm install
fi

# Ensure build dependencies are installed (npx-cli)
echo "📦 Installing build dependencies (npx-cli)..."
(cd npx-cli && npm install --silent)

if [ "$NEEDS_FRONTEND_BUILD" = "true" ]; then
  echo "🔨 Building frontend with pnpm..."
  (
    cd frontend
    pnpm run build
  )

  if [ "$NEEDS_BACKEND_BUILD" = "true" ]; then
    echo "🔨 Cleaning Rust build cache to pick up fresh frontend..."
    # Remove the embedded frontend from the build cache
    rm -rf target/release/build/forge-app-*/
    rm -rf target/release/.fingerprint/forge-app-*/
  fi
else
  echo "⏭️  Skipping frontend build (no changes)"
fi

if [ "$NEEDS_BACKEND_BUILD" = "true" ]; then
  echo "🔨 Building Rust binaries..."

  # Use SQLx offline mode for compilation (uses .sqlx/ metadata instead of live database)
  # This prevents "unable to open database file" errors during compilation
  # See: https://github.com/namastexlabs/automagik-forge/issues/86
  export SQLX_OFFLINE=true

  cargo build --release --bin forge-app
  cargo build --release --bin mcp_task_server
  cargo build --release --bin forge-cleanup
else
  # Verify binaries actually exist before skipping
  if [ ! -f "target/release/forge-app${BIN_EXT}" ] || [ ! -f "target/release/mcp_task_server${BIN_EXT}" ] || [ ! -f "target/release/forge-cleanup${BIN_EXT}" ]; then
    echo "⚠️  Backend binaries missing despite no detected changes - rebuilding"

    # Use SQLx offline mode for compilation
    # See: https://github.com/namastexlabs/automagik-forge/issues/86
    export SQLX_OFFLINE=true

    cargo build --release --bin forge-app
    cargo build --release --bin mcp_task_server
    cargo build --release --bin forge-cleanup
  else
    echo "⏭️  Skipping backend build (no changes)"
    echo "   Using existing binaries from target/release/"
  fi
fi

echo "📦 Creating distribution package..."

PLATFORMS=("linux-x64" "linux-arm64" "windows-x64" "windows-arm64" "macos-x64" "macos-arm64")

# Helper: zip a single file using Node.js (cross-platform, no OS dependencies)
zip_one() {
  local src="$1"
  local out_zip="$2"
  node scripts/build/create-zip.js "$src" "$out_zip"
  if [ $? -ne 0 ]; then
    echo "❌ Failed to create ZIP file: $out_zip" >&2
    exit 1
  fi
}

# Package binaries for current platform
echo "📦 Packaging binaries for $PLATFORM_DIR..."
mkdir -p "npx-cli/dist/$PLATFORM_DIR"

# Copy and zip the main forge-app binary
cp "target/release/forge-app${BIN_EXT}" "automagik-forge${BIN_EXT}"
zip_one "automagik-forge${BIN_EXT}" "automagik-forge.zip"
rm -f "automagik-forge${BIN_EXT}"
mv "automagik-forge.zip" "npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip"

# Copy and zip the MCP binary (currently a copy of forge-app)
cp "target/release/forge-app${BIN_EXT}" "automagik-forge-mcp${BIN_EXT}"
zip_one "automagik-forge-mcp${BIN_EXT}" "automagik-forge-mcp.zip"
rm -f "automagik-forge-mcp${BIN_EXT}"
mv "automagik-forge-mcp.zip" "npx-cli/dist/$PLATFORM_DIR/automagik-forge-mcp.zip"

# Copy and zip the cleanup binary
cp "target/release/forge-cleanup${BIN_EXT}" "forge-cleanup${BIN_EXT}"
zip_one "forge-cleanup${BIN_EXT}" "forge-cleanup.zip"
rm -f "forge-cleanup${BIN_EXT}"
mv "forge-cleanup.zip" "npx-cli/dist/$PLATFORM_DIR/forge-cleanup.zip"

# On Android/Termux, also copy to android-arm64 directory (for npm package)
if [ "$IS_ANDROID" = true ] && [ "$PLATFORM_DIR" = "linux-arm64" ]; then
  echo "📱 Creating android-arm64 package for Termux..."
  mkdir -p "npx-cli/dist/android-arm64"
  cp "npx-cli/dist/linux-arm64/automagik-forge.zip" "npx-cli/dist/android-arm64/automagik-forge.zip"
  cp "npx-cli/dist/linux-arm64/automagik-forge-mcp.zip" "npx-cli/dist/android-arm64/automagik-forge-mcp.zip"
  cp "npx-cli/dist/linux-arm64/forge-cleanup.zip" "npx-cli/dist/android-arm64/forge-cleanup.zip"
  echo "✅ Created android-arm64 package"
fi

# Create placeholder directories for other platforms
for platform in "${PLATFORMS[@]}"; do
  if [ "$platform" != "$PLATFORM_DIR" ]; then
    mkdir -p "npx-cli/dist/$platform"
    echo "Binaries for $platform need to be built on that platform" > "npx-cli/dist/$platform/README.txt"
  fi
done

echo "✅ Binary zips staged for NPX CLI"
echo "📁 Files created:"
echo "   - npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip"
echo "   - npx-cli/dist/$PLATFORM_DIR/automagik-forge-mcp.zip"
echo "   - npx-cli/dist/$PLATFORM_DIR/forge-cleanup.zip"
echo "📋 Other platform placeholders created under npx-cli/dist/"

echo "ℹ️ To create the npm package tarball, run:"
echo "   pnpm pack --filter npx-cli"

# Save current commit hash as build marker for incremental builds
if git rev-parse HEAD >/dev/null 2>&1; then
  CURRENT_COMMIT=$(git rev-parse HEAD)
  echo "$CURRENT_COMMIT" > "$BUILD_MARKER"
  echo "📝 Build marker updated: $CURRENT_COMMIT"
fi

# --- Optional convenience: global npm link for the CLI ---
echo ""
echo "🔗 Attempting to globally link the CLI via npm (optional)..."
if command -v npm >/dev/null 2>&1; then
  (
    set +e
    cd npx-cli
    # Install dependencies first
    npm install
    # Use flags to avoid slow, unnecessary network calls
    npm link --no-audit --no-fund --no-update-notifier --foreground-scripts
    LINK_STATUS=$?
    set -e
    if [ "$LINK_STATUS" -eq 0 ]; then
      echo "✅ npm link complete."
      echo ""
      echo "Next steps:"
      echo "  - Test in dev mode:     make dev"
      echo "  - Test production:      make prod"
      echo "  - Run CLI directly:     automagik-forge --help"
      echo "  - Or use short alias:   forge --help"
      echo ""
      echo "To unlink the globally linked CLI:"
      echo "  - npm unlink -g automagik-forge"
      echo "  - Or remove altogether: npm rm -g automagik-forge"
    else
      echo "⚠️  npm link failed (status $LINK_STATUS). Package was still built."
      echo "    You can link manually with verbose logs:"
      echo "      cd npx-cli && npm link --no-audit --no-fund --no-update-notifier --foreground-scripts --loglevel silly"
      echo "    Or use pnpm as an alternative:"
      echo "      cd npx-cli && pnpm link --global"
    fi
  )
else
  echo "ℹ️ Skipped npm link: 'npm' not found on PATH."
  echo "   You can still install locally via pnpm:"
  echo "     cd npx-cli && pnpm link --global"
fi
