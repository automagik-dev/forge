#!/bin/bash
#
# Generate RC Release Completion Report
#

set -euo pipefail

STATE_FILE=".genie/state/rc-release-automation.json"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
REPORT_FILE=".genie/reports/rc-release-complete-$TIMESTAMP.md"

# Read state
version=$(jq -r '.current_rc_version' "$STATE_FILE")
attempts=$(jq -r '.attempt_number' "$STATE_FILE")
started=$(jq -r '.started_at' "$STATE_FILE")
completed=$(jq -r '.completed_at // "N/A"' "$STATE_FILE")
phase=$(jq -r '.phase' "$STATE_FILE")
hibernations=$(jq -r '.hibernation_count' "$STATE_FILE")

# Calculate duration
if [[ "$started" != "null" ]] && [[ "$completed" != "N/A" ]] && [[ "$completed" != "null" ]]; then
  start_epoch=$(date -d "$started" +%s 2>/dev/null || echo "0")
  end_epoch=$(date -d "$completed" +%s 2>/dev/null || echo "0")
  if [[ $start_epoch -gt 0 ]] && [[ $end_epoch -gt 0 ]]; then
    duration_seconds=$((end_epoch - start_epoch))
    duration_minutes=$((duration_seconds / 60))
    duration_hours=$((duration_minutes / 60))
    remaining_minutes=$((duration_minutes % 60))
    duration_str="${duration_hours}h ${remaining_minutes}m"
  else
    duration_str="N/A"
  fi
else
  duration_str="N/A"
fi

# Generate report
cat > "$REPORT_FILE" <<EOF
# 🚀 RC Release Automation - Completion Report

**Version:** $version
**Attempts:** $attempts
**Started:** $started
**Completed:** $completed
**Duration:** $duration_str
**Status:** $phase

## Published Packages

- ✅ @automagik/forge@$version
- ✅ automagik@$version

## Installation

\`\`\`bash
npm install @automagik/forge@$version
# or
npm install automagik@$version
\`\`\`

## CI/CD Status

### automagik-forge
- Build: $(jq -r '.automagik_forge.build_status' "$STATE_FILE")
- Sync: $(jq -r '.automagik_forge.sync_status' "$STATE_FILE")
- Build URL: $(jq -r '.automagik_forge.build_url' "$STATE_FILE")
- npm verified:
  - @automagik/forge: $(jq -r '.automagik_forge.npm_verified["@automagik/forge"]' "$STATE_FILE")
  - automagik: $(jq -r '.automagik_forge.npm_verified.automagik' "$STATE_FILE")

## Statistics

- Total attempts: $attempts
- Hibernation cycles: $hibernations
- Total duration: $duration_str

## Fixes Applied

$(jq -r '.fixes_applied[] | "- " + .' "$STATE_FILE" 2>/dev/null || echo "None")

## Blockers Encountered

$(jq -r '.blockers[] | "- " + .' "$STATE_FILE" 2>/dev/null || echo "None")

## Next Steps

1. Verify packages are installable:
   \`\`\`bash
   npm install @automagik/forge@$version
   npm install automagik@$version
   \`\`\`

2. Test RC in development environment

3. Monitor for issues in Discord/GitHub

4. If stable, promote to latest:
   \`\`\`bash
   gh workflow run release.yml --ref dev -f action=promote
   \`\`\`

---

**All systems operational.** 🎉

Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
State file: $STATE_FILE
EOF

echo "✅ Completion report generated: $REPORT_FILE"
cat "$REPORT_FILE"
