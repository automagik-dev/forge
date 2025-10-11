# AGENTS.md Simplified

## Change Summary
Removed detailed upstream update workflow instructions from AGENTS.md and replaced with simple reference to the agent file.

## Before (82 lines)
```markdown
  - `utilities/upstream-update` — automate upstream version updates with mechanical rebranding
  - `utilities/testgen`, `utilities/refactor`, `utilities/commit`, `utilities/tracer`, `utilities/secaudit`, `utilities/docgen` — task-specific helpers
- Escalate to the Plan → Wish pipeline whenever the scope expands beyond a quick helper (multi-file edits, new tests, major refactors).

### Upstream Update Workflow

**Purpose:** Automate the complete upstream sync workflow: fork sync → release tag creation → gitmodule update → mechanical rebranding.

**Usage:**
```bash
# Automated via agent (from automagik-forge repo)
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"
```

**Complete Workflow:**
1. **Fork Sync**: Pull latest from BloopAI/vibe-kanban → namastexlabs/vibe-kanban
   - Setup upstream remote (BloopAI/vibe-kanban)
   - Fetch latest changes and tags
   - Hard reset fork to upstream/main
   - Force push to namastexlabs/vibe-kanban

2. **Release Creation**: Create namastex-tagged release
   - Determine namastex tag (e.g., v0.0.106-namastex)
   - Create annotated tag on fork
   - Create GitHub release with notes

3. **Gitmodule Update**: Point automagik-forge to new tag
   - Navigate to upstream/ submodule
   - Fetch new tags from fork
   - Checkout namastex tag

4. **Mechanical Rebrand**: Apply transformations
   - Run scripts/rebrand.sh
   - Verify zero vibe-kanban references
   - Validate build success

5. **Commit Preparation**: Stage and prepare commit
   - Stage all changes
   - Generate descriptive commit message
   - Review changes before committing

**Verification:**
- Fork mirrors upstream exactly (git diff upstream/main = empty)
- Namastex tag exists on fork
- Gitmodule points to namastex tag
- All vibe-kanban references replaced → automagik-forge
- Application builds successfully
- Ready to commit

**Manual Alternative:**
```bash
# 1. In namastexlabs/vibe-kanban fork
git remote add upstream https://github.com/BloopAI/vibe-kanban.git
git fetch upstream --tags
LATEST_TAG=$(git tag --list 'v0.0.*' --sort=-version:refname | head -1)
git reset --hard upstream/main
git push origin main --force
NAMASTEX_TAG="${LATEST_TAG%-*}-namastex"
git tag -a $NAMASTEX_TAG -m "Namastex release based on $LATEST_TAG"
git push origin $NAMASTEX_TAG
gh release create $NAMASTEX_TAG --repo namastexlabs/vibe-kanban --title "$NAMASTEX_TAG" --notes "Based on $LATEST_TAG"

# 2. In automagik-forge repo
cd upstream && git fetch origin --tags && git checkout $NAMASTEX_TAG && cd ..
./scripts/rebrand.sh
grep -r "vibe-kanban" upstream frontend | wc -l  # Must be 0
cargo check --workspace && cd frontend && pnpm run check
git add -A && git status
```

**Total time:** ~3-5 minutes. Full automation via agent!
```

## After (3 lines)
```markdown
  - `utilities/upstream-update` — automate complete upstream sync (fork sync, release tag, gitmodule update, rebrand). See @.genie/agents/utilities/upstream-update.md for full workflow
  - `utilities/testgen`, `utilities/refactor`, `utilities/commit`, `utilities/tracer`, `utilities/secaudit`, `utilities/docgen` — task-specific helpers
- Escalate to the Plan → Wish pipeline whenever the scope expands beyond a quick helper (multi-file edits, new tests, major refactors).
```

## Rationale
1. **Single Source of Truth**: All workflow details in agent file (@.genie/agents/utilities/upstream-update.md)
2. **Reduced Duplication**: No need to maintain workflow in two places
3. **Cleaner AGENTS.md**: Focus on agent routing, not detailed instructions
4. **Manual Invocation**: User will call agent manually, doesn't need full instructions in AGENTS.md

## Changes
- **Removed**: 79 lines of detailed workflow, verification, and manual alternative
- **Kept**: Single-line reference in utility agents list
- **Added**: Pointer to agent file via @ syntax
- **Updated**: Description to mention all workflow phases (fork sync, release tag, gitmodule update, rebrand)

## Result
- AGENTS.md: 79 lines shorter (more concise)
- upstream-update.md: Still contains all 398 lines with complete workflow
- No information lost, just consolidated to single location
