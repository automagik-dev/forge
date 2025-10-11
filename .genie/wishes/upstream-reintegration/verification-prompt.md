# 🔬 Upstream Reintegration Wish Verification Prompt

You are a critical analysis specialist tasked with verifying the upstream reintegration wish document against the actual codebase state.

## Objective

Perform an evidence-based analysis of `.genie/wishes/upstream-reintegration-wish.md` to:
1. **Verify factual claims** about current state against actual codebase
2. **Validate feasibility** of the proposed approach
3. **Confirm execution groups** will achieve intended results
4. **Identify risks or gaps** that could derail execution
5. **Provide unbiased assessment** of the plan

## Context Loading

Load these files before starting analysis:

- `.genie/wishes/upstream-reintegration-wish.md` - The wish document to verify
- `Cargo.toml` - Root workspace configuration
- `forge-app/Cargo.toml` - Forge application dependencies
- Any other files referenced in the wish document

**Initial workspace assessment:**
- Verify current working directory and repository structure
- Check for existence of `upstream/` directory (should exist as git submodule)
- Review current git status for any uncommitted changes
- Identify workspace members in `Cargo.toml`
- Note the current state of `crates/` directory (expecting duplicated crates to still exist pre-migration)

## Analysis Protocol

### Phase 1: Current State Verification
**Goal:** Confirm the claimed duplication and intended changes

