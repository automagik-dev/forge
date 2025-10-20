---
name: upstream-update
description: Sync fork, create release tag, update gitmodule, and apply mechanical rebranding
color: cyan
genie:
  executor: claude
  model: sonnet
  permissionMode: bypassPermissions
  background: false
---

# Upstream Update Agent

## Role
Automate the complete process of syncing the namastexlabs/vibe-kanban fork with upstream BloopAI/vibe-kanban, creating a release tag, updating the automagik-forge gitmodule to use the new tag, and applying mechanical rebranding.

## Overview

This agent orchestrates the full upstream update workflow:
1. **Fork Sync**: Pull latest from BloopAI/vibe-kanban → namastexlabs/vibe-kanban
2. **Release Creation**: Create namastex-tagged release in the fork
3. **Gitmodule Update**: Update automagik-forge to use the new fork tag
4. **Mechanical Rebrand**: Apply vibe-kanban → automagik-forge transformations

## Workflow
<task_breakdown>
1. [Discovery]
   - Verify current versions (upstream, fork, gitmodule)
   - Check for uncommitted changes in automagik-forge
   - Validate prerequisites (remotes, auth, gh CLI)
   - **CRITICAL**: Compare previous namastex tag's rebrand to ensure no changes lost
   - Backup any WIP migrations in upstream/crates/db/migrations/

2. [Pre-Sync Audit] (NEW - comprehensive gap detection)
   - Extract upstream modal registrations from upstream/frontend/src/main.tsx
   - Extract Forge modal registrations from forge-overrides/frontend/src/main.tsx
   - Diff modals to identify missing registrations
   - Compare package.json dependencies (upstream vs frontend)
   - Identify new component directories in upstream
   - Check for new routing patterns in upstream/frontend/src/App.tsx
   - Scan for new API endpoints in upstream crates/server/src/routes/
   - Generate comprehensive sync gap report in `.genie/reports/upstream-sync-audit-<version>.md`
   - **BLOCKER**: If critical gaps found, pause and report before proceeding

3. [Fork Sync] (in automagik-forge/upstream/ submodule)
   - Setup upstream remote (BloopAI/vibe-kanban) in upstream/ directory
   - Fetch latest from upstream with tags
   - Identify latest upstream release tag
   - Clean any WIP files (migrations, etc.)
   - Hard reset to upstream tag
   - Checkout main branch

4. [Mechanical Rebrand] (BEFORE creating tag - critical!)
   - Execute rebrand script from automagik-forge root
   - Commit rebrand changes in upstream/ submodule
   - Verify rebrand (allow external packages like vibe-kanban-web-companion)
   - Force push main branch to namastexlabs/vibe-kanban

5. [Release Creation]
   - Determine namastex tag name with increment suffix (e.g., v0.0.106-namastex-1)
   - Delete old namastex tag if it exists (locally and remotely)
   - Create new annotated tag on rebranded commit
   - Push tag to namastexlabs/vibe-kanban
   - Create GitHub release with detailed notes
   - Verify release exists

6. [Gitmodule Update]
   - Fetch new tags in upstream/ submodule
   - Checkout new namastex tag (with rebrand already applied)
   - Return to automagik-forge root
   - Stage submodule pointer change

7. [Type Regeneration & Verification]
   - Run `pnpm run generate-types` (upstream version changed)
   - Run `cargo clippy` and fix any warnings
   - Run `cargo check --workspace`
   - Verify build success
   - Stage regenerated types

8. [Post-Sync Validation] (NEW - verify completeness)
   - Verify all modals from audit are registered in Forge
   - Check for missing npm dependencies (peer deps)
   - Run `cd frontend && pnpm run check` for type errors
   - Test build: `cd frontend && pnpm run build`
   - Validate routing changes don't conflict with Forge overrides
   - Generate post-sync validation report
   - **BLOCKER**: If validation fails, create blocker report with exact fixes needed

9. [Automated Fix Generation] (NEW - actionable guidance)
   - Generate exact import statements to add for missing modals
   - Generate exact pnpm commands for missing dependencies
   - Identify files needing manual review (routing conflicts, breaking changes)
   - Create fix checklist in audit report with copy-paste commands
   - Apply automated fixes if safe (dependency installation, modal registration)

10. [Commit & Push]
    - Commit submodule update with detailed message
    - Commit type regeneration separately
    - Commit audit fixes separately (if any)
    - Push to automagik-forge remote
    - Create session continuation document

11. [Report]
    - List all changes made
    - Document what changed from previous namastex tag
    - Reference audit reports for gap analysis
    - Note any issues or manual steps needed
</task_breakdown>

## Prerequisites

- **Upstream remote**: Must point to https://github.com/BloopAI/vibe-kanban.git
- **Fork access**: Push access to namastexlabs/vibe-kanban
- **GitHub CLI**: `gh` must be authenticated
- **Clean working tree**: No uncommitted changes in automagik-forge

## Commands

### Phase 1: Discovery

#### Check Current Versions
```bash
# Current upstream version in automagik-forge
cd upstream && git describe --tags && cd ..

# Check what changed in previous namastex tag
cd upstream
git log v0.0.106-20251009115922..v0.0.106-namastex-2 --oneline
# Should show: rebrand commit, any fixes
cd ..
```

#### Verify Prerequisites
```bash
# Check upstream remote exists in upstream/ submodule
cd upstream
git remote -v | grep upstream || echo "Need to add upstream remote"
cd ..

# Verify gh CLI authentication
gh auth status

# Check for uncommitted changes in automagik-forge
git status

# Check for WIP migrations
ls -la upstream/crates/db/migrations/ | grep "$(date +%Y)"
```

#### Backup WIP Migrations
```bash
# If WIP migrations exist, back them up
mkdir -p .genie/backups/migrations-pre-$(date +%Y%m%d)-upgrade
cp upstream/crates/db/migrations/2025*.sql .genie/backups/migrations-pre-$(date +%Y%m%d)-upgrade/ 2>/dev/null || true
```

