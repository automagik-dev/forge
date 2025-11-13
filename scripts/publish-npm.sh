#!/bin/bash

# Manual NPM Publish Script
# Usage: ./scripts/publish-npm.sh [run_id]
# Or via Makefile: make npm [RUN_ID=xxxxx]

set -e

REPO="namastexlabs/automagik-forge"
RUN_ID="${1:-}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              📦 Manual NPM Publish from Artifacts             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check if publish-temp exists or download artifacts
if [ ! -d "publish-temp" ] || [ -z "$(ls -A publish-temp 2>/dev/null)" ]; then
    if [ -z "$RUN_ID" ]; then
        echo "🔍 Finding latest successful build..."
        RUN_ID=$(gh run list --repo "$REPO" --workflow "Build All Platforms" --limit 10 --json databaseId,conclusion --jq '.[] | select(.conclusion == "success" or .conclusion == "failure") | .databaseId' | head -1)

        if [ -z "$RUN_ID" ]; then
            echo "❌ Could not find recent build run"
            echo "Usage: $0 [run_id]"
            echo "Or specify: make npm RUN_ID=xxxxx"
            exit 1
        fi

        echo "✅ Found run: $RUN_ID"
    fi

    echo "📥 Downloading artifacts from run $RUN_ID..."
    echo "🔗 Run URL: https://github.com/$REPO/actions/runs/$RUN_ID"
    echo ""

    rm -rf publish-temp
    gh run download "$RUN_ID" --repo "$REPO" --dir ./publish-temp || {
        echo "❌ Failed to download artifacts"
        echo "Make sure the run has completed and artifacts are available"
        exit 1
    }

    echo "✅ Artifacts downloaded"
    echo ""
else
    echo "✅ Using existing artifacts in publish-temp/"
    echo ""
fi

# Step 2: Reorganize artifacts to npx-cli/dist/
echo "🔄 Reorganizing artifacts..."
cd publish-temp

for dir in binaries-*; do
    if [ -d "$dir" ]; then
        # Strip "binaries-" prefix to get platform name
        platform=${dir#binaries-}

        # Handle special case: android-termux → android-arm64
        if [ "$platform" = "android-termux" ]; then
            platform="android-arm64"
        fi

        # Create target directory
        mkdir -p ../npx-cli/dist/$platform

        # Move all files
        if [ "$(ls -A $dir 2>/dev/null)" ]; then
            mv $dir/* ../npx-cli/dist/$platform/ 2>/dev/null || true
            echo "  ✓ Moved $dir → npx-cli/dist/$platform"
        fi
    fi
done

cd ..
echo ""

# Step 3: Verify all required binaries are present
echo "🔍 Verifying required binaries..."
MISSING_BINARIES=()
REQUIRED_PLATFORMS=("linux-x64" "linux-arm64" "android-arm64" "windows-x64" "macos-arm64")

for platform in "${REQUIRED_PLATFORMS[@]}"; do
    if [ -f "npx-cli/dist/$platform/automagik-forge.zip" ]; then
        SIZE=$(du -h "npx-cli/dist/$platform/automagik-forge.zip" | cut -f1)
        echo "  ✅ $platform/automagik-forge.zip ($SIZE)"
    else
        echo "  ❌ MISSING: $platform/automagik-forge.zip"
        MISSING_BINARIES+=("$platform")
    fi
done

echo ""

if [ ${#MISSING_BINARIES[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing required binaries:"
    for platform in "${MISSING_BINARIES[@]}"; do
        echo "  - $platform"
    done
    echo ""
    echo "Available files:"
    find npx-cli/dist -type f -name "*.zip" | sort
    exit 1
fi

echo "✅ All required platform binaries are present!"
echo ""

# Step 4: Check npm login status
echo "🔐 Checking npm authentication..."
if ! npm whoami >/dev/null 2>&1; then
    echo "❌ Not logged into npm"
    echo ""
    echo "Please login first:"
    echo "  npm login"
    echo ""
    echo "Then run this script again"
    exit 1
fi

NPM_USER=$(npm whoami)
echo "✅ Logged in as: $NPM_USER"
echo ""

# Step 5: Read package info
echo "📋 Package information:"
PKG_NAME=$(node -e "console.log(require('./npx-cli/package.json').name)")
PKG_VERSION=$(node -e "console.log(require('./npx-cli/package.json').version)")
echo "  Name:    $PKG_NAME"
echo "  Version: $PKG_VERSION"
echo ""

# Step 6: Check if version already published
echo "🔍 Checking if version already published..."
if npm view "$PKG_NAME@$PKG_VERSION" version >/dev/null 2>&1; then
    echo "⚠️  Version $PKG_VERSION already published on npm!"
    echo ""
    read -p "Skip publish and exit? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Skipped (version already on npm)"
        exit 0
    fi
fi

# Step 7: Determine npm tag
NPM_TAG="latest"
if [[ "$PKG_VERSION" =~ -beta\. ]]; then
    NPM_TAG="beta"
    echo "📦 Publishing as beta version"
elif [[ "$PKG_VERSION" =~ -rc\. ]]; then
    NPM_TAG="next"
    echo "📦 Publishing as release candidate (next)"
else
    echo "📦 Publishing as latest version"
fi
echo ""

# Step 8: Confirm before publishing
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 READY TO PUBLISH                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Package:  $PKG_NAME@$PKG_VERSION"
echo "NPM Tag:  $NPM_TAG"
echo "User:     $NPM_USER"
echo "Provenance: Manual publish (no provenance - use GitHub Actions for provenance)"
echo ""
read -p "Proceed with publish? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

echo ""
echo "📤 Publishing to npm..."

# Step 9: Publish
# Note: --provenance only works in GitHub Actions, not local CLI
cd npx-cli
npm publish --access public --tag "$NPM_TAG" || {
    echo ""
    echo "❌ Publish failed!"
    echo ""
    echo "Common issues:"
    echo "  1. Check if you have publish permissions for this package"
    echo "  2. Verify 2FA code if prompted"
    echo "  3. Make sure you're logged in: npm whoami"
    echo ""
    echo "For provenance publishing, use the automated GitHub Actions workflow"
    echo ""
    exit 1
}

cd ..

# Step 10: Verify publication
echo ""
echo "⏳ Waiting 10 seconds for npm registry to update..."
sleep 10

NPM_PUBLISHED_VERSION=$(npm view "$PKG_NAME" version 2>/dev/null || echo "")
if [ "$NPM_PUBLISHED_VERSION" = "$PKG_VERSION" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                   ✅ PUBLISH SUCCESSFUL!                      ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📦 Package: $PKG_NAME@$PKG_VERSION"
    echo "🔗 NPM: https://www.npmjs.com/package/$PKG_NAME"
    echo "🏷️  Tag: $NPM_TAG"
    echo ""
    echo "Users can install with:"
    echo "  npx $PKG_NAME"
    if [ "$NPM_TAG" != "latest" ]; then
        echo "  npx $PKG_NAME@$NPM_TAG"
    fi
    echo ""

    # Cleanup
    echo "🧹 Cleaning up..."
    rm -rf publish-temp
    echo "✅ Removed publish-temp/"
    echo ""
else
    echo ""
    echo "⚠️  Published, but npm registry shows: $NPM_PUBLISHED_VERSION"
    echo "   Expected: $PKG_VERSION"
    echo "   This may take a few minutes to propagate."
    echo ""
fi
