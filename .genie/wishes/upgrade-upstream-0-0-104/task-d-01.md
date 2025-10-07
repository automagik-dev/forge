# Task D-01: Omni Extension Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** implementor
**Effort:** S
**Priority:** HIGH
**Files:** `forge-extensions/omni/{client.rs,types.rs,service.rs,lib.rs}`

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

**Why:** Git worktrees don't auto-initialize submodules. Without this, `upstream/` will be empty and compilation will fail.

---

## Discovery

### Objective
Validate Omni extension crate compiles and functions correctly against v0.0.105 upstream.

### Context
- Omni is a Forge-specific feature providing AI assistant integration
- Extension sits on top of upstream, not an override
- 4 Rust files in `forge-extensions/omni/src/`
- Must compile against v0.0.105 dependencies

### Files to Validate
1. `client.rs` - Omni API client
2. `types.rs` - Omni type definitions
3. `service.rs` - Omni service implementation
4. `lib.rs` - Crate entry point

---

## Implementation

### Validation Steps

1. **Initialize submodules:**
   ```bash
   git submodule update --init --recursive
   ```

2. **Compile extension:**
   ```bash
   cargo build -p forge-omni
   ```

3. **Run tests:**
   ```bash
   cargo test -p forge-omni
   ```

4. **Lint:**
   ```bash
   cargo clippy -p forge-omni -- -D warnings
   ```

5. **Check type compatibility:**
   - Verify `shared/forge-types.ts` includes Omni types
   - Run `cargo run -p forge-app --bin generate_forge_types -- --check`

### Breaking Change Detection

If compilation fails, check for:
- Upstream API changes in dependencies
- Type signature changes
- Import path changes
- Removed/renamed upstream functions

Document any required fixes.

---

## Verification

### Success Criteria
- [ ] Submodules initialized (`upstream/frontend/` populated)
- [ ] `cargo build -p forge-omni` succeeds
- [ ] `cargo test -p forge-omni` passes
- [ ] `cargo clippy -p forge-omni` clean (no warnings)
- [ ] Type generation includes Omni types

### Evidence Files
- Compilation output: `.genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-compile.txt`
- Test output: `.genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-test.txt`
- Clippy output: `.genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-clippy.txt`

### Validation Commands
```bash
# Verify submodules
ls -la upstream/frontend/src/ | head -5

# Save evidence
cargo build -p forge-omni 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-compile.txt
cargo test -p forge-omni 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-test.txt
cargo clippy -p forge-omni -- -D warnings 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-clippy.txt
```

---

## Done Report Template

```markdown
# Done Report: Task D-01 - Omni Extension Validation

**Status:** ✅ COMPLETE / ⚠️ BLOCKED / ❌ FAILED

## Summary
[1-2 sentences about outcome]

## Work Completed
- Submodules initialized: [YES/NO]
- Compilation: [SUCCESS/FAILED]
- Tests: [PASSED/FAILED - X/Y]
- Clippy: [CLEAN/WARNINGS]

## Files Modified
[List if any fixes were needed]

## Breaking Changes Found
[List any v0.0.105 breaking changes and how they were fixed]

## Evidence
- Compile: @.genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-compile.txt
- Tests: @.genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-test.txt
- Clippy: @.genie/wishes/upgrade-upstream-0-0-104/evidence/d-01-clippy.txt

## Blockers
[None / List any blockers]

## Next Steps
[What needs human review or next task to start]
```
