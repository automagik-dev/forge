# Upstream Update Workflow Documentation

## Overview
This document describes the complete workflow for updating automagik-forge to new upstream versions using mechanical rebranding.

## Architecture

### Components
- **upstream/** - Git submodule from vibe-kanban (READ-ONLY)
- **scripts/rebrand.sh** - Mechanical rebrand script (converts vibe-kanban → automagik-forge)
- **forge-extensions/** - Real features (omni, config, branch templates)
- **forge-overrides/** - Minimal feature files only (no branding)

### Workflow
```
Pull upstream → Run rebrand → Verify & commit
```

## Automated Process (Recommended)

### Using the upstream-update Agent
```bash
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"
```

**What the agent does:**
1. Verifies current upstream version
2. Checks for uncommitted changes
3. Validates target version exists
4. Navigates to upstream directory
5. Fetches and checks out target version
6. Returns to root directory
7. Executes mechanical rebrand script
8. Verifies zero vibe-kanban references remain
9. Confirms build success
10. Prepares changes for commit

**Success criteria:**
- ✅ Upstream updated to target version
- ✅ Zero vibe-kanban references in upstream/ and frontend/
- ✅ Application builds successfully
- ✅ Ready for commit

## Manual Process (Alternative)

### Step-by-Step

**1. Update upstream submodule**
```bash
cd upstream
git fetch origin
git checkout v0.0.106
cd ..
```

**2. Apply mechanical rebrand**
```bash
./scripts/rebrand.sh
```

**3. Verify success**
```bash
# Count remaining vibe-kanban references (must be 0)
grep -r "vibe-kanban\|Vibe Kanban" upstream frontend | wc -l

# Verify build succeeds
cargo check --workspace
cd frontend && pnpm run check
```

**4. Commit changes**
```bash
git add -A
git status
git commit -m "chore: update upstream to v0.0.106 and rebrand"
```

## Verification Commands

### Reference Count Check
```bash
grep -r "vibe-kanban" upstream frontend | wc -l  # Must output 0
```

### Build Validation
```bash
# Rust workspace check
cargo check --workspace

# Frontend check
cd frontend && pnpm run check

# Full test suite (optional)
cargo test --workspace
```

### Current Version Check
```bash
cd upstream && git describe --tags
```

## Error Handling

### Uncommitted Changes
```bash
git stash
# Run update process
git stash pop
```

### Invalid Version
```bash
cd upstream
git tag -l "v*"  # List available versions
cd ..
```

### Build Failures
1. Check rebrand script output for errors
2. Verify all vibe-kanban references replaced
3. Review git diff for unexpected changes
4. File blocker report with details

## Performance Metrics

**Total time:** ~2 minutes
- Update upstream: ~30 seconds
- Run rebrand script: ~1 minute
- Verify and commit: ~30 seconds

**No manual intervention required!**

## Documentation References

- Agent definition: `.genie/agents/utilities/upstream-update.md`
- README section: "Development → Upstream Management"
- AGENTS.md section: "Chat-Mode & Utility Agents → Upstream Update Workflow"

## Evidence Collection

Evidence stored in `.genie/wishes/mechanical-rebrand/qa/group-c/`:
- `agent-created.md` - Copy of upstream-update agent
- `readme-updated.diff` - Changes to README
- `agents-updated.diff` - Changes to AGENTS.md
- `workflow-documented.md` - This document

## Success Validation

✅ Agent created and functional at `.genie/agents/utilities/upstream-update.md`
✅ README reflects new workflow in "Development → Upstream Management" section
✅ AGENTS.md documents process in "Chat-Mode & Utility Agents" section
✅ Full workflow documented in this file
✅ Process takes < 2 minutes
✅ Zero manual intervention required
