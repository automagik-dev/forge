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

FORGE_CORE_REPO="https://github.com/namastexlabs/forge-core.git"

# Verify tag exists on remote BEFORE making any changes
echo "🔍 Verifying tag $NEW_TAG exists on remote..."
MAX_RETRIES=3
TAG_VERIFIED=false

for i in $(seq 1 $MAX_RETRIES); do
    if git ls-remote --tags "$FORGE_CORE_REPO" 2>/dev/null | grep -q "refs/tags/$NEW_TAG"; then
        echo "✅ Tag $NEW_TAG verified on remote"
        TAG_VERIFIED=true
        break
    fi
    if [ $i -lt $MAX_RETRIES ]; then
        echo "⏳ Tag not found (attempt $i/$MAX_RETRIES), waiting for replication..."
        sleep 5
    fi
done

if [ "$TAG_VERIFIED" = false ]; then
    echo ""
    echo "❌ ERROR: Tag $NEW_TAG NOT found on forge-core remote after $MAX_RETRIES attempts"
    echo ""
    echo "Available recent tags:"
    git ls-remote --tags "$FORGE_CORE_REPO" 2>/dev/null | grep -oP 'refs/tags/\Kv[0-9]+\.[0-9]+\.[0-9]+[^\^]*' | sort -V | tail -5 | sed 's/^/  /'
    echo ""
    echo "Please verify the tag exists before running this script."
    exit 1
fi

echo "🔄 Updating forge-core dependency to $NEW_TAG..."

# Update forge-app/Cargo.toml (7 git dependencies)
if [ -f "forge-app/Cargo.toml" ]; then
    sed -i "s|tag = \"v[^\"]*\"|tag = \"$NEW_TAG\"|g" forge-app/Cargo.toml
    echo "✅ Updated forge-app/Cargo.toml"
else
    echo "ERROR: forge-app/Cargo.toml not found"
    exit 1
fi

# Update forge-extensions/config/Cargo.toml (1 git dependency)
if [ -f "forge-extensions/config/Cargo.toml" ]; then
    sed -i "s|tag = \"v[^\"]*\"|tag = \"$NEW_TAG\"|g" forge-extensions/config/Cargo.toml
    echo "✅ Updated forge-extensions/config/Cargo.toml"
else
    echo "⚠️  Warning: forge-extensions/config/Cargo.toml not found (skipping)"
fi

# Regenerate Cargo.lock
echo "📦 Regenerating Cargo.lock..."
cargo update -p db -p services -p server -p deployment -p local-deployment -p executors -p utils 2>/dev/null || cargo update

echo "✅ Updated to forge-core $NEW_TAG"
echo ""
echo "Next steps:"
echo "  git add forge-app/Cargo.toml Cargo.lock"
echo "  git commit -m \"chore: bump forge-core to $NEW_TAG\""
