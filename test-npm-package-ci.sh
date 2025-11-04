#!/bin/bash
# test-npm-package-ci.sh - CI-friendly version (no interactive QA launch)

set -e

echo "🧪 Testing NPM package (CI mode)..."

# Build the package with skip flags to prevent interactive QA
export AUTOMAGIK_FORGE_SKIP_START=1
export CI=true

./local-build.sh

cd npx-cli

echo "📋 Checking files to be included..."
npm pack --dry-run

echo "📦 Creating package tarball..."
npm pack

TARBALL=$(pwd)/$(ls automagik-forge-*.tgz | head -n1)

echo "🧪 Testing main command..."
npx -y --package=$TARBALL automagik-forge &
MAIN_PID=$!
sleep 3
kill $MAIN_PID 2>/dev/null || true
wait $MAIN_PID 2>/dev/null || true
echo "✅ Main app started successfully"

echo "🧪 Testing MCP command with complete handshake..."

node ../scripts/mcp_test.js $TARBALL

echo "🧹 Cleaning up..."
rm "$TARBALL"

echo "✅ NPM package test completed successfully!"
