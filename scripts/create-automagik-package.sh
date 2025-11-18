#!/bin/bash
# Create automagik package from automagik-forge for initial npm publish
set -e

cd "$(dirname "$0")/../npx-cli"

echo "📦 Creating automagik package..."

# Create the base package if it doesn't exist
if [ ! -f "automagik-forge-0.7.4.tgz" ]; then
    echo "🔨 Building package first..."
    pnpm pack
fi

# Extract
echo "📂 Extracting..."
rm -rf extracted
mkdir -p extracted
tar -xzf automagik-forge-0.7.4.tgz -C extracted

# Modify package.json
echo "✏️  Modifying package name..."
sed -i 's/"name": "@automagik\/forge"/"name": "automagik"/' extracted/package/package.json
sed -i 's/"automagik-forge":/"automagik":/' extracted/package/package.json

# Verify changes
echo "✅ Package name: $(grep '"name"' extracted/package/package.json)"

# Repack
echo "📦 Repacking..."
tar -czf automagik-0.7.4.tgz -C extracted package

# Cleanup
rm -rf extracted

echo ""
echo "✅ Package created: npx-cli/automagik-0.7.4.tgz"
echo ""
echo "To publish (first time only):"
echo "  cd npx-cli"
echo "  npm publish automagik-0.7.4.tgz --access public"
