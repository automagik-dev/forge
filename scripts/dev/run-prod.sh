#!/bin/bash
# run-prod.sh - Build and run the production package locally

set -e

echo "📦 Building production package..."
bash scripts/build/build.sh

echo ""
echo "🚀 Running production build (globally linked CLI)..."
echo "   This tests the same binaries that will be published to npm"
echo ""

if command -v automagik-forge >/dev/null 2>&1; then
  automagik-forge
elif command -v forge >/dev/null 2>&1; then
  forge
else
  echo "❌ Neither 'automagik-forge' nor 'forge' command found. Build may have failed."
  exit 1
fi
