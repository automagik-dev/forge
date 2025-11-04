#!/bin/bash
# run-prod.sh - Build and run the production npm package locally
# This runs the exact same thing you'll publish to npm

set -e

echo "📦 Building production package..."
bash scripts/build/build.sh

cd npx-cli

echo "📋 Creating package tarball..."
TARBALL=$(npm pack 2>&1 | tail -n1)

echo "🚀 Running production package from tarball..."
echo "   This is exactly what users will get from: npx automagik-forge"
echo ""

npx -y --package=$TARBALL automagik-forge

# Note: This will run until you Ctrl+C
# The tarball will be cleaned up automatically
