#!/bin/bash

# GitHub Actions Build Helper for automagik-forge
# Usage: ./gh-build.sh [command]
# Commands:
#   trigger - Manually trigger workflow
#   monitor [run_id] - Monitor a workflow run
#   download [run_id] - Download artifacts from a run
#   publish [type] - Publish management (check|manual|auto)
#   publish - Interactive Claude-powered release pipeline
#   beta - Auto-incremented beta release pipeline
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
        
    publish-status)
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
        
    publish)
        echo "🚀 Starting automated publishing pipeline..."
        echo ""
        
        # Check current version vs npm
        CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        NPM_VERSION=$(npm view automagik-forge version 2>/dev/null || echo "0.0.0")
        
        echo "📊 Version Status:"
        echo "  Current local:  $CURRENT_VERSION"
        echo "  Latest on npm:  $NPM_VERSION"
        echo ""
        
        # Check if version was already bumped but not published
        if [ "$CURRENT_VERSION" != "$NPM_VERSION" ]; then
            # Version comparison to check if local is newer
            NEWER_VERSION=$(printf '%s\n' "$CURRENT_VERSION" "$NPM_VERSION" | sort -V | tail -n1)
            if [ "$NEWER_VERSION" = "$CURRENT_VERSION" ]; then
                echo "⚠️  Local version ($CURRENT_VERSION) is newer than npm ($NPM_VERSION)"
                echo ""
                
                # Check for recent failed workflows
                RECENT_FAILED=$(gh run list --workflow="Create GitHub Pre-Release" --repo "$REPO" --status failure --limit 1 --json databaseId,createdAt,headBranch --jq '.[0]')
                if [ -n "$RECENT_FAILED" ] && [ "$RECENT_FAILED" != "null" ]; then
                    FAILED_RUN_ID=$(echo "$RECENT_FAILED" | jq -r '.databaseId')
                    FAILED_TIME=$(echo "$RECENT_FAILED" | jq -r '.createdAt')
                    echo "❌ Found recent failed pre-release workflow:"
                    echo "   Run ID: $FAILED_RUN_ID"
                    echo "   Time: $FAILED_TIME"
                    echo ""
                fi
                
                # Check for existing tags with this version
                EXISTING_TAGS=$(git tag -l "v$CURRENT_VERSION*" 2>/dev/null)
                if [ -n "$EXISTING_TAGS" ]; then
                    echo "📋 Found existing tags for version $CURRENT_VERSION:"
                    echo "$EXISTING_TAGS" | sed 's/^/   /'
                    echo ""
                fi
                
                # Check for existing pre-releases
                PRERELEASE_TAG=$(gh release list --repo "$REPO" --limit 10 --json tagName,isPrerelease --jq '.[] | select(.isPrerelease == true) | select(.tagName | startswith("v'$CURRENT_VERSION'")) | .tagName' | head -1)
                if [ -n "$PRERELEASE_TAG" ]; then
                    echo "📦 Found existing pre-release: $PRERELEASE_TAG"
                    echo ""
                fi
                
                echo "Choose how to proceed:"
                echo "1) Resume: Use existing version and continue"
                echo "2) Retry: Trigger new pre-release workflow"
                echo "3) Reset: Start fresh with new version bump"
                echo "4) Cancel"
                read -p "Select action (1-4): " RESUME_CHOICE
                
                case $RESUME_CHOICE in
                    1)
                        echo "✅ Resuming with version $CURRENT_VERSION"
                        if [ -z "$PRERELEASE_TAG" ]; then
                            echo "⚠️  No pre-release found. You need to retry the workflow to create one."
                            echo "   Switching to retry mode..."
                            VERSION_TYPE="patch"
                            SKIP_VERSION_BUMP=false
                            SKIP_WORKFLOW=false
                        else
                            SKIP_VERSION_BUMP=true
                            SKIP_WORKFLOW=true
                            VERSION_TYPE="patch"  # Just for display, won't be used
                        fi
                        ;;
                    2)
                        echo "🔄 Retrying pre-release workflow with existing version"
                        VERSION_TYPE="patch"  # This will work because version is already bumped
                        SKIP_VERSION_BUMP=false
                        SKIP_WORKFLOW=false
                        ;;
                    3)
                        echo "🔄 Starting fresh - will select new version bump"
                        SKIP_VERSION_BUMP=false
                        SKIP_WORKFLOW=false
                        # Continue to normal version selection
                        ;;
                    4)
                        echo "❌ Publishing cancelled"
                        exit 1
                        ;;
                    *)
                        echo "❌ Invalid choice"
                        exit 1
                        ;;
                esac
                echo ""
            fi
        fi
        
        # Select version bump type (skip if resuming)
        if [ "${SKIP_VERSION_BUMP:-false}" != "true" ] && [ -z "$VERSION_TYPE" ]; then
            PS3="Select version bump type: "
            select VERSION_TYPE in "patch (bug fixes)" "minor (new features)" "major (breaking changes)" "Cancel"; do
                case $VERSION_TYPE in
                    "patch (bug fixes)")
                        VERSION_TYPE="patch"
                        break
                        ;;
                    "minor (new features)")
                        VERSION_TYPE="minor"
                        break
                        ;;
                    "major (breaking changes)")
                        VERSION_TYPE="major"
                        break
                        ;;
                    "Cancel")
                        echo "❌ Publishing cancelled"
                        exit 1
                        ;;
                esac
            done
        fi
        
        # Check for saved release notes from previous attempts
        SAVED_NOTES_FILE=".release-notes-v${CURRENT_VERSION}.saved"
        
        # Skip release notes generation if resuming with existing pre-release
        if [ "${SKIP_WORKFLOW:-false}" = "true" ] && [ -n "$PRERELEASE_TAG" ]; then
            echo ""
            echo "📋 Using existing pre-release, fetching its release notes..."
            
            # Get the existing release notes from the pre-release
            EXISTING_NOTES=$(gh release view "$PRERELEASE_TAG" --repo "$REPO" --json body --jq '.body' 2>/dev/null || echo "")
            
            if [ -n "$EXISTING_NOTES" ]; then
                echo "$EXISTING_NOTES" > .release-notes-draft.md
                echo "✅ Retrieved existing release notes"
            else
                # Fallback to simple notes if can't retrieve
                echo "# Release v$CURRENT_VERSION" > .release-notes-draft.md
                echo "" >> .release-notes-draft.md
                echo "Converting pre-release $PRERELEASE_TAG to full release" >> .release-notes-draft.md
            fi
        elif [ -f "$SAVED_NOTES_FILE" ] && [ "${SKIP_VERSION_BUMP:-false}" = "false" ]; then
            echo ""
            echo "📋 Found saved release notes from previous attempt"
            cp "$SAVED_NOTES_FILE" .release-notes-draft.md
            cat .release-notes-draft.md
            echo ""
            echo "═══════════════════════════════════════════════════════════════"
            read -p "Use these saved release notes? (y/n): " USE_SAVED
            if [ "$USE_SAVED" = "y" ] || [ "$USE_SAVED" = "Y" ]; then
                echo "✅ Using saved release notes"
            else
                rm -f "$SAVED_NOTES_FILE"
                # Continue to generate new notes
                GENERATE_NEW_NOTES=true
            fi
        else
            GENERATE_NEW_NOTES=true
        fi
        
        if [ "${GENERATE_NEW_NOTES:-false}" = "true" ]; then
            echo ""
            echo "📈 Selected: $VERSION_TYPE version bump"
            
            # Get commits since last tag for Claude
            LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
            if [ -z "$LAST_TAG" ]; then
                COMMITS=$(git log --pretty=format:"- %s (%an)" -10)
                echo "📝 No previous tags found, using last 10 commits"
            else
                COMMITS=$(git log $LAST_TAG..HEAD --pretty=format:"- %s (%an)")
                echo "📝 Generating notes since $LAST_TAG"
            fi
            
            if [ -z "$COMMITS" ]; then
                echo "❌ No new commits found since last tag!"
                echo "💡 Did you forget to commit your changes?"
                exit 1
            fi
        
        # Create Claude prompt with Agno-style template
        CLAUDE_PROMPT="Generate professional GitHub release notes for automagik-forge version $VERSION using this Agno-style template:

