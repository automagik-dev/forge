#!/bin/bash

set -e

echo "🚀 Triggering GitHub Actions build for all platforms..."

# Trigger the workflow
echo "📤 Dispatching workflow..."
gh workflow run "Build All Platforms" --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)"

# Wait a moment for the workflow to start
echo "⏳ Waiting for workflow to start..."
sleep 10

# Get the latest run ID
RUN_ID=$(gh run list --workflow="Build All Platforms" --limit=1 --json databaseId -q '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo "❌ Failed to get workflow run ID"
    exit 1
fi

echo "📋 Workflow run ID: $RUN_ID"
echo "🔗 View in browser: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/$RUN_ID"
echo ""

# Monitor the workflow
echo "📊 Monitoring workflow progress (checking every minute)..."
echo "Press Ctrl+C to stop monitoring (workflow will continue running)"
echo ""

while true; do
    # Get the current status
    STATUS=$(gh run view $RUN_ID --json status -q .status)
    CONCLUSION=$(gh run view $RUN_ID --json conclusion -q .conclusion)
    
    # Get current time
    CURRENT_TIME=$(date +"%H:%M:%S")
    
    # Display status
    if [ "$STATUS" = "completed" ]; then
        if [ "$CONCLUSION" = "success" ]; then
            echo "[$CURRENT_TIME] ✅ Build completed successfully!"
            
            # List the artifacts
            echo ""
            echo "📦 Build artifacts:"
            gh run view $RUN_ID --json jobs -q '.jobs[] | "\(.name): \(.conclusion)"'
            
            echo ""
            echo "📥 To download artifacts:"
            echo "gh run download $RUN_ID"
            
            break
        elif [ "$CONCLUSION" = "failure" ]; then
            echo "[$CURRENT_TIME] ❌ Build failed!"
            
            # Show which jobs failed
            echo ""
            echo "Failed jobs:"
            gh run view $RUN_ID --json jobs -q '.jobs[] | select(.conclusion == "failure") | .name'
            
            echo ""
            echo "📋 View logs:"
            echo "gh run view $RUN_ID --log-failed"
            
            exit 1
        elif [ "$CONCLUSION" = "cancelled" ]; then
            echo "[$CURRENT_TIME] 🛑 Build was cancelled"
            exit 1
        fi
    else
        # Get job statuses
        JOBS_STATUS=$(gh run view $RUN_ID --json jobs -q '.jobs[] | "\(.name): \(.status)"' | head -5)
        
        echo "[$CURRENT_TIME] 🔄 Status: $STATUS"
        echo "$JOBS_STATUS" | sed 's/^/    /'
        echo ""
    fi
    
    # Wait 1 minute before next check
    sleep 60
done

echo ""
echo "🎉 All platforms built successfully!"