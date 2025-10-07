# Task F: Regression Testing & Final Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Group:** F - Regression testing
**Tracker:** `upgrade-upstream-0-0-104-task-f`
**Persona:** qa
**Branch:** `feat/genie-framework-migration` (existing)
**Effort:** S

---

## Scope

Run full test suite, regression harness, and compare with baseline to ensure no regressions introduced.

## Context

**Validation Targets:**
- Rust test suite
- Frontend lint/type checks
- Regression harness
- Baseline comparisons

## Inputs

- @baseline-tests.txt - Pre-upgrade test output
- @baseline-executors.json - Pre-upgrade executor list
- @.genie/wishes/upgrade-upstream-0-0-104-wish.md - Acceptance criteria

## Deliverables

1. **Test Suite Results:**
   - `upgraded-tests.txt` - Full cargo test output
   - All tests passing (or documented new failures)

2. **Quality Checks:**
   - Clippy passes with no warnings
   - Frontend lint passes
   - Frontend type check passes

3. **Regression Harness:**
   - Run `./scripts/run-forge-regression.sh`
   - Capture output
   - Document any regressions

4. **Comparison Reports:**
   - Test output: baseline vs upgraded
   - Executor list: baseline vs upgraded
   - MCP responses: baseline vs upgraded
   - UI screenshots: baseline vs upgraded

## Task Breakdown

```
<task_breakdown>
1. [Discovery]
   - Locate baseline files
   - Review test suite structure
   - Understand regression harness

2. [Implementation]
   - Run full Rust test suite
   - Run clippy
   - Run frontend lint/type checks
   - Run regression harness
   - Generate comparison reports

3. [Verification]
   - Compare test results with baseline
   - Verify no new test failures
   - Confirm no quality regressions
   - Document differences
</task_breakdown>
```

## Validation

```bash
# Rust tests
cargo test --workspace 2>&1 | tee upgraded-tests.txt

# Clippy
cargo clippy --all --all-targets --all-features -- -D warnings 2>&1 | tee clippy-output.txt

# Frontend quality
cd frontend && pnpm run lint 2>&1 | tee lint-output.txt
cd frontend && pnpm run check 2>&1 | tee type-check-output.txt

# Regression harness
./scripts/run-forge-regression.sh 2>&1 | tee regression-output.txt

# Comparisons
echo "=== Test Suite Comparison ===" > comparison-report.txt
diff baseline-tests.txt upgraded-tests.txt >> comparison-report.txt || true

echo "\n=== Executor List Comparison ===" >> comparison-report.txt
diff baseline-executors.json upgraded-executors.json >> comparison-report.txt || true

echo "\n=== Summary ===" >> comparison-report.txt
echo "Tests: $(grep -c 'test result:' upgraded-tests.txt) test runs" >> comparison-report.txt
echo "Executors: $(jq 'keys | length' upgraded-executors.json) executors" >> comparison-report.txt
```

## Success Criteria

✅ `cargo test --workspace` passes (no new failures)
✅ `cargo clippy` passes (no warnings)
✅ Frontend lint passes
✅ Frontend type check passes
✅ Regression harness passes
✅ Comparison reports show expected changes only
✅ All quality gates from wish spec_contract met

## Never Do

❌ Ignore test failures
❌ Skip regression harness
❌ Proceed with new clippy warnings
❌ Forget to compare with baseline

## Dependencies

- Task E (integration testing must pass)

## Evidence

Store in: `.genie/wishes/upgrade-upstream-0-0-104/qa/task-f/`

- `upgraded-tests.txt`
- `clippy-output.txt`
- `lint-output.txt`
- `type-check-output.txt`
- `regression-output.txt`
- `comparison-report.txt`
- `visual-regression/` (screenshot comparisons)

## Follow-ups

- **Human Review Gate:** Final approval to commit + push
- After approval: Commit to `feat/genie-framework-migration`
- Create PR to `main`
- Reference wish in PR description
