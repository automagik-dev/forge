#!/bin/bash

# GitHub Actions Build Helper for automagik-forge
# Usage: ./gh-build.sh [command] [options]
# Commands:
#   trigger - Manually trigger workflow
#   monitor [run_id] - Monitor a workflow run
#   download [run_id] - Download artifacts from a run
#   publish [options] - Automated release pipeline with AI-generated notes
#     Options:
#       --minor | --major | --patch  - Auto-select version bump type
#       --non-interactive | -y       - Skip all prompts, auto-approve
#       Example: ./gh-build.sh publish --minor --non-interactive
#   beta - Auto-incremented beta release pipeline
#   update-releases [tag] - Update releases.json with Genie-style message for a release
#     Example: ./gh-build.sh update-releases v0.5.1-rc.1
#   status - Show latest workflow status

set -e

REPO="namastexlabs/automagik-forge"
WORKFLOW_FILE=".github/workflows/build-all-platforms.yml"

case "${1:-status}" in
    update-releases)
        TAG="${2:-}"

        if [ -z "$TAG" ]; then
            echo "📋 Fetching latest release..."
            TAG=$(gh release list --repo "$REPO" --limit 1 --json tagName --jq '.[0].tagName')

            if [ -z "$TAG" ] || [ "$TAG" = "null" ]; then
                echo "❌ No releases found. Please specify a tag:"
                echo "Usage: ./gh-build.sh update-releases <tag>"
                exit 1
            fi

            echo "✅ Using latest release: $TAG"
        fi

        echo "🔍 Fetching release information for $TAG..."

        # Get release data from GitHub
        RELEASE_DATA=$(gh release view "$TAG" --repo "$REPO" --json tagName,name,body,url,publishedAt,isPrerelease 2>/dev/null)

        if [ -z "$RELEASE_DATA" ] || [ "$RELEASE_DATA" = "null" ]; then
            echo "❌ Release $TAG not found"
            exit 1
        fi

        # Extract version from tag
        VERSION=$(echo "$TAG" | sed 's/^v//')
        RELEASE_BODY=$(echo "$RELEASE_DATA" | jq -r '.body')
        RELEASE_URL=$(echo "$RELEASE_DATA" | jq -r '.url')
        PUBLISHED_AT=$(echo "$RELEASE_DATA" | jq -r '.publishedAt')
        IS_PRERELEASE=$(echo "$RELEASE_DATA" | jq -r '.isPrerelease')

        echo "📝 Release: $TAG"
        echo "   Version: $VERSION"
        echo "   URL: $RELEASE_URL"
        echo "   Published: $PUBLISHED_AT"
        echo "   Prerelease: $IS_PRERELEASE"
        echo ""

        # Generate Genie-style message
        echo "🧞 Generating Genie-style welcome message..."

        if ! command -v claude &> /dev/null; then
            echo "❌ Claude CLI not found. Install it first:"
            echo "   npm install -g @anthropic-ai/claude-cli"
            exit 1
        fi

        # Create temporary file with release notes
        echo "$RELEASE_BODY" > .temp-release-notes.md

        GENIE_PROMPT="You are Genie, the friendly AI assistant for Automagik Forge. Convert the following technical release notes into a warm, conversational message for users opening the app.

Technical Release Notes:
$(cat .temp-release-notes.md)

Create a JSON object with this structure:
{
  \"tag_name\": \"$TAG\",
  \"name\": \"Automagik Forge $TAG\",
  \"body\": \"[Your conversational message here - write as if Genie is talking directly to the user about this release. Be warm, friendly, and highlight the most exciting changes. Use emojis sparingly but effectively. Keep it concise but informative.]\",
  \"html_url\": \"$RELEASE_URL\",
  \"published_at\": \"$PUBLISHED_AT\",
  \"prerelease\": $IS_PRERELEASE
}

