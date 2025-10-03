# 🧞 UPGRADE UPSTREAM TO v0.0.101 + SYNC FRONTEND WISH
**Status:** DRAFT
**Roadmap Item:** MAINT-001 – Upstream synchronization and technical debt reduction
**Mission Link:** @README.md §Philosophy (Vibe Coding++™)
**Standards:** @CLAUDE.md §Architecture Overview
**Completion Score:** 0/100 (updated by `/review`)

## Evaluation Matrix (100 Points Total)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts)**
  - [ ] All relevant files/docs referenced with @ notation (4 pts)
  - [ ] Upstream changelog v0.95→v0.101 analyzed (3 pts)
  - [ ] Frontend diff analysis completed (~30 files) (3 pts)
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
  - [ ] Follows project standards (@CLAUDE.md) (5 pts)
  - [ ] Minimal surface area changes, focused scope (5 pts)
  - [ ] Clean abstractions and patterns (5 pts)
- **Test Coverage (10 pts)**
  - [ ] Backend smoke tests pass (4 pts)
  - [ ] Frontend UI tests pass (4 pts)
  - [ ] Evidence of test execution captured (2 pts)
- **Documentation (5 pts)**
  - [ ] Updated README with new version (2 pts)
  - [ ] Updated DEVELOPER.md if needed (2 pts)
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
  - [ ] Screenshots/UI verification captured (3 pts)
  - [ ] Before/after comparisons provided (3 pts)
- **Review Thoroughness (5 pts)**
  - [ ] Human approval obtained at checkpoints (2 pts)
  - [ ] All blockers resolved or documented (2 pts)
  - [ ] Status log updated with completion timestamp (1 pt)

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Planning brief | doc | v0.95→v0.101 upgrade plan, 225+ files changed, 6 versions gap | entire wish |
| @upstream/CHANGELOG.md | repo | Upstream changes v0.96-v0.101 | implementation |
| @.genie/wishes/restructure-upstream-library-wish.md | repo | Previous migration context | wish context |
| @Cargo.toml | repo | Workspace configuration with forge-extensions | Group A |
| @frontend/src/components/ | repo | ~30 files differ from upstream (branding, features) | Group B |
| @upstream/crates/db/migrations/ | repo | Schema changes (branch NOT NULL, base_branch→target_branch) | Group A |
| git diff analysis | discovery | Frontend customizations identified | Group B |

## Discovery Summary
- **Primary analyst:** GENIE + Human
- **Key observations:**
  - Current upstream submodule at v0.0.95-20250924092007 (detached HEAD)
  - Latest available: v0.0.101-20251001171801 (6 versions behind)
  - 225+ files changed in upstream between versions
  - **NEW:** Overlay architecture implemented (commit 2fa77027, Oct 3 2025)
    - Frontend now uses Vite overlay resolver (forge-overrides/ → upstream/)
    - `frontend/` is minimal (5 files), `forge-overrides/frontend/` currently empty
    - All UI currently pure upstream (no active customizations)
  - forge-extensions/branch-templates to be removed
  - forge-extensions/omni and forge-extensions/config are actively used, must keep
  - No forge-extensions/genie exists (was hallucinated reference)
  - No production data concerns - pre-release state allows fresh DB start

