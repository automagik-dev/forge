# Automagik Forge vs Upstream Divergence Investigation

**Generated**: 2025-10-08 (Updated after context rewind)
**Investigation Goal**: Verify Forge is a perfect mirror of upstream for core task/branch/worktree functionality

---

## Current Situation

**Context**: User suspects unnecessary code duplication/divergence exists, questioning the entire "upstream as library" migration strategy.

**Key Concern**: If upstream is used as a module/library, why does Forge need so much custom code? This suggests either:
1. The library integration is broken/incomplete
2. Previous agent made unnecessary customizations
3. Upstream's library interface is poorly designed

---

## Investigation Scope

### Files to Verify (Core Task/Branch Logic)

**Models** (Should be 100% identical to upstream):
- `crates/db/src/models/task_attempt.rs`
- `crates/db/src/models/task.rs`
- `crates/db/src/models/draft.rs`

**Services** (Should use upstream as-is):
- `crates/services/src/services/container.rs` (trait definition)
- `crates/services/src/services/git.rs`
- `crates/services/src/services/worktree_manager.rs`

**Implementation** (May have Forge customizations):
- `crates/local-deployment/src/container.rs` (ContainerService impl)

**Config** (Forge-specific branding):
- `crates/services/src/services/config/versions/v7.rs`
  - Should have `git_branch_prefix: "forge"` instead of `"vk"`
  - Everything else identical

---

## Known Recent Changes (From Previous Agent)

1. ✅ Copied upstream `task_attempt.rs` model
2. ✅ Added `git_branch_prefix: "forge"` to config v7
3. ✅ Copied missing migration `20250923000000_make_branch_non_null.sql`
4. ❓ Modified `crates/local-deployment/src/container.rs` (34 lines changed)

**Current Git Status**:
```
M crates/local-deployment/src/container.rs
```

---

## Critical Questions for Next Agent

### 1. Library Integration Check
**Question**: Does Forge actually import/use upstream crates as dependencies, or does it copy code?

**How to verify**:
```bash
# Check if upstream is imported as dependency
grep -r "upstream" Cargo.toml */Cargo.toml

# Check if upstream crates are in workspace
cat Cargo.toml | grep -A20 "workspace.members"

# Verify if Forge re-exports or duplicates
ls -la upstream/crates/
ls -la crates/
```

**Expected**: If "upstream as library", Forge should import upstream crates, NOT duplicate them.

---

### 2. Actual Divergence Analysis
**Question**: What ACTUALLY differs between upstream and Forge for task/branch logic?

**Commands to run**:
```bash
# Compare models (should be identical)
diff -u upstream/crates/db/src/models/task_attempt.rs crates/db/src/models/task_attempt.rs

# Compare container trait (should be identical except imports)
diff -u upstream/crates/services/src/services/container.rs crates/services/src/services/container.rs

# Compare container implementation (may have Forge-specific code)
diff -u upstream/crates/local-deployment/src/container.rs crates/local-deployment/src/container.rs
```

**Focus on**:
- Field names: `base_branch` vs `target_branch`
- Field types: `branch: Option<String>` vs `branch: String`
- Branch naming: Where does `"forge/"` prefix get set?
- Custom logic: What did previous agent add that shouldn't be there?

---

### 3. Branch Prefix Configuration
**Question**: How SHOULD branch naming work in the upstream-as-library model?

**Investigation**:
```bash
# Find where upstream sets branch prefix
grep -rn "git_branch_prefix\|vk/" upstream/crates/ --include="*.rs"

# Find where Forge sets branch prefix
grep -rn "git_branch_prefix\|forge/" crates/ --include="*.rs"

# Check if there's a proper config override mechanism
grep -rn "git_branch_from_task_attempt" upstream/crates/ crates/ --include="*.rs"
```

**Expected**: Forge should ONLY need to override the config default, not duplicate any logic.

---

### 4. Container Implementation Divergence
**Question**: What are the 34 lines changed in `crates/local-deployment/src/container.rs`?