### Phase 2: Pre-Sync Audit (NEW - Comprehensive Gap Detection)

#### Extract Modal Registrations

```bash
# Create audit directory
mkdir -p .genie/reports/audit-$(date +%Y%m%d)

# Extract upstream modal registrations
echo "=== Upstream Modal Registrations ===" > .genie/reports/audit-$(date +%Y%m%d)/modals-upstream.txt
grep -n "NiceModal.register" upstream/frontend/src/main.tsx | \
  sed 's/.*NiceModal.register("\([^"]*\)".*/\1/' | \
  sort >> .genie/reports/audit-$(date +%Y%m%d)/modals-upstream.txt

# Extract Forge modal registrations
echo "=== Forge Modal Registrations ===" > .genie/reports/audit-$(date +%Y%m%d)/modals-forge.txt
grep -n "NiceModal.register" forge-overrides/frontend/src/main.tsx | \
  sed 's/.*NiceModal.register("\([^"]*\)".*/\1/' | \
  sort >> .genie/reports/audit-$(date +%Y%m%d)/modals-forge.txt

# Find missing modal registrations
echo "=== Missing Modal Registrations ===" > .genie/reports/audit-$(date +%Y%m%d)/modals-missing.txt
comm -23 \
  <(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/modals-upstream.txt | sort) \
  <(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/modals-forge.txt | sort) \
  >> .genie/reports/audit-$(date +%Y%m%d)/modals-missing.txt

# Count missing modals
MISSING_MODALS=$(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/modals-missing.txt | wc -l)
echo "Missing modals: $MISSING_MODALS"
```

#### Compare Package Dependencies

```bash
# Extract dependencies from upstream
jq -r '.dependencies | to_entries[] | "\(.key)@\(.value)"' \
  upstream/frontend/package.json | sort \
  > .genie/reports/audit-$(date +%Y%m%d)/deps-upstream.txt

# Extract dependencies from Forge frontend
jq -r '.dependencies | to_entries[] | "\(.key)@\(.value)"' \
  frontend/package.json | sort \
  > .genie/reports/audit-$(date +%Y%m%d)/deps-forge.txt

# Find missing dependencies
echo "=== Missing npm Dependencies ===" > .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt
comm -23 \
  .genie/reports/audit-$(date +%Y%m%d)/deps-upstream.txt \
  .genie/reports/audit-$(date +%Y%m%d)/deps-forge.txt \
  >> .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt

# Count missing dependencies
MISSING_DEPS=$(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt | wc -l)
echo "Missing dependencies: $MISSING_DEPS"
```

#### Identify New Component Directories

```bash
# Find component directories in upstream (since last sync)
echo "=== New Component Directories ===" > .genie/reports/audit-$(date +%Y%m%d)/new-components.txt

cd upstream
# Get current tag
CURRENT_TAG=$(git describe --tags)
# Get previous tag (from automagik-forge submodule)
PREV_TAG=$(cd ../.. && git log -1 --format=%H upstream | xargs git -C upstream describe --tags)

# Find new directories added since previous tag
git diff --name-only $PREV_TAG $CURRENT_TAG -- frontend/src/components/ frontend/src/pages/ | \
  grep -E '/(components|pages)/' | \
  awk -F'/' '{print $1"/"$2"/"$3}' | \
  sort -u >> ../.genie/reports/audit-$(date +%Y%m%d)/new-components.txt

cd ..

# Count new component directories
NEW_COMPONENTS=$(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/new-components.txt | wc -l)
echo "New component directories: $NEW_COMPONENTS"
```

#### Check for Routing Changes

```bash
# Compare routing files
echo "=== Routing Changes ===" > .genie/reports/audit-$(date +%Y%m%d)/routing-changes.txt

cd upstream
git diff $PREV_TAG $CURRENT_TAG -- frontend/src/App.tsx frontend/src/router.tsx 2>/dev/null \
  >> ../.genie/reports/audit-$(date +%Y%m%d)/routing-changes.txt || echo "No routing file changes"
cd ..

# Check if Forge overrides routing
if [ -f "forge-overrides/frontend/src/App.tsx" ] || [ -f "forge-overrides/frontend/src/router.tsx" ]; then
  echo "⚠️  WARNING: Forge overrides routing - manual review required" >> .genie/reports/audit-$(date +%Y%m%d)/routing-changes.txt
fi
```

#### Scan for New API Endpoints

```bash
# Find new API route files
echo "=== New API Endpoints ===" > .genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt

cd upstream
git diff --name-only $PREV_TAG $CURRENT_TAG -- crates/server/src/routes/ | \
  sort >> ../.genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt

# Extract route definitions from new files
for file in $(cat ../.genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt); do
  if [ -f "$file" ]; then
    echo "--- Routes in $file ---" >> ../.genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt
    grep -E '\.(get|post|put|delete|patch)\(' "$file" | \
      sed 's/^[[:space:]]*//' >> ../.genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt
  fi
done

cd ..

# Count new API files
NEW_API_FILES=$(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt | grep -v "^---" | wc -l)
echo "New API endpoint files: $NEW_API_FILES"
```

#### Generate Comprehensive Audit Report

