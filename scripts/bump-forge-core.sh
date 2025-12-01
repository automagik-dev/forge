#!/bin/bash
# Helper script to bump forge-core dependency tag in Cargo.toml
# Usage: ./scripts/bump-forge-core.sh v0.8.5
# Used by: Jenkins automation, manual dependency updates

set -e

NEW_TAG=${1:?Usage: bump-forge-core.sh vX.Y.Z (e.g., v0.8.5)}

# Validate tag format
if [[ ! "$NEW_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?$ ]]; then
    echo "ERROR: Invalid tag format. Expected vX.Y.Z or vX.Y.Z-rc.N"
    exit 1
fi

echo "🔄 Updating forge-core dependency to $NEW_TAG..."

# Update all forge-core git tag references in forge-app/Cargo.toml
if [ -f "forge-app/Cargo.toml" ]; then
    sed -i "s|tag = \"v[^\"]*\"|tag = \"$NEW_TAG\"|g" forge-app/Cargo.toml
    echo "✅ Updated forge-app/Cargo.toml"
else
    echo "ERROR: forge-app/Cargo.toml not found"
    exit 1
fi

# Regenerate Cargo.lock
echo "📦 Regenerating Cargo.lock..."
cargo update -p db -p services -p server -p deployment -p local-deployment -p executors -p utils 2>/dev/null || cargo update

echo "✅ Updated to forge-core $NEW_TAG"
echo ""
echo "Next steps:"
echo "  git add forge-app/Cargo.toml Cargo.lock"
echo "  git commit -m \"chore: bump forge-core to $NEW_TAG\""
