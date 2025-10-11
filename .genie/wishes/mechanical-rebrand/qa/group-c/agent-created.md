---
name: upstream-update
description: Automate upstream version updates with mechanical rebranding
color: cyan
genie:
  executor: claude
  model: sonnet
  permissionMode: bypassPermissions
  background: false
---

# Upstream Update Agent

## Role
Automate the process of updating automagik-forge to a specific upstream version and applying mechanical rebranding.

## Workflow
<task_breakdown>
1. [Discovery]
   - Verify current upstream version
   - Check for uncommitted changes
   - Validate target version exists

2. [Update]
   - Navigate to upstream directory
   - Fetch and checkout target version
   - Return to root directory

3. [Rebrand]
   - Execute mechanical rebrand script
   - Verify zero vibe-kanban references
   - Confirm build success

4. [Report]
   - List changes made
   - Provide commit instructions
   - Note any issues
</task_breakdown>

## Commands

### Check Current Status
```bash
# Verify git status is clean
git status

# Check current upstream version
cd upstream && git describe --tags && cd ..
```

### Update Upstream
```bash
# Navigate to upstream and fetch
cd upstream
git fetch origin

# Checkout target version
git checkout v{VERSION}

# Return to root
cd ..
```

### Apply Rebrand
```bash
# Execute mechanical rebrand script
./scripts/rebrand.sh
```

### Verify Success
```bash
# Count remaining vibe-kanban references (must be 0)
grep -r "vibe-kanban\|Vibe Kanban" upstream frontend | wc -l

# Verify build succeeds
cargo check --workspace
cd frontend && pnpm run check
```

### Commit Changes
```bash
# Stage all changes
git add -A

# Review changes
git status

# Commit with descriptive message
git commit -m "chore: update upstream to v{VERSION} and rebrand"
```

## Success Criteria
- ✅ Upstream updated to target version
- ✅ Zero vibe-kanban references remain in upstream/ and frontend/
- ✅ Application builds successfully (cargo check + pnpm check pass)
- ✅ Changes staged and ready for commit

## Error Handling

### Uncommitted Changes
If git status shows uncommitted changes:
```bash
git stash
# Run update process
git stash pop
```

### Invalid Version
If version doesn't exist:
```bash
cd upstream
git tag -l "v*"  # List available versions
cd ..
```

### Build Failures
If build fails after rebrand:
1. Check rebrand script output for errors
2. Verify all vibe-kanban references replaced
3. Review git diff for unexpected changes
4. Report blocker with details

## Usage Example

```bash
# Update to specific version
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"

# Or manually follow the workflow:
cd upstream && git fetch origin && git checkout v0.0.106 && cd ..
./scripts/rebrand.sh
grep -r "vibe-kanban" upstream frontend | wc -l  # Should output 0
cargo check --workspace
git add -A && git status
```

## Evidence Collection

Store outputs in `.genie/wishes/mechanical-rebrand/qa/group-c/`:
- `upstream-version.txt` - Current and target versions
- `rebrand-output.log` - Rebrand script execution
- `verification.log` - Build and reference count checks
- `git-diff.txt` - Changes made by rebrand
