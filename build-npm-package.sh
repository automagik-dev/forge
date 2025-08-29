#!/bin/bash

set -e  # Exit on any error

echo "📦 Building NPM package with ALL platform binaries..."
echo ""
echo "⚠️  IMPORTANT: This script assumes you have pre-built binaries for all platforms"
echo "   in the target/release directory or have access to them."
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist
mkdir -p npx-cli/dist

# Define all platforms we support
PLATFORMS=(
    "linux-x64"
    "linux-arm64" 
    "windows-x64"
    "windows-arm64"
    "macos-x64"
    "macos-arm64"
)

# For now, we'll only package the current platform's binaries
# In production, you'd need CI/CD to build on each platform
CURRENT_PLATFORM=""
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$PLATFORM" = "linux" ] && [ "$ARCH" = "x86_64" ]; then
    CURRENT_PLATFORM="linux-x64"
elif [ "$PLATFORM" = "linux" ] && [ "$ARCH" = "aarch64" ]; then
    CURRENT_PLATFORM="linux-arm64"
elif [ "$PLATFORM" = "darwin" ] && [ "$ARCH" = "x86_64" ]; then
    CURRENT_PLATFORM="macos-x64"
elif [ "$PLATFORM" = "darwin" ] && [ "$ARCH" = "arm64" ]; then
    CURRENT_PLATFORM="macos-arm64"
else
    CURRENT_PLATFORM="linux-x64"
fi

echo "📦 Current platform detected: $CURRENT_PLATFORM"
echo ""

# Check if we have the binaries
if [ ! -f "target/release/server" ] || [ ! -f "target/release/mcp_task_server" ]; then
    echo "❌ Binaries not found! Please run 'cargo build --release' first"
    exit 1
fi

# Package binaries for current platform
echo "📦 Packaging binaries for $CURRENT_PLATFORM..."
mkdir -p npx-cli/dist/$CURRENT_PLATFORM

# Copy and zip the main binary
cp target/release/server vibe-kanban
zip -q vibe-kanban.zip vibe-kanban
rm -f vibe-kanban
mv vibe-kanban.zip npx-cli/dist/$CURRENT_PLATFORM/

# Copy and zip the MCP binary
cp target/release/mcp_task_server vibe-kanban-mcp
zip -q vibe-kanban-mcp.zip vibe-kanban-mcp
rm -f vibe-kanban-mcp
mv vibe-kanban-mcp.zip npx-cli/dist/$CURRENT_PLATFORM/

echo "✅ Packaged $CURRENT_PLATFORM"

# Create placeholder files for other platforms with instructions
for platform in "${PLATFORMS[@]}"; do
    if [ "$platform" != "$CURRENT_PLATFORM" ]; then
        echo "⚠️  Creating placeholder for $platform (requires native build)"
        mkdir -p npx-cli/dist/$platform
        echo "Binaries for $platform need to be built on that platform" > npx-cli/dist/$platform/README.txt
    fi
done

echo ""
echo "📋 Package structure:"
tree npx-cli/dist 2>/dev/null || ls -la npx-cli/dist/

echo ""
echo "⚠️  WARNING: Only $CURRENT_PLATFORM binaries are included!"
echo "   For full cross-platform support, you need to:"
echo "   1. Build on each platform (or use GitHub Actions)"
echo "   2. Collect all binaries into npx-cli/dist/"
echo "   3. Then run 'npm publish' from npx-cli/"
echo ""
echo "✅ NPM package structure ready!"