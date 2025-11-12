#!/bin/bash
# A/B Test Publishing as 'automagik' from dev branch
# Same as make publish, but:
# 1. Allows publishing from dev branch (for testing)
# 2. Publishes as unscoped 'automagik' package instead of @automagik/forge

set -e

REPO="namastexlabs/automagik-forge"

echo "🧪 A/B Test: Full release pipeline as 'automagik'"
echo ""

# Check we're on dev branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "❌ ERROR: A/B test publishing is only allowed on the 'dev' branch"
    echo "   Current branch: $CURRENT_BRANCH"
    echo ""
    echo "   Please switch to dev branch first:"
    echo "   git checkout dev"
    exit 1
fi

echo "✅ On dev branch - proceeding with A/B test release"
echo ""

# Run the normal publish flow, but after success, handle automagik republishing
# Call the normal publish process
./gh-build.sh publish "$@"

# After normal publish succeeds, now handle the automagik republishing
# The normal publish creates a release and publishes @automagik/forge
# Now we need to:
# 1. Download the same .tgz from the release
# 2. Repackage it as 'automagik'
# 3. Publish as unscoped package

echo ""
echo "🧪 Now publishing same release as 'automagik' (unscoped package)..."
echo ""

# Get the latest release
LATEST_TAG=$(gh release list --repo "$REPO" --limit 1 --json tagName --jq '.[0].tagName')
LATEST_RELEASE=$(gh release view "$LATEST_TAG" --repo "$REPO" --json id --jq '.id')

echo "📦 Using release: $LATEST_TAG"
echo "🔍 Release ID: $LATEST_RELEASE"
echo ""

# Trigger the publish-automagik workflow with the tag and release ID
echo "🚀 Triggering publish-automagik workflow..."
gh workflow run "publish-automagik.yml" --repo "$REPO" \
    --field tag_name="$LATEST_TAG" \
    --field release_id="$LATEST_RELEASE"

echo ""
echo "⏳ Workflow triggered - monitoring progress..."
sleep 10

# Find and monitor the workflow
RUN_ID=$(gh run list --workflow="publish-automagik.yml" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -n "$RUN_ID" ]; then
    echo "📋 Monitoring publish-automagik workflow: $RUN_ID"
    echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
    echo ""

    # Monitor the workflow
    while true; do
        STATUS=$(gh run view "$RUN_ID" --repo "$REPO" --json status --jq '.status')
        echo -n "[$(date +%H:%M:%S)] Status: $STATUS"

        case "$STATUS" in
            completed)
                CONCLUSION=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion --jq '.conclusion')
                if [ "$CONCLUSION" = "success" ]; then
                    echo " ✅"
                    echo ""
                    echo "🎉 Success! Package published as 'automagik'"
                    echo ""
                    echo "Both versions now available on npm:"
                    echo "  • @automagik/forge (main release)"
                    echo "  • automagik (A/B test)"
                    echo ""
                    echo "Install A/B test version:"
                    echo "  npm install automagik"
                    break
                else
                    echo " ❌"
                    echo ""
                    echo "❌ Publish-automagik workflow failed"
                    echo "🔗 View logs: https://github.com/$REPO/actions/runs/$RUN_ID"
                    exit 1
                fi
                ;;
            *)
                echo " - waiting..."
                sleep 15
                ;;
        esac
    done
else
    echo "⚠️  Could not find workflow run"
fi