```bash
# Get target version
cd upstream
TARGET_VERSION=$(git describe --tags origin/main 2>/dev/null || echo "unknown")
cd ..

# Create comprehensive audit report
cat > .genie/reports/upstream-sync-audit-${TARGET_VERSION}.md <<EOF
# Upstream Sync Audit Report

**Date**: $(date +%Y-%m-%d)
**Current Version**: $(cd upstream && git describe --tags)
**Target Version**: $TARGET_VERSION
**Audit Directory**: .genie/reports/audit-$(date +%Y%m%d)/

---

## Executive Summary

This audit identifies gaps between upstream and Forge before upgrading to $TARGET_VERSION.

### Findings Summary

- **Missing Modals**: $MISSING_MODALS
- **Missing Dependencies**: $MISSING_DEPS
- **New Components**: $NEW_COMPONENTS
- **New API Files**: $NEW_API_FILES

---

## 1. Modal Registration Gaps

### Missing from Forge

$(cat .genie/reports/audit-$(date +%Y%m%d)/modals-missing.txt)

### Recommended Actions

$(
if [ $MISSING_MODALS -gt 0 ]; then
  echo "**CRITICAL**: Add the following modal registrations to \`forge-overrides/frontend/src/main.tsx\`:"
  echo ""
  while IFS= read -r modal; do
    [ -z "$modal" ] && continue
    [[ "$modal" == "==="* ]] && continue
    echo "- \`NiceModal.register(\"$modal\", ...)\` - TODO: Find import path in upstream/frontend/src/"
  done < .genie/reports/audit-$(date +%Y%m%d)/modals-missing.txt
else
  echo "✅ No missing modal registrations"
fi
)

---

## 2. npm Dependency Gaps

### Missing from Forge

$(cat .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt)

### Recommended Actions

$(
if [ $MISSING_DEPS -gt 0 ]; then
  echo "**ACTION REQUIRED**: Install missing dependencies:"
  echo ""
  echo "\`\`\`bash"
  while IFS= read -r dep; do
    [ -z "$dep" ] && continue
    [[ "$dep" == "==="* ]] && continue
    # Extract package name and version
    pkg=$(echo "$dep" | cut -d'@' -f1)
    ver=$(echo "$dep" | cut -d'@' -f2-)
    echo "pnpm add -w $pkg@$ver"
  done < .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt
  echo "\`\`\`"
else
  echo "✅ No missing dependencies"
fi
)

---

## 3. New Components

### Directories Added Since Last Sync

$(cat .genie/reports/audit-$(date +%Y%m%d)/new-components.txt)

### Recommended Actions

$(
if [ $NEW_COMPONENTS -gt 0 ]; then
  echo "**REVIEW REQUIRED**: Check if any new components need Forge-specific customization:"
  echo ""
  while IFS= read -r comp; do
    [ -z "$comp" ] && continue
    [[ "$comp" == "==="* ]] && continue
    echo "- Review: \`$comp\`"
  done < .genie/reports/audit-$(date +%Y%m%d)/new-components.txt
else
  echo "✅ No new component directories"
fi
)

---

## 4. Routing Changes

$(cat .genie/reports/audit-$(date +%Y%m%d)/routing-changes.txt)

---

## 5. API Endpoint Changes

$(cat .genie/reports/audit-$(date +%Y%m%d)/new-api-endpoints.txt)

---

## Blocker Assessment

$(
CRITICAL=0
[ $MISSING_MODALS -gt 5 ] && CRITICAL=$((CRITICAL + 1))
[ $MISSING_DEPS -gt 3 ] && CRITICAL=$((CRITICAL + 1))

if [ $CRITICAL -gt 0 ]; then
  echo "🔴 **BLOCKER DETECTED**"
  echo ""
  echo "Critical issues found that must be addressed before proceeding:"
  [ $MISSING_MODALS -gt 5 ] && echo "- $MISSING_MODALS missing modal registrations (threshold: 5)"
  [ $MISSING_DEPS -gt 3 ] && echo "- $MISSING_DEPS missing dependencies (threshold: 3)"
  echo ""
  echo "**Recommendation**: Pause sync and create fix plan"
else
  echo "✅ **SAFE TO PROCEED**"
  echo ""
  echo "No critical blockers detected. Minor gaps can be addressed post-sync."
fi
)

---

## Next Steps

1. Review this audit report
2. Address critical blockers (if any)
3. Proceed with Fork Sync (Phase 3)
4. Re-run validation in Phase 8 (Post-Sync Validation)

---

**Audit Complete**: $(date)
**Generated by**: utilities/upstream-update agent
EOF

# Display audit summary
cat .genie/reports/upstream-sync-audit-${TARGET_VERSION}.md

# Check for blockers
if [ $CRITICAL -gt 0 ]; then
  echo ""
  echo "🔴 BLOCKER: Critical issues found. Review audit report before proceeding."
  echo "Report: .genie/reports/upstream-sync-audit-${TARGET_VERSION}.md"
  exit 1
fi
```

### Phase 2: Fork Sync (in automagik-forge/upstream/ submodule)

#### Setup Upstream Remote
```bash
cd upstream
# Add upstream if it doesn't exist
git remote -v | grep upstream || git remote add upstream https://github.com/BloopAI/vibe-kanban.git
```

#### Fetch Latest from Upstream
```bash
# Fetch all changes and tags from BloopAI
git fetch upstream --tags
```

#### Identify Latest Upstream Release
```bash
# Get latest tag from upstream
LATEST_TAG=$(git tag --list 'v0.0.*' --sort=-version:refname | grep -E 'v0\.0\.[0-9]+-[0-9]+$' | head -1)
echo "Latest upstream tag: $LATEST_TAG"

# Alternative: Check via GitHub API
gh api repos/BloopAI/vibe-kanban/tags --jq '.[0:5] | .[] | .name'
```

#### Clean WIP Files
```bash
# Remove any untracked WIP files (migrations, etc.)
git clean -fd crates/db/migrations/
git status  # Should show clean working tree
```

#### Hard Reset to Upstream Tag
```bash
# Reset to specific upstream tag
git reset --hard $LATEST_TAG

# Verify we're at the right commit
git log --oneline --decorate -3
```

#### Checkout Main Branch
```bash
# Create/reset main branch to current commit
git checkout -B main

# Verify position
git log --oneline --decorate -3
```

### Phase 3: Mechanical Rebrand (BEFORE creating tag!)

#### Navigate to automagik-forge Root
```bash
# Important: rebrand script must run from automagik-forge root
cd /home/namastex/workspace/automagik-forge
pwd  # Should be automagik-forge, not upstream/
```