IMPORTANT RULES:
1. Write in first person as Genie ('I', 'we')
2. Focus on what USERS will notice or experience (not implementation details)
3. Use simple, everyday language - avoid ALL tech jargon (NPX, .env, git, Claude, API, CLI, etc.)
4. Highlight 2-3 most exciting user-facing improvements
5. Explain benefits in terms of their experience using Forge
6. Keep it brief, upbeat, and conversational
7. The body should be markdown formatted
8. Return ONLY valid JSON, no other text or explanation"

        # Generate Genie message
        claude -p --model haiku "$GENIE_PROMPT" > .genie-welcome-draft-raw.json 2>/dev/null || {
            echo "❌ Claude failed to generate Genie message"
            rm -f .temp-release-notes.md
            exit 1
        }

        rm -f .temp-release-notes.md

        # Strip markdown code blocks if present
        if grep -q '```json' .genie-welcome-draft-raw.json; then
            sed -n '/```json/,/```/p' .genie-welcome-draft-raw.json | sed '1d;$d' > .genie-welcome-draft.json
        else
            cp .genie-welcome-draft-raw.json .genie-welcome-draft.json
        fi
        rm -f .genie-welcome-draft-raw.json

        # Validate JSON
        if ! jq empty .genie-welcome-draft.json 2>/dev/null; then
            echo "❌ Generated invalid JSON. Contents:"
            cat .genie-welcome-draft.json
            rm -f .genie-welcome-draft.json
            exit 1
        fi

        echo "✅ Genie message generated!"
        echo ""
        echo "Preview:"
        echo "───────────────────────────────────────────────────────────────"
        jq -r '.body' .genie-welcome-draft.json
        echo "───────────────────────────────────────────────────────────────"
        echo ""

        # Update releases.json
        if [ ! -f "frontend/public/releases.json" ]; then
            echo "❌ frontend/public/releases.json not found"
            rm -f .genie-welcome-draft.json
            exit 1
        fi

        echo "📝 Updating frontend/public/releases.json..."

        # Read existing releases
        EXISTING_RELEASES=$(cat frontend/public/releases.json)
        NEW_RELEASE=$(cat .genie-welcome-draft.json)

        # Check if this release already exists (by tag_name)
        EXISTING_TAG=$(echo "$EXISTING_RELEASES" | jq -r --arg tag "$TAG" '.[] | select(.tag_name == $tag) | .tag_name')

        if [ "$EXISTING_TAG" = "$TAG" ]; then
            echo "⚠️  Release $TAG already exists in releases.json"
            read -p "Replace it? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "❌ Cancelled"
                rm -f .genie-welcome-draft.json
                exit 1
            fi

            # Remove existing entry and add new one
            echo "$EXISTING_RELEASES" | jq --arg tag "$TAG" 'map(select(.tag_name != $tag))' | \
                jq --argjson new "$NEW_RELEASE" '. = [$new] + .' > frontend/public/releases.json.tmp
        else
            # Add new release to the beginning of the array
            echo "$EXISTING_RELEASES" | jq --argjson new "$NEW_RELEASE" '. = [$new] + .' > frontend/public/releases.json.tmp
        fi

        mv frontend/public/releases.json.tmp frontend/public/releases.json

        echo "✅ Updated releases.json"
        echo ""
        echo "📦 Releases in file:"
        jq -r '.[] | "  - \(.tag_name) (\(if .prerelease then "pre-release" else "stable" end))"' frontend/public/releases.json

        # Clean up
        rm -f .genie-welcome-draft.json

        echo ""
        echo "✨ Done! The welcome modal will now show Genie's message for $TAG"
        ;;

    trigger)
        echo "🚀 Triggering GitHub Actions build..."
        TAG="${2:-}"

        if [ -n "$TAG" ]; then
            echo "📦 Building with tag: $TAG"
            gh workflow run "$WORKFLOW_FILE" --repo "$REPO" --field tag="$TAG"
        else
            gh workflow run "$WORKFLOW_FILE" --repo "$REPO"
        fi

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

    publish-tag)
        TAG="${2:-}"
        if [ -z "$TAG" ]; then
            echo "❌ Tag required for publish-tag command"
            echo "Usage: ./gh-build.sh publish-tag <tag>"
            echo ""
            echo "Available tags:"
            gh release list --repo "$REPO" --limit 5 --json tagName,isPrerelease --jq '.[] | "\(.tagName) \(if .isPrerelease then "(pre-release)" else "" end)"'
            exit 1
        fi

        echo "🚀 Triggering publish workflow for tag: $TAG"
        gh workflow run "$WORKFLOW_FILE" --repo "$REPO" --field tag="$TAG"

        echo "⏳ Waiting for workflow to start..."
        sleep 10

        RUN_ID=$(gh run list --workflow="$WORKFLOW_FILE" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')

        if [ -n "$RUN_ID" ]; then
            echo "📋 Monitoring workflow run: $RUN_ID"
            echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
            echo ""
            ./gh-build.sh monitor "$RUN_ID"
        else
            echo "❌ Failed to get workflow run ID"
            exit 1
        fi
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
        # Parse flags
        NON_INTERACTIVE=false
        AUTO_VERSION=""
        AUTO_APPROVE=false

        shift # remove 'publish' from args
        while [[ $# -gt 0 ]]; do
            case $1 in
                --non-interactive|-y)
                    NON_INTERACTIVE=true
                    AUTO_APPROVE=true
                    shift
                    ;;
                --version)
                    AUTO_VERSION="$2"
                    shift 2
                    ;;
                --patch|--minor|--major)
                    AUTO_VERSION="${1#--}"
                    shift
                    ;;
                *)
                    echo "Unknown option: $1"
                    exit 1
                    ;;
            esac
        done

        echo "🚀 Starting automated publishing pipeline..."
        echo ""

        # Restrict to main branch only
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        if [ "$CURRENT_BRANCH" != "main" ]; then
            echo "❌ ERROR: Publishing is only allowed on the 'main' branch"
            echo "   Current branch: $CURRENT_BRANCH"
            echo ""
            echo "   Please switch to main branch first:"
            echo "   git checkout main"
            exit 1
        fi

        # Validate all version files are in sync BEFORE any operations
        echo "🔍 Validating version consistency across all files..."
        echo ""

        # Get versions from all files
        ROOT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        NPX_VERSION=$(grep '"version"' npx-cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        FRONTEND_VERSION=$(grep '"version"' frontend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        CARGO_VERSION=$(grep '^version' forge-app/Cargo.toml | head -1 | sed 's/version = "\([^"]*\)".*/\1/')

        echo "📋 Current versions:"
        echo "   package.json:          $ROOT_VERSION"
        echo "   npx-cli/package.json:  $NPX_VERSION"
        echo "   frontend/package.json: $FRONTEND_VERSION"
        echo "   forge-app/Cargo.toml:  $CARGO_VERSION"
        echo ""

        # Check if all versions match
        if [ "$ROOT_VERSION" != "$NPX_VERSION" ] || [ "$ROOT_VERSION" != "$FRONTEND_VERSION" ] || [ "$ROOT_VERSION" != "$CARGO_VERSION" ]; then
            echo "❌ ERROR: Version mismatch detected!"
            echo ""
            echo "All version files must be in sync before publishing."
            echo "The GitHub Actions workflow will bump ALL files together."
            echo ""
            echo "To fix this, manually sync all versions to the same value:"
            echo "  1. Choose the correct version (likely: $ROOT_VERSION)"
            echo "  2. Update all mismatched files to that version"
            echo "  3. Commit the changes"
            echo ""
            echo "Files to update:"
            [ "$ROOT_VERSION" != "$NPX_VERSION" ] && echo "  - npx-cli/package.json (currently $NPX_VERSION, should be $ROOT_VERSION)"
            [ "$ROOT_VERSION" != "$FRONTEND_VERSION" ] && echo "  - frontend/package.json (currently $FRONTEND_VERSION, should be $ROOT_VERSION)"
            [ "$ROOT_VERSION" != "$CARGO_VERSION" ] && echo "  - forge-app/Cargo.toml (currently $CARGO_VERSION, should be $ROOT_VERSION)"
            exit 1
        fi

        echo "✅ All versions are in sync at $ROOT_VERSION"
        echo ""

        # Check for uncommitted changes and auto-commit them
        if ! git diff --quiet || ! git diff --staged --quiet; then
            echo "⚠️  Detected uncommitted changes"
            echo "📝 Changed files:"
            git status --short
            echo ""

            # Auto-commit uncommitted package.json changes
            if git status --short | grep -E "package\.json|Cargo\.toml|Cargo\.lock"; then
                echo "🔄 Auto-committing version-related changes..."
                git add package.json npx-cli/package.json frontend/package.json 2>/dev/null || true
                git add forge-app/Cargo.toml forge-extensions/*/Cargo.toml Cargo.lock 2>/dev/null || true

                CURRENT_VERSION_FOR_MSG=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
                git commit -m "chore: prepare v${CURRENT_VERSION_FOR_MSG} for release" || {
                    echo "❌ Failed to commit changes"
                    echo "Please commit your changes manually and try again"
                    exit 1
                }

                # Push the commit
                CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
                echo "📤 Pushing commit to $CURRENT_BRANCH..."
                git push origin "$CURRENT_BRANCH" || {
                    echo "❌ Failed to push changes"
                    echo "Please push your changes manually and try again"
                    exit 1
                }

                echo "✅ Changes committed and pushed"
                echo ""
            else
                echo "❌ You have uncommitted changes that are not version files"
                echo "Please commit or stash your changes before publishing"
                exit 1
            fi
        fi

        # Check current version vs npm
        CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        NPM_VERSION=$(npm view automagik-forge version 2>/dev/null || echo "0.0.0")

        echo "📊 Version Status:"
        echo "  Current local:  $CURRENT_VERSION"
        echo "  Latest on npm:  $NPM_VERSION"
        echo ""

        # Only check for recent failed workflows if versions don't match (indicating incomplete publish)
        # or if there's a very recent failure (< 1 hour old)
        RECENT_FAILED=""
        if [ "$CURRENT_VERSION" != "$NPM_VERSION" ]; then
            echo "🔍 Version mismatch detected - checking for related failed workflows..."
            RECENT_FAILED=$(gh run list --workflow="pre-release-simple.yml" --repo "$REPO" --status failure --limit 1 --json databaseId,createdAt,headBranch,conclusion --jq '.[0]' 2>/dev/null || echo "null")
        else
            # Versions match - only check for very recent failures (< 1 hour)
            echo "🔍 Checking for very recent failed workflows (< 1 hour)..."
            RECENT_FAILED=$(gh run list --workflow="pre-release-simple.yml" --repo "$REPO" --status failure --limit 1 --json databaseId,createdAt,headBranch,conclusion --jq '.[0]' 2>/dev/null || echo "null")

            # Check if failure is recent (< 1 hour)
            if [ -n "$RECENT_FAILED" ] && [ "$RECENT_FAILED" != "null" ]; then
                FAILED_TIME=$(echo "$RECENT_FAILED" | jq -r '.createdAt')
                FAILED_TIMESTAMP=$(date -d "$FAILED_TIME" +%s 2>/dev/null || echo "0")
                CURRENT_TIMESTAMP=$(date +%s)
                TIME_DIFF=$((CURRENT_TIMESTAMP - FAILED_TIMESTAMP))

                # If failure is older than 1 hour (3600 seconds), ignore it
                if [ "$TIME_DIFF" -gt 3600 ]; then
                    echo "✅ No recent failures (last failure was $(($TIME_DIFF / 3600)) hours ago)"
                    RECENT_FAILED="null"
                fi
            fi
        fi

        if [ -n "$RECENT_FAILED" ] && [ "$RECENT_FAILED" != "null" ]; then
            FAILED_RUN_ID=$(echo "$RECENT_FAILED" | jq -r '.databaseId')
            FAILED_TIME=$(echo "$RECENT_FAILED" | jq -r '.createdAt')
            FAILED_BRANCH=$(echo "$RECENT_FAILED" | jq -r '.headBranch')

            echo ""
            echo "❌ Found recent failed workflow:"
            echo "   Run ID: $FAILED_RUN_ID"
            echo "   Time: $FAILED_TIME"
            echo "   Branch: $FAILED_BRANCH"
            echo "   URL: https://github.com/$REPO/actions/runs/$FAILED_RUN_ID"
            echo ""

            if [ "$NON_INTERACTIVE" = "true" ]; then
                echo "▶️  Auto-selecting: Continue with new release (non-interactive mode)"
                RETRY_CHOICE=2
            else
                echo "Would you like to retry this failed release?"
                echo "1) Retry failed workflow (re-run with fixes)"
                echo "2) Continue with new release"
                echo "3) Cancel"
                read -p "Select option: " RETRY_CHOICE
            fi

            case $RETRY_CHOICE in
                1)
                    echo "🔄 Retrying failed workflow..."
                    gh run rerun "$FAILED_RUN_ID" --repo "$REPO" --failed
                    echo ""
                    echo "⏳ Monitoring version-and-tag retry..."
                    sleep 5

                    # Find the retry run
                    RETRY_RUN=$(gh run list --workflow="pre-release-simple.yml" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
                    if [ -n "$RETRY_RUN" ]; then
                        ./gh-build.sh monitor "$RETRY_RUN"
                    fi

                    # After version-and-tag succeeds, check if build workflow was triggered
                    echo ""
                    echo "🔍 Checking for triggered build workflow..."
                    sleep 10  # Give GitHub time to trigger the build on tag push

                    # Find the most recent build-all-platforms run
                    BUILD_RUN=$(gh run list --workflow="build-all-platforms.yml" --repo "$REPO" --limit 1 --json databaseId,status,conclusion --jq '.[0]')
                    if [ -n "$BUILD_RUN" ] && [ "$BUILD_RUN" != "null" ]; then
                        BUILD_ID=$(echo "$BUILD_RUN" | jq -r '.databaseId')
                        BUILD_STATUS=$(echo "$BUILD_RUN" | jq -r '.status')
                        BUILD_CONCLUSION=$(echo "$BUILD_RUN" | jq -r '.conclusion')

                        echo "📦 Build workflow detected: Run ID $BUILD_ID"
                        echo "   Status: $BUILD_STATUS"

                        # Always monitor the build, regardless of initial status
                        if [ "$BUILD_STATUS" = "completed" ]; then
                            if [ "$BUILD_CONCLUSION" = "failure" ]; then
                                echo "❌ Build workflow failed"
                                echo "🔗 View logs: https://github.com/$REPO/actions/runs/$BUILD_ID"
                                echo ""
                                read -p "Retry the build workflow? (y/n): " RETRY_BUILD
                                if [ "$RETRY_BUILD" = "y" ] || [ "$RETRY_BUILD" = "Y" ]; then
                                    echo "🔄 Retrying build workflow..."
                                    gh run rerun "$BUILD_ID" --repo "$REPO" --failed
                                    sleep 5
                                    NEW_BUILD=$(gh run list --workflow="build-all-platforms.yml" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
                                    ./gh-build.sh monitor "$NEW_BUILD"
                                fi
                            elif [ "$BUILD_CONCLUSION" = "success" ]; then
                                echo "✅ Build already completed successfully"
                            fi
                        else
                            # Build is queued, pending, or in_progress - monitor it
                            echo "⏳ Build is $BUILD_STATUS, monitoring..."
                            ./gh-build.sh monitor "$BUILD_ID"
                        fi
                    else
                        echo "⚠️  No build workflow detected"
                    fi
                    exit 0
                    ;;
                2)
                    echo "▶️  Continuing with new release..."
                    echo ""
                    ;;
                3)
                    echo "❌ Cancelled"
                    exit 1
                    ;;
                *)
                    echo "❌ Invalid choice"
                    exit 1
                    ;;
            esac
        fi

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
                            # Check if we just need to trigger publish (builds already done)
                            echo "🔍 Checking if builds are already complete..."
                            LAST_BUILD_RUN=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --status success --limit 5 --json databaseId,headBranch,createdAt --jq ".[] | select(.headBranch == \"$PRERELEASE_TAG\" or .headBranch == \"main\") | .databaseId" | head -1)

                            if [ -n "$LAST_BUILD_RUN" ]; then
                                echo "✅ Found successful build run: $LAST_BUILD_RUN"

                                # Check if publish was skipped (manual trigger without tag)
                                PUBLISH_STATUS=$(gh run view "$LAST_BUILD_RUN" --repo "$REPO" --json jobs --jq '.jobs[] | select(.name == "publish") | .conclusion' 2>/dev/null || echo "")

                                if [ "$PUBLISH_STATUS" = "skipped" ]; then
                                    echo "⚠️  Publish job was skipped in the last run (missing tag parameter)"
                                    echo ""
                                    echo "Would you like to:"
                                    echo "1) Trigger publish only (no rebuild)"
                                    echo "2) Rebuild everything"
                                    read -p "Select option (1-2): " PUBLISH_CHOICE

                                    if [ "$PUBLISH_CHOICE" = "1" ]; then
                                        echo "🚀 Triggering publish-only workflow with tag..."
                                        gh workflow run "Build All Platforms" --repo "$REPO" --field tag="$PRERELEASE_TAG"

                                        echo "⏳ Waiting for workflow to start..."
                                        sleep 10

                                        PUBLISH_RUN=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
                                        if [ -n "$PUBLISH_RUN" ]; then
                                            echo "📋 Monitoring publish workflow: $PUBLISH_RUN"
                                            ./gh-build.sh monitor "$PUBLISH_RUN"
                                        fi
                                        exit 0
                                    fi
                                fi
                            fi

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
            # Get current version
            CURRENT_VER=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

            # Use auto version if provided
            if [ -n "$AUTO_VERSION" ]; then
                VERSION_TYPE="$AUTO_VERSION"
                echo "✅ Auto-selected: $VERSION_TYPE version bump"
            else
                clear
                echo "╔═══════════════════════════════════════════════════════════════╗"
                echo "║                   🏷️  Version Bump Selection                   ║"
                echo "╚═══════════════════════════════════════════════════════════════╝"
                echo ""
                echo "📦 Current Version: $CURRENT_VER"
                echo ""

                # Check if this is an RC version
                if [[ "$CURRENT_VER" =~ -rc\.([0-9]+)$ ]]; then
                    RC_NUM="${BASH_REMATCH[1]}"
                    STABLE_VER=$(echo "$CURRENT_VER" | sed 's/-rc\.[0-9]*$//')
                    NEXT_RC_VER=$(echo "$CURRENT_VER" | sed "s/-rc\.$RC_NUM$/-rc.$((RC_NUM + 1))/")

                    echo "🎯 RC Version Detected - Choose release path:"
                    echo ""
                    echo "   ✅ stable  - Promote to stable release"
                    echo "              → $STABLE_VER"
                    echo ""
                    echo "   🧪 rc      - Continue with next release candidate"
                    echo "              → $NEXT_RC_VER"
                    echo ""
                    echo "═══════════════════════════════════════════════════════════════"
                    echo ""

                    PS3="Choose release type: "
                    select VERSION_TYPE in "✅ stable (promote to stable)" "🧪 rc (next release candidate)" "❌ Cancel"; do
                        case $VERSION_TYPE in
                            "✅ stable (promote to stable)")
                                VERSION_TYPE="stable"
                                echo "✅ Selected: Promote to stable ($STABLE_VER)"
                                break
                                ;;
                            "🧪 rc (next release candidate)")
                                VERSION_TYPE="rc"
                                echo "✅ Selected: Continue RC ($NEXT_RC_VER)"
                                break
                                ;;
                            "❌ Cancel")
                                echo "❌ Publishing cancelled"
                                exit 1
                                ;;
                        esac
                    done
                else
                    # Normal version - show patch/minor only (major is too dangerous)
                    echo "🎯 Choose the type of release based on your changes:"
                    echo ""
                    echo "   🐛 patch   - Bug fixes, security patches, minor improvements"
                    echo "              → $(echo "$CURRENT_VER" | awk -F. '{print $1"."$2"."($3+1)}')"
                    echo ""
                    echo "   ✨ minor   - New features, significant improvements, API additions"
                    echo "              → $(echo "$CURRENT_VER" | awk -F. '{print $1"."($2+1)".0"}')"
                    echo ""
                    echo "═══════════════════════════════════════════════════════════════"
                    echo ""

                    PS3="Choose version bump type: "
                    select VERSION_TYPE in "🐛 patch (bug fixes & improvements)" "✨ minor (new features & enhancements)" "❌ Cancel"; do
                        case $VERSION_TYPE in
                            "🐛 patch (bug fixes & improvements)")
                                VERSION_TYPE="patch"
                                echo "✅ Selected: patch version bump"
                                break
                                ;;
                            "✨ minor (new features & enhancements)")
                                VERSION_TYPE="minor"
                                echo "✅ Selected: minor version bump"
                                break
                                ;;
                            "❌ Cancel")
                                echo "❌ Publishing cancelled"
                                exit 1
                                ;;
                        esac
                    done
                fi
            fi
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

            # Get last tag for analysis
            LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
            if [ -z "$LAST_TAG" ]; then
                echo "📝 No previous tags found, analyzing last 20 commits"
                ANALYSIS_FROM=""
            else
                echo "📝 Analyzing code changes since $LAST_TAG"
                ANALYSIS_FROM="$LAST_TAG"
            fi

            # Remove old draft if exists
            rm -f .release-notes-draft.md

            # Use AI to generate professional release notes
            echo "🧠 Generating AI-powered release notes..."

            # Get the next version based on bump type
            CURRENT_VER=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
            case "$VERSION_TYPE" in
                patch)
                    NEXT_VER=$(echo "$CURRENT_VER" | awk -F. '{print $1"."$2"."($3+1)}')
                    ;;
                minor)
                    NEXT_VER=$(echo "$CURRENT_VER" | awk -F. '{print $1"."($2+1)".0"}')
                    ;;
                major)
                    NEXT_VER=$(echo "$CURRENT_VER" | awk -F. '{print ($1+1)".0.0"}')
                    ;;
                stable)
                    # Remove -rc suffix
                    NEXT_VER=$(echo "$CURRENT_VER" | sed 's/-rc\.[0-9]*$//')
                    ;;
                rc)
                    # Increment RC number
                    RC_NUM=$(echo "$CURRENT_VER" | sed 's/.*-rc\.\([0-9]*\)$/\1/')
                    NEXT_VER=$(echo "$CURRENT_VER" | sed "s/-rc\.$RC_NUM$/-rc.$((RC_NUM + 1))/")
                    ;;
                *)
                    NEXT_VER="$CURRENT_VER"
                    ;;
            esac

            # Generate release notes with Claude using conventional commit format
            # Use Haiku for speed and cost efficiency
            if command -v claude &> /dev/null; then
                echo "📝 Using Claude AI to analyze git changes and generate professional release notes..."

                AI_PROMPT="Generate comprehensive GitHub release notes for version $NEXT_VER (comparing current HEAD to ${LAST_TAG:-previous commits}).

Analyze the git diff and commits to create professional release notes following this structure:

# Release v$NEXT_VER

## 📋 Overview
[1-2 sentence summary of the release - what's the main theme/focus?]

## ✨ Features
[List NEW features/capabilities added in this release]
- Feature 1 with brief description
- Feature 2 with brief description

## 🔧 Improvements
[List enhancements to existing features]
- Improvement 1
- Improvement 2

## 🐛 Bug Fixes
[List bugs fixed]
- Fix 1
- Fix 2

## 📊 Statistics
- **Files Changed:** [count from git diff --stat]
- **Lines Added:** [count]
- **Lines Removed:** [count]

## 🚀 Deployment
[If there are environment variable changes or deployment considerations, list them here]

## 📝 Migration Notes
**Breaking Changes:** [List any breaking changes or write 'None']
**Recommended Actions:** [List any actions users should take]

---
**Full Changelog**: https://github.com/$REPO/compare/${LAST_TAG:-initial}...v$NEXT_VER

IMPORTANT RULES:
1. Analyze ACTUAL code changes (git diff), NOT commit messages
2. IGNORE commits starting with: 'Perfect!', 'Excellent!', 'I see', 'Let me', 'Now', '---'
3. Focus on user-facing changes
4. Be concise but informative
5. Use proper markdown formatting
6. If a section is empty, omit it entirely
7. Write in present tense (e.g., 'Adds support' not 'Added support')
8. Group related changes together
9. Prioritize clarity over completeness"

                claude -p --model haiku "$AI_PROMPT" > .release-notes-draft.md 2>/dev/null || {
                    echo "⚠️  Claude AI failed, falling back to simple method"
                    # Fallback: filter out AI agent commit messages
                    COMMITS=$(git log ${ANALYSIS_FROM:+$ANALYSIS_FROM..}HEAD --pretty=format:"%s" --no-merges | \
                        grep -v -E "^(Perfect!|Excellent!|Great!|I see|Let me|Now|I'll|I've|---|Merge pull request)" | \
                        sed 's/^/- /' | head -20)

                    cat > .release-notes-draft.md <<EOF
# Release v$NEXT_VER

## 📋 What's Changed

$COMMITS

---
**Full Changelog**: https://github.com/$REPO/compare/${ANALYSIS_FROM:-initial}...v$NEXT_VER
EOF
                }

                echo "✅ AI-powered release notes generated"
            else
                echo "⚠️  Claude CLI not available, using fallback method"
                # Fallback: filter out AI agent commit messages
                COMMITS=$(git log ${ANALYSIS_FROM:+$ANALYSIS_FROM..}HEAD --pretty=format:"%s" --no-merges | \
                    grep -v -E "^(Perfect!|Excellent!|Great!|I see|Let me|Now|I'll|I've|---|Merge pull request)" | \
                    sed 's/^/- /' | head -20)

                cat > .release-notes-draft.md <<EOF
# Release v$NEXT_VER

## 📋 What's Changed

$COMMITS

---
**Full Changelog**: https://github.com/$REPO/compare/${ANALYSIS_FROM:-initial}...v$NEXT_VER
EOF

                echo "✅ Release notes generated (install Claude CLI for AI-powered notes: npm install -g @anthropic-ai/claude-cli)"
            fi

            # Interactive loop with enhanced review flow (skip if non-interactive)
            if [ "$NON_INTERACTIVE" = "true" ] || [ "$AUTO_APPROVE" = "true" ]; then
                echo "✅ Auto-approving release notes (non-interactive mode)"
                cp .release-notes-draft.md "$SAVED_NOTES_FILE"
            else
                while true; do
                    clear
                    echo "╔═══════════════════════════════════════════════════════════════╗"
                    echo "║                🚀 Release Notes Review                         ║"
                    echo "╚═══════════════════════════════════════════════════════════════╝"
                    echo ""

                    # Display release notes
                    if [ -f ".release-notes-draft.md" ]; then
                        LINE_COUNT=$(wc -l < .release-notes-draft.md)
                        echo "📄 Release Notes ($LINE_COUNT lines):"
                        echo "───────────────────────────────────────────────────────────────"
                        cat .release-notes-draft.md
                        echo "───────────────────────────────────────────────────────────────"
                    else
                        echo "❌ No release notes found!"
                    fi

                    echo ""
                    echo "═══════════════════════════════════════════════════════════════"
                    echo ""

                    PS3="Choose an action: "
                    select choice in "✅ Accept and continue" "✏️  Edit manually" "❌ Cancel release"; do
                    case $choice in
                        "✅ Accept and continue")
                            echo "✅ Release notes accepted!"
                            cp .release-notes-draft.md "$SAVED_NOTES_FILE"
                            break 2
                            ;;
                        "✏️  Edit manually")
                            echo "🖊️  Opening release notes in editor..."
                            ${EDITOR:-nano} .release-notes-draft.md
                            break
                            ;;
                        "❌ Cancel release")
                            echo "❌ Release cancelled by user"
                            rm -f .release-notes-draft.md
                            exit 1
                            ;;
                        *)
                            echo "❌ Invalid choice."
                            ;;
                    esac
                done
            done
            fi

            # Generate Genie-style welcome message for releases.json
            echo ""
            echo "🧞 Generating Genie-style welcome message for frontend..."

            if command -v claude &> /dev/null; then
                GENIE_PROMPT="You are Genie, the friendly AI assistant for Automagik Forge. Convert the following technical release notes into a warm, conversational message for users opening the app.

Technical Release Notes:
$(cat .release-notes-draft.md)

Create a JSON object with this structure:
{
  \"tag_name\": \"v$NEXT_VER\",
  \"name\": \"Automagik Forge v$NEXT_VER\",
  \"body\": \"[Your conversational message here - write as if Genie is talking directly to the user about this release. Be warm, friendly, and highlight the most exciting changes. Use emojis sparingly but effectively. Keep it concise but informative.]\",
  \"html_url\": \"https://github.com/$REPO/releases/tag/v$NEXT_VER\",
  \"published_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"prerelease\": false
}

IMPORTANT RULES:
1. Write in first person as Genie ('I', 'we')
2. Focus on what USERS will notice or experience (not implementation details)
3. Use simple, everyday language - avoid ALL tech jargon (NPX, .env, git, Claude, API, CLI, etc.)
4. Highlight 2-3 most exciting user-facing improvements
5. Explain benefits in terms of their experience using Forge
6. Keep it brief, upbeat, and conversational
7. The body should be markdown formatted
8. Return ONLY valid JSON, no other text or explanation"

                # Generate Genie message
                claude -p --model haiku "$GENIE_PROMPT" > .genie-welcome-draft-raw.json 2>/dev/null || {
                    echo "⚠️  Claude failed to generate Genie message, using fallback"
                    # Fallback to simple JSON
                    cat > .genie-welcome-draft.json <<EOF
{
  "tag_name": "v$NEXT_VER",
  "name": "Automagik Forge v$NEXT_VER",
  "body": "$(cat .release-notes-draft.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')",
  "html_url": "https://github.com/$REPO/releases/tag/v$NEXT_VER",
  "published_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "prerelease": false
}
EOF
                }

                # Strip markdown code blocks if present
                if [ -f ".genie-welcome-draft-raw.json" ]; then
                    if grep -q '```json' .genie-welcome-draft-raw.json; then
                        sed -n '/```json/,/```/p' .genie-welcome-draft-raw.json | sed '1d;$d' > .genie-welcome-draft.json
                    else
                        cp .genie-welcome-draft-raw.json .genie-welcome-draft.json
                    fi
                    rm -f .genie-welcome-draft-raw.json
                fi

                # Update releases.json
                if [ -f "frontend/public/releases.json" ]; then
                    echo "📝 Updating frontend/public/releases.json..."

                    # Read existing releases
                    EXISTING_RELEASES=$(cat frontend/public/releases.json)

                    # Add new release to the beginning of the array
                    NEW_RELEASE=$(cat .genie-welcome-draft.json)

                    # Create updated releases.json with new release prepended
                    echo "$EXISTING_RELEASES" | jq --argjson new "$NEW_RELEASE" '. = [$new] + .' > frontend/public/releases.json.tmp
                    mv frontend/public/releases.json.tmp frontend/public/releases.json

                    echo "✅ Updated releases.json with Genie welcome message"

                    # Clean up
                    rm -f .genie-welcome-draft.json
                else
                    echo "⚠️  frontend/public/releases.json not found, skipping update"
                fi
            else
                echo "⚠️  Claude CLI not available, skipping Genie message generation"
                echo "   Install Claude CLI: npm install -g @anthropic-ai/claude-cli"
            fi
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
            
            # Trigger the version bump workflow
            gh workflow run "Version Bump and Tag" --repo "$REPO" -f version_type="$VERSION_TYPE" || {
                echo "❌ Failed to trigger version bump workflow"
                rm -f .release-notes-draft.md
                exit 1
            }
            
            echo "⏳ Waiting for version bump workflow to start..."
            sleep 10
            
            # Find the workflow run
            PRERELEASE_RUN=$(gh run list --workflow="Version Bump and Tag" --repo "$REPO" --limit 1 --json databaseId,status --jq '.[0] | select(.status != "completed") | .databaseId')
            
            if [ -z "$PRERELEASE_RUN" ]; then
                echo "⚠️  Could not find the pre-release workflow run"
                echo "Check manually at: https://github.com/$REPO/actions"
                exit 1
            fi
            
            echo "📋 Version bump workflow started: Run ID $PRERELEASE_RUN"
            echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$PRERELEASE_RUN"
            echo ""
            echo "⏳ Monitoring version bump..."
            
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
                            echo "🔍 Finding created release..."

                            # Get the most recent release (stable or pre-release)
                            RELEASE_INFO=$(gh release list --repo "$REPO" --limit 1 --json tagName,isPrerelease,name --jq '.[0]')
                            NEW_TAG=$(echo "$RELEASE_INFO" | jq -r '.tagName')
                            IS_PRERELEASE=$(echo "$RELEASE_INFO" | jq -r '.isPrerelease')

                            if [ -z "$NEW_TAG" ] || [ "$NEW_TAG" = "null" ]; then
                                echo "❌ Could not find the created release"
                                exit 1
                            fi

                            # Extract version from tag (strip v prefix and optional timestamp suffix)
                            NEW_VERSION=$(echo "$NEW_TAG" | sed 's/^v//' | sed 's/-[0-9]*$//')

                            if [ "$IS_PRERELEASE" = "true" ]; then
                                echo "✅ Pre-release created: $NEW_TAG (version: $NEW_VERSION)"
                            else
                                echo "✅ Stable release created: $NEW_TAG (version: $NEW_VERSION)"
                            fi

                            # IMPORTANT: Tags pushed with GITHUB_TOKEN don't trigger workflows
                            # We need to explicitly trigger the build workflow
                            echo ""
                            echo "🚀 Explicitly triggering build workflow for tag $NEW_TAG..."
                            echo "(GitHub Actions security prevents tag-triggered workflows from GITHUB_TOKEN)"
                            
                            # Trigger build-all-platforms.yml with the specific tag
                            gh workflow run "Build All Platforms" --repo "$REPO" --field tag="$NEW_TAG" || {
                                echo "❌ Failed to trigger build workflow"
                                echo "You can manually trigger it at: https://github.com/$REPO/actions/workflows/build-all-platforms.yml"
                                exit 1
                            }
                            
                            echo "⏳ Waiting for build workflow to start..."
                            sleep 15
                            
                            # Find the workflow run we just triggered (by tag name in headBranch)
                            BUILD_RUN=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --limit 3 --json databaseId,headBranch,createdAt --jq '.[] | select(.headBranch == "'"$NEW_TAG"'") | .databaseId' | head -1)
                            
                            if [ -z "$BUILD_RUN" ]; then
                                # Fallback: get the most recent run  
                                echo "⚠️  Could not find run by tag, using most recent run..."
                                BUILD_RUN=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
                            fi
                            
                            if [ -n "$BUILD_RUN" ]; then
                                echo "📋 Build workflow started: Run ID $BUILD_RUN"
                                echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$BUILD_RUN"
                                echo ""
                                echo "⏳ Monitoring build (this will take ~30-45 minutes)..."
                                
                                # Monitor the build workflow
                                while true; do
                                    BUILD_STATUS=$(gh run view "$BUILD_RUN" --repo "$REPO" --json status --jq '.status')
                                    echo -n "[$(date +%H:%M:%S)] Build status: $BUILD_STATUS"
                                    
                                    case "$BUILD_STATUS" in
                                        completed)
                                            BUILD_CONCLUSION=$(gh run view "$BUILD_RUN" --repo "$REPO" --json conclusion --jq '.conclusion')
                                            if [ "$BUILD_CONCLUSION" = "success" ]; then
                                                echo " ✅"
                                                echo "✅ Build completed successfully! NPM package should be published."
                                                
                                                # Verify NPM publication
                                                echo ""
                                                echo "🔍 Verifying NPM publication..."
                                                sleep 30  # Give npm registry time to update
                                                
                                                NPM_VERSION=$(npm view automagik-forge version 2>/dev/null || echo "")
                                                if [ "$NPM_VERSION" = "$NEW_VERSION" ]; then
                                                    echo "✅ Version $NEW_VERSION successfully published to NPM!"
                                                else
                                                    echo "⚠️  NPM version check shows: $NPM_VERSION (expected $NEW_VERSION)"
                                                    echo "   It may take a few minutes for NPM to update."
                                                fi
                                            else
                                                echo " ❌"
                                                echo "❌ Build failed! Check the logs:"
                                                echo "https://github.com/$REPO/actions/runs/$BUILD_RUN"
                                                exit 1
                                            fi
                                            break
                                            ;;
                                        *)
                                            echo " - waiting..."
                                            sleep 30
                                            ;;
                                    esac
                                done
                            else
                                echo "❌ Could not find build workflow run"
                                echo "You can manually trigger it at: https://github.com/$REPO/actions/workflows/build-all-platforms.yml"
                                exit 1
                            fi
                            
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
        
        PUBLISH_RUN=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --limit 1 --json databaseId,createdAt --jq '.[0].databaseId')
        
        if [ -n "$PUBLISH_RUN" ]; then
            echo "📋 NPM publish workflow started: Run ID $PUBLISH_RUN"
            echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$PUBLISH_RUN"
            echo ""
            echo "⏳ Monitoring npm publish..."
            
            # Monitor the publish workflow
            BUILD_SUCCESS=false
            while true; do
                STATUS=$(gh run view "$PUBLISH_RUN" --repo "$REPO" --json status --jq '.status')
                echo -n "[$(date +%H:%M:%S)] Publish status: $STATUS"

                case "$STATUS" in
                    completed)
                        CONCLUSION=$(gh run view "$PUBLISH_RUN" --repo "$REPO" --json conclusion --jq '.conclusion')
                        if [ "$CONCLUSION" = "success" ]; then
                            echo " ✅"
                            BUILD_SUCCESS=true
                            break
                        else
                            echo " ❌"
                            echo ""
                            # Treat as success if npm already has the new version (idempotent publish)
                            NPM_VER=$(npm view automagik-forge version 2>/dev/null || echo "")
                            if [ -n "$NEW_VERSION" ] && [ "$NPM_VER" = "$NEW_VERSION" ]; then
                                echo "✅ Detected $NPM_VER on npm (expected $NEW_VERSION). Considering publish successful."
                                BUILD_SUCCESS=true
                                break
                            fi

                            echo "❌ NPM publish workflow failed!"
                            echo "🔗 View logs: https://github.com/$REPO/actions/runs/$PUBLISH_RUN"
                            echo ""
                            read -p "Retry the build? (y/n): " RETRY_BUILD
                            if [ "$RETRY_BUILD" = "y" ] || [ "$RETRY_BUILD" = "Y" ]; then
                                echo "🔄 Retrying build workflow..."
                                gh run rerun "$PUBLISH_RUN" --repo "$REPO" --failed
                                echo ""
                                echo "⏳ Waiting for retry to start..."
                                sleep 10
                                # Get the new run ID
                                NEW_PUBLISH_RUN=$(gh run list --workflow="Build All Platforms" --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
                                if [ "$NEW_PUBLISH_RUN" != "$PUBLISH_RUN" ]; then
                                    PUBLISH_RUN="$NEW_PUBLISH_RUN"
                                    echo "📋 Monitoring retry: Run ID $PUBLISH_RUN"
                                    echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$PUBLISH_RUN"
                                    echo ""
                                    continue  # Continue monitoring the new run
                                fi
                            else
                                echo ""
                                echo "❌ Build failed and retry declined"
                                echo ""
                                echo "To retry later, run:"
                                echo "  gh run rerun $PUBLISH_RUN --repo $REPO --failed"
                                echo "  # or"
                                echo "  make publish"
                                exit 1
                            fi
                            break
                        fi
                        ;;
                    *)
                        echo ""
                        sleep 30
                        ;;
                esac
            done

            # Only show success if build actually succeeded
            if [ "$BUILD_SUCCESS" = true ]; then
                echo ""
                echo "🎉 Release complete!"
                echo "📦 Version $NEW_VERSION published"
                echo "📦 NPM package: https://www.npmjs.com/package/automagik-forge"
                echo "🏷️  GitHub release: https://github.com/$REPO/releases/tag/$NEW_TAG"
            else
                exit 1
            fi
        else
            echo "⚠️  No publish workflow detected"
            exit 1
        fi
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

        echo "╔═══════════════════════════════════════════════════════════════╗"
        echo "║              📊 Monitoring Workflow Run $RUN_ID              ║"
        echo "╚═══════════════════════════════════════════════════════════════╝"
        echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
        echo "📋 Press Ctrl+C to stop monitoring"
        echo ""

        LAST_STATUS=""
        START_TIME=$(date +%s)

        while true; do
            # Get workflow details
            WORKFLOW_DATA=$(gh run view "$RUN_ID" --repo "$REPO" --json status,conclusion,jobs 2>/dev/null)

            if [ -z "$WORKFLOW_DATA" ] || [ "$WORKFLOW_DATA" = "null" ]; then
                echo "[$(date +%H:%M:%S)] ❌ Failed to fetch workflow data"
                sleep 10
                continue
            fi

            STATUS=$(echo "$WORKFLOW_DATA" | jq -r '.status')
            CURRENT_TIME=$(date +%s)
            ELAPSED=$((CURRENT_TIME - START_TIME))
            ELAPSED_MIN=$((ELAPSED / 60))
            ELAPSED_SEC=$((ELAPSED % 60))

            # Only show status updates when it changes or every 30 seconds
            if [ "$STATUS" != "$LAST_STATUS" ] || [ $((ELAPSED % 30)) -eq 0 ]; then
                echo -n "[$(date +%H:%M:%S)] [${ELAPSED_MIN}m${ELAPSED_SEC}s] "

            case "$STATUS" in
                completed)
                    CONCLUSION=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion --jq '.conclusion')
                    case "$CONCLUSION" in
                        success)
                            echo "✅ Workflow completed successfully!"
                            echo "🔗 View details: https://github.com/$REPO/actions/runs/$RUN_ID"

                            # Check if this workflow has a publish job (indicates it should publish to npm)
                            HAS_PUBLISH_JOB=$(echo "$WORKFLOW_DATA" | jq -r '.jobs[] | select(.name == "publish") | .name' 2>/dev/null)

                            if [ -n "$HAS_PUBLISH_JOB" ]; then
                                echo ""
                                echo "🔍 Verifying NPM publication..."
                                echo "   Waiting 30 seconds for npm registry to update..."
                                sleep 30

                                # Try to get expected version from latest release tag (more reliable than package.json)
                                EXPECTED_VERSION=$(gh release list --repo "$REPO" --limit 1 --json tagName --jq '.[0].tagName' 2>/dev/null | sed 's/^v//' | sed 's/-[0-9]*$//')

                                # Fallback to package.json if no release found
                                if [ -z "$EXPECTED_VERSION" ]; then
                                    EXPECTED_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
                                fi

                                echo "   Expected version: $EXPECTED_VERSION (from latest GitHub release)"

                                for i in {1..10}; do
                                    NPM_VERSION=$(npm view automagik-forge version 2>/dev/null || echo "")
                                    echo "  Attempt $i/10: npm shows version '$NPM_VERSION'"

                                    if [ "$NPM_VERSION" = "$EXPECTED_VERSION" ]; then
                                        echo ""
                                        echo "✅ SUCCESS! Version $EXPECTED_VERSION published to NPM!"
                                        echo "📦 Package ready: https://www.npmjs.com/package/automagik-forge"
                                        echo "🚀 Users can now install with: npx automagik-forge"
                                        break
                                    fi

                                    if [ $i -lt 10 ]; then
                                        sleep 10
                                    fi
                                done

                                if [ "$NPM_VERSION" != "$EXPECTED_VERSION" ]; then
                                    echo ""
                                    echo "⚠️  NPM still shows: '$NPM_VERSION' (expected '$EXPECTED_VERSION')"
                                    echo "   Package may still be propagating through npm registry"
                                    echo "   Check: https://www.npmjs.com/package/automagik-forge"
                                fi
                            fi
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

                    # Show job statuses with better formatting
                    JOBS_INFO=$(echo "$WORKFLOW_DATA" | jq -r '.jobs[] | "    \(.name): \(.status) \(if .conclusion then "(\(.conclusion))" else "" end)"')
                    if [ -n "$JOBS_INFO" ]; then
                        echo "$JOBS_INFO" | while read -r line; do
                            if echo "$line" | grep -q "completed"; then
                                if echo "$line" | grep -q "success"; then
                                    echo "    ✅ $(echo "$line" | sed 's/: completed (success)//')"
                                elif echo "$line" | grep -q "failure"; then
                                    echo "    ❌ $(echo "$line" | sed 's/: completed (failure)//')"
                                else
                                    echo "    ⚠️  $line"
                                fi
                            elif echo "$line" | grep -q "in_progress"; then
                                echo "    🔄 $(echo "$line" | sed 's/: in_progress//')"
                            else
                                echo "    ⏳ $line"
                            fi
                        done
                    fi

                    LAST_STATUS="$STATUS"
                    sleep 15
                    ;;
                *)
                    echo "❓ Unknown status: $STATUS"
                    break
                    ;;
            esac
            fi
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
        echo "  ./gh-build.sh trigger [tag]   - Manually trigger workflow (with optional tag)"
        echo "  ./gh-build.sh publish-tag TAG - Quick publish for specific tag (no rebuild)"
        echo "  ./gh-build.sh monitor [id]    - Monitor latest/specific run"
        echo "  ./gh-build.sh download [id]   - Download artifacts"
        echo "  ./gh-build.sh publish [type]  - Publish management:"
        echo "    - check   - Check current publish status"
        echo "    - manual  - Manually publish from artifacts"
        echo "    - auto    - Monitor automatic tag-based publish"
        echo "  ./gh-build.sh publish         - Interactive release (smart resume)"
        echo "  ./gh-build.sh beta            - Auto-incremented beta release"
        echo "  ./gh-build.sh status          - Show this status"
        echo ""
        echo "Quick Resume Examples:"
        echo "  ./gh-build.sh publish-tag v0.3.11-20251014203510  # Publish existing tag"
        echo "  ./gh-build.sh trigger v0.3.11-20251014203510      # Rebuild + publish"
        ;;
esac
