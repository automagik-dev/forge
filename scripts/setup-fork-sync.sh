#!/bin/bash

# Script to set up the namastexlabs/vibe-kanban fork to track upstream releases
# This should be run in the vibe-kanban fork repository

set -e

echo "=== Fork Sync Setup Tool ==="
echo ""
echo "This script configures your vibe-kanban fork to track upstream releases."
echo "Run this in your local clone of https://github.com/namastexlabs/vibe-kanban"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository. Please run this from your vibe-kanban fork clone."
    exit 1
fi

# Check current remotes
echo "Current remotes:"
git remote -v
echo ""

# Add upstream remote if it doesn't exist
if ! git remote get-url upstream &>/dev/null; then
    echo "Adding upstream remote for BloopAI/vibe-kanban..."
    git remote add upstream https://github.com/BloopAI/vibe-kanban.git
    echo "✅ Upstream remote added"
else
    echo "Upstream remote already exists, updating URL..."
    git remote set-url upstream https://github.com/BloopAI/vibe-kanban.git
    echo "✅ Upstream remote updated"
fi

# Fetch all tags from upstream
echo ""
echo "Fetching tags from upstream..."
git fetch upstream --tags

# Show latest tags
echo ""
echo "Latest release tags from upstream:"
git tag -l --sort=-v:refname | head -10

echo ""
echo "✅ Fork sync setup complete!"
echo ""
echo "To sync with a specific release:"
echo "  1. git fetch upstream --tags"
echo "  2. git checkout tags/v0.0.95 -b release-v0.0.95"
echo "  3. git push origin release-v0.0.95"
echo "  4. git push origin --tags"
echo ""
echo "To update main branch with latest release:"
echo "  1. git checkout main"
echo "  2. git merge tags/v0.0.95"
echo "  3. git push origin main"