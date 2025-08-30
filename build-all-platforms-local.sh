#!/bin/bash

set -e

echo "🚀 Building automagik-forge for all platforms locally"
echo "⚠️  This requires 'cross' for cross-compilation"
echo ""

# Check if cross is installed
if ! command -v cross &> /dev/null; then
    echo "❌ 'cross' is not installed. Install it with:"
    echo "   cargo install cross"
    exit 1
fi

# Set environment variables for vendored dependencies
# This ensures cross-compilation works properly
export OPENSSL_STATIC=1
export LIBSQLITE3_SYS_USE_PKG_CONFIG=0
export LIBZ_SYS_STATIC=1


# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist
mkdir -p npx-cli/dist

# Build frontend once
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Define all targets
declare -A TARGETS=(
    ["linux-x64"]="x86_64-unknown-linux-gnu"
    ["linux-arm64"]="aarch64-unknown-linux-gnu"
    ["windows-x64"]="x86_64-pc-windows-gnu"
    ["macos-x64"]="x86_64-apple-darwin"
    ["macos-arm64"]="aarch64-apple-darwin"
)

# Build each target
for PLATFORM in "${!TARGETS[@]}"; do
    TARGET="${TARGETS[$PLATFORM]}"
    echo ""
    echo "🔨 Building for $PLATFORM ($TARGET)..."
    
    # Use appropriate build tool for each target
    if [[ "$OSTYPE" == "linux-gnu"* ]] && [[ "$TARGET" == "x86_64-unknown-linux-gnu" ]]; then
        # Native Linux x64 build
        cargo build --release --target $TARGET
    else
        # All cross-compilation uses cross
        echo "Using cross for $TARGET..."
        cross build --release --target $TARGET
    fi
    
    # Package the binaries
    mkdir -p npx-cli/dist/$PLATFORM
    
    # Determine binary extension
    if [[ "$TARGET" == *"windows"* ]]; then
        EXT=".exe"
    else
        EXT=""
    fi
    
    # Copy and zip main binary
    cp target/$TARGET/release/server$EXT automagik-forge$EXT
    zip -q npx-cli/dist/$PLATFORM/automagik-forge.zip automagik-forge$EXT
    rm automagik-forge$EXT
    
    # Copy and zip MCP binary
    cp target/$TARGET/release/mcp_task_server$EXT automagik-forge-mcp$EXT
    zip -q npx-cli/dist/$PLATFORM/automagik-forge-mcp.zip automagik-forge-mcp$EXT
    rm automagik-forge-mcp$EXT
    
    echo "✅ Built $PLATFORM"
done

echo ""
echo "🎉 All platforms built successfully!"
echo "📦 Distribution files in npx-cli/dist/"
ls -la npx-cli/dist/