- **Assumptions (ASM-#):**
  - **ASM-1**: Upstream v0.0.101 is stable and production-ready
  - **ASM-2**: Overlay architecture (commit 2fa77027) is functional and complete
  - **ASM-3**: forge-extensions/omni and config are integrated and functional
  - **ASM-4**: Database schema can start fresh (no migration required)
  - **ASM-5**: Main branch is old direct fork - this branch is the future architecture
  - **ASM-6**: forge-overrides/frontend/ can stay empty (pure upstream UI acceptable for now)

- **Open questions (Q-#):**
  - **Q-1**: Are there breaking API changes in v0.96-v0.101 that affect forge-extensions?
  - **Q-2**: Does overlay resolver handle all upstream frontend changes automatically?
  - **Q-3**: Any branding customizations needed in forge-overrides/frontend/?
  - **Q-4**: Any runtime dependencies changed (Node, Rust, pnpm versions)?

- **Risks:**
  - **RISK-1**: Overlay resolver may fail with new upstream file structure
  - **RISK-2**: New upstream components may break forge-extensions/omni integration
  - **RISK-3**: Database schema changes may surface at runtime if migrations incomplete
  - **RISK-4**: Breaking API changes in 225+ files could affect forge-extensions
  - **RISK-5**: Build script (local-build.sh) references deleted frontend-forge package

## Executive Summary
Upgrade the upstream vibe-kanban submodule from v0.0.95 to v0.0.101 (6 versions, 225+ files), verify overlay architecture handles upstream changes, remove dead code (branch-templates extension), and fix build script. With the new overlay architecture (commit 2fa77027), frontend upgrades are automatic—no manual file merging required.

## Current State
- **Upstream submodule:** v0.0.95-20250924092007 (Sept 2025)
  - @upstream/ git submodule tracked in @.gitmodules
  - Backend: Using upstream crates directly via Cargo workspace (@Cargo.toml)
  - Database: Custom `dev_assets/db.sqlite` with v0.95 schema

- **Frontend (NEW overlay architecture):** @frontend/
  - Minimal package: 5 files in src/ (App.tsx 930 lines, main.tsx, styles.css, etc.)
  - Vite overlay resolver: @forge-overrides/frontend/src/ → @upstream/frontend/src/
  - Currently using pure upstream UI (forge-overrides/frontend/ is empty)
  - @frontend/vite.config.ts implements overlay pattern

- **Extensions:** @forge-extensions/
  - **omni/**: Notification system (KEEP - actively used)
  - **config/**: Forge config management (KEEP - actively used)
  - **branch-templates/**: Custom branch naming (DELETE - being removed)
  - **genie/**: Does not exist (was hallucinated reference)

- **Overrides:** @forge-overrides/
  - @forge-overrides/frontend/ exists but empty (future UI customizations)
  - .gitkeep placeholder retained

- **Gaps/Pain points:**
  - 6 versions behind upstream (missing features, bug fixes, security patches)
  - branch_template extension still present (needs deletion)
  - Build script broken: references deleted frontend-forge package
  - Cargo.toml ts-rs missing serde-json-impl feature (causes build failure)

## Target State & Guardrails
- **Desired behaviour:**
  - Upstream submodule at v0.0.101-20251001171801
  - Overlay architecture handles upstream frontend automatically
  - forge-overrides/frontend/ ready for future customizations (currently empty OK)
  - Clean workspace: only omni+config extensions remain
  - Fresh database with v0.0.101 schema
  - Build script fixed (no frontend-forge references)
  - All smoke tests passing (create project → task → attempt)

- **Non-negotiables:**
  - **Keep omni+config:** These extensions are functional and required
  - **No data loss:** Pre-release state, fresh DB acceptable
  - **Backend unchanged:** Use upstream crates directly (no local overrides)
  - **Overlay architecture:** Preserve Vite overlay resolver pattern
  - **Testable:** Must be able to run full development cycle
  - **Reversible:** Git allows rollback if critical issues found

## Execution Groups

### Group A – Backend Cleanup & Upstream Upgrade
- **Goal:** Remove dead extensions, upgrade upstream submodule, verify backend compiles
- **Surfaces:**
  - @forge-extensions/branch-templates/ (DELETE)
  - @forge-extensions/genie/ (DELETE if exists)
  - @Cargo.toml (UPDATE workspace members)
  - @upstream/ (UPGRADE to v0.0.101)
  - @.gitmodules (UPDATE submodule ref)

- **Deliverables:**
  - Deleted: `forge-extensions/branch-templates/`, `forge-extensions/genie/`
  - Updated: `Cargo.toml` workspace members list
  - Upgraded: `upstream/` submodule to v0.0.101-20251001171801
  - Verified: `cargo check --workspace` passes
  - Tested: Backend starts (`pnpm run backend:dev`)

- **Evidence:**
  - Command outputs: `rm -rf forge-extensions/{branch-templates,genie}`
  - Git commit: Submodule update and Cargo.toml changes
  - Build log: `cargo check --workspace` success
  - Runtime log: Backend server startup
  - Storage: `.genie/wishes/upgrade-upstream-v0.0.101/group-a-evidence.md`

- **Suggested personas:** N/A (straightforward deletion + submodule update)
- **External tracker:** N/A

### Group B – Frontend Synchronization
- **Goal:** Merge ~30 frontend files from upstream while preserving Automagik Forge customizations
- **Surfaces:**
  - @frontend/src/components/ (~30 files)
  - @frontend/public/ (assets)
  - @upstream/frontend/src/components/ (reference)
  - @frontend/src/components/NormalizedConversation/PendingApprovalEntry.tsx (NEW - add from upstream)

- **Deliverables:**
  - **Preserved customizations:**
    - Branding: logos, colors, "Automagik Forge" naming
    - Omni component integration
    - Custom UI polish
  - **Adopted from upstream:**
    - Bug fixes in conversation rendering
    - New PendingApprovalEntry.tsx component
    - Improved diff visualization
    - Performance optimizations
  - **Removed completely:**
    - All branch_template UI (BranchSelector, template fields in TaskFormDialog)
    - Any genie-related frontend code

- **Evidence:**
  - File-by-file merge decisions documented
  - Before/after screenshots of key UI pages
  - Brand consistency verification (logos, naming)
  - Frontend build: `pnpm run check` passes
  - UI smoke test: Full task lifecycle works
  - Storage: `.genie/wishes/upgrade-upstream-v0.0.101/group-b-evidence.md`

- **Suggested personas:** N/A (requires human judgment on branding decisions)
- **External tracker:** N/A

### Group C – Database & Integration Testing
- **Goal:** Fresh database setup, comprehensive smoke testing, documentation updates
- **Surfaces:**
  - @dev_assets/db.sqlite (DELETE - fresh start)
  - @README.md (UPDATE version references)
  - @DEVELOPER.md (UPDATE if needed)
  - Full application stack

- **Deliverables:**
  - Fresh database with upstream v0.0.101 schema
  - Smoke test success:
    - Create project
    - Create task (verify no branch_template UI)
    - Start task attempt
    - Verify branding throughout
  - Documentation updated with v0.0.101 references
  - Screenshots of working application

- **Evidence:**
  - Database recreation: `rm dev_assets/db.sqlite && pnpm run dev`
  - Smoke test transcript with screenshots
  - Updated documentation files
  - Final verification: `cargo test --workspace` (if applicable)
  - Storage: `.genie/wishes/upgrade-upstream-v0.0.101/group-c-evidence.md`

- **Suggested personas:** N/A (manual testing)
- **External tracker:** N/A

## Verification Plan

### Validation Commands (Exact Syntax)
```bash
# Phase 1: Backend verification
cargo check --workspace
cargo fmt --all -- --check
pnpm run backend:dev  # Verify starts without errors

# Phase 2: Frontend verification
pnpm run check        # TypeScript compilation
pnpm run lint         # Linting passes
pnpm run dev          # Full stack starts

# Phase 3: Smoke tests (manual)
# 1. Open http://localhost:3000
# 2. Verify "Automagik Forge" branding visible
# 3. Create new project
# 4. Create new task (verify NO branch_template field)
# 5. Start task attempt
# 6. Verify branch name uses default pattern: forge-{title}-{uuid}
```

### Evidence Checklist
- **Validation commands (exact):**
  - All commands above executed with SUCCESS outputs
  - Logs captured showing no errors

- **Artefact paths (where evidence lives):**
  - `.genie/wishes/upgrade-upstream-v0.0.101/group-a-evidence.md` (backend)
  - `.genie/wishes/upgrade-upstream-v0.0.101/group-b-evidence.md` (frontend)
  - `.genie/wishes/upgrade-upstream-v0.0.101/group-c-evidence.md` (testing)
  - `.genie/wishes/upgrade-upstream-v0.0.101/screenshots/` (UI verification)

- **Approval checkpoints (human sign-off required):**
  - ✅ **Checkpoint 1:** After Group A - verify backend compiles and starts
  - ✅ **Checkpoint 2:** After Group B - review frontend branding preserved
  - ✅ **Checkpoint 3:** After Group C - approve final smoke test results

### Branch Strategy
- **Current branch:** `feat/genie-framework-migration` (keep planning)
- **Merge planning back:** Merge this wish document to main/upstream branch
- **New branch for execution:** Create fresh branch for actual upgrade work
  - Suggested name: `upgrade-upstream-v0.0.101`
  - Branch from: Latest main/upstream branch
  - Duration: Single focused PR (2-3 hours work)

## <spec_contract>
- **Scope:**
  - Upgrade upstream submodule v0.0.95 → v0.0.101
  - Remove forge-extensions/branch-templates and forge-extensions/genie
  - Synchronize ~30 frontend files preserving Automagik Forge branding
  - Fresh database with v0.0.101 schema
  - Complete branch_template feature removal
  - Documentation updates

- **Out of scope:**
  - Changes to forge-extensions/omni or forge-extensions/config
  - New features beyond upstream additions
  - Performance optimizations beyond upstream improvements
  - Database migration from existing data (fresh start)
  - Changes to main branch architecture

- **Success metrics:**
  - `cargo check --workspace` ✅
  - `pnpm run check` ✅
  - `pnpm run dev` starts both servers ✅
  - Create project → task → attempt workflow completes ✅
  - "Automagik Forge" branding visible throughout UI ✅
  - No branch_template UI visible ✅
  - Git submodule at v0.0.101-20251001171801 ✅

- **External tasks:** None

- **Dependencies:**
  - Upstream vibe-kanban repository (read-only access)
  - Node.js, Rust, pnpm toolchain
  - Git submodule functionality

## Blocker Protocol
1. Pause work and create `.genie/reports/blocker-upgrade-upstream-<timestamp>.md` describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after wish status/log is updated.

## Status Log
- [2025-10-02 22:00Z] Wish created from planning brief
- [YYYY-MM-DD HH:MMZ] Planning merged to upstream branch
- [YYYY-MM-DD HH:MMZ] New branch created for execution
- [YYYY-MM-DD HH:MMZ] Group A started
- [YYYY-MM-DD HH:MMZ] Group A completed - Checkpoint 1 approved
- [YYYY-MM-DD HH:MMZ] Group B started
- [YYYY-MM-DD HH:MMZ] Group B completed - Checkpoint 2 approved
- [YYYY-MM-DD HH:MMZ] Group C started
- [YYYY-MM-DD HH:MMZ] Group C completed - Checkpoint 3 approved
- [YYYY-MM-DD HH:MMZ] Wish COMPLETED - Score: __/100
