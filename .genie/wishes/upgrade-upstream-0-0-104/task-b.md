# Task B: Comprehensive Override Audit

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Group:** B - Override audit
**Tracker:** `upgrade-upstream-0-0-104-task-b`
**Persona:** implementor
**Branch:** `feat/genie-framework-migration` (existing)
**Effort:** S

---

## Scope

Audit ALL 25 existing override files against upstream v0.0.104 and identify new upstream files that might need overriding.

## Context

**Override Files:** 25 files in `forge-overrides/frontend/src/`
**Upstream Version:** v0.0.104-20251006165551
**Purpose:** Generate comprehensive drift analysis to guide C-01 through C-25 refactoring

## Inputs

- @forge-overrides/frontend/src/ - All current overrides
- @upstream/frontend/src/ - Upstream v0.0.104 equivalents
- @.genie/wishes/upgrade-upstream-0-0-104-wish.md - Wish context

## Deliverables

1. **Override Audit Report:** `.genie/wishes/upgrade-upstream-0-0-104/override-audit.md`
   - For each of 25 files:
     - Path (override + upstream)
     - Upstream equivalent exists? (yes/no)
     - Lines changed vs upstream
     - Forge customizations identified
     - Drift bugs detected
     - Refactor priority (HIGH/MEDIUM/LOW)
     - Recommended action

2. **New File Analysis:**
   - List new files in upstream v0.0.104
   - Recommend: Override or leave as-is?

## Task Breakdown

```
<task_breakdown>
1. [Discovery]
   - List all files in forge-overrides/frontend/src/
   - For each file, check if upstream equivalent exists
   - Generate diff for files with upstream equivalents

2. [Analysis]
   - Parse diffs to identify Forge customizations:
     - Branding changes (Automagik Forge vs Vibe Kanban)
     - forge-api calls
     - Omni integration
     - Repository links (namastexlabs vs BloopAI)
   - Detect potential drift bugs (mismatched logic)
   - Assign priority based on complexity + importance

3. [New Files Check]
   - Compare upstream file tree: v0.0.101 vs v0.0.104
   - Identify new components/utilities/types
   - Assess if each needs Forge override

4. [Report Generation]
   - Compile findings into override-audit.md
   - Include summary statistics
   - Provide refactoring recommendations
</task_breakdown>
```

## Validation

```bash
# Verify report exists
test -f .genie/wishes/upgrade-upstream-0-0-104/override-audit.md

# Count audited files (should be 25+)
grep -c "^### " .genie/wishes/upgrade-upstream-0-0-104/override-audit.md

# Check for new files analysis
grep -A5 "New Upstream Files" .genie/wishes/upgrade-upstream-0-0-104/override-audit.md

# Verify priority assignments
grep -c "Priority: HIGH" .genie/wishes/upgrade-upstream-0-0-104/override-audit.md
grep -c "Priority: MEDIUM" .genie/wishes/upgrade-upstream-0-0-104/override-audit.md
grep -c "Priority: LOW" .genie/wishes/upgrade-upstream-0-0-104/override-audit.md
```

## Success Criteria

✅ All 25 override files audited
✅ Drift analysis complete for each file
✅ Forge customizations documented
✅ Priority assignments made
✅ New upstream files identified
✅ Override audit report generated

## Never Do

❌ Skip any of the 25 override files
❌ Assign priorities without analyzing diffs
❌ Ignore new upstream files
❌ Proceed to refactoring without completing audit

## Dependencies

- Task A (submodule must be updated to v0.0.104)

## Evidence

Store in: `.genie/wishes/upgrade-upstream-0-0-104/qa/task-b/`

- `override-audit.md` (comprehensive report)
- `diff-samples/` (example diffs for high-priority files)
- `new-files-list.txt`
- `priority-summary.txt`

## Follow-ups

- **Human Review Gate:** Approve audit report before proceeding
- After approval: Begin Tasks C-01 through C-25 (file refactoring)
