#!/bin/bash
# Standalone release notes enhancer
# Categorizes commits and creates semantic release notes

set -e

RELEASE_TAG="${1:-}"
VERSION="${2:-}"
FROM_TAG="${3:-}"
REPO="namastexlabs/automagik-forge"

if [ -z "$RELEASE_TAG" ] || [ -z "$VERSION" ] || [ -z "$FROM_TAG" ]; then
    echo "Usage: $0 RELEASE_TAG VERSION FROM_TAG"
    echo "Example: $0 v0.4.0-20251021043456 0.4.0 v0.3.18"
    exit 1
fi

echo "🔍 Checking if pre-release exists..."
if ! gh release view "$RELEASE_TAG" --repo "$REPO" >/dev/null 2>&1; then
    echo "⚠️  Pre-release $RELEASE_TAG not found yet, exiting silently"
    exit 0
fi

echo "✅ Pre-release found: $RELEASE_TAG"
echo "📊 Analyzing changes from $FROM_TAG to $RELEASE_TAG..."

# Fetch tags
git fetch --tags 2>/dev/null || true

# Get commits and categorize
COMMITS=$(git log "$FROM_TAG..$RELEASE_TAG" --pretty=format:"%s" --no-merges 2>/dev/null || echo "")

if [ -z "$COMMITS" ]; then
    echo "⚠️  No commits found, keeping existing notes"
    exit 0
fi

# Categorize commits
FEATURES=$(echo "$COMMITS" | grep -i "^feat" || true)
FIXES=$(echo "$COMMITS" | grep -i "^fix" || true)
DOCS=$(echo "$COMMITS" | grep -i "^docs" || true)
CHORES=$(echo "$COMMITS" | grep -i "^chore\|^ci\|^build" || true)
OTHERS=$(echo "$COMMITS" | grep -v -i "^feat\|^fix\|^docs\|^chore\|^ci\|^build" || true)

# Build enhanced notes
cat > /tmp/enhanced-notes.md <<EOF
# Release v$VERSION

EOF

# Add features section
if [ -n "$FEATURES" ]; then
    echo "## 🚀 New Features" >> /tmp/enhanced-notes.md
    echo "$FEATURES" | sed 's/^feat[:(].*[):] */- /' | sed 's/^feat: */- /' >> /tmp/enhanced-notes.md
    echo "" >> /tmp/enhanced-notes.md
fi

# Add fixes section
if [ -n "$FIXES" ]; then
    echo "## 🐛 Bug Fixes" >> /tmp/enhanced-notes.md
    echo "$FIXES" | sed 's/^fix[:(].*[):] */- /' | sed 's/^fix: */- /' >> /tmp/enhanced-notes.md
    echo "" >> /tmp/enhanced-notes.md
fi

# Add docs section
if [ -n "$DOCS" ]; then
    echo "## 📚 Documentation" >> /tmp/enhanced-notes.md
    echo "$DOCS" | sed 's/^docs[:(].*[):] */- /' | sed 's/^docs: */- /' >> /tmp/enhanced-notes.md
    echo "" >> /tmp/enhanced-notes.md
fi

# Add other changes
if [ -n "$OTHERS" ]; then
    echo "## 🔧 Other Changes" >> /tmp/enhanced-notes.md
    echo "$OTHERS" | sed 's/^/- /' >> /tmp/enhanced-notes.md
    echo "" >> /tmp/enhanced-notes.md
fi

# Add internal section
if [ -n "$CHORES" ]; then
    echo "## 🧰 Internal" >> /tmp/enhanced-notes.md
    echo "$CHORES" | sed 's/^chore[:(].*[):] */- /' | sed 's/^chore: */- /' | sed 's/^ci: */- /' | sed 's/^build: */- /' >> /tmp/enhanced-notes.md
    echo "" >> /tmp/enhanced-notes.md
fi

# Add changelog link
cat >> /tmp/enhanced-notes.md <<EOF
---
**Full Changelog**: https://github.com/$REPO/compare/$FROM_TAG...v$VERSION
EOF

echo "📝 Updating GitHub release with enhanced notes..."
if gh release edit "$RELEASE_TAG" --repo "$REPO" --notes-file /tmp/enhanced-notes.md 2>/dev/null; then
    echo "✅ Release notes updated successfully!"

    # Also save to repo for reference
    cp /tmp/enhanced-notes.md ".release-notes-v$VERSION.md" 2>/dev/null || true
else
    echo "❌ Failed to update release notes (non-fatal)"
    exit 0  # Don't fail the workflow
fi
