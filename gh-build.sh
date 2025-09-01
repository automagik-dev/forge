#!/bin/bash

# GitHub Actions Build Helper for automagik-forge
# Usage: ./gh-build.sh [command]
# Commands:
#   trigger - Manually trigger workflow
#   monitor [run_id] - Monitor a workflow run
#   download [run_id] - Download artifacts from a run
#   publish [type] - Publish management (check|manual|auto)
#   status - Show latest workflow status

set -e

REPO="namastexlabs/automagik-forge"
WORKFLOW_FILE=".github/workflows/build-all-platforms.yml"

case "${1:-status}" in
    trigger)
        echo "🚀 Triggering GitHub Actions build..."
        gh workflow run "$WORKFLOW_FILE" --repo "$REPO"
        
        echo "⏳ Waiting for workflow to start..."
        sleep 5
        
        # Get the latest run
        RUN_ID=$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
        
        if [ -z "$RUN_ID" ]; then
            echo "❌ Failed to get workflow run ID"
            exit 1
        fi
        
        echo "📋 Workflow run ID: $RUN_ID"
        echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
        echo ""
        echo "Run './gh-build.sh monitor $RUN_ID' to monitor progress"
        ;;
        
    publish)
        PUBLISH_TYPE="${2:-check}"
        
        case "$PUBLISH_TYPE" in
            check)
                echo "📊 Checking publish status..."
                echo ""
                echo "Latest NPM package version:"
                npm view automagik-forge version 2>/dev/null || echo "  (Package not found or not published)"
                echo ""
                echo "Current local version:"
                cat package.json | grep '"version"' | cut -d'"' -f4
                echo ""
                echo "Latest GitHub release:"
                gh release list --repo "$REPO" --limit 1 | head -1 || echo "  (No releases found)"
                echo ""
                echo "Recent workflow runs:"
                gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 3
                ;;
                
            manual)
                echo "🚀 Manual NPM publish (requires NPM_TOKEN)..."
                
                # Check if we have artifacts from a successful build
                LATEST_RUN=$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --status success --limit 1 --json databaseId --jq '.[0].databaseId')
                
                if [ -z "$LATEST_RUN" ]; then
                    echo "❌ No successful workflow runs found. Run './gh-build.sh trigger' first."
                    exit 1
                fi
                
                echo "📥 Downloading artifacts from successful run $LATEST_RUN..."
                OUTPUT_DIR="publish-temp"
                rm -rf "$OUTPUT_DIR"
                mkdir -p "$OUTPUT_DIR"
                
                gh run download "$LATEST_RUN" --repo "$REPO" --dir "$OUTPUT_DIR"
                
                # Reorganize artifacts like the workflow does
                cd "$OUTPUT_DIR"
                for dir in binaries-*; do
                    if [ -d "$dir" ]; then
                        platform=${dir#binaries-}
                        mkdir -p "../npx-cli/dist/$platform"
                        mv "$dir"/* "../npx-cli/dist/$platform/" 2>/dev/null || true
                    fi
                done
                cd ..
                rm -rf "$OUTPUT_DIR"
                
                echo "📦 Publishing to NPM..."
                if [ -z "$NPM_TOKEN" ]; then
                    echo "⚠️  NPM_TOKEN not set. Make sure you're logged in: npm login"
                    echo "   Or set NPM_TOKEN environment variable"
                fi
                
                cd npx-cli
                npm publish
                echo "✅ Published to NPM!"
                ;;
                
            auto)
                echo "🔄 Waiting for automatic publish via GitHub Actions..."
                
                # Find the most recent tag-triggered run
                TAG_RUN=$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --event push --limit 5 --json databaseId,headBranch,event --jq '.[] | select(.headBranch | startswith("refs/tags/")) | .databaseId' | head -1)
                
                if [ -z "$TAG_RUN" ]; then
                    echo "❌ No recent tag-triggered runs found"
                    echo "💡 Try: git tag v0.x.y && git push origin v0.x.y"
                    exit 1
                fi
                
                echo "📋 Monitoring tag-based run: $TAG_RUN"
                ./gh-build.sh monitor "$TAG_RUN"
                ;;
                
            *)
                echo "❌ Unknown publish command: $PUBLISH_TYPE"
                echo "Usage: ./gh-build.sh publish [check|manual|auto]"
                echo "  check  - Check current publish status"
                echo "  manual - Manually publish after downloading artifacts"
                echo "  auto   - Monitor automatic publish from tag push"
                exit 1
                ;;
        esac
        ;;
        
    monitor)
        RUN_ID="${2:-$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')}"
        
        if [ -z "$RUN_ID" ]; then
            echo "❌ No run ID provided and couldn't find latest run"
            echo "Usage: ./gh-build.sh monitor [run_id]"
            exit 1
        fi
        
        echo "📊 Monitoring workflow run $RUN_ID..."
        echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
        echo "Press Ctrl+C to stop monitoring"
        echo ""
        
        while true; do
            STATUS=$(gh run view "$RUN_ID" --repo "$REPO" --json status --jq '.status')
            
            # Get job statuses
            echo -n "[$(date +%H:%M:%S)] "
            
            case "$STATUS" in
                completed)
                    CONCLUSION=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion --jq '.conclusion')
                    case "$CONCLUSION" in
                        success)
                            echo "✅ Workflow completed successfully!"
                            echo "🔗 View details: https://github.com/$REPO/actions/runs/$RUN_ID"
                            ;;
                        failure)
                            echo "❌ Workflow failed"
                            echo "🔗 View details: https://github.com/$REPO/actions/runs/$RUN_ID"
                            echo ""
                            echo "Failed jobs:"
                            FAILED_JOBS=$(gh run view "$RUN_ID" --repo "$REPO" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .databaseId')
                            
                            for JOB_ID in $FAILED_JOBS; do
                                JOB_NAME=$(gh run view "$RUN_ID" --repo "$REPO" --json jobs --jq ".jobs[] | select(.databaseId == $JOB_ID) | .name")
                                echo ""
                                echo "❌ $JOB_NAME"
                                echo "View logs: gh run view $RUN_ID --job $JOB_ID --log-failed"
                                
                                # Show last 20 lines of error
                                echo ""
                                echo "Last error lines:"
                                gh run view "$RUN_ID" --repo "$REPO" --job "$JOB_ID" --log-failed 2>/dev/null | tail -20 || echo "  (Could not fetch error details)"
                            done
                            ;;
                        cancelled)
                            echo "🚫 Workflow cancelled"
                            ;;
                        *)
                            echo "⚠️ Workflow completed with status: $CONCLUSION"
                            ;;
                    esac
                    break
                    ;;
                in_progress|queued|pending)
                    echo "🔄 Status: $STATUS"
                    gh run view "$RUN_ID" --repo "$REPO" --json jobs --jq '.jobs[] | "    \(.name): \(.status)"'
                    sleep 60
                    ;;
                *)
                    echo "❓ Unknown status: $STATUS"
                    break
                    ;;
            esac
        done
        ;;
        
    download)
        RUN_ID="${2:-$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')}"
        
        if [ -z "$RUN_ID" ]; then
            echo "❌ No run ID provided and couldn't find latest run"
            echo "Usage: ./gh-build.sh download [run_id]"
            exit 1
        fi
        
        echo "📥 Downloading artifacts from run $RUN_ID..."
        
        OUTPUT_DIR="gh-artifacts"
        rm -rf "$OUTPUT_DIR"
        mkdir -p "$OUTPUT_DIR"
        
        gh run download "$RUN_ID" --repo "$REPO" --dir "$OUTPUT_DIR"
        
        echo "✅ Downloaded to $OUTPUT_DIR/"
        echo ""
        echo "📦 Contents:"
        ls -la "$OUTPUT_DIR/"
        ;;
        
    status|*)
        echo "📊 Latest workflow status:"
        gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 5
        echo ""
        echo "Commands:"
        echo "  ./gh-build.sh trigger         - Manually trigger workflow"
        echo "  ./gh-build.sh monitor [id]    - Monitor latest/specific run"
        echo "  ./gh-build.sh download [id]   - Download artifacts"
        echo "  ./gh-build.sh publish [type]  - Publish management:"
        echo "    - check   - Check current publish status"
        echo "    - manual  - Manually publish from artifacts"  
        echo "    - auto    - Monitor automatic tag-based publish"
        echo "  ./gh-build.sh status          - Show this status"
        ;;
esac