## New Features
[List major new functionality and capabilities]

## Improvements  
[List enhancements, optimizations, and developer experience improvements]

## Bug Fixes
[List bug fixes and stability improvements]

## What's Changed
[List technical changes and implementation details]

Based on these commits:
$COMMITS

Focus on:
- User-facing benefits
- Technical improvements
- Developer workflow enhancements
- Be concise but informative
- Use bullet points with clear descriptions"

        # Try to generate with Claude, fall back to template
        echo "🤖 Generating release notes..."
        if command -v claude >/dev/null 2>&1; then
            CLAUDE_OUTPUT=$(claude -p "$CLAUDE_PROMPT" --output-format json 2>/dev/null) || true
            if [ -n "$CLAUDE_OUTPUT" ]; then
                CONTENT=$(echo "$CLAUDE_OUTPUT" | jq -r '.result' 2>/dev/null)
                SESSION_ID=$(echo "$CLAUDE_OUTPUT" | jq -r '.session_id' 2>/dev/null)
            fi
        fi
        
        # If Claude failed or isn't available, generate from template
        if [ -z "$CONTENT" ] || [ "$CONTENT" = "null" ]; then
            echo "📝 Using template-based release notes..."
            CONTENT="## Release v$VERSION

## What's Changed
$COMMITS

