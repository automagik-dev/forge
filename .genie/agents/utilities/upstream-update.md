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

2. [Fork Sync] (in automagik-forge/upstream/ submodule)
   - Setup upstream remote (BloopAI/vibe-kanban) in upstream/ directory
   - Fetch latest from upstream with tags
   - Identify latest upstream release tag
   - Clean any WIP files (migrations, etc.)
   - Hard reset to upstream tag
   - Checkout main branch

3. [Mechanical Rebrand] (BEFORE creating tag - critical!)
   - Execute rebrand script from automagik-forge root
   - Commit rebrand changes in upstream/ submodule
   - Verify rebrand (allow external packages like vibe-kanban-web-companion)
   - Force push main branch to namastexlabs/vibe-kanban

4. [Release Creation]
   - Determine namastex tag name with increment suffix (e.g., v0.0.106-namastex-1)
   - Delete old namastex tag if it exists (locally and remotely)
   - Create new annotated tag on rebranded commit
   - Push tag to namastexlabs/vibe-kanban
   - Create GitHub release with detailed notes
   - Verify release exists

5. [Gitmodule Update]
   - Fetch new tags in upstream/ submodule
   - Checkout new namastex tag (with rebrand already applied)
   - Return to automagik-forge root
   - Stage submodule pointer change

6. [Type Regeneration & Verification]
   - Run `pnpm run generate-types` (upstream version changed)
   - Run `cargo clippy` and fix any warnings
   - Run `cargo check --workspace`
   - Verify build success
   - Stage regenerated types

7. [Commit & Push]
   - Commit submodule update with detailed message
   - Commit type regeneration separately
   - Push to automagik-forge remote
   - Create session continuation document

8. [Report]
   - List all changes made
   - Document what changed from previous namastex tag
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

### Phase 7: Commit & Push

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