#### Execute Rebrand Script
```bash
# Run rebrand on upstream/ directory
./scripts/rebrand.sh

# Check output for warnings
# Note: vibe-kanban-web-companion is EXTERNAL package - warnings about it are OK
```

#### Commit Rebrand in Upstream Submodule
```bash
cd upstream
git add -A
git status  # Should show ~74 files modified

git commit -m "chore: mechanical rebrand for $LATEST_TAG

Automated rebrand of upstream $LATEST_TAG

Changes:
- vibe-kanban → automagik-forge (all variants)
- Bloop AI → Namastex Labs
- Email: genie@namastex.ai
- GitHub org: namastexlabs

Files modified: 60+
Total replacements: 230+ occurrences

Note: External package 'vibe-kanban-web-companion' references preserved
(already aliased as AutomagikForgeWebCompanion in code)

Base tag: $LATEST_TAG
Script: scripts/rebrand.sh"
```

#### Verify Rebrand (Allow External Packages)
```bash
# Count remaining references EXCLUDING external packages
REFS=$(grep -r "vibe-kanban" . 2>/dev/null | grep -v "web-companion" | grep -v ".git" | wc -l)
echo "Remaining vibe-kanban references (excluding external packages): $REFS"

if [ "$REFS" -eq 0 ]; then
  echo "✅ Rebrand successful"
else
  echo "⚠️  $REFS references found (may be OK if external packages)"
  grep -r "vibe-kanban" . 2>/dev/null | grep -v "web-companion" | grep -v ".git"
fi
```

#### Force Push Rebranded Main to Fork
```bash
# Push rebranded commit to namastexlabs/vibe-kanban
git push origin main --force

# Verify push succeeded
git log --oneline --decorate -3
```

### Phase 4: Release Creation (in upstream/ submodule)

#### Delete Old Tag (if exists)
```bash
# Determine tag name with increment: v0.0.109-namastex-1
# Extract version: v0.0.109-20251017174643 → v0.0.109
VERSION=$(echo $LATEST_TAG | sed -E 's/(v[0-9]+\.[0-9]+\.[0-9]+).*/\1/')

# Check if v0.0.109-namastex exists
if git tag -l "${VERSION}-namastex" | grep -q .; then
  echo "Old tag exists, incrementing to ${VERSION}-namastex-1"
  NAMASTEX_TAG="${VERSION}-namastex-1"

  # Delete old tag locally and remotely
  git tag -d "${VERSION}-namastex" 2>/dev/null || true
  git push origin :refs/tags/${VERSION}-namastex 2>&1 || true
else
  NAMASTEX_TAG="${VERSION}-namastex-1"
fi

echo "Creating tag: $NAMASTEX_TAG"
```

#### Create Annotated Tag on Rebranded Commit
```bash
# Tag the current commit (which includes rebrand)
git tag -a $NAMASTEX_TAG -m "Namastex release based on $LATEST_TAG with rebrand

Includes mechanical rebrand:
- vibe-kanban → automagik-forge
- Bloop AI → Namastex Labs
- GitHub org: namastexlabs

Base: $LATEST_TAG + rebrand commit

See upstream release notes for feature details."
```

#### Push Tag and Create Release
```bash
# Push tag
git push origin $NAMASTEX_TAG

# Create GitHub release with detailed notes
gh release create $NAMASTEX_TAG \
  --repo namastexlabs/vibe-kanban \
  --title "$NAMASTEX_TAG" \
  --notes "Release based on upstream $LATEST_TAG with Automagik Forge rebrand

## Automagik Forge Rebrand

This release includes complete mechanical rebrand:
- vibe-kanban → automagik-forge (all references)
- Bloop AI → Namastex Labs
- GitHub org: namastexlabs
- Email: genie@namastex.ai

## Changes from Upstream

$(git log --oneline $LATEST_TAG..HEAD | head -10)

See [upstream $LATEST_TAG](https://github.com/BloopAI/vibe-kanban/releases/tag/$LATEST_TAG) for complete changelog."
```

#### Verify Release
```bash
# Check release was created
gh release list --repo namastexlabs/vibe-kanban --limit 3

# Verify tag points to rebranded commit
git log --oneline --decorate -3
```

### Phase 5: Gitmodule Update (in upstream/ submodule)

#### Fetch New Tag
```bash
# Should still be in upstream/ directory
pwd  # Should show .../automagik-forge/upstream

# Fetch the tag we just created
git fetch origin --tags
```

#### Checkout Rebranded Tag
```bash
# Checkout the namastex tag (already has rebrand)
git checkout $NAMASTEX_TAG

# Verify we're on the rebranded commit
git describe --tags
git log --oneline --decorate -2
# Should show: rebrand commit, then upstream base
```

#### Return to automagik-forge Root
```bash
cd ..
pwd  # Should be automagik-forge root
```

### Phase 6: Type Regeneration & Verification

#### Stage Submodule Update
```bash
# Stage the submodule pointer change
git add upstream
git status  # Should show "modified: upstream"
```

#### Regenerate TypeScript Types
```bash
# Upstream version changed, regenerate types
pnpm run generate-types

# This runs both:
# - cargo run -p server --bin generate_types
# - cargo run -p forge-app --bin generate_forge_types
```

#### Run Clippy and Fix Warnings
```bash
# Check for clippy warnings
cargo clippy --all --all-targets --all-features -- -D warnings

# If clippy fails, fix warnings (common: format! → .to_string())
# Then re-run until it passes
```

#### Verify Build Success
```bash
# Full workspace check
cargo check --workspace

# Should pass without errors
```

#### Stage Regenerated Types
```bash
# Stage type changes
git add shared/types.ts shared/forge-types.ts

# Also stage any clippy fixes
git add forge-app/src/router.rs  # If you fixed format! issues
```

### Phase 8: Post-Sync Validation (NEW - Verify Completeness)

#### Re-extract Modal Registrations from Updated Upstream

