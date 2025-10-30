#!/bin/bash
# Smart NPM Publish Monitor
# Calculates expected completion time and sleeps intelligently

set -e

REPO="namastexlabs/automagik-forge"
RUN_ID="${1:-}"

if [ -z "$RUN_ID" ]; then
    echo "Usage: $0 <workflow_run_id>"
    echo ""
    echo "Example: $0 18694584151"
    exit 1
fi

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║            🤖 Smart NPM Publish Monitor                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Calculate average build time from recent successful runs
echo "📊 Analyzing recent build times..."
RECENT_DURATIONS=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --limit 10 --json conclusion,createdAt,updatedAt --jq '.[] | select(.conclusion == "success") | (((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 60 | floor)' 2>/dev/null)

if [ -n "$RECENT_DURATIONS" ]; then
    AVG_TIME=$(echo "$RECENT_DURATIONS" | awk '{sum+=$1; count++} END {print int(sum/count)}')
    MAX_TIME=$(echo "$RECENT_DURATIONS" | sort -n | tail -1)
    echo "  • Average: ${AVG_TIME} minutes"
    echo "  • Maximum: ${MAX_TIME} minutes"
else
    AVG_TIME=40  # Default fallback
    MAX_TIME=50
    echo "  • Using defaults: avg=${AVG_TIME}min, max=${MAX_TIME}min"
fi

echo ""
echo "🔗 Workflow: https://github.com/$REPO/actions/runs/$RUN_ID"
echo ""

# Get workflow start time
START_TIME=$(gh run view "$RUN_ID" --repo "$REPO" --json createdAt --jq '.createdAt' 2>/dev/null)
if [ -z "$START_TIME" ]; then
    echo "❌ Failed to get workflow start time"
    exit 1
fi

START_EPOCH=$(date -d "$START_TIME" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$START_TIME" +%s)
CURRENT_EPOCH=$(date +%s)
ELAPSED_MIN=$(( (CURRENT_EPOCH - START_EPOCH) / 60 ))

echo "⏱️  Elapsed: ${ELAPSED_MIN} minutes"

# Smart sleep strategy
if [ $ELAPSED_MIN -lt 5 ]; then
    # Just started - sleep for most of avg time
    SLEEP_MIN=$((AVG_TIME - 10))
    echo "🛌 Build just started. Sleeping ${SLEEP_MIN} minutes (will check last 10 min actively)..."
    sleep $((SLEEP_MIN * 60))
elif [ $ELAPSED_MIN -lt $((AVG_TIME - 5)) ]; then
    # Mid-build - sleep until near expected completion
    REMAINING=$((AVG_TIME - ELAPSED_MIN - 5))
    if [ $REMAINING -gt 0 ]; then
        echo "🛌 Mid-build. Sleeping ${REMAINING} minutes (will check last 5 min actively)..."
        sleep $((REMAINING * 60))
    fi
fi

# Active monitoring phase
echo ""
echo "👁️  Entering active monitoring phase..."
echo ""

EXPECTED_VERSION=$(gh release list --repo "$REPO" --limit 1 --json tagName --jq '.[0].tagName' 2>/dev/null | sed 's/^v//' | sed 's/-[0-9]*$//')

while true; do
    CURRENT_EPOCH=$(date +%s)
    ELAPSED_MIN=$(( (CURRENT_EPOCH - START_EPOCH) / 60 ))

    # Get workflow status
    WORKFLOW_DATA=$(gh run view "$RUN_ID" --repo "$REPO" --json status,conclusion,jobs 2>/dev/null)

    if [ -z "$WORKFLOW_DATA" ]; then
        echo "[$(date +%H:%M:%S)] ❌ Failed to fetch workflow data"
        sleep 30
        continue
    fi

    STATUS=$(echo "$WORKFLOW_DATA" | jq -r '.status')

    echo "[$(date +%H:%M:%S)] [${ELAPSED_MIN}min] Status: $STATUS"

    if [ "$STATUS" = "completed" ]; then
        CONCLUSION=$(echo "$WORKFLOW_DATA" | jq -r '.conclusion')

        if [ "$CONCLUSION" = "success" ]; then
            echo ""
            echo "✅ Build completed successfully after ${ELAPSED_MIN} minutes!"

            # Check for publish job
            HAS_PUBLISH=$(echo "$WORKFLOW_DATA" | jq -r '.jobs[] | select(.name == "publish") | .name')

            if [ -n "$HAS_PUBLISH" ]; then
                echo ""
                echo "🔍 Verifying NPM publication..."
                echo "   Expected version: $EXPECTED_VERSION"
                echo "   Polling npm registry..."

                sleep 30  # Initial wait for npm propagation

                for attempt in {1..15}; do
                    NPM_VERSION=$(npm view automagik-forge version 2>/dev/null || echo "")
                    echo "  [Attempt $attempt/15] npm version: $NPM_VERSION"

                    if [ "$NPM_VERSION" = "$EXPECTED_VERSION" ]; then
                        echo ""
                        echo "╔═══════════════════════════════════════════════════════════════╗"
                        echo "║              ✅ SUCCESS - NPM PACKAGE LIVE!                   ║"
                        echo "╚═══════════════════════════════════════════════════════════════╝"
                        echo ""
                        echo "📦 Version: $EXPECTED_VERSION"
                        echo "🔗 Package: https://www.npmjs.com/package/automagik-forge"
                        echo "🚀 Install: npx automagik-forge"
                        echo ""
                        echo "Total time: ${ELAPSED_MIN} minutes"
                        exit 0
                    fi

                    if [ $attempt -lt 15 ]; then
                        sleep 20
                    fi
                done

                echo ""
                echo "⚠️  NPM verification timeout (current: $NPM_VERSION, expected: $EXPECTED_VERSION)"
                echo "   Package may still be propagating. Check manually:"
                echo "   https://www.npmjs.com/package/automagik-forge"
                exit 1
            else
                echo "No publish job found in this workflow"
                exit 0
            fi
        else
            echo ""
            echo "❌ Build failed with conclusion: $CONCLUSION"
            echo "🔗 View logs: https://github.com/$REPO/actions/runs/$RUN_ID"
            exit 1
        fi
    fi

    # Show job progress
    JOBS_COMPLETED=$(echo "$WORKFLOW_DATA" | jq -r '.jobs[] | select(.status == "completed") | .name' | wc -l)
    JOBS_TOTAL=$(echo "$WORKFLOW_DATA" | jq -r '.jobs | length')
    echo "  Progress: $JOBS_COMPLETED/$JOBS_TOTAL jobs completed"

    # Timeout check
    if [ $ELAPSED_MIN -gt $((MAX_TIME + 15)) ]; then
        echo ""
        echo "⚠️  Build exceeded maximum expected time (${MAX_TIME}min + 15min buffer)"
        echo "   Still running but this is unusual. Check manually:"
        echo "   https://github.com/$REPO/actions/runs/$RUN_ID"
    fi

    sleep 60  # Check every minute during active phase
done
