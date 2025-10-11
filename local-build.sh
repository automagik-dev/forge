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

echo "🔄 Syncing upstream assets..."
node scripts/sync-upstream-assets.js

echo "🔨 Building frontend with pnpm..."
cd frontend && pnpm run build && cd ..

echo "🔨 Building Rust binaries..."
cargo build --release
cargo build --release --bin mcp_task_server

echo "📦 Creating distribution package..."

PLATFORMS=("linux-x64" "linux-arm64" "windows-x64" "windows-arm64" "macos-x64" "macos-arm64")

# Package binaries for current platform
echo "📦 Packaging binaries for $PLATFORM_DIR..."
mkdir -p npx-cli/dist/$PLATFORM_DIR

# Copy and zip the main forge application binary
cp target/release/forge-app automagik-forge
zip -q automagik-forge.zip automagik-forge
rm -f automagik-forge
mv automagik-forge.zip npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip

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
