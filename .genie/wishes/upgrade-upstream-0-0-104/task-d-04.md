# Task D-04: Type Generation Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** implementor
**Effort:** XS
**Priority:** HIGH
**Files:** `forge-app/src/bin/generate_forge_types.rs`

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

---

## Discovery

### Objective
Validate type generation works for both core (server) and Forge extensions.

---

## Implementation

```bash
git submodule update --init --recursive

# Core types
cargo run -p server --bin generate_types -- --check

# Forge extension types
cargo run -p forge-app --bin generate_forge_types -- --check
```

---

## Verification

### Success Criteria
- [ ] Core type generation passes
- [ ] Forge type generation passes
- [ ] `shared/types.ts` valid
- [ ] `shared/forge-types.ts` valid

### Evidence
```bash
cargo run -p server --bin generate_types -- --check 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-04-core-types.txt
cargo run -p forge-app --bin generate_forge_types -- --check 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-04-forge-types.txt
```
