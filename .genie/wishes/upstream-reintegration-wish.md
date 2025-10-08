# 🧞 Upstream Reintegration Wish
**Status:** READY
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

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Plan – Upstream reintegration brief (2025-10-08) | conversation | Three-phase strategy to realign Forge with upstream while preserving Omni/branch overrides | entire wish |
| @.genie/product/mission.md | repo doc | Mission emphasizes structured orchestration and git worktree isolation | discovery, executive summary |
| @.genie/product/roadmap.md | repo doc | Phase 0 “Open-source foundation” commits to leveraging upstream strengths | spec contract, guardrails |
| @.genie/standards/best-practices.md | repo doc | Coding standards and quality expectations for Rust/TypeScript | standards checklist |
| @.genie/standards/naming.md | repo doc | Naming conventions required during refactor | execution groups |
| crates/services/src/services/container.rs:101 | repo code | Local duplicate of container trait (upstream has same at line 105) | current state analysis |
| upstream/crates/services/src/services/container.rs:231 | upstream code | **CRITICAL**: Extension seam `git_branch_from_task_attempt` already exists | Phase 0, Group B |
| crates/services/src/services/git.rs:71 | repo code | DiffTarget with different shape vs upstream line 123 | risk assessment |
| crates/local-deployment/src/container.rs:531 | repo code | Hardcoded "forge/" prefix instead of using trait seam | current state, Group B |
| upstream/crates/local-deployment/src/container.rs:583 | upstream code | Uses trait-based branch naming via line 231 seam | target state |
| crates/db/src/models/follow_up_draft.rs:8 | repo code | Forge-only model; upstream uses unified draft.rs | execution scope |
| upstream/crates/db/src/models/draft.rs:1 | upstream code | Unified Draft model with DraftType enum | target state |
| upstream/crates/services/src/services/drafts.rs:1 | upstream code | DraftsService provides draft management | Group B scope |
| crates/db/migrations/20250921222241_unify_drafts_tables.sql | repo migration | **FOUND**: Existing migration to unify drafts | Phase 0, Group B |
| crates/server/src/bin/generate_types.rs:46,103 | repo code | Exports FollowUpDraftResponse + FollowUpDraft types | Group B type migration |
| upstream/crates/server/src/bin/generate_types.rs:46,106-107 | upstream code | Exports DraftResponse + Draft/DraftType types | target state |
| crates/server/src/routes/omni.rs:11,33-45,110-122 | repo code | Omni routes import from local services directly | Group B decoupling |
| upstream/crates/executors/src/executors/copilot.rs:1 | upstream code | Copilot executor (missing in Forge) | upstream richer |
| forge-app/Cargo.toml:27-30 | repo config | Points to ../crates/* not ../upstream/crates/* | Group A scope |
| Cargo.toml:1-10 | repo config | Workspace excludes upstream crates entirely | Group A scope |

## Discovery Summary
- **Primary analyst:** Human collaborator with GENIE oversight
- **Key observations:** Forge duplicated ALL 7 upstream crates (`db`, `services`, `server`, `executors`, `utils`, `deployment`, `local-deployment`) and edited them, breaking the "use upstream as library" objective. Upstream is more mature than Forge's forks (e.g., has copilot executor, DraftsService).
- **Root cause:** Only Omni integration and branch prefix changes were intended. All other backend changes were unintended divergence.
- **Assumptions (ASM-1):** Upstream repo (`upstream/*`) remains read-only and is the single source for all shared services/models.
- **Assumptions (ASM-2):** Omni features stay Forge-specific; everything else uses upstream as-is.
- **Decisions (DEC-1):** Delete all duplicated crates, use upstream directly via path dependencies.
- **Decisions (DEC-2):** Override git_branch_prefix config to "forge" (from "vk").
- **Decisions (DEC-3):** Drop database, start fresh with upstream schema.
- **Decisions (DEC-4):** Move Omni to forge-extensions, remove from services.
- **Risks:** Omni import coupling in server/local-deployment must be rewired to `forge-extensions/omni`.
- **Open questions resolved (Q-1):** Migration is straightforward - delete and use upstream.

## Executive Summary
Forge should use upstream crates directly, adding only Omni integration as a Forge-specific extension. This wish removes unintended backend divergence by deleting duplicated crates and pointing to upstream. The database will be recreated fresh with upstream schema. The only customizations are: (1) Omni in forge-extensions, (2) git_branch_prefix config override to "forge".

## Current State
- **Unintended duplication:** ALL 7 crates (`db`, `services`, `server`, `executors`, `utils`, `deployment`, `local-deployment`) were copied from upstream and modified, breaking the "upstream as library" architecture.
- **Only intended changes:**
  1. Add Omni integration (currently in `crates/services/src/services/omni/`)
  2. Change `git_branch_prefix` from `"vk"` to `"forge"`
- **Everything else:** Unintended divergence that should be deleted and replaced with upstream.
- **Development environment:** Database can be dropped and recreated fresh - no data preservation needed.

## Target State
- **Goal:** Use upstream directly for everything except Omni and branch prefix.
- **Implementation:**
  1. Delete all duplicated crates
  2. Point forge-app to upstream crates via path dependencies
  3. Override config: `config.git_branch_prefix = "forge"`
  4. Move Omni to forge-extensions
- **Out-of-scope:** Frontend changes, any backend changes beyond Omni and branch prefix.

## Migration Blueprint
- **Step 1: Delete all duplicated crates**
  - `rm -rf crates/db crates/services crates/server crates/local-deployment crates/utils crates/executors crates/deployment`
  - Drop database: `rm dev_assets/db.sqlite*` (development environment, no data preservation needed)

- **Step 2: Point to upstream in forge-app/Cargo.toml:**
  ```toml
  db = { path = "../upstream/crates/db" }
  services = { path = "../upstream/crates/services" }
  server = { path = "../upstream/crates/server" }
  local-deployment = { path = "../upstream/crates/local-deployment" }
  utils = { path = "../upstream/crates/utils" }
  executors = { path = "../upstream/crates/executors" }
  deployment = { path = "../upstream/crates/deployment" }
  ```

- **Step 3: Branch prefix patch (vk → forge):**
  - Config override in `forge-app/src/main.rs` at startup:
    ```rust
    config.git_branch_prefix = "forge".to_string();
    ```
  - No trait implementations or wrappers needed.

- **Step 4: Move Omni to forge-extensions:**
  - Move `crates/services/src/services/omni/` → `forge-extensions/omni/`
  - Update imports from `services::services::omni` → `forge_omni`
  - Add Omni routes to `forge-app/src/router.rs`

- **Shared types generation:**
  - Use upstream server generator (core-only). Ensure the upstream `server` crate is part of the workspace or adjust scripts to run with `--manifest-path` so the documented commands work.
  - Keep Omni types confined to `forge-app/src/bin/generate_forge_types.rs`. Ensure `shared/types.ts` comes from the upstream generator; `shared/forge-types.ts` contains Omni-only additions.

- **Omni-only hotspots (move to extensions):**
  - `crates/services/src/services/omni/**` → `forge-extensions/omni/**` (single source of truth).
  - Follow-up drafts are not Omni-only: upstream provides `DraftsService` and routes; remove Forge’s `follow_up_draft.rs` model and align with upstream `draft` table + services. If Forge needs extra behavior, wrap upstream service from `forge-app` without forking.
  - Any legacy follow-up-draft endpoints implemented in Forge’s server/services should be proxied or re-expressed via `forge-app` to upstream drafts routes, then removed.

- **Guardrails:**
  - CI job fails if any of these crates exist under `crates/`: `db, services, server, utils, executors, local-deployment, deployment` (post-migration). Only upstream counterparts permitted.
  - CI verifies `Cargo.toml` dependencies for these crates resolve to `../upstream/crates/*` and no local duplicates are present. (If a legacy dir briefly exists, it must contain no Rust sources and be excluded from workspace.)

## Out-of-Scope
- Introducing new Omni features beyond existing needs.
- Altering upstream submodule contents directly.
- Frontend/Vite build chain modifications (track separately).

<spec_contract>
Roadmap Alignment: Phase 0 – Open-source foundation (@.genie/product/roadmap.md §Phase 0)
Success Metrics:
1. ✅ Forge uses upstream crates via path deps (`forge-app/Cargo.toml` points to `../upstream/crates/*`)
2. ✅ Zero duplicated crates in `crates/` directory (deleted completely)
3. ✅ Branch prefix is "forge" via simple config override (no trait implementations)
4. ✅ Omni fully decoupled (imports from `forge-extensions/omni`, not `services::services::omni`)
5. ✅ Database recreated fresh from upstream schema
6. ✅ Automated guardrail (`scripts/check-upstream-alignment.sh`) passes in CI
External Tracker Placeholder: TBD (add Jira/Linear ID once assigned)
Dependencies: Upstream submodule availability, existing draft migration (20250921222241), CI pipeline updates for guardrails.
</spec_contract>

## Execution Groups

### Group A – delete-duplicates
- **Goal:** Remove all duplicated crates and drop database.
- **Surfaces:** All of `crates/` directory except forge-extensions.
- **Deliverables:**
  1. **Delete duplicated crates**:
     ```bash
     rm -rf crates/db crates/services crates/server crates/local-deployment
     rm -rf crates/utils crates/executors crates/deployment
     ```
  2. **Drop database** (dev environment, no data preservation):
     ```bash
     rm dev_assets/db.sqlite*
     rm .sqlx/*  # Clear query cache
     ```
  3. **Clean build artifacts**:
     ```bash
     cargo clean
     ```
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-a.log` with `ls -la crates/` showing only forge-extensions remains.
- **Suggested personas:** specialists/implementor.
- **External tracker:** TBD.

### Group B – point-to-upstream
- **Goal:** Update forge-app to use upstream crates directly.
- **Surfaces:** `forge-app/Cargo.toml`, workspace `Cargo.toml`.
- **Deliverables:**
  1. **Update forge-app/Cargo.toml dependencies**:
     ```toml
     [dependencies]
     db = { path = "../upstream/crates/db" }
     services = { path = "../upstream/crates/services" }
     server = { path = "../upstream/crates/server" }
     local-deployment = { path = "../upstream/crates/local-deployment" }
     utils = { path = "../upstream/crates/utils" }
     executors = { path = "../upstream/crates/executors" }
     deployment = { path = "../upstream/crates/deployment" }
     ```
  2. **Add upstream/crates/server to workspace** (for type generation):
     ```toml
     members = [
       "forge-app",
       "forge-extensions/*",
       "upstream/crates/server",  # For generate_types binary
     ]
     ```
  3. **Initialize database with upstream schema**:
     ```bash
     sqlx database create
     sqlx migrate run --source upstream/crates/db/migrations
     ```
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-b.log` with successful `cargo build -p forge-app`.
- **Suggested personas:** specialists/implementor.
- **External tracker:** TBD.

### Group C – config-override
- **Goal:** Override git_branch_prefix with config patch.
- **Surfaces:** `forge-app/src/main.rs` or startup code.
- **Deliverables:**
  1. **Config override** (no trait implementations):
     ```rust
     // In forge-app startup, after loading config:
     config.git_branch_prefix = "forge".to_string();
     ```
  2. **Remove any trait wrappers** - not needed
  3. **Verify branches created with "forge/" prefix**:
     ```bash
     # Create a test task and verify branch name
     curl -X POST localhost:8080/api/tasks/...
     git branch | grep "forge/"
     ```
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-c.log` showing branches with "forge/" prefix.
- **Suggested personas:** specialists/implementor.
- **External tracker:** TBD.

### Group D – omni-migration
- **Goal:** Move Omni from services to forge-extensions.
- **Surfaces:** `crates/services/src/services/omni/`, `forge-extensions/omni/`.
- **Deliverables:**
  1. **Move Omni module**:
     ```bash
     mv crates/services/src/services/omni forge-extensions/
     ```
  2. **Update imports**:
     ```diff
     # forge-app/src/main.rs and routes
     -use services::services::omni;
     +use forge_omni;
     ```
  3. **Add Omni routes to forge-app router**:
     ```rust
     // forge-app/src/router.rs
     .merge(forge_omni::routes())
     ```
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-d.log` with successful Omni API calls.
- **Suggested personas:** specialists/implementor.
- **External tracker:** TBD.
### Group E – guardrails
- **Goal:** Establish automated drift detection to prevent future divergence.
- **Surfaces:** `scripts/check-upstream-alignment.sh`, CI configs.
- **Deliverables:**
  1. **Drift detection script**:
     ```bash
     #!/bin/bash
     # scripts/check-upstream-alignment.sh

     echo "Checking upstream alignment..."

     # No duplicated crates allowed
     for crate in db services server executors utils deployment local-deployment; do
         if [ -d "crates/$crate" ]; then
             echo "ERROR: Duplicate crate crates/$crate exists"
             exit 1
         fi
     done

     # Verify forge-app uses upstream
     if ! grep -q 'path = "../upstream/crates' forge-app/Cargo.toml; then
         echo "ERROR: forge-app not using upstream crates"
         exit 1
     fi

     echo "✅ Upstream alignment verified"
     ```
  2. **Add to CI**:
     ```yaml
     - name: Check upstream alignment
       run: ./scripts/check-upstream-alignment.sh
     ```
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-e.log` with script passing.
- **Suggested personas:** specialists/tests.
- **External tracker:** TBD.

## Validation Plan

**After Group A (delete duplicates):**
- [ ] `ls crates/` shows empty or only forge-extensions
- [ ] Database deleted: `ls dev_assets/db.sqlite*` returns nothing

**After Group B (point to upstream):**
- [ ] `cargo build -p forge-app` succeeds
- [ ] `grep "upstream/crates" forge-app/Cargo.toml` shows all 7 crates

**After Group C (config override):**
- [ ] Create test task, verify branch starts with "forge/"
- [ ] No complex trait implementations exist

**After Group D (omni migration):**
- [ ] Omni API endpoints respond successfully
- [ ] No references to `services::services::omni` remain

**After Group E (guardrails):**
- [ ] `./scripts/check-upstream-alignment.sh` passes
- [ ] CI pipeline includes alignment check

**Final Validation:**
- [ ] `cargo test --workspace` passes
- [ ] Frontend builds: `cd frontend && pnpm run build`
- [ ] Branch prefix is "forge/" not "vk/"

**Artifacts stored under** `.genie/wishes/upstream-reintegration/qa/` with subfolders per phase/group.

## Blocker Protocol
- **Escalation:** Document blockers in Status Log as `BLOCKER-#` with owner and unblock steps. Escalate to human champion if unresolved after two work sessions.
- **Fallback:** If upstream lacks extension seam, raise `BLOCKER-EXT` and propose upstream PR or temporary shim with documented debt.

## Status Log
- 2025-10-08 – Initialized wish.
- 2025-10-08 – Updated to READY status:
  - ✅ Only Omni integration and branch prefix override needed
  - ✅ Database can be dropped and recreated (dev environment)
  - ✅ Branch prefix via config override
  - ✅ Delete duplicated crates and use upstream directly
  - ✅ Organized into 5 execution groups

## Branch & Tracker Strategy
- Working branches: `feature/upstream-reintegration/<group-letter>` spawned per execution group, based off latest main with isolated worktrees managed by specialists/git-workflow.
- Tracker linkage: Add external tracker ID to spec contract once assigned; mirror status in tracker and wish status log.
- Evidence storage: `.genie/wishes/upstream-reintegration/qa/<group>`; include guardrail artifacts and diff outputs.

## Approvals & Checkpoints
- Human approval required before launching `/forge` for each execution group.
- Post-implementation review via `/review` referencing Evaluation Matrix.
- Final sign-off once guardrails verified and blockers resolved/accepted.