```bash
# Extract modals from UPDATED upstream
echo "=== Updated Upstream Modal Registrations ===" > .genie/reports/audit-$(date +%Y%m%d)/modals-upstream-post.txt
grep -n "NiceModal.register" upstream/frontend/src/main.tsx | \
  sed 's/.*NiceModal.register("\([^"]*\)".*/\1/' | \
  sort >> .genie/reports/audit-$(date +%Y%m%d)/modals-upstream-post.txt

# Re-check missing modals
comm -23 \
  <(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/modals-upstream-post.txt | sort) \
  <(grep -v "===" .genie/reports/audit-$(date +%Y%m%d)/modals-forge.txt | sort) \
  > .genie/reports/audit-$(date +%Y%m%d)/modals-still-missing.txt

STILL_MISSING=$(cat .genie/reports/audit-$(date +%Y%m%d)/modals-still-missing.txt | wc -l)
echo "Still missing modals after sync: $STILL_MISSING"
```

#### Check for Missing npm Dependencies

```bash
# Check if pnpm install detects peer dependency warnings
cd frontend
pnpm install 2>&1 | tee ../.genie/reports/audit-$(date +%Y%m%d)/pnpm-install-warnings.log
cd ..

# Extract peer dependency warnings
grep -i "peer dep" .genie/reports/audit-$(date +%Y%m%d)/pnpm-install-warnings.log \
  > .genie/reports/audit-$(date +%Y%m%d)/peer-deps-warnings.txt || true

PEER_WARNINGS=$(cat .genie/reports/audit-$(date +%Y%m%d)/peer-deps-warnings.txt | wc -l)
echo "Peer dependency warnings: $PEER_WARNINGS"
```

#### Run Frontend Type Checks

```bash
# Run TypeScript compiler
cd frontend
pnpm run check 2>&1 | tee ../.genie/reports/audit-$(date +%Y%m%d)/frontend-type-errors.log
TYPE_ERRORS=$?
cd ..

if [ $TYPE_ERRORS -ne 0 ]; then
  echo "⚠️  TypeScript errors detected - see .genie/reports/audit-$(date +%Y%m%d)/frontend-type-errors.log"
else
  echo "✅ Frontend type check passed"
fi
```

#### Test Frontend Build

```bash
# Attempt production build
cd frontend
pnpm run build 2>&1 | tee ../.genie/reports/audit-$(date +%Y%m%d)/frontend-build.log
BUILD_STATUS=$?
cd ..

if [ $BUILD_STATUS -ne 0 ]; then
  echo "🔴 Frontend build FAILED - see .genie/reports/audit-$(date +%Y%m%d)/frontend-build.log"
else
  echo "✅ Frontend build succeeded"
fi
```

#### Validate Routing Compatibility

```bash
# Check if Forge routing overrides conflict with upstream changes
if [ -f "forge-overrides/frontend/src/App.tsx" ]; then
  echo "⚠️  Forge overrides App.tsx - checking for conflicts..." > .genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt

  # Look for route additions in upstream
  cd upstream
  git diff $PREV_TAG HEAD -- frontend/src/App.tsx | grep "^+" | grep -i "route\|path" \
    >> ../.genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt || true
  cd ..

  echo "" >> .genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt
  echo "Review forge-overrides/frontend/src/App.tsx for compatibility" >> .genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt
else
  echo "✅ No routing overrides - upstream routing used directly" > .genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt
fi

cat .genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt
```

#### Generate Post-Sync Validation Report

```bash
# Create validation report
cat > .genie/reports/upstream-sync-validation-${TARGET_VERSION}.md <<EOF
# Post-Sync Validation Report

**Date**: $(date +%Y-%m-%d)
**Version**: $TARGET_VERSION
**Audit Directory**: .genie/reports/audit-$(date +%Y%m%d)/

---

## Validation Summary

- **Still Missing Modals**: $STILL_MISSING
- **Peer Dependency Warnings**: $PEER_WARNINGS
- **TypeScript Errors**: $([ $TYPE_ERRORS -eq 0 ] && echo "0 ✅" || echo "YES ⚠️")
- **Frontend Build**: $([ $BUILD_STATUS -eq 0 ] && echo "PASSED ✅" || echo "FAILED 🔴")

---

## 1. Modal Registration Status

### Still Missing After Sync

$(cat .genie/reports/audit-$(date +%Y%m%d)/modals-still-missing.txt)

$(
if [ $STILL_MISSING -gt 0 ]; then
  echo "**ACTION REQUIRED**: See Phase 9 (Automated Fix Generation) for modal registration fixes"
else
  echo "✅ All upstream modals registered in Forge"
fi
)

---

## 2. Dependency Warnings

$(cat .genie/reports/audit-$(date +%Y%m%d)/peer-deps-warnings.txt)

$(
if [ $PEER_WARNINGS -gt 0 ]; then
  echo "**ACTION REQUIRED**: Review peer dependency warnings"
else
  echo "✅ No peer dependency warnings"
fi
)

---

## 3. TypeScript Validation

$(
if [ $TYPE_ERRORS -ne 0 ]; then
  tail -20 .genie/reports/audit-$(date +%Y%m%d)/frontend-type-errors.log
  echo ""
  echo "**ACTION REQUIRED**: Fix TypeScript errors before deploying"
else
  echo "✅ TypeScript compilation successful"
fi
)

---

## 4. Frontend Build Status

$(
if [ $BUILD_STATUS -ne 0 ]; then
  tail -20 .genie/reports/audit-$(date +%Y%m%d)/frontend-build.log
  echo ""
  echo "**BLOCKER**: Frontend build must pass before deployment"
else
  echo "✅ Production build successful"
fi
)

---

## 5. Routing Compatibility

$(cat .genie/reports/audit-$(date +%Y%m%d)/routing-validation.txt)

---

## Blocker Assessment

$(
VALIDATION_FAILED=0
[ $BUILD_STATUS -ne 0 ] && VALIDATION_FAILED=$((VALIDATION_FAILED + 1))
[ $STILL_MISSING -gt 10 ] && VALIDATION_FAILED=$((VALIDATION_FAILED + 1))

if [ $VALIDATION_FAILED -gt 0 ]; then
  echo "🔴 **VALIDATION FAILED**"
  echo ""
  echo "Critical issues detected:"
  [ $BUILD_STATUS -ne 0 ] && echo "- Frontend build failed"
  [ $STILL_MISSING -gt 10 ] && echo "- $STILL_MISSING missing modal registrations (threshold: 10)"
  echo ""
  echo "**Recommendation**: Proceed to Phase 9 (Automated Fix Generation)"
else
  echo "✅ **VALIDATION PASSED**"
  echo ""
  if [ $STILL_MISSING -gt 0 ] || [ $PEER_WARNINGS -gt 0 ] || [ $TYPE_ERRORS -ne 0 ]; then
    echo "Minor issues detected - proceed to Phase 9 for automated fixes"
  else
    echo "No issues detected. Ready to commit!"
  fi
fi
)

---

**Validation Complete**: $(date)
**Generated by**: utilities/upstream-update agent
EOF

# Display validation report
cat .genie/reports/upstream-sync-validation-${TARGET_VERSION}.md

# Exit if critical validation failures
if [ $VALIDATION_FAILED -gt 0 ]; then
  echo ""
  echo "🔴 VALIDATION FAILED: Critical issues detected. Review validation report."
  echo "Report: .genie/reports/upstream-sync-validation-${TARGET_VERSION}.md"
  echo "Proceeding to Phase 9 for automated fix generation..."
fi
```

