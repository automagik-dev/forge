# Task C - Upstream Update Agent & Documentation

**Wish:** @.genie/wishes/mechanical-rebrand-wish.md
**Group:** C - Upstream Update Agent & Documentation
**Tracker:** placeholder-group-c
**Persona:** implementor
**Branch:** feat/mechanical-rebrand
**Status:** pending

## Scope
1. Create specialized agent for upstream version updates
2. Update documentation to reflect new workflow
3. Ensure process is fully automated

## Implementation

### 1. Upstream Update Agent
Create `.genie/agents/utilities/upstream-update.md`:

```markdown
---
name: upstream-update
description: Automate upstream version updates with mechanical rebranding
genie:
  executor: codex
  model: gpt-5
  reasoningEffort: low
  sandbox: workspace-write
---

# Upstream Update Agent

## Role
Automate the process of updating vibe-kanban to a specific version and applying mechanical rebranding.

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
```bash
# Update upstream
cd upstream
git fetch origin
git checkout v{VERSION}
cd ..

# Apply rebrand
./scripts/rebrand.sh

# Verify success
grep -r "vibe-kanban" upstream frontend | wc -l  # Must be 0

# Commit
git add -A
git status
```

## Success Criteria
- ✅ Upstream updated to target version
- ✅ Zero vibe-kanban references remain
- ✅ Application builds successfully
- ✅ Ready for commit
```

### 2. Update README.md
```markdown
## Upstream Management

### Updating to New Version

Use the upstream update agent:
```bash
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"
```

Or manually:
```bash
# 1. Update upstream
cd upstream
git fetch origin
git checkout v0.0.106
cd ..

# 2. Apply mechanical rebrand
./scripts/rebrand.sh

# 3. Commit changes
git add -A
git commit -m "chore: update upstream to v0.0.106 and rebrand"
```

Total time: ~2 minutes

### Architecture

This repository uses a mechanical rebranding approach:
- `upstream/` - Git submodule from vibe-kanban (READ-ONLY)
- `scripts/rebrand.sh` - Converts all vibe-kanban references to automagik-forge
- `forge-extensions/` - Real features (omni, config)
- Minimal `forge-overrides/` - Only feature files, no branding

### Workflow

1. **Pull new upstream version** → 2. **Run rebrand script** → 3. **Verify & commit**

No manual maintenance required!
```

### 3. Update AGENTS.md
Add section about upstream management:

```markdown
## Upstream Update Workflow

### Automated Process
```bash
# Use the upstream-update agent
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"
```

### What It Does
1. Fetches specified version from upstream
2. Runs mechanical rebrand script
3. Verifies zero vibe-kanban references
4. Prepares for commit

### Verification
- All vibe-kanban references replaced
- Application builds successfully
- Tests pass
```

## Verification
```bash
# Test the agent
mcp__genie__run agent="utilities/upstream-update" prompt="Update to current version"

# Verify documentation
grep "mechanical rebrand" README.md
grep "upstream-update" AGENTS.md

# Verify process works
cd upstream && git status && cd ..
./scripts/rebrand.sh
cargo build -p forge-app
```

## Evidence Requirements
Store in `.genie/wishes/mechanical-rebrand/qa/group-c/`:
- `agent-created.md` - Copy of upstream-update agent
- `readme-updated.diff` - Changes to README
- `agents-updated.diff` - Changes to AGENTS.md
- `test-run.log` - Test execution of agent
- `workflow-documented.md` - Complete workflow documentation

## Success Criteria
- ✅ Agent created and functional
- ✅ README reflects new workflow
- ✅ AGENTS.md documents process
- ✅ Full workflow tested end-to-end
- ✅ Process takes < 2 minutes
- ✅ Zero manual intervention required