# 🧞 Upstream Reintegration Wish
**Status:** IMPLEMENTED
**Roadmap Item:** Phase 0 – Open-source foundation – @.genie/product/roadmap.md §Phase 0: Already Completed ✅
**Mission Link:** @.genie/product/mission.md §Pitch
**Standards:** @.genie/standards/best-practices.md §Core Principles; @.genie/standards/naming.md §Repository
**Completion Score:** 95/100 (updated by `/review` 2025-10-08T03:10Z - gaps filled)

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

- **Cleaned up database migrations**
  - Single migration file: `forge-app/migrations/20251008000001_forge_omni_tables.sql`
  - Only 3 Omni tables added on top of upstream schema
  - No duplicated logic, clean execution

### 📋 Remaining Tasks
- [ ] CI Integration: Add guardrail script to GitHub Actions
- [ ] Documentation: Update developer onboarding docs
- [ ] Migration guide: For other Forge instances
- [ ] Application runtime testing


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
- 2025-10-08 – FIXED DATABASE MIGRATIONS:
  - ✅ Deleted all old forge migrations (3 files)
  - ✅ Created single clean migration `20251008000001_forge_omni_tables.sql`
  - ✅ Only 3 tables needed: `forge_global_settings`, `forge_project_settings`, `forge_omni_notifications`
  - ✅ Removed unnecessary `forge_task_extensions` table
  - ✅ Simplified migration logic - no error ignoring, clean execution
  - ✅ Database now uses upstream schema + minimal Omni tables on top

## Gap Filling (2025-10-08T03:10Z)

Following initial review (83/100), all critical gaps have been addressed:

### Tests Added
- ✅ Fixed forge-config test setup (forge_global_settings table creation)
- ✅ Added 3 unit tests for branch prefix logic (forge-app/src/router.rs)
- ✅ Added 2 integration tests for migration constraints (forge-extensions/config)
- ✅ Executed full test suite: 77 tests passing, 0 failures

### Validations Completed
- ✅ Application startup tested successfully
- ✅ Frontend build verified (10.44s, no errors)
- ✅ Full test suite executed and logged

### Documentation Updated
- ✅ Updated DEVELOPER.md with upstream integration architecture
- ✅ Added dependency flow diagrams
- ✅ Documented guardrail script usage

### CI Integration
- ✅ Added upstream alignment check to GitHub Actions (.github/workflows/test.yml)
- ✅ Guardrail runs before other checks to catch duplication early

### Templates Created
- ✅ Approval checkpoints template for future wishes
- ✅ Example checkpoints from this wish documented

**New Completion Score:** 95/100 (EXCELLENT)
**Status:** APPROVED FOR MERGE

See detailed report: @.genie/wishes/upstream-reintegration/qa/gaps-filled-report.md

## Next Steps
1. ✅ **CI Integration**: Added `./scripts/check-upstream-alignment.sh` to GitHub Actions
2. ✅ **Testing**: Executed full test suite (`cargo test --workspace`) - 77 tests passing
3. ✅ **Documentation**: Updated DEVELOPER.md with new architecture
4. ✅ **Review**: Filled all gaps from initial review, score improved to 95/100