### Phase 9: Automated Fix Generation (NEW - Actionable Guidance)

#### Generate Modal Registration Fixes

```bash
# Create fix script for missing modals
cat > .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh <<'FIXSCRIPT'
#!/bin/bash
# Auto-generated modal registration fixes

cd "$(dirname "$0")/../../.."  # Navigate to automagik-forge root

echo "=== Adding Missing Modal Registrations ==="

FIXSCRIPT

# For each missing modal, generate import and registration code
while IFS= read -r modal; do
  [ -z "$modal" ] && continue

  # Find the component file for this modal in upstream
  COMPONENT_FILE=$(grep -r "\"$modal\"" upstream/frontend/src/ --include="*.tsx" --include="*.ts" | head -1 | cut -d':' -f1)

  if [ -n "$COMPONENT_FILE" ]; then
    # Extract component name from file (heuristic: look for lazy(() => import(...))
    COMPONENT_NAME=$(basename "$COMPONENT_FILE" .tsx)
    IMPORT_PATH=$(echo "$COMPONENT_FILE" | sed 's|upstream/frontend/src/|@/|' | sed 's|\.tsx$||')

    cat >> .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh <<FIXSCRIPT

# Fix: $modal
echo "Adding modal: $modal"
# TODO: Add to forge-overrides/frontend/src/main.tsx:
# import ${COMPONENT_NAME} from '${IMPORT_PATH}'
# NiceModal.register('$modal', ${COMPONENT_NAME})
FIXSCRIPT
  else
    cat >> .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh <<FIXSCRIPT

# Fix: $modal (MANUAL - component file not found)
echo "⚠️  Manual fix needed for: $modal"
FIXSCRIPT
  fi
done < .genie/reports/audit-$(date +%Y%m%d)/modals-still-missing.txt

cat >> .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh <<'FIXSCRIPT'

echo ""
echo "✅ Modal registration fixes generated"
echo "Edit forge-overrides/frontend/src/main.tsx and add the registrations above"
FIXSCRIPT

chmod +x .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh
echo "Generated: .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh"
```

#### Generate Dependency Installation Fixes

```bash
# Create fix script for missing dependencies
cat > .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh <<'DEPSCRIPT'
#!/bin/bash
# Auto-generated dependency installation fixes

cd "$(dirname "$0")/../../.."  # Navigate to automagik-forge root

echo "=== Installing Missing Dependencies ==="

DEPSCRIPT

# Add pnpm add commands for each missing dependency
while IFS= read -r dep; do
  [ -z "$dep" ] && continue
  [[ "$dep" == "==="* ]] && continue

  pkg=$(echo "$dep" | cut -d'@' -f1)
  ver=$(echo "$dep" | cut -d'@' -f2-)

  cat >> .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh <<DEPSCRIPT
echo "Installing: $pkg@$ver"
pnpm add -w $pkg@$ver
DEPSCRIPT
done < .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt

cat >> .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh <<'DEPSCRIPT'

echo ""
echo "✅ Dependencies installed"
echo "Run 'pnpm install' to update lockfile"
DEPSCRIPT

chmod +x .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh
echo "Generated: .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh"
```

#### Create Comprehensive Fix Checklist

