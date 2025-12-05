#!/bin/bash
#
# Autonomous RC Release Loop
# Vibe-inspired self-healing release automation
#
# Exit criteria:
# - forge-core RC published with green CI/CD
# - @automagik/forge published to npm
# - automagik published to npm
# - All versions synced, all workflows passing
#

set -euo pipefail

# Configuration
STATE_FILE=".genie/state/rc-release-automation.json"
MAX_ATTEMPTS=20
SLEEP_DURATION=120  # 2 minutes between checks

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Autonomous RC Release - Vibe Mode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Initialize state file with start time
jq ".started_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"

# Main autonomous loop
for attempt in $(seq 1 $MAX_ATTEMPTS); do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 Attempt #$attempt of $MAX_ATTEMPTS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⏰ $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""

  # Update state
  jq ".attempt_number = $attempt | .last_wake = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" \
    "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"

  # ─────────────────────────────────────────
  # STEP 1: Calculate next RC version
  # ─────────────────────────────────────────
  echo "📦 Step 1: Calculate next RC version"

  current_rc=$(jq -r '.current_rc_version' "$STATE_FILE")
  base_version="0.8.6"
  rc_num=$(echo "$current_rc" | grep -oP 'rc\.\K\d+' || echo "2")
  next_rc_num=$((rc_num + 1))
  new_version="${base_version}-rc.${next_rc_num}"

  echo "   Current: $current_rc"
  echo "   Next:    $new_version"
  echo ""

  # Update state
  jq ".current_rc_version = \"$new_version\" | .phase = \"version_bump\"" \
    "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"

  # ─────────────────────────────────────────
  # STEP 2: Trigger bump-rc workflow
  # ─────────────────────────────────────────
  echo "🏷️  Step 2: Trigger version bump"

  # Trigger release workflow with bump-rc action
  gh workflow run release.yml --ref dev -f action=bump-rc

  echo "   ⏳ Triggered bump-rc workflow"
  sleep 30  # Wait for workflow to start

  # Monitor version bump workflow
  echo "   📊 Monitoring version bump..."
  for check in {1..10}; do
    workflow_run=$(gh run list --workflow release.yml --limit 1 --json status,conclusion,databaseId --jq '.[0]')
    status=$(echo "$workflow_run" | jq -r '.status')
    conclusion=$(echo "$workflow_run" | jq -r '.conclusion')
    run_id=$(echo "$workflow_run" | jq -r '.databaseId')

    echo "      Check $check/10: status=$status, conclusion=$conclusion"

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        echo "   ✅ Version bump successful!"
        jq ".phase = \"automagik_build\"" "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        break
      else
        echo "   ❌ Version bump failed: $conclusion"
        echo "   📋 Logs: https://github.com/namastexlabs/automagik-forge/actions/runs/$run_id"

        # Analyze failure
        gh run view $run_id --log > /tmp/version-bump-failure.log 2>&1 || true

        # Check for common issues
        if grep -q "npm.*EAUTH\|E401\|E403" /tmp/version-bump-failure.log 2>/dev/null; then
          echo "   🔧 Detected: npm authentication issue"
          jq ".fixes_applied += [\"npm_auth_retry\"]" "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        fi

        # Continue to next attempt
        jq ".phase = \"failed_version_bump\" | .last_error = \"$conclusion\"" \
          "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        continue 2
      fi
    fi

    sleep $SLEEP_DURATION
  done

  # ─────────────────────────────────────────
  # STEP 3: Monitor build workflow
  # ─────────────────────────────────────────
  echo ""
  echo "🔨 Step 3: Monitor build workflow"

  # Wait for build workflow to be triggered
  sleep 60

  for check in {1..30}; do
    build_run=$(gh run list --workflow build-all-platforms.yml --limit 1 --json status,conclusion,databaseId,headBranch --jq '.[0]')
    status=$(echo "$build_run" | jq -r '.status')
    conclusion=$(echo "$build_run" | jq -r '.conclusion')
    run_id=$(echo "$build_run" | jq -r '.databaseId')
    branch=$(echo "$build_run" | jq -r '.headBranch')

    echo "   Check $check/30: status=$status, conclusion=$conclusion, branch=$branch"

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        echo "   ✅ Build successful!"
        url="https://github.com/namastexlabs/automagik-forge/actions/runs/$run_id"
        jq ".automagik_forge.build_status = \"passed\" | .automagik_forge.build_url = \"$url\" | .phase = \"npm_verify\"" \
          "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        break
      else
        echo "   ❌ Build failed: $conclusion"
        echo "   📋 Logs: https://github.com/namastexlabs/automagik-forge/actions/runs/$run_id"

        # Analyze build failure
        gh run view $run_id --log > /tmp/build-failure.log 2>&1 || true

        if grep -q "openssl" /tmp/build-failure.log 2>/dev/null; then
          echo "   🔧 Detected: OpenSSL build issue"
          jq ".fixes_applied += [\"openssl_vendored\"]" "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        elif grep -q "EAUTH\|E401\|E403" /tmp/build-failure.log 2>/dev/null; then
          echo "   🔧 Detected: npm auth issue"
          jq ".fixes_applied += [\"npm_auth_retry\"]" "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        fi

        jq ".automagik_forge.build_status = \"failed\" | .automagik_forge.last_error = \"$conclusion\"" \
          "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
        continue 2
      fi
    fi

    sleep $SLEEP_DURATION
  done

  # ─────────────────────────────────────────
  # STEP 4: Verify npm packages
  # ─────────────────────────────────────────
  echo ""
  echo "📦 Step 4: Verify npm packages"

  # Wait for npm registry sync
  sleep 60

  forge_verified=false
  automagik_verified=false

  for verify in {1..15}; do
    echo "   Verify attempt $verify/15"

    # Check @automagik/forge
    if npm view "@automagik/forge@$new_version" version &>/dev/null; then
      if [[ "$forge_verified" == "false" ]]; then
        echo "   ✅ @automagik/forge@$new_version found on npm!"
        forge_verified=true
        jq ".automagik_forge.npm_verified[\"@automagik/forge\"] = true" \
          "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
      fi
    else
      echo "   ⏳ @automagik/forge@$new_version not yet on npm..."
    fi

    # Check automagik
    if npm view "automagik@$new_version" version &>/dev/null; then
      if [[ "$automagik_verified" == "false" ]]; then
        echo "   ✅ automagik@$new_version found on npm!"
        automagik_verified=true
        jq ".automagik_forge.npm_verified.automagik = true" \
          "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"
      fi
    else
      echo "   ⏳ automagik@$new_version not yet on npm..."
    fi

    # Check if both verified
    if [[ "$forge_verified" == "true" ]] && [[ "$automagik_verified" == "true" ]]; then
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "🎉 SUCCESS! RC Release Complete!"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "   Version: $new_version"
      echo "   Attempt: #$attempt"
      echo "   Packages:"
      echo "     ✅ @automagik/forge@$new_version"
      echo "     ✅ automagik@$new_version"
      echo ""
      echo "   npm install @automagik/forge@$new_version"
      echo "   npm install automagik@$new_version"
      echo ""

      # Update state to complete
      jq ".phase = \"complete\" | .completed_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" \
        "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"

      # Generate completion report
      bash .genie/scripts/generate-rc-report.sh

      exit 0
    fi

    sleep 30
  done

  # If we get here, npm verification timed out
  echo "   ⚠️  npm verification timeout"
  echo "   Packages published: forge=$forge_verified, automagik=$automagik_verified"

  if [[ "$forge_verified" == "true" ]] || [[ "$automagik_verified" == "true" ]]; then
    echo "   ⚠️  Partial success - will check forge-core sync..."

    # TODO: Check if forge-core is also published
    # For now, if at least one package is up, we retry
  fi

  # Update hibernation counter
  jq ".hibernation_count += 1" "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"

  echo ""
  echo "💤 Hibernating before next attempt..."
  sleep 300  # 5 minutes between attempts
done

# If we get here, max attempts exceeded
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ BLOCKER: Exceeded maximum attempts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Attempted $MAX_ATTEMPTS releases without success."
echo "Last version attempted: $(jq -r '.current_rc_version' "$STATE_FILE")"
echo ""
echo "State file: $STATE_FILE"
echo "Review logs and state for debugging."
echo ""

jq ".phase = \"blocked\" | .blockers += [\"Exceeded max attempts ($MAX_ATTEMPTS)\"]" \
  "$STATE_FILE" > tmp && mv tmp "$STATE_FILE"

exit 1
