#!/bin/bash

set -e

# Check if run ID is provided
if [ -z "$1" ]; then
    echo "📊 Monitoring latest workflow run..."
    # Get the latest run ID
    RUN_ID=$(gh run list --workflow="Build All Platforms" --limit=1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$RUN_ID" ]; then
        echo "❌ No workflow runs found"
        echo "Usage: $0 [run-id]"
        echo "Or trigger a new build with: ./trigger-build.sh"
        exit 1
    fi
else
    RUN_ID=$1
fi

echo "📋 Monitoring workflow run ID: $RUN_ID"
echo "🔗 View in browser: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/$RUN_ID"
echo ""
echo "📊 Checking status every minute..."
echo "Press Ctrl+C to stop monitoring (workflow will continue running)"
echo ""

while true; do
    # Get the current status
    STATUS=$(gh run view $RUN_ID --json status -q .status 2>/dev/null || echo "unknown")
    
    if [ "$STATUS" = "unknown" ]; then
        echo "❌ Failed to get workflow status. Run ID might be invalid."
        exit 1
    fi
    
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
            echo "📥 Download artifacts with:"
            echo "gh run download $RUN_ID"
            
            # Show artifact details
            echo ""
            echo "📦 Available artifacts:"
            gh api "/repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/$RUN_ID/artifacts" \
                --jq '.artifacts[] | "- \(.name) (\(.size_in_bytes / 1048576 | floor) MB)"'
            
            break
        elif [ "$CONCLUSION" = "failure" ]; then
            echo "[$CURRENT_TIME] ❌ Build failed!"
            
            # Show which jobs failed
            echo ""
            echo "Failed jobs:"
            gh run view $RUN_ID --json jobs -q '.jobs[] | select(.conclusion == "failure") | .name'
            
            echo ""
            echo "📋 View logs with:"
            echo "gh run view $RUN_ID --log-failed"
            
            exit 1
        elif [ "$CONCLUSION" = "cancelled" ]; then
            echo "[$CURRENT_TIME] 🛑 Build was cancelled"
            exit 1
        fi
    else
        # Get job statuses with more detail
        echo "[$CURRENT_TIME] 🔄 Workflow Status: $STATUS"
        
        # Show job progress
        TOTAL_JOBS=$(gh run view $RUN_ID --json jobs -q '.jobs | length')
        COMPLETED_JOBS=$(gh run view $RUN_ID --json jobs -q '[.jobs[] | select(.status == "completed")] | length')
        IN_PROGRESS=$(gh run view $RUN_ID --json jobs -q '[.jobs[] | select(.status == "in_progress")] | length')
        QUEUED=$(gh run view $RUN_ID --json jobs -q '[.jobs[] | select(.status == "queued")] | length')
        
        echo "    Progress: $COMPLETED_JOBS/$TOTAL_JOBS jobs completed"
        
        if [ "$IN_PROGRESS" -gt 0 ]; then
            echo "    🏃 In Progress: $IN_PROGRESS jobs"
            gh run view $RUN_ID --json jobs -q '.jobs[] | select(.status == "in_progress") | "      - \(.name)"'
        fi
        
        if [ "$QUEUED" -gt 0 ]; then
            echo "    ⏳ Queued: $QUEUED jobs"
        fi
        
        echo ""
    fi
    
    # Wait 1 minute before next check
    sleep 60
done

echo ""
echo "🎉 Build monitoring complete!"