## Summary
This release includes various improvements and bug fixes.

---
*Full Changelog*: https://github.com/$REPO/compare/$LAST_TAG...v$VERSION"
        fi
        
        # Save initial content
        echo "$CONTENT" > .release-notes-draft.md
        
            # Interactive loop with keyboard selection
            while true; do
                clear
                echo "═══════════════════════════════════════════════════════════════"
                echo "📋 Generated Release Notes for v$VERSION"
                echo "═══════════════════════════════════════════════════════════════"
                echo ""
                cat .release-notes-draft.md
                echo ""
                echo "═══════════════════════════════════════════════════════════════"
                echo ""
                
                PS3="Choose an action: "
                select choice in "✅ Accept and continue" "✏️  Edit manually" "🔄 Regenerate with feedback" "❌ Cancel release"; do
                case $choice in
                    "✅ Accept and continue")
                        echo "✅ Release notes accepted!"
                        # Save release notes for potential retry
                        cp .release-notes-draft.md "$SAVED_NOTES_FILE"
                        break 2
                        ;;
                    "✏️  Edit manually")
                        echo "🖊️  Opening release notes in editor..."
                        ${EDITOR:-nano} .release-notes-draft.md
                        break
                        ;;
                    "🔄 Regenerate with feedback")
                        echo ""
                        echo "Enter feedback for Claude (or press Enter for different style):"
                        read -r feedback
                        
                        if [ -n "$feedback" ]; then
                            FEEDBACK_PROMPT="$feedback"
                        else
                            FEEDBACK_PROMPT="Generate the release notes again but make them more technical and detailed, focusing on specific implementation changes and developer benefits."
                        fi
                        
                        echo "🤖 Regenerating with feedback..."
                        if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
                            CLAUDE_OUTPUT=$(claude -p "$FEEDBACK_PROMPT" --resume "$SESSION_ID" --output-format json 2>/dev/null) || {
                                echo "⚠️  Session continuation failed, generating fresh notes..."
                                CLAUDE_OUTPUT=$(claude -p "$CLAUDE_PROMPT

Additional context: $FEEDBACK_PROMPT" --output-format json 2>/dev/null)
                            }
                        else
                            CLAUDE_OUTPUT=$(claude -p "$CLAUDE_PROMPT

Additional context: $FEEDBACK_PROMPT" --output-format json 2>/dev/null)
                        fi
                        
                        NEW_CONTENT=$(echo "$CLAUDE_OUTPUT" | jq -r '.result')
                        if [ -n "$NEW_CONTENT" ] && [ "$NEW_CONTENT" != "null" ]; then
                            echo "$NEW_CONTENT" > .release-notes-draft.md
                            SESSION_ID=$(echo "$CLAUDE_OUTPUT" | jq -r '.session_id')
                            echo "✅ Release notes regenerated!"
                        else
                            echo "❌ Failed to regenerate release notes"
                        fi
                        break
                        ;;
                    "❌ Cancel release")
                        echo "❌ Release cancelled by user"
                        rm -f .release-notes-draft.md
                        exit 1
                        ;;
                    *)
                        echo "❌ Invalid choice. Please select 1-4."
                        ;;
                esac
            done
        done
        fi
        
        # Step 1: Handle pre-release workflow or use existing pre-release
        if [ "${SKIP_WORKFLOW:-false}" = "true" ] && [ -n "$PRERELEASE_TAG" ]; then
            echo ""
            echo "📦 Using existing pre-release: $PRERELEASE_TAG"
            NEW_TAG="$PRERELEASE_TAG"
            NEW_VERSION="$CURRENT_VERSION"
            echo "✅ Skipping workflow, proceeding to release conversion"
        elif [ "${SKIP_WORKFLOW:-false}" = "true" ] && [ -z "$PRERELEASE_TAG" ]; then
            echo ""
            echo "❌ No existing pre-release found for version $CURRENT_VERSION"
            echo "Please select 'Retry' option to build the release"
            exit 1
        else
            echo ""
            echo "🏗️  Step 1: Triggering pre-release workflow..."
            echo "This will:"
            if [ "${SKIP_VERSION_BUMP:-false}" != "true" ]; then
                echo "  • Bump version ($VERSION_TYPE)"
            else
                echo "  • Use existing version $CURRENT_VERSION"
            fi
            echo "  • Build all platforms"
            echo "  • Create pre-release with .tgz package"
            echo ""
            
            # Trigger the pre-release workflow
            gh workflow run "Create GitHub Pre-Release" --repo "$REPO" -f version_type="$VERSION_TYPE" || {
                echo "❌ Failed to trigger pre-release workflow"
                rm -f .release-notes-draft.md
                exit 1
            }
            
            echo "⏳ Waiting for pre-release workflow to start..."
            sleep 10
            
            # Find the workflow run
            PRERELEASE_RUN=$(gh run list --workflow="Create GitHub Pre-Release" --repo "$REPO" --limit 1 --json databaseId,status --jq '.[0] | select(.status != "completed") | .databaseId')
            
            if [ -z "$PRERELEASE_RUN" ]; then
                echo "⚠️  Could not find the pre-release workflow run"
                echo "Check manually at: https://github.com/$REPO/actions"
                exit 1
            fi
            
            echo "📋 Pre-release workflow started: Run ID $PRERELEASE_RUN"
            echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$PRERELEASE_RUN"
            echo ""
            echo "⏳ Monitoring build (this will take ~30-45 minutes)..."
            
            # Monitor the pre-release build and get the new version
            NEW_VERSION=""
            NEW_TAG=""
            while true; do
                STATUS=$(gh run view "$PRERELEASE_RUN" --repo "$REPO" --json status --jq '.status')
                
                echo -n "[$(date +%H:%M:%S)] Status: $STATUS"
                
                case "$STATUS" in
                    completed)
                        CONCLUSION=$(gh run view "$PRERELEASE_RUN" --repo "$REPO" --json conclusion --jq '.conclusion')
                        if [ "$CONCLUSION" = "success" ]; then
                            echo " ✅"
                            
                            # Get the new version/tag from the workflow output
                            echo ""
                            echo "🔍 Finding created pre-release..."
                            
                            # Get the most recent pre-release
                            RELEASE_INFO=$(gh release list --repo "$REPO" --limit 1 --json tagName,isPrerelease,name --jq '.[] | select(.isPrerelease == true)')
                            NEW_TAG=$(echo "$RELEASE_INFO" | jq -r '.tagName')
                            
                            if [ -z "$NEW_TAG" ]; then
                                echo "❌ Could not find the created pre-release"
                                exit 1
                            fi
                            
                            # Extract version from tag (remove timestamp suffix)
                            NEW_VERSION=$(echo "$NEW_TAG" | sed 's/^v//' | sed 's/-[0-9]*$//')
                            
                            echo "✅ Pre-release created: $NEW_TAG (version: $NEW_VERSION)"
                            break
                        else
                            echo " ❌"
                            echo "Pre-release workflow failed! Check the logs:"
                            echo "https://github.com/$REPO/actions/runs/$PRERELEASE_RUN"
                            rm -f .release-notes-draft.md
                            exit 1
                        fi
                        ;;
                    *)
                        echo " - waiting..."
                        sleep 30
                        ;;
                esac
            done
        fi
        
        echo ""
        echo "🔄 Step 2: Converting pre-release to full release..."
        echo "This will trigger the npm publish workflow."
        echo ""
        
        # Update the pre-release with our release notes and convert to full release
        echo "📝 Converting to full release with custom release notes..."
        gh release edit "$NEW_TAG" --repo "$REPO" \
            --title "Release v$NEW_VERSION" \
            --notes-file .release-notes-draft.md \
            --prerelease=false \
            --latest || {
            echo "❌ Failed to convert pre-release to full release"
            rm -f .release-notes-draft.md
            exit 1
        }
        
        rm -f .release-notes-draft.md
        rm -f "$SAVED_NOTES_FILE"  # Clean up saved notes after successful release
        
        echo "✅ Release v$NEW_VERSION published!"
        echo ""
        
        # Monitor the publish workflow (if it triggers)
        echo "⏳ Checking for npm publish workflow..."
        sleep 10
        
        PUBLISH_RUN=$(gh run list --workflow="Publish to npm" --repo "$REPO" --limit 1 --json databaseId,createdAt --jq '.[0].databaseId')
        
        if [ -n "$PUBLISH_RUN" ]; then
            echo "📋 NPM publish workflow started: Run ID $PUBLISH_RUN"
            echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$PUBLISH_RUN"
            echo ""
            echo "⏳ Monitoring npm publish..."
            
            # Monitor the publish workflow
            while true; do
                STATUS=$(gh run view "$PUBLISH_RUN" --repo "$REPO" --json status --jq '.status')
                echo -n "[$(date +%H:%M:%S)] Publish status: $STATUS"
                
                case "$STATUS" in
                    completed)
                        CONCLUSION=$(gh run view "$PUBLISH_RUN" --repo "$REPO" --json conclusion --jq '.conclusion')
                        if [ "$CONCLUSION" = "success" ]; then
                            echo " ✅"
                            break
                        else
                            echo " ❌"
                            echo "NPM publish failed. Check the logs."
                            break
                        fi
                        ;;
                    *)
                        echo ""
                        sleep 30
                        ;;
                esac
            done
        fi
        
        echo ""
        echo "🎉 Release complete!"
        echo "📦 Version $NEW_VERSION published"
        echo "📦 NPM package: https://www.npmjs.com/package/automagik-forge"
        echo "🏷️  GitHub release: https://github.com/$REPO/releases/tag/$NEW_TAG"
        ;;
        
    beta)
        echo "🧪 Starting beta release pipeline..."
        
        # Get current version from package.json (base version)
        BASE_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        if [ -z "$BASE_VERSION" ]; then
            echo "❌ Could not determine version from package.json"
            exit 1
        fi
        
        # Check NPM for existing beta versions and auto-increment
        echo "🔍 Checking for existing beta versions..."
        EXISTING_BETAS=$(npm view automagik-forge versions --json 2>/dev/null | jq -r ".[]" 2>/dev/null | grep "^$BASE_VERSION-beta\." || echo "")
        
        if [ -z "$EXISTING_BETAS" ]; then
            BETA_NUMBER=1
            echo "📝 No existing betas found, starting with beta.1"
        else
            LAST_BETA=$(echo "$EXISTING_BETAS" | sort -V | tail -1)
            BETA_NUMBER=$(echo "$LAST_BETA" | sed "s/$BASE_VERSION-beta\.//" | awk '{print $1+1}')
            echo "📝 Found existing betas, incrementing to beta.$BETA_NUMBER"
        fi
        
        BETA_VERSION="$BASE_VERSION-beta.$BETA_NUMBER"
        echo "🎯 Publishing beta version: $BETA_VERSION"
        
        # Get recent commits for simple release notes
        COMMITS=$(git log --oneline -5 | sed 's/^/- /')
        
        # Create simple beta release notes
        BETA_NOTES="# Beta Release $BETA_VERSION

