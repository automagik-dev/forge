# Task A: Submodule Update & Preparation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Group:** A - Submodule prep
**Tracker:** `upgrade-upstream-0-0-104-task-a`
**Persona:** implementor
**Branch:** `feat/genie-framework-migration` (existing)
**Effort:** XS

---

## Scope

Update the upstream submodule pointer from v0.0.101 to v0.0.104 and create baseline snapshots for validation.

## Context

**Current:** `upstream/` at v0.0.101-20251001171801 (commit d8fc7a98)
**Target:** v0.0.104-20251006165551 (commit fbb972a5)
**Gap:** 3 versions, 68 files, +1835/-975 lines

## Inputs

- @upstream/ - Git submodule
- @.genie/wishes/upgrade-upstream-0-0-104-wish.md - Full wish context

## Deliverables

1. **Submodule Update:**
   - Checkout v0.0.104-20251006165551 in upstream/
   - Stage submodule pointer change
   - DO NOT commit yet (wait for validation)

2. **Baseline Snapshots:**
   - `baseline-upstream.txt` - Current submodule version
   - `baseline-executors.json` - Current executor list
   - `baseline-tests.txt` - Current test suite output

3. **Override Backup:**
   - `forge-overrides-backup/` - Full backup of current overrides

4. **Type Generation Check:**
   - Run initial type generation to verify compatibility

## Task Breakdown

```
<task_breakdown>
1. [Discovery]
   - Verify current upstream version
   - Check git submodule status
   - Review existing override files

2. [Implementation]
   - Update submodule: cd upstream && git checkout v0.0.104-20251006165551
   - Stage change: cd .. && git add upstream
   - Create baselines: executor list, test output
   - Backup overrides: cp -r forge-overrides forge-overrides-backup
   - Test type generation

3. [Verification]
   - Confirm submodule at correct commit
   - Verify baseline files created
   - Check backup directory exists
</task_breakdown>
```

## Validation

```bash
# Verify submodule updated
cd upstream && git log -1 --oneline  # Should show fbb972a5

# Check submodule staged
git diff --cached upstream  # Should show submodule pointer change

# Verify baseline files
test -f baseline-upstream.txt && echo "✓ upstream baseline"
test -f baseline-executors.json && echo "✓ executors baseline"
test -f baseline-tests.txt && echo "✓ tests baseline"

# Verify backup
test -d forge-overrides-backup && echo "✓ overrides backup"

# Type generation check
cargo run -p server --bin generate_types -- --check
cargo run -p forge-app --bin generate_forge_types -- --check
```

## Success Criteria

✅ Submodule pointer at v0.0.104-20251006165551
✅ Submodule change staged (not committed)
✅ Baseline snapshots created (3 files)
✅ Override backup complete
✅ Type generation succeeds

## Never Do

❌ Commit the submodule change before validation passes
❌ Skip baseline creation
❌ Forget to backup overrides
❌ Proceed if type generation fails

## Dependencies

- None (first task)

## Evidence

Store in: `.genie/wishes/upgrade-upstream-0-0-104/qa/task-a/`

- `baseline-upstream.txt`
- `baseline-executors.json`
- `baseline-tests.txt`
- `backup-manifest.txt` (list of backed up files)
- `type-gen-check.log`

## Follow-ups

- After completion: Proceed to Task B (override audit)
- If type generation fails: Create blocker report, halt execution