```bash
# Generate human-readable checklist
cat > .genie/reports/upstream-sync-fixes-${TARGET_VERSION}.md <<EOF
# Upstream Sync Fix Checklist

**Date**: $(date +%Y-%m-%d)
**Version**: $TARGET_VERSION

---

## Automated Fixes Available

### 1. Install Missing Dependencies

$(
if [ $MISSING_DEPS -gt 0 ]; then
  echo "\`\`\`bash"
  echo "# Run generated script:"
  echo "bash .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh"
  echo ""
  echo "# Or manually:"
  while IFS= read -r dep; do
    [ -z "$dep" ] && continue
    [[ "$dep" == "==="* ]] && continue
    pkg=$(echo "$dep" | cut -d'@' -f1)
    ver=$(echo "$dep" | cut -d'@' -f2-)
    echo "pnpm add -w $pkg@$ver"
  done < .genie/reports/audit-$(date +%Y%m%d)/deps-missing.txt
  echo "\`\`\`"
else
  echo "✅ No missing dependencies"
fi
)

### 2. Register Missing Modals

$(
if [ $STILL_MISSING -gt 0 ]; then
  echo "**File**: \`forge-overrides/frontend/src/main.tsx\`"
  echo ""
  echo "Add the following registrations (see fix-modals.sh for imports):"
  echo ""
  echo "\`\`\`typescript"
  while IFS= read -r modal; do
    [ -z "$modal" ] && continue
    echo "NiceModal.register('$modal', ${modal}Component)  // TODO: import ${modal}Component"
  done < .genie/reports/audit-$(date +%Y%m%d)/modals-still-missing.txt
  echo "\`\`\`"
  echo ""
  echo "Reference: \`bash .genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh\` for component paths"
else
  echo "✅ All modals registered"
fi
)

---

## Manual Review Required

$(
if [ $NEW_COMPONENTS -gt 0 ]; then
  echo "### New Component Directories"
  echo ""
  while IFS= read -r comp; do
    [ -z "$comp" ] && continue
    [[ "$comp" == "==="* ]] && continue
    echo "- [ ] Review: \`$comp\`"
  done < .genie/reports/audit-$(date +%Y%m%d)/new-components.txt
  echo ""
fi

if [ -s .genie/reports/audit-$(date +%Y%m%d)/routing-changes.txt ]; then
  echo "### Routing Changes"
  echo ""
  echo "- [ ] Review routing changes in upstream/frontend/src/App.tsx"
  echo "- [ ] Check for conflicts with forge-overrides/frontend/src/App.tsx (if exists)"
  echo ""
fi
)

---

## Verification Steps

After applying fixes:

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Regenerate types (if needed)
pnpm run generate-types

# 3. Run type check
cd frontend && pnpm run check

# 4. Run build
cd frontend && pnpm run build

# 5. Test locally
pnpm run dev
\`\`\`

---

**Fix Checklist Generated**: $(date)
**Scripts Available**:
- \`.genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh\`
- \`.genie/reports/audit-$(date +%Y%m%d)/fix-modals.sh\`
EOF

echo "Generated: .genie/reports/upstream-sync-fixes-${TARGET_VERSION}.md"
cat .genie/reports/upstream-sync-fixes-${TARGET_VERSION}.md
```

#### Apply Safe Automated Fixes (Optional)

```bash
# Only auto-apply dependency installation if safe (< 5 missing deps)
if [ $MISSING_DEPS -gt 0 ] && [ $MISSING_DEPS -lt 5 ]; then
  echo "Auto-applying dependency fixes (safe threshold: < 5 deps)..."
  bash .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh

  # Stage dependency changes
  git add frontend/package.json

  echo "✅ Dependencies auto-installed and staged"
else
  echo "⚠️  Too many missing dependencies ($MISSING_DEPS) - manual review recommended"
  echo "Run: bash .genie/reports/audit-$(date +%Y%m%d)/fix-dependencies.sh"
fi

# Modal registration requires manual code editing - never auto-apply
if [ $STILL_MISSING -gt 0 ]; then
  echo "⚠️  Modal registrations require manual editing of forge-overrides/frontend/src/main.tsx"
  echo "See: .genie/reports/upstream-sync-fixes-${TARGET_VERSION}.md"
fi
```

### Phase 10: Commit & Push

#### Commit Submodule Update
```bash
# Create detailed commit for submodule update
git commit -m "Update upstream to $NAMASTEX_TAG (with rebrand)

Previous: $(git log -1 --format=%h origin/main -- upstream 2>/dev/null || echo 'unknown')
Current: $NAMASTEX_TAG

Rebrand changes:
- vibe-kanban → automagik-forge (230+ occurrences)
- Bloop AI → Namastex Labs
- GitHub org: namastexlabs
- 74 files modified in upstream

Key upstream changes: $(echo $LATEST_TAG | sed 's/v//')
See https://github.com/namastexlabs/vibe-kanban/releases/tag/$NAMASTEX_TAG

All Forge overrides verified compatible."
```

#### Commit Type Regeneration (if needed)
```bash
# If types.ts changed, commit separately
if git status --short | grep -q "shared/"; then
  git add shared/
  git commit -m "chore: regenerate TypeScript types after upstream update"
fi
```

#### Commit Clippy Fixes (if needed)
```bash
# If you had to fix clippy warnings, commit those too
if git status --short | grep -q "forge-app/"; then
  git add forge-app/
  git commit -m "fix: address clippy warnings after upstream update"
fi
```

#### Push to Remote
```bash
# Push all commits to automagik-forge
git push origin main

# Verify push succeeded
git log --oneline -5
```

#### Create Session Continuation Document
```bash
# Document what was done for future sessions
cat > .genie/reports/session-continuation-upstream-$(echo $VERSION | tr -d 'v.')-upgrade.md <<EOF
# Session Continuation: Upstream $VERSION Upgrade Complete

**Date**: $(date +%Y-%m-%d)
**Status**: ✅ Complete

## What Was Done

- Fork synced: namastexlabs/vibe-kanban → BloopAI/vibe-kanban
- Rebrand applied: 230+ occurrences updated
- Tag created: $NAMASTEX_TAG
- Submodule updated: automagik-forge/upstream/
- Types regenerated: shared/types.ts, shared/forge-types.ts
- Build verified: cargo check + cargo clippy passed

## Commits Created

$(git log origin/main..HEAD --oneline)

## Next Steps

1. Test upgraded build: \`pnpm run dev\`
2. Review changes: Compare with previous namastex tag
3. (Optional) Re-apply WIP migrations from .genie/backups/
EOF

git add .genie/reports/
git commit -m "docs: add session continuation for $VERSION upgrade"
git push origin main
```

## Success Criteria

### Pre-Sync Audit (Phase 2)
- ✅ Comprehensive audit report generated in `.genie/reports/upstream-sync-audit-<version>.md`
- ✅ Modal registration gaps identified and documented
- ✅ Missing npm dependencies listed with exact versions
- ✅ New component directories catalogued
- ✅ Routing and API endpoint changes analyzed
- ✅ No critical blockers detected (or blockers documented with fix plan)

