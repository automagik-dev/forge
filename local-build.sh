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

echo "🔨 Building frontend..."
(cd frontend && npm run build)

echo "🔨 Building Rust binaries..."
cargo build --release
cargo build --release --bin mcp_task_server

echo "📦 Creating distribution package..."

# Copy the main binary
cp target/release/server automagik-forge
zip -q automagik-forge.zip automagik-forge
rm -f automagik-forge
mv automagik-forge.zip npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip

# Copy the MCP binary
cp target/release/mcp_task_server automagik-forge-mcp
zip -q automagik-forge-mcp.zip automagik-forge-mcp
rm -f automagik-forge-mcp
mv automagik-forge-mcp.zip npx-cli/dist/$PLATFORM_DIR/automagik-forge-mcp.zip

echo "✅ NPM package ready!"
echo "📁 Files created:"
echo "   - npx-cli/dist/$PLATFORM_DIR/automagik-forge.zip"
echo "   - npx-cli/dist/$PLATFORM_DIR/automagik-forge-mcp.zip"