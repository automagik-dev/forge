#!/bin/bash

set -euo pipefail  # Exit on error, unset var, or failed pipe

# Load .env file if it exists
if [ -f .env ]; then
  echo "📝 Loading environment from .env..."
  set -a  # automatically export all variables
  source .env
  set +a
fi

echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist

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

# Binary extension per OS
BIN_EXT=""
if [ "$PLATFORM_OS" = "windows" ]; then
  BIN_EXT=".exe"
fi

echo "📦 Building for platform: $PLATFORM_DIR"
mkdir -p "npx-cli/dist/$PLATFORM_DIR"

echo "🔄 Syncing upstream assets..."
node scripts/sync-upstream-assets.js

echo "🔨 Building frontend with pnpm..."
(
  cd frontend
  pnpm run build
)

echo "🔨 Cleaning Rust build cache to pick up fresh frontend..."
# Remove the embedded frontend from the build cache
rm -rf target/release/build/forge-app-*/
rm -rf target/release/.fingerprint/forge-app-*/

echo "🔨 Building Rust binaries with fresh frontend embed..."
cargo build --release --bin forge-app

echo "📦 Creating distribution package..."

PLATFORMS=("linux-x64" "linux-arm64" "windows-x64" "windows-arm64" "macos-x64" "macos-arm64")

# Helper: zip a single file using available tool
zip_one() {
  local src="$1"
  local out_zip="$2"
  if command -v zip >/dev/null 2>&1; then
    zip -q "$out_zip" "$src"
  elif [ "$PLATFORM_OS" = "windows" ] && command -v powershell >/dev/null 2>&1; then
    # Use PowerShell Compress-Archive on Windows when zip is missing
    powershell -NoProfile -Command "Compress-Archive -Path \"$src\" -DestinationPath \"$out_zip\" -Force" >/dev/null
  else
    echo "❌ Neither 'zip' nor PowerShell Compress-Archive is available to create $out_zip" >&2
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
echo "📋 Other platform placeholders created under npx-cli/dist/"

echo "ℹ️ To create the npm package tarball, run:"
echo "   pnpm pack --filter npx-cli"

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
      echo "  - Run CLI directly (recommended):    automagik-forge --help"
      echo "  - Avoid using npx here:              npx automagik-forge"
      echo "      npx may fetch from the registry and ignore the global link,"
      echo "      causing slow or 'eternal' waits."
      echo ""
      echo "To unlink the globally linked CLI:"
      echo "  - npm unlink -g automagik-forge"
      echo "  - Or remove altogether: npm rm -g automagik-forge"
      echo ""
      echo "Troubleshooting tips:"
      echo "  - Verify zips exist:   ls -1 npx-cli/dist/*/*.zip"
      echo "  - Check unzip is present (Linux/macOS): which unzip"
      echo "  - Show where the binary resolves: which automagik-forge"
      echo "  - If 'npx automagik-forge' hangs, run: automagik-forge --help"
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

# --- Launch the freshly linked CLI for QA ---
echo ""
echo "🚀 Preparing to launch automagik-forge for QA..."

if [ "${CI:-}" = "true" ]; then
  echo "ℹ️ Detected CI environment; skipping app launch."
elif [ "${AUTOMAGIK_FORGE_SKIP_START:-0}" = "1" ]; then
  echo "ℹ️ Skipping launch because AUTOMAGIK_FORGE_SKIP_START=1."
elif ! command -v automagik-forge >/dev/null 2>&1; then
  echo "⚠️  automagik-forge CLI not found on PATH after linking; skipping launch."
  echo "    Ensure npm link succeeded, then rerun this script or launch manually."
else
  echo "▶️ Launching automagik-forge (Ctrl+C when you're finished QAing)."
  if [ -n "${AUTOMAGIK_FORGE_START_ARGS:-}" ]; then
    # Allow whitespace-delimited extra arguments via env var
    # shellcheck disable=SC2206
    EXTRA_ARGS=(${AUTOMAGIK_FORGE_START_ARGS})
    echo "   Additional args: ${EXTRA_ARGS[*]}"
    automagik-forge "${EXTRA_ARGS[@]}"
  else
    automagik-forge
  fi
  echo ""
  echo "✅ automagik-forge exited. If you stopped it intentionally, you're all set."
  echo "   To skip auto-launch next time, run: AUTOMAGIK_FORGE_SKIP_START=1 ./local-build.sh"
fi
