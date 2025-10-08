# 🧞 Upstream Reintegration Wish
**Status:** IMPLEMENTED
**Roadmap Item:** Phase 0 – Open-source foundation – @.genie/product/roadmap.md §Phase 0: Already Completed ✅
**Mission Link:** @.genie/product/mission.md §Pitch
**Standards:** @.genie/standards/best-practices.md §Core Principles; @.genie/standards/naming.md §Repository
**Completion Score:** 0/100 (updated by `/review`)

## Evaluation Matrix (100 Points Total)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts)**
  - [ ] All relevant files/docs referenced with @ notation (4 pts)
  - [ ] Background persona outputs captured in context ledger (3 pts)
  - [ ] Assumptions (ASM-#), decisions (DEC-#), risks documented (3 pts)
- **Scope Clarity (10 pts)**
  - [ ] Clear current state and target state defined (3 pts)
  - [ ] Spec contract complete with success metrics (4 pts)
  - [ ] Out-of-scope explicitly stated (3 pts)
- **Evidence Planning (10 pts)**
  - [ ] Validation commands specified with exact syntax (4 pts)
  - [ ] Artifact storage paths defined (3 pts)
  - [ ] Approval checkpoints documented (3 pts)

### Implementation Phase (40 pts)
- **Code Quality (15 pts)**
  - [ ] Follows project standards (@.genie/standards/*) (5 pts)
  - [ ] Minimal surface area changes, focused scope (5 pts)
  - [ ] Clean abstractions and patterns (5 pts)
- **Test Coverage (10 pts)**
  - [ ] Unit tests for new behavior (4 pts)
  - [ ] Integration tests for workflows (4 pts)
  - [ ] Evidence of test execution captured (2 pts)
- **Documentation (5 pts)**
  - [ ] Inline comments where complexity exists (2 pts)
  - [ ] Updated relevant external docs (2 pts)
  - [ ] Context preserved for maintainers (1 pt)
- **Execution Alignment (10 pts)**
  - [ ] Stayed within spec contract scope (4 pts)
  - [ ] No unapproved scope creep (3 pts)
  - [ ] Dependencies and sequencing honored (3 pts)

### Verification Phase (30 pts)
- **Validation Completeness (15 pts)**
  - [ ] All validation commands executed successfully (6 pts)
  - [ ] Artifacts captured at specified paths (5 pts)
  - [ ] Edge cases and error paths tested (4 pts)
- **Evidence Quality (10 pts)**
  - [ ] Command outputs (failures → fixes) logged (4 pts)
  - [ ] Screenshots/metrics captured where applicable (3 pts)
  - [ ] Before/after comparisons provided (3 pts)
- **Review Thoroughness (5 pts)**
  - [ ] Human approval obtained at checkpoints (2 pts)
  - [ ] All blockers resolved or documented (2 pts)
  - [ ] Status log updated with completion timestamp (1 pt)

## Context Ledger (Implementation Complete)
| Source | Type | Summary | Status |
| --- | --- | --- | --- |
| forge-app/Cargo.toml:31-37 | config | Dependencies now point to ../upstream/crates/* | ✅ Fixed |
| forge-extensions/*/Cargo.toml | config | Dependencies now point to ../../upstream/crates/* | ✅ Fixed |
| crates/* | deleted | All 7 duplicated crates removed | ✅ Deleted |
| forge-app/src/router.rs:126-140 | code | Branch prefix override implementation | ✅ Implemented |
| forge-extensions/omni/* | code | Omni integration preserved | ✅ Active |
| scripts/check-upstream-alignment.sh | script | Guardrail to prevent future duplication | ✅ Created |

## Key Decisions Implemented
- **DEC-1:** ✅ Deleted all duplicated crates, using upstream directly via path dependencies
- **DEC-2:** ✅ Branch prefix override to "forge" implemented in router (not config)
- **DEC-3:** ✅ Using upstream schema (no database drop needed)
- **DEC-4:** ✅ Omni already in forge-extensions, properly isolated

## Executive Summary
Forge now uses upstream crates directly with only two Forge-specific customizations: Omni integration and branch prefix override.

## Implementation Status (2025-10-08)

### ✅ Completed
- **Deleted all 7 duplicated crates** from `crates/` directory
  - Removed: `db`, `services`, `server`, `executors`, `utils`, `deployment`, `local-deployment`
  - Directory now empty: `ls crates/` returns only `.` and `..`

- **Updated all dependencies to use upstream**
  - `forge-app/Cargo.toml`: Points to `../upstream/crates/*`
  - `forge-extensions/*/Cargo.toml`: Points to `../../upstream/crates/*`

- **Fixed compilation with upstream integration**
  - Added missing `branch` field in CreateTaskAttempt
  - Added task_attempt_id UUID generation
  - Implemented forge branch prefix directly in router

- **Preserved Forge customizations**
  - Omni integration: Lives in `forge-extensions/omni/`
  - Branch prefix: Override in `forge-app/src/router.rs` (generates `forge/{task-id}`)

- **Created guardrail script**
  - Location: `scripts/check-upstream-alignment.sh`
  - Prevents future crate duplication
  - Verifies all dependencies point to upstream

### 📋 Remaining Tasks
- [ ] **Database Migration Fix**: `forge_global_settings` table not created properly (migration marked as applied but table missing)
  - Workaround: Manually create table with: `CREATE TABLE IF NOT EXISTS forge_global_settings (id INTEGER PRIMARY KEY CHECK (id = 1), forge_config TEXT NOT NULL DEFAULT '{}', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP); INSERT OR IGNORE INTO forge_global_settings (id, forge_config) VALUES (1, '{}')`
  - Root cause: Database path resolution - upstream uses `upstream/dev_assets`, need symlink or path override
- [ ] Database Path Configuration: Set up proper database location (currently requires symlink `dev_assets -> upstream/dev_assets`)
- [ ] CI Integration: Add guardrail script to GitHub Actions
- [ ] Documentation: Update developer onboarding docs with database setup
- [ ] Migration guide: For other Forge instances


## Out-of-Scope
- Introducing new Omni features beyond existing needs.
- Altering upstream submodule contents directly.
- Frontend/Vite build chain modifications (track separately).

<spec_contract>
Roadmap Alignment: Phase 0 – Open-source foundation (@.genie/product/roadmap.md §Phase 0)
Success Metrics (Achieved):
1. ✅ Forge uses upstream crates via path deps (`forge-app/Cargo.toml` points to `../upstream/crates/*`)
2. ✅ Zero duplicated crates in `crates/` directory (deleted completely)
3. ✅ Branch prefix is "forge" via direct override in router
4. ✅ Omni in forge-extensions (no longer in services)
5. ✅ Builds successfully with upstream schema
6. ✅ Automated guardrail (`scripts/check-upstream-alignment.sh`) created and passing
External Tracker: TBD
Dependencies: Upstream submodule (present), CI pipeline updates (pending).
</spec_contract>


## Validation Results

### Completed Validations ✅
- `ls crates/` shows empty directory
- `cargo build -p forge-app` succeeds
- `cargo build --workspace` completes successfully
- `grep "upstream/crates" forge-app/Cargo.toml` shows all 7 crates
- Branch generation uses "forge/{task-id}" pattern
- Omni remains in forge-extensions
- `./scripts/check-upstream-alignment.sh` passes
- Type generation works for both upstream and forge

### Pending Validations
- [ ] Database properly initialized (see database issues in status log)
- [ ] Application starts without errors
- [ ] CI pipeline integration of alignment check
- [ ] Full test suite: `cargo test --workspace`
- [ ] Frontend build verification: `cd frontend && pnpm run build`

## Blocker Protocol
- **Escalation:** Document blockers in Status Log as `BLOCKER-#` with owner and unblock steps. Escalate to human champion if unresolved after two work sessions.
- **Fallback:** If upstream lacks extension seam, raise `BLOCKER-EXT` and propose upstream PR or temporary shim with documented debt.

## Status Log
- 2025-10-08 – Initialized wish
- 2025-10-08 – Updated to READY status with 5 execution groups
- 2025-10-08 – IMPLEMENTED:
  - ✅ Deleted all 7 duplicated crates from `crates/`
  - ✅ Updated all dependencies to point to `upstream/crates/*`
  - ✅ Fixed compilation issues with upstream integration
  - ✅ Branch prefix override implemented in router
  - ✅ Omni preserved in forge-extensions
  - ✅ Created and tested guardrail script
  - ✅ Full workspace builds successfully
- 2025-10-08 – DISCOVERED DATABASE ISSUES:
  - 🔧 Database path resolution: upstream uses `upstream/dev_assets` not workspace `dev_assets`
  - 🔧 `forge_global_settings` table migration partially failed (marked as run but table not created)
  - 🔧 Workaround: Symlink `dev_assets -> upstream/dev_assets` + manually create missing table
  - 📋 Need proper database path configuration in Forge

## Next Steps
1. **CI Integration**: Add `./scripts/check-upstream-alignment.sh` to GitHub Actions
2. **Testing**: Run full test suite (`cargo test --workspace`)
3. **Documentation**: Update developer docs to reflect new structure
4. **Review**: Run `/review` to evaluate implementation against matrix
