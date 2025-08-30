#!/bin/bash

set -e

echo "📥 Downloading build artifacts..."

# Check if run ID is provided
if [ -z "$1" ]; then
    echo "Getting latest successful build..."
    # Get the latest successful run ID
    RUN_ID=$(gh run list --workflow="Build All Platforms" --status=success --limit=1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$RUN_ID" ]; then
        echo "❌ No successful workflow runs found"
        echo "Usage: $0 [run-id]"
        exit 1
    fi
else
    RUN_ID=$1
fi

echo "📋 Downloading from workflow run ID: $RUN_ID"

# Create directory for artifacts
ARTIFACT_DIR="artifacts-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARTIFACT_DIR"

echo "📂 Downloading to: $ARTIFACT_DIR"

# Download all artifacts
gh run download $RUN_ID --dir "$ARTIFACT_DIR"

echo ""
echo "📦 Downloaded artifacts:"
echo ""

# Reorganize and display structure
cd "$ARTIFACT_DIR"

# Show what was downloaded
for platform_dir in */; do
    if [ -d "$platform_dir" ]; then
        platform_name=$(basename "$platform_dir")
        echo "  📁 $platform_name:"
        
        # List files in this platform directory
        for file in "$platform_dir"*.zip; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                size=$(du -h "$file" | cut -f1)
                echo "    📄 $filename ($size)"
            fi
        done
    fi
done

cd ..

echo ""
echo "✅ All artifacts downloaded successfully!"
echo ""
echo "📂 Location: $ARTIFACT_DIR"
echo ""
echo "📤 To upload to release:"
echo "   gh release create v0.3.3 $ARTIFACT_DIR/*/*.zip --title 'Release v0.3.3' --notes 'Release notes here'"