## 🧪 Pre-release for Testing

This is a beta release for testing upcoming features in v$BASE_VERSION.

## Recent Changes
$COMMITS

**⚠️ This is a pre-release version intended for testing. Use with caution in production.**

Install with: \`npx automagik-forge@beta\`"
        
        # Save beta notes
        echo "$BETA_NOTES" > .beta-release-notes.md
        
        echo "📋 Beta release notes:"
        echo "═══════════════════════════════════════════════════════════════"
        cat .beta-release-notes.md
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        
        # Confirm beta release
        read -p "Proceed with beta release $BETA_VERSION? [Y/n]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            echo "❌ Beta release cancelled"
            rm -f .beta-release-notes.md
            exit 1
        fi
        
        # Create GitHub pre-release
        echo "🏗️  Creating GitHub pre-release..."
        gh release create "v$BETA_VERSION" --title "Beta v$BETA_VERSION" --notes-file .beta-release-notes.md --prerelease || {
            echo "❌ Failed to create GitHub pre-release"
            rm -f .beta-release-notes.md
            exit 1
        }
        
        echo "✅ GitHub pre-release created: https://github.com/$REPO/releases/tag/v$BETA_VERSION"
        
        # Create and push git tag
        echo "🏷️  Creating and pushing git tag..."
        git tag "v$BETA_VERSION" 2>/dev/null || echo "⚠️  Tag v$BETA_VERSION already exists"
        git push origin "v$BETA_VERSION"
        
        # Cleanup
        rm -f .beta-release-notes.md
        
        # Monitor GitHub Actions build
        echo ""
        echo "⏳ Triggering and monitoring GitHub Actions build..."
        
        # Wait for workflow to start
        sleep 5
        RUN_ID=$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
        
        if [ -n "$RUN_ID" ]; then
            echo "📋 Monitoring build run: $RUN_ID"
            echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
            echo ""
            echo "💡 Beta will be published to NPM with 'beta' tag after successful build"
            echo "💡 Install with: npx automagik-forge@beta"
            echo ""
            
            # Monitor the build automatically
            ./gh-build.sh monitor "$RUN_ID"
        else
            echo "⚠️  Could not find triggered build, monitoring latest..."
            ./gh-build.sh monitor
        fi
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
        echo "  ./gh-build.sh publish         - Interactive Claude-powered release"
        echo "  ./gh-build.sh beta            - Auto-incremented beta release"
        echo "  ./gh-build.sh status          - Show this status"
        ;;
esac