# Task F: Regression Testing & Final Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** qa
**Effort:** S
**Priority:** HIGH

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

---

## Discovery

### Objective
Run full regression suite and compare baseline vs v0.0.105 upgrade.

---

## Implementation

### Test Suite

1. **Initialize submodules:**
   ```bash
   git submodule update --init --recursive
   ```

2. **Full test suite:**
   ```bash
   cargo test --workspace 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/f-upgraded-tests.txt
   cargo clippy --all --all-targets --all-features -- -D warnings
   cd frontend && pnpm run lint
   cd frontend && pnpm run check
   ```

3. **Regression harness:**
   ```bash
   ./scripts/run-forge-regression.sh
   ```

4. **Comparison:**
   ```bash
   diff .genie/wishes/upgrade-upstream-0-0-104/evidence/baseline-tests.txt \
        .genie/wishes/upgrade-upstream-0-0-104/evidence/f-upgraded-tests.txt
   ```

---

## Verification

### Success Criteria
- [ ] All tests pass
- [ ] Clippy clean
- [ ] Frontend lint/type-check pass
- [ ] Regression harness passes
- [ ] Diff report shows expected changes only

### Evidence
- Test output: `.genie/wishes/upgrade-upstream-0-0-104/evidence/f-upgraded-tests.txt`
- Diff report: `.genie/wishes/upgrade-upstream-0-0-104/evidence/f-baseline-diff.txt`
- Regression output: `.genie/wishes/upgrade-upstream-0-0-104/evidence/f-regression.txt`

---

## Human Approval Gate

After Task F passes, request human approval to:
1. Review all evidence
2. Approve commit to `feat/genie-framework-migration`
3. Create PR if needed
