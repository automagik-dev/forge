# Forge Plan – Mechanical Rebrand System
**Generated:** 2025-01-08T08:15:00Z | **Wish:** @.genie/wishes/mechanical-rebrand-wish.md
**Task Files:** `.genie/wishes/mechanical-rebrand/task-*.md`
**Branch:** feat/mechanical-rebrand

## Summary
Transform automagik-forge from a complex overlay system to a lean codebase that mechanically rebrands upstream on each version update. Focus on removing branding-only overrides, creating bulletproof rebrand script, and automating upstream updates.

## Spec Contract (from wish)
- **Scope:**
  - One-time: Identify and remove redundant forge-overrides (keeping ONLY real features like omni)
  - Recurring: Script to rebrand ALL occurrences after each upstream pull
  - Automation: Agent for upstream version updates
- **Out of scope:**
  - Binary patching
  - Git commit automation (manual review required)
- **Success metrics:**
  - Zero manual intervention after upstream merge
  - < 1 minute execution time
  - 100% pattern coverage (ZERO vibe-kanban references remain)
- **Dependencies:** bash, sed, grep, find

## Proposed Groups

### Group A – Surgical Override Removal
- **Scope:** Identify and DELETE all forge-overrides that are NOT features
- **Inputs:**
  - `@forge-overrides/`
  - `@forge-extensions/omni/` (KEEP - real feature)
  - `@forge-extensions/config/` (KEEP - real feature)
- **Deliverables:**
  - Exact list of files to DELETE
  - Exact list of files to KEEP
  - Cleanup script to remove redundant files
- **Evidence:** `.genie/wishes/mechanical-rebrand/qa/group-a/`
  - `files-to-delete.txt`
  - `files-to-keep.txt`
  - `cleanup.sh`
- **Tracker:** placeholder-group-a
- **Suggested personas:** implementor
- **Dependencies:** None
- **Validation:**
  ```bash
  # After cleanup, only feature files remain
  find forge-overrides -type f | wc -l  # Should be minimal
  # Verify omni still exists
  ls forge-extensions/omni/
  ```

### Group B – Bulletproof Rebrand Script
- **Scope:** Create script that replaces EVERY SINGLE occurrence with verification
- **Inputs:**
  - `@scripts/rebrand.sh` (current version)
  - All pattern variants: vibe-kanban, VibeKanban, VK, etc.
- **Deliverables:**
  - Enhanced script with:
    - Pattern coverage for ALL variants
    - Verification that ZERO occurrences remain
    - Report of replacements made
    - Failure if ANY vibe-kanban reference survives
- **Evidence:** `.genie/wishes/mechanical-rebrand/qa/group-b/`
  - `rebrand-test-results.txt`
  - `pattern-coverage.md`
  - `zero-references-proof.txt`
- **Tracker:** placeholder-group-b
- **Suggested personas:** implementor
- **Dependencies:** None
- **Validation:**
  ```bash
  # Run script
  ./scripts/rebrand.sh
  # Verify ZERO occurrences
  grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|VK\|vk" upstream frontend | wc -l  # MUST be 0
  # Build must succeed
  cargo build -p forge-app
  ```

### Group C – Upstream Update Agent & Documentation
- **Scope:** Create agent for automated upstream updates + update docs
- **Inputs:**
  - `@.genie/agents/` (agent templates)
  - `@README.md` (needs update)
  - Current upstream workflow
- **Deliverables:**
  - `.genie/agents/utilities/upstream-update.md` - Agent that:
    - Pulls specific version from upstream's upstream
    - Runs rebrand script automatically
    - Verifies success
  - Updated README with new workflow
  - Updated AGENTS.md with workflow
- **Evidence:** `.genie/wishes/mechanical-rebrand/qa/group-c/`
  - `agent-test.log`
  - `readme-diff.txt`
  - `workflow-documented.md`
- **Tracker:** placeholder-group-c
- **Suggested personas:** implementor
- **Dependencies:** Group B (needs working script)
- **Validation:**
  ```bash
  # Test agent with mock update
  mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.105"
  # Verify docs updated
  grep "mechanical rebrand" README.md
  ```

## Validation Hooks
- **Group A:** Count files before/after, verify only features remain
- **Group B:** Zero vibe-kanban references, successful build
- **Group C:** Agent executes update workflow, docs reflect new process

## Evidence Storage Paths
- Group A: `.genie/wishes/mechanical-rebrand/qa/group-a/`
- Group B: `.genie/wishes/mechanical-rebrand/qa/group-b/`
- Group C: `.genie/wishes/mechanical-rebrand/qa/group-c/`
- Final metrics: `.genie/wishes/mechanical-rebrand/metrics.txt`

## Approval Log
- [2025-01-08 08:15Z] Forge plan created, awaiting approval

## Follow-up
1. Execute Group A first to clean codebase
2. Execute Group B to ensure bulletproof rebranding
3. Execute Group C to automate future updates
4. Test full workflow with real upstream merge