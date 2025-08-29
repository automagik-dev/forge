#!/bin/bash

# This script shows the complete structure needed for all platforms
# You need to run the build on each platform and collect the binaries

set -e

echo "📦 Full NPM package structure needed:"
echo ""
echo "npx-cli/dist/"
echo "├── linux-x64/"
echo "│   ├── vibe-kanban.zip"
echo "│   └── vibe-kanban-mcp.zip"
echo "├── linux-arm64/"
echo "│   ├── vibe-kanban.zip"
echo "│   └── vibe-kanban-mcp.zip"
echo "├── windows-x64/"
echo "│   ├── vibe-kanban.zip      (contains vibe-kanban.exe)"
echo "│   └── vibe-kanban-mcp.zip  (contains vibe-kanban-mcp.exe)"
echo "├── windows-arm64/"
echo "│   ├── vibe-kanban.zip      (contains vibe-kanban.exe)"
echo "│   └── vibe-kanban-mcp.zip  (contains vibe-kanban-mcp.exe)"
echo "├── macos-x64/"
echo "│   ├── vibe-kanban.zip"
echo "│   └── vibe-kanban-mcp.zip"
echo "└── macos-arm64/"
echo "    ├── vibe-kanban.zip"
echo "    └── vibe-kanban-mcp.zip"
echo ""
echo "Current status:"

# Check what we have
for platform in linux-x64 linux-arm64 windows-x64 windows-arm64 macos-x64 macos-arm64; do
    if [ -d "npx-cli/dist/$platform" ]; then
        echo "✅ $platform - $(ls npx-cli/dist/$platform 2>/dev/null | wc -l) files"
    else
        echo "❌ $platform - missing"
    fi
done

echo ""
echo "To build for all platforms:"
echo "1. Linux: Run 'cargo build --release' on Linux x64 and ARM64"
echo "2. Windows: Run 'cargo build --release' on Windows x64 and ARM64"
echo "3. macOS: Run 'cargo build --release' on macOS Intel and Apple Silicon"
echo "4. After building on each platform, run local-build.sh to package"
echo "5. Collect all dist folders and merge them before publishing"
echo ""
echo "Alternative: Use GitHub Actions to build on all platforms automatically"