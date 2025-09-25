#!/bin/bash

# Script to sync upstream vibe-kanban from a specific release tag
# Reads configuration from upstream-config.json

set -e

CONFIG_FILE="upstream-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found"
    exit 1
fi

# Parse configuration
REPO_URL=$(jq -r '.repository' "$CONFIG_FILE")
VERSION=$(jq -r '.version' "$CONFIG_FILE")
SYNC_MODE=$(jq -r '.sync_mode' "$CONFIG_FILE")

echo "=== Upstream Sync Tool ==="
echo "Repository: $REPO_URL"
echo "Version: $VERSION"
echo "Sync Mode: $SYNC_MODE"
echo ""

# Initialize or update the submodule
if [ ! -d "upstream/.git" ]; then
    echo "Initializing upstream submodule..."
    git submodule update --init upstream
fi

cd upstream

# Configure remotes
echo "Configuring remotes..."
# Set origin to your fork
git remote set-url origin "$REPO_URL"

# Add upstream remote (original repo) if it doesn't exist
if ! git remote get-url upstream &>/dev/null; then
    echo "Adding upstream remote for original repo..."
    git remote add upstream https://github.com/BloopAI/vibe-kanban.git
fi

# Fetch all tags from both remotes
echo "Fetching tags from remotes..."
git fetch origin --tags
git fetch upstream --tags

# Checkout the specific version tag
echo "Checking out version $VERSION..."
if git show-ref --tags | grep -q "refs/tags/$VERSION"; then
    git checkout "tags/$VERSION"
    echo "Successfully checked out $VERSION"
else
    echo "Error: Tag $VERSION not found"
    echo "Available release tags:"
    git tag -l | grep -E "^v[0-9]+\.[0-9]+\.[0-9]+$" | tail -20
    exit 1
fi

cd ..

echo ""
echo "✅ Upstream synced to $VERSION"
echo ""
echo "To update the main repository with these changes:"
echo "  git add upstream"
echo "  git commit -m \"Update upstream to $VERSION\""