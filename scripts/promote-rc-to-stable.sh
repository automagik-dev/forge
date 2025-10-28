#!/bin/bash
set -e

RC_VERSION="$1"

if [ -z "$RC_VERSION" ]; then
  echo "❌ Error: RC version required"
  echo "Usage: ./scripts/promote-rc-to-stable.sh 0.5.1-rc.1"
  exit 1
fi

# Extract stable version (remove -rc.X suffix)
STABLE_VERSION=$(echo "$RC_VERSION" | sed 's/-rc\.[0-9]*$//')

echo "🎯 Promoting $RC_VERSION to stable $STABLE_VERSION"
echo ""

# 1. Change npm dist-tag
echo "📦 Updating npm tags..."
npm dist-tag add automagik-forge@$RC_VERSION latest
npm dist-tag rm automagik-forge@$RC_VERSION next || true

# 2. Update GitHub release
echo "🏷️  Updating GitHub release..."
gh release edit "v$RC_VERSION" --tag "v$STABLE_VERSION" --prerelease=false --latest

echo ""
echo "✅ Successfully promoted $RC_VERSION to stable $STABLE_VERSION"
echo "📦 npm: automagik-forge@$STABLE_VERSION (latest tag)"
echo "🏷️  GitHub: v$STABLE_VERSION (stable release)"
