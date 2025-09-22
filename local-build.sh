#!/bin/bash

set -e  # Exit on any error

echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist

# Detect current platform
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map to NPM package platform names
if [ "$PLATFORM" = "linux" ] && [ "$ARCH" = "x86_64" ]; then
    PLATFORM_DIR="linux-x64"
elif [ "$PLATFORM" = "linux" ] && [ "$ARCH" = "aarch64" ]; then
    PLATFORM_DIR="linux-arm64"
elif [ "$PLATFORM" = "darwin" ] && [ "$ARCH" = "x86_64" ]; then
    PLATFORM_DIR="macos-x64"
elif [ "$PLATFORM" = "darwin" ] && [ "$ARCH" = "arm64" ]; then
    PLATFORM_DIR="macos-arm64"
else
    echo "⚠️  Unknown platform: $PLATFORM-$ARCH, defaulting to linux-x64"
    PLATFORM_DIR="linux-x64"
fi

echo "📦 Building for platform: $PLATFORM_DIR"
mkdir -p npx-cli/dist/$PLATFORM_DIR

echo "🔨 Building forge frontend..."
(cd frontend-forge && pnpm run build)

LEGACY_FRONTEND_DIR=upstream/frontend
if [ -d "$LEGACY_FRONTEND_DIR" ]; then
  echo "🔨 Building legacy frontend from $LEGACY_FRONTEND_DIR..."
  (cd "$LEGACY_FRONTEND_DIR" && pnpm run build)
else
  echo "⚠️  Legacy frontend directory missing; skipping build"
fi

echo "🔨 Building Rust binaries..."
cargo build --release
cargo build --release --bin mcp_task_server

echo "📦 Creating distribution package..."

PLATFORMS=("linux-x64" "linux-arm64" "windows-x64" "windows-arm64" "macos-x64" "macos-arm64")

# Package binaries for current platform
echo "📦 Packaging binaries for $PLATFORM_DIR..."
mkdir -p npx-cli/dist/$PLATFORM_DIR

# Build bundle containing binary, frontends, and defaults
BUNDLE_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t automagik-forge)
trap 'rm -rf "$BUNDLE_DIR"' EXIT

cp target/release/forge-app "$BUNDLE_DIR/automagik-forge"
cp -R frontend-forge/dist "$BUNDLE_DIR/frontend-forge-dist"

if [ -d "$LEGACY_FRONTEND_DIR/dist" ]; then
  cp -R "$LEGACY_FRONTEND_DIR/dist" "$BUNDLE_DIR/legacy-frontend-dist"
fi

if [ -f dev_assets_seed/forge-snapshot/from_repo/db.sqlite ]; then
  cp dev_assets_seed/forge-snapshot/from_repo/db.sqlite "$BUNDLE_DIR/forge.sqlite"
fi

if [ -f dev_assets/config.json ]; then
  cp dev_assets/config.json "$BUNDLE_DIR/config.json"
fi

mkdir -p "$BUNDLE_DIR/bloop/vibe-kanban"

if [ -f dev_assets_seed/forge-snapshot/from_repo/db.sqlite ]; then
  cp dev_assets_seed/forge-snapshot/from_repo/db.sqlite "$BUNDLE_DIR/bloop/vibe-kanban/db.sqlite"
fi

if [ -f dev_assets/config.json ]; then
  cp dev_assets/config.json "$BUNDLE_DIR/bloop/vibe-kanban/config.json"
fi

(cd "$BUNDLE_DIR" && zip -rq "$OLDPWD/automagik-forge.zip" .)
mv automagik-forge.zip npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip

rm -rf "$BUNDLE_DIR"
trap - EXIT

# Copy and zip the MCP binary
cp target/release/mcp_task_server automagik-forge-mcp
zip -q automagik-forge-mcp.zip automagik-forge-mcp
rm -f automagik-forge-mcp
mv automagik-forge-mcp.zip npx-cli/dist/$PLATFORM_DIR/automagik-forge-mcp.zip

# Create placeholder directories for other platforms
for platform in "${PLATFORMS[@]}"; do
  if [ "$platform" != "$PLATFORM_DIR" ]; then
    mkdir -p npx-cli/dist/$platform
    echo "Binaries for $platform need to be built on that platform" > npx-cli/dist/$platform/README.txt
  fi
done

echo "✅ NPM package ready!"
echo "📁 Files created:"
echo "   - npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip"
echo "   - npx-cli/dist/$PLATFORM_DIR/automagik-forge-mcp.zip"
echo "📋 Other platform placeholders created under npx-cli/dist/"
