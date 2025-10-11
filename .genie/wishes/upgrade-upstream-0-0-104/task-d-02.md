# Task D-02: Config Extension Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM
**Files:** `forge-extensions/config/{types.rs,service.rs,lib.rs}`

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

---

## Discovery

### Objective
Validate Config extension crate compiles correctly against v0.0.105.

### Files
1. `types.rs` - Config type definitions
2. `service.rs` - Config service implementation
3. `lib.rs` - Crate entry point

---

## Implementation

```bash
git submodule update --init --recursive
cargo build -p forge-config
cargo test -p forge-config
cargo clippy -p forge-config -- -D warnings
```

---

## Verification

### Success Criteria
- [ ] Compilation succeeds
- [ ] Tests pass
- [ ] Clippy clean

### Evidence
```bash
cargo build -p forge-config 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-02-compile.txt
cargo test -p forge-config 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-02-test.txt
cargo clippy -p forge-config -- -D warnings 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-02-clippy.txt
```