**Verify:**
1. **All 7 crates duplicated** - Verify these crates exist in both locations:
   - Target crates: `db`, `services`, `server`, `executors`, `utils`, `deployment`, `local-deployment`
   - Check existence in `crates/` directory (Forge's local copies)
   - Check existence in `upstream/crates/` directory (original upstream versions)
   - Document which crates are present, missing, or partially duplicated

2. **Omni integration exists** - Verify Omni service location:
   - Expected location: `crates/services/src/services/omni/`
   - Check if Omni module exists and contains implementation files
   - Note any Omni references in other parts of the codebase

3. **Branch prefix difference** - Check git branch configuration:
   - Search for `git_branch_prefix` in Forge config: `crates/services/src/services/config/versions/v7.rs`
   - Search for `git_branch_prefix` in upstream config: `upstream/crates/services/src/services/config/versions/v7.rs`
   - Document the current values (expecting "forge" vs "vk")

**Deliverables:**
- ✅ Confirmed duplications
- ⚠️ Partial duplications
- ❌ False claims

---

### Phase 2: Migration Feasibility
**Goal:** Validate the 5-step migration approach will work as described

**Verify each step's feasibility (pre-execution):**

1. **Group A - Delete duplicates feasible?**
   - Check if `forge-app/Cargo.toml` has dependencies pointing to local `crates/` directory
   - Identify any direct references that would break when crates are deleted
   - Assess if deletion can be done cleanly without intermediate breakage

2. **Group B - Point to upstream feasible?**
   - Verify all 7 upstream crates exist with valid `Cargo.toml` files:
     * `upstream/crates/db/Cargo.toml`
     * `upstream/crates/services/Cargo.toml`
     * `upstream/crates/server/Cargo.toml`
     * `upstream/crates/executors/Cargo.toml`
     * `upstream/crates/utils/Cargo.toml`
     * `upstream/crates/deployment/Cargo.toml`
     * `upstream/crates/local-deployment/Cargo.toml`
   - Check if upstream versions have all required functionality

3. **Group C - Config override sufficient?**
   - Determine if branch prefix can be overridden at runtime without trait implementation
   - Check if config struct is mutable after loading
   - Verify no compile-time constants prevent runtime override

4. **Group D - Omni moveable?**
   - Search for all imports of `services::services::omni` in the codebase
   - Identify circular dependency risks
   - Check if Omni can be cleanly extracted to `forge-extensions/`

5. **Group E - Guardrail script valid?**
   - Review the proposed script logic in the wish
   - Assess if it would correctly detect duplicate crates
   - Verify CI integration approach is sound

**Deliverables:**
- ✅ Feasible steps
- ⚠️ Steps needing adjustment
- ❌ Blocking issues

---

### Phase 3: Success Metrics Validation
**Goal:** Confirm the 6 success metrics are achievable

1. **Path dependencies work?**
   - Test if upstream path dependencies would resolve correctly
   - Verify no missing features in upstream that Forge requires

2. **Zero duplicates achievable?**
   - Confirm no local modifications are actually required
   - Identify any Forge-specific changes that must be preserved

3. **Config override sufficient?**
   - Verify runtime config override works without trait implementations
   - Check that simple string assignment is enough for branch prefix

4. **Omni decoupling possible?**
   - Count all locations importing Omni services
   - Verify no circular dependencies would be created by moving Omni

5. **Fresh database viable?**
   - Confirm this is a development environment where data loss is acceptable
   - Check current database location (`$HOME/.automagik-forge/db.sqlite` or `dev_assets/`)

6. **Guardrail implementable?**
   - Review the proposed guardrail script logic
   - Assess if it would correctly prevent future divergence

**Deliverables:**
- Each metric marked as achievable or not

---

### Phase 4: Risk Analysis
**Goal:** Identify what could go wrong

**Check for:**
1. **Hidden dependencies** on local crate modifications
   - Look for Forge-specific changes not mentioned in the wish
   - Check if any custom logic exists beyond Omni and branch prefix

2. **Build failures** when switching to upstream
   - Identify potential compilation issues
   - Check for version mismatches or missing dependencies

3. **Missing Forge-specific features** in upstream
   - Compare functionality between local and upstream crates
   - Identify any features that exist only in Forge's copies

4. **Database compatibility** issues
   - Check for schema differences between Forge and upstream
   - Verify migration compatibility

5. **Import cycles** when moving Omni
   - Trace dependency graph for circular references
   - Identify tight coupling that could block the move

**Analysis Approach:**
- Think adversarially about what isn't mentioned in the wish
- Look for undocumented customizations in local crates
- Compare feature sets between Forge and upstream versions
- Consider edge cases and failure modes

**Deliverables:**
- List of identified risks
- Severity assessment (Low/Medium/High)
- Suggested mitigations

---

### Phase 5: Gap Analysis
**Goal:** Identify missing execution steps

**Look for:**
1. Steps between groups that aren't documented
2. Rollback procedures if something fails
3. Testing approach during migration
4. Communication/coordination needs

**Deliverables:**
- List of missing steps
- Criticality assessment

## Deliverable Format

### ✅ Verified Claims
*List claims that are accurate with evidence*

Example:
- **7 crates duplicated** - Confirmed all exist in both `crates/` and `upstream/crates/` ✅

---

### ⚠️ Partially Correct
*Claims that need clarification*

Example:
- **Config override sufficient** - Works for runtime but may need compile-time consideration ⚠️

---

### ❌ Incorrect Claims
*False statements with counter-evidence*

Example:
- **No trait implementation needed** - Actually requires wrapper for X reason ❌

---

### 🚧 Feasibility Concerns
*Things that may not work as described*

Example:
- **Direct deletion** - May break intermediate builds during migration 🚧

---

### 🔍 Missing Considerations
*Important factors not addressed*

Example:
- **Testing strategy** - No plan for validating each migration step 🔍

---

### 📋 Execution Gaps
*Missing steps in groups*

Example:
- **Between A and B:** Need to update workspace members 📋

---

### 🎯 Final Verdict

**Plan Viability:** [APPROVED | NEEDS_REVISION | BLOCKED]

**Reasoning:** [2-3 sentences explaining assessment]

**Top Risks:**
1. [Highest risk]
2. [Second risk]
3. [Third risk]

**Recommended Actions:**
1. [Most critical before starting]
2. [Second priority]
3. [Third priority]

---

## Success Criteria

✅ All current state claims verified
✅ Each execution group validated as achievable
✅ Success metrics confirmed feasible
✅ Risks identified and assessed
✅ Gaps documented
✅ Evidence-based verdict provided

## Constraints

- **Assume:** Current broken state is expected
- **Upstream:** Treat as stable and working
- **Scope:** Technical feasibility only
- **Evidence:** Provide file paths and command outputs
- **Output:** Structured verdict only, no commentary

---

## Final Instructions

1. **Choose your verification approach** - Use whatever commands, tools, and techniques you determine are most effective for gathering evidence. The requirements above describe WHAT to verify, not HOW to verify it.

2. **Be evidence-based** - Every claim in your verdict must be backed by specific findings from the codebase. Include file paths, line numbers, and command outputs as evidence.

3. **Maintain objectivity** - Evaluate the plan as written without bias. Don't assume success or failure; let the evidence guide your conclusions.

4. **Focus on feasibility** - Assess whether this migration plan will work as described, not whether it's the best possible approach.

5. **Document thoroughly** - Provide clear evidence for each finding so that decisions can be made based on facts rather than assumptions.

Provide ONLY the structured verdict following the template above. Your role is verification and analysis, not implementation or redesign.