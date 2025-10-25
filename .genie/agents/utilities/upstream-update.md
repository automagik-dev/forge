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

2. [Fork Sync]
   - Setup upstream remote (BloopAI/vibe-kanban)
   - Fetch latest from upstream
   - Identify latest upstream release tag
   - Hard reset fork to upstream/main
   - Force push to namastexlabs/vibe-kanban

3. [Release Creation]
   - Determine namastex tag name (e.g., v0.0.106-namastex)
   - Create release on namastexlabs/vibe-kanban
   - Verify release exists

4. [Gitmodule Update]
   - Navigate to automagik-forge upstream/ directory
   - Fetch new tags from fork
   - Checkout new namastex tag
   - Return to automagik-forge root

5. [Mechanical Rebrand]
   - Execute rebrand script
   - Verify zero vibe-kanban references
   - Confirm build success

6. [Report]
   - List changes made
   - Provide commit instructions
   - Note any issues
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

# Check if in vibe-kanban fork repo
pwd  # Should be in vibe-kanban fork for sync operations
```

#### Verify Prerequisites
```bash
# Check upstream remote exists (in fork repo)
git remote -v | grep upstream

# Verify gh CLI authentication
gh auth status

# Check for uncommitted changes
git status
```

### Phase 2: Fork Sync (in namastexlabs/vibe-kanban repo)

#### Setup Upstream Remote
```bash
# Add upstream if it doesn't exist
git remote -v | grep upstream || git remote add upstream https://github.com/BloopAI/vibe-kanban.git
```

#### Fetch Latest from Upstream
```bash
# Fetch all changes and tags
git fetch upstream
git fetch upstream --tags
```

#### Identify Latest Upstream Release
```bash
# Get latest tag from upstream
LATEST_TAG=$(git tag --list 'v0.0.*' --sort=-version:refname | head -1)
echo "Latest upstream tag: $LATEST_TAG"

# Alternative: Check GitHub releases
gh release list --repo BloopAI/vibe-kanban --limit 5
```

#### Hard Reset to Upstream Main
```bash
# Discard ALL local changes and match upstream exactly
git reset --hard upstream/main

# Verify no differences
git diff upstream/main  # Should be empty
```

#### Force Push to Fork
```bash
# Mirror upstream to fork (--force is required)
git push origin main --force

# Push all tags
git push origin --tags --force
```

### Phase 3: Release Creation (in namastexlabs/vibe-kanban repo)

#### Determine Tag Name
```bash
# Extract version from latest upstream tag
UPSTREAM_TAG=$(git tag --list 'v0.0.*' --sort=-version:refname | head -1)
# Create namastex variant: v0.0.106-20251009115922 → v0.0.106-namastex
NAMASTEX_TAG=$(echo $UPSTREAM_TAG | sed 's/-[0-9]*$/-namastex/')
echo "Creating tag: $NAMASTEX_TAG"
```

#### Create Release
```bash
# Create annotated tag
git tag -a $NAMASTEX_TAG -m "Namastex release based on $UPSTREAM_TAG"

# Push tag
git push origin $NAMASTEX_TAG

# Create GitHub release
gh release create $NAMASTEX_TAG \
  --repo namastexlabs/vibe-kanban \
  --title "$NAMASTEX_TAG" \
  --notes "Release $NAMASTEX_TAG - synced from upstream BloopAI/vibe-kanban

Based on upstream tag: $UPSTREAM_TAG

Key changes:
$(git log --oneline HEAD~5..HEAD | head -10)" \
  --latest
```

#### Verify Release
```bash
# Check release exists
gh release list --repo namastexlabs/vibe-kanban --limit 3

# Verify tag exists
git tag -l "$NAMASTEX_TAG"
```

### Phase 4: Gitmodule Update (in automagik-forge repo)

#### Navigate to Upstream Submodule
```bash
cd upstream
```

#### Fetch New Tags from Fork
```bash
# Ensure origin points to namastexlabs/vibe-kanban
git remote get-url origin  # Should be namastexlabs/vibe-kanban

# Fetch new tags
git fetch origin --tags
```

#### Checkout New Tag
```bash
# Checkout the namastex tag
git checkout $NAMASTEX_TAG

# Verify version
git describe --tags
```

#### Return to Root
```bash
cd ..
```

### Phase 5: Mechanical Rebrand (in automagik-forge repo)

#### Execute Rebrand Script
```bash
./scripts/rebrand.sh
```

#### Verify Zero References
```bash
# Count remaining vibe-kanban references (must be 0)
REFERENCE_COUNT=$(grep -r "vibe-kanban\|Vibe Kanban" upstream frontend 2>/dev/null | wc -l)
echo "Remaining vibe-kanban references: $REFERENCE_COUNT"

if [ "$REFERENCE_COUNT" -eq 0 ]; then
  echo "✅ Rebrand successful - zero references remain"
else
  echo "❌ Rebrand incomplete - $REFERENCE_COUNT references found"
  grep -r "vibe-kanban\|Vibe Kanban" upstream frontend
fi
```

#### Verify Build Success
```bash
# Rust workspace check
cargo check --workspace

# Frontend check
cd frontend && pnpm run check && cd ..
```

### Phase 6: Commit Changes (in automagik-forge repo)

#### Stage All Changes
```bash
git add -A
```

#### Review Changes
```bash
git status
git diff --cached --stat
```

#### Commit with Descriptive Message
```bash
git commit -m "chore: update upstream to $NAMASTEX_TAG and rebrand

- Synced fork namastexlabs/vibe-kanban with BloopAI/vibe-kanban
- Created release tag $NAMASTEX_TAG based on upstream $UPSTREAM_TAG
- Updated gitmodule to use $NAMASTEX_TAG
- Applied mechanical rebrand (vibe-kanban → automagik-forge)
- Verified zero references remain
- Build validation passed"
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