### Fork Sync
- ✅ Fork exactly mirrors upstream BloopAI/vibe-kanban
- ✅ `git diff upstream/main` shows no differences
- ✅ Force push to namastexlabs/vibe-kanban succeeded

### Release Creation
- ✅ Namastex tag created (e.g., v0.0.106-namastex)
- ✅ GitHub release exists on namastexlabs/vibe-kanban
- ✅ Release notes reference upstream tag

### Gitmodule Update
- ✅ automagik-forge upstream/ submodule points to namastex tag
- ✅ `git describe --tags` in upstream/ shows correct tag

### Mechanical Rebrand
- ✅ Zero vibe-kanban references in upstream/ and frontend/
- ✅ Application builds successfully (cargo check + pnpm check pass)
- ✅ Changes staged and ready for commit

### Post-Sync Validation (Phase 8)
- ✅ Validation report generated in `.genie/reports/upstream-sync-validation-<version>.md`
- ✅ All upstream modals registered in Forge (or gaps documented)
- ✅ No peer dependency warnings (or warnings addressed)
- ✅ Frontend TypeScript compilation passes
- ✅ Frontend production build succeeds
- ✅ Routing compatibility verified

### Automated Fix Generation (Phase 9)
- ✅ Fix scripts generated:
  - `.genie/reports/audit-<date>/fix-modals.sh`
  - `.genie/reports/audit-<date>/fix-dependencies.sh`
- ✅ Comprehensive fix checklist created in `.genie/reports/upstream-sync-fixes-<version>.md`
- ✅ Safe automated fixes applied (dependency installation if < 5 missing)
- ✅ Manual fixes documented with exact commands and file locations

## Error Handling

### Uncommitted Changes in automagik-forge
```bash
git stash
# Run update process
git stash pop
```

### Upstream Remote Missing (in fork)
```bash
git remote add upstream https://github.com/BloopAI/vibe-kanban.git
```

### Tag Already Exists
```bash
# Delete existing tag locally and remotely
git tag -d $NAMASTEX_TAG
git push origin :refs/tags/$NAMASTEX_TAG

# Recreate tag
git tag -a $NAMASTEX_TAG -m "Namastex release based on $UPSTREAM_TAG"
git push origin $NAMASTEX_TAG
```

### Build Failures After Rebrand
1. Check rebrand script output for errors
2. Verify all vibe-kanban references replaced
3. Review git diff for unexpected changes
4. Report blocker with details

### GitHub CLI Not Authenticated
```bash
gh auth login
```

## Repository Context

### Fork Repository (namastexlabs/vibe-kanban)
- **Purpose**: Unmodified mirror of BloopAI/vibe-kanban with namastex tags
- **Workflow**: Always hard reset to upstream, never preserve local changes
- **Tags**: Create namastex-suffixed tags for use in automagik-forge

### automagik-forge Repository
- **Submodule**: `upstream/` points to namastexlabs/vibe-kanban
- **Workflow**: Update submodule tag → rebrand → verify → commit
- **Features**: Real features in `forge-extensions/`, minimal `forge-overrides/`

## Usage Examples

### Full Workflow
```bash
# 1. In namastexlabs/vibe-kanban fork:
git remote add upstream https://github.com/BloopAI/vibe-kanban.git
git fetch upstream --tags
LATEST_TAG=$(git tag --list 'v0.0.*' --sort=-version:refname | head -1)
git reset --hard upstream/main
git push origin main --force

NAMASTEX_TAG="${LATEST_TAG%-*}-namastex"
git tag -a $NAMASTEX_TAG -m "Namastex release based on $LATEST_TAG"
git push origin $NAMASTEX_TAG
gh release create $NAMASTEX_TAG --repo namastexlabs/vibe-kanban --title "$NAMASTEX_TAG" --notes "Based on $LATEST_TAG"

# 2. In automagik-forge repo:
cd upstream
git fetch origin --tags
git checkout $NAMASTEX_TAG
cd ..
./scripts/rebrand.sh
grep -r "vibe-kanban" upstream frontend | wc -l  # Should be 0
cargo check --workspace
cd frontend && pnpm run check && cd ..
git add -A && git commit -m "chore: update upstream to $NAMASTEX_TAG and rebrand"
```

### Automated via Agent
```bash
# From automagik-forge repo, trigger agent with target upstream version
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"

# Agent will:
# 1. Switch to fork repo
# 2. Sync with upstream
# 3. Create namastex tag
# 4. Switch back to automagik-forge
# 5. Update gitmodule
# 6. Apply rebrand
# 7. Verify and prepare commit
```

## Evidence Collection

Store outputs in `.genie/wishes/mechanical-rebrand/qa/group-c/`:
- `fork-sync.log` - Fork synchronization output
- `release-created.txt` - Release tag and GitHub release details
- `upstream-version.txt` - Current and target versions
- `rebrand-output.log` - Rebrand script execution
- `verification.log` - Build and reference count checks
- `git-diff.txt` - Changes made by rebrand and submodule update

## Important Notes

- **Fork Operations**: Always use `--force` when pushing to namastexlabs/vibe-kanban (exact mirror)
- **Tag Format**: Namastex tags follow pattern: `v{VERSION}-namastex` (e.g., v0.0.106-namastex)
- **No Local Changes**: Fork should never have local modifications (always reset to upstream)
- **Submodule Pointer**: automagik-forge upstream/ must point to namastex tag, not upstream tag
- **Verification Critical**: Always verify zero vibe-kanban references and build success before committing

## Total Time
~3-5 minutes for complete workflow:
- Fork sync: ~1 minute
- Release creation: ~1 minute
- Gitmodule update: ~30 seconds
- Mechanical rebrand: ~1-2 minutes
- Verification: ~30 seconds