**Check**:
```bash
git diff crates/local-deployment/src/container.rs | grep -E "^[\+\-]" | head -50
```

**Validation**:
- Are these changes necessary for Forge branding?
- Or did previous agent unnecessarily customize upstream behavior?
- Can we revert to 100% upstream implementation?

---

## Investigation Protocol

### Step 1: Verify Library Integration
- [ ] Check if `upstream/crates/*` are imported as dependencies
- [ ] Verify Cargo.toml workspace structure
- [ ] Confirm Forge doesn't duplicate upstream code unnecessarily

### Step 2: Model Alignment
- [ ] Diff `task_attempt.rs` - should be IDENTICAL
- [ ] Diff `draft.rs` - should be IDENTICAL (except Forge's `follow_up_draft.rs` extension)
- [ ] Diff `task.rs` - should be IDENTICAL

### Step 3: Service Alignment
- [ ] Diff `container.rs` trait - should be IDENTICAL (except imports)
- [ ] Diff `git.rs` - should be IDENTICAL
- [ ] Diff `worktree_manager.rs` - should be IDENTICAL

### Step 4: Config Branding
- [ ] Verify ONLY difference in config v7 is `git_branch_prefix: "forge"` vs `"vk"`
- [ ] Confirm no other config changes

### Step 5: Implementation Customization
- [ ] Review `local-deployment/container.rs` changes
- [ ] Justify each divergence OR revert to upstream
- [ ] Document any truly necessary Forge-specific logic

---

## Success Criteria

**Perfect Mirror Achieved When**:
1. All models identical to upstream (byte-for-byte)
2. All service traits identical to upstream
3. Config only differs in branding (`git_branch_prefix`)
4. Implementation (`local-deployment/container.rs`) uses upstream logic, ONLY overrides config

**If This Fails**:
- Document WHY Forge needs custom code
- Question if "upstream as library" strategy is viable
- Consider alternative architectures

---

## Prompt for Next Agent

```
I need you to verify that Automagik Forge is a perfect mirror of upstream (vibe-kanban) for task/branch/worktree functionality.

**Context**:
- Forge is supposed to use upstream as a library/module
- Previous agent made changes that added ~34 lines to container.rs
- User suspects unnecessary code duplication exists
- Current state: Only `crates/local-deployment/src/container.rs` is modified

**Your Mission**:
1. Verify Forge actually imports upstream crates (not duplicates them)
2. Compare models: task_attempt.rs, draft.rs, task.rs (should be IDENTICAL)
3. Compare services: container.rs trait, git.rs, worktree_manager.rs (should be IDENTICAL)
4. Analyze the 34-line diff in local-deployment/container.rs - is it necessary?
5. Check if ONLY difference should be config `git_branch_prefix: "forge"` vs `"vk"`

**Commands to run**:
```bash
# 1. Check library integration
grep -r "upstream" Cargo.toml */Cargo.toml
cat Cargo.toml | grep -A30 "workspace.members"

# 2. Compare models
diff -u upstream/crates/db/src/models/task_attempt.rs crates/db/src/models/task_attempt.rs
diff -u upstream/crates/db/src/models/draft.rs crates/db/src/models/draft.rs

# 3. Compare services
diff -u upstream/crates/services/src/services/container.rs crates/services/src/services/container.rs
diff -u upstream/crates/services/src/services/git.rs crates/services/src/services/git.rs

# 4. Review container.rs changes
git diff crates/local-deployment/src/container.rs

# 5. Find branch prefix usage
grep -rn "git_branch_prefix\|forge/\|vk/" crates/ upstream/crates/ --include="*.rs" | grep -v "test\|comment"
```

**Deliverable**:
1. List of files that SHOULD be identical but aren't
2. Justification for each divergence OR recommendation to align with upstream
3. Confirmation that Forge is a perfect mirror (or explanation of why it can't be)
4. Assessment of whether "upstream as library" strategy is working as intended

**Focus**: We want MINIMAL code in Forge. If upstream provides it, use it. Don't reinvent.
```
