# 🧞 Upstream Reintegration Wish
**Status:** DRAFT  
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
| crates/services/src/services/container.rs | repo code | Local copy diverged from upstream container trait and impl | current state analysis |
| crates/services/src/services/git.rs | repo code | Forked Git service with large divergence from upstream | risk assessment |
| crates/local-deployment/src/container.rs | repo code | Modified worktree management and branch logic | current state, execution scope |
| crates/db/src/models/task.rs | repo code | Forge-specific edits to model vs upstream | execution scope |
| crates/server/src/bin/generate_types.rs | repo code | Type generator diverges; Omni types inlined, upstream drafts removed | Group B guardrails |
| crates/server/src/main.rs | repo code | Additional browser-launch guard, other drift vs upstream | Group A scope |
| crates/utils/src/lib.rs | repo code | Trimmed module surface, Forge-specific helpers | Group A scope |
| crates/executors/src/actions/coding_agent_follow_up.rs | repo code | Executor spawn contract changes vs upstream | Group B scope |
| crates/deployment/src/lib.rs | repo code | Deployment crate copied and edited | Group A scope |
| upstream/crates/services/src/services/container.rs | upstream code | Baseline we must lean on instead of duplicate | target state |
| upstream/crates/db/src/models/task.rs | upstream code | Source of truth for task model | target state |

## Discovery Summary
- **Primary analyst:** Human collaborator with GENIE oversight
- **Key observations:** Forge duplicated multiple upstream crates (`crates/services`, `crates/db`, `crates/local-deployment`) and edited them, breaking the “use upstream as library” objective. Omni/branch-prefix overrides are the only justifiable differences.
- **Assumptions (ASM-1):** Upstream repo (`upstream/*`) remains read-only and should be the single source for shared services/models.
- **Assumptions (ASM-2):** Omni features and branch prefix customization stay Forge-specific and may require extension seams.
- **Decisions (DEC-1):** Pursue reintegration by replacing duplicated crates with upstream dependencies where feasible.
- **Risks:** Drift in Forge-specific behavior (diff streaming, follow-up drafts) may lack extension points; dependency graph changes could impact builds; hidden drift in other crates must be cataloged.
- **Open questions (Q-1):** Do any consumers depend on Forge-only Git service behavior (e.g., fetch semantics, identity defaults)? (Answer in Execution Group B.)

## Executive Summary
Forge must stop maintaining forks of upstream task/worktree infrastructure and instead depend directly on upstream crates, adding only thin Forge extensions for Omni and branch-prefix requirements. This wish formalizes the reintegration roadmap: analyze dependency seams, realign Cargo manifests to use upstream code, migrate legitimate divergences into extension crates, and institute drift detection plus audits for remaining crates. Success restores the “upstream as library” architecture, slashes maintenance overhead, and ensures future upstream updates propagate automatically.

## Current State
- **Duplication:** `crates/services/src/services/container.rs`, `crates/services/src/services/git.rs`, and `crates/local-deployment/src/container.rs` duplicate upstream implementations with Forge edits.
- **Model divergence:** `crates/db/src/models/task.rs`, `crates/db/src/models/execution_process.rs`, and related modules diverge from upstream; `.sqlx` query caches differ. Forge added a `follow_up_draft.rs` model while upstream uses a unified `draft` table and `DraftsService`.
- **Server & tooling drift:** `crates/server/**` (including `src/main.rs`, `routes/`, and `bin/generate_types.rs`) and `crates/utils/**` include Forge-specific logic (browser launch, Omni routes, WSL helpers) instead of extension seams. Type generation in Forge replaces upstream drafts bindings with alternative types.
- **Executor differences:** `crates/executors/**` modifies action contracts and profiles, embedding Forge behaviour directly in the upstream copy.
- **Deployment crate:** `crates/deployment/**` mirrors upstream but with local edits, introducing yet another fork.
- **Configuration fork:** `crates/services/src/services/config/versions/v7.rs` duplicates upstream config to change branch prefix and add Omni fields.
- **Cargo topology:** Workspace excludes upstream crates, so binaries link against duplicated Forge copies.

## Target State & Guardrails
- **Desired behaviour:** Forge crates import upstream implementations via path dependencies, layering Forge-specific behavior through extension crates, traits, or configuration adapters.
- **Non-negotiables:** Preserve Omni configuration, maintain `git_branch_prefix: "forge"` override, keep Rust/TypeScript shared types generated via upstream pipelines, honor project standards (@.genie/standards/*), and avoid regressions in task/worktree workflows.
- **Out-of-scope:** Frontend overlay changes, unrelated executor enhancements, or rewriting upstream internals.
- **Customization strategy:** All Omni-specific logic, follow-up-draft support, and branch-prefix adjustments must live in Forge extension crates or minimal adapters—never by editing upstream copies.

## Migration Blueprint
- **Cargo rewiring (single source of truth):**
  - `forge-app/Cargo.toml` and affected crate manifests reference upstream crates directly:
    - `db = { path = "../upstream/crates/db" }`
    - `services = { path = "../upstream/crates/services" }`
    - `server = { path = "../upstream/crates/server" }`
    - `local-deployment = { path = "../upstream/crates/local-deployment" }`
    - `utils = { path = "../upstream/crates/utils" }`
    - `executors = { path = "../upstream/crates/executors" }`
    - `deployment = { path = "../upstream/crates/deployment" }`
  - Remove or archive duplicated `crates/*` counterparts once build compiles against upstream.
  - Workspace membership for developer tooling: add upstream crates that expose binaries invoked by our standard commands (e.g., `upstream/crates/server` for `cargo run -p server --bin generate_types`). Alternatively, update scripts to call `--manifest-path upstream/crates/server/Cargo.toml`; prefer adding upstream `server` to `workspace.members` to keep commands unchanged.

- **Per-crate actions (avoid duplicates):**
  - `crates/db`: restore to upstream; move `follow_up_draft` into an Omni DB module within `forge-extensions/omni` (or a small Forge DB extension). Apply Omni migrations via `forge-app` startup.
  - `crates/services`: drop local copies; re-implement any needed Omni/follow-up event streaming as separate services inside `forge-extensions/omni` and expose via `forge-app` routing.
  - `crates/local-deployment`: use upstream; any custom branch/worktree helpers live in extensions (goal is full reliance on upstream APIs).
  - `crates/server`: depend on upstream router; add Omni endpoints in `forge-app/src/router.rs`. Provide compatibility shims for current follow-up draft endpoints under `/api/forge/*` or mirrored legacy paths in `forge-app` to avoid frontend churn.
  - `crates/utils`: use upstream; move Forge-only helpers (e.g., WSL detection, custom cache dir) into a tiny `forge-utils` module under `forge-extensions` or into `forge-app` directly.
  - `crates/executors`: use upstream; any spawn/log normalization differences are implemented as adapters in Forge space if absolutely necessary.
  - `crates/deployment`: use upstream; Forge-specific initialization (Omni config, project settings defaults) occurs in `forge-app` startup.

- **Branch prefix (vk → forge) without forking config:**
  - Keep upstream `services::config::versions::v7` intact; inject default `git_branch_prefix = "forge"` at runtime in `forge-app` by applying a post-load override when unset.
  - Add a small guard in a Forge config extension to validate branch prefix format (reuse upstream validator) and set sane defaults for Forge instances.

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
1. Forge workspace `Cargo.toml` uses upstream crates for all backend dependencies (`upstream/crates/services`, `db`, `local-deployment`, `server`, `utils`, `executors`, `deployment`) without local duplication.
2. Forge-specific deltas are isolated in extension crates or config overlays with ≤10% code duplication versus upstream counterparts.
3. Automated guardrail test ensures key files remain in sync (e.g., diff check or integration test) and fails if drift reappears.
External Tracker Placeholder: TBD (add Jira/Linear ID once assigned)  
Dependencies: Upstream submodule availability, Omni extension crates, CI pipeline updates for new guardrails.
</spec_contract>

## Execution Groups

### Group A – dependency-realignment
- **Goal:** Replace duplicated Forge crates with upstream dependencies while preserving build success.
- **Surfaces:** Workspace `Cargo.toml`, `forge-app/Cargo.toml`, and crate manifests for `crates/services`, `crates/db`, `crates/local-deployment`, `crates/server`, `crates/utils`, `crates/executors`, `crates/deployment`; @.genie/standards/best-practices.md §Core Principles.
- **Deliverables:** Updated Cargo manifests pointing to upstream crates; removal or shrink-wrapping of duplicated source directories into extension crates (e.g., move Omni routes into `forge-extensions`); documentation of any unavoidable shim modules.
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-a.log` capturing `cargo tree`, `cargo check`, and diff snapshots before/after.
- **Suggested personas:** specialists/implementor, specialists/git-workflow.
- **External tracker:** TBD.

### Group B – extension-boundaries
- **Goal:** Isolate Forge-specific behaviour (Omni, branch prefix, follow-up drafts, executor tweaks) into explicit extensions without modifying upstream code.
 - **Surfaces:** `forge-extensions/*`, `forge-app/src/services/mod.rs`, Forge-specific configs (Omni), branch-prefix helpers, follow-up draft storage, executor overrides, type generators, and upstream trait surfaces (e.g., `upstream/crates/services/src/services/container.rs`, upstream server `task_attempts` routes including `drafts`).
 - **Deliverables:** Adapter modules or trait impls injecting Omni configuration and branch-prefix overrides; follow-up draft support via Omni module and migrations; executor augmentations via adapters; reworked type-generation pipeline that composes upstream generators plus Forge add-ons; documentation of seams and API routes (including any `/api` compatibility proxies hosted in `forge-app`).
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-b.md` summarizing extension patterns, updated doc references, and targeted unit tests.
- **Suggested personas:** specialists/implementor, specialists/tests.
- **External tracker:** TBD.

### Group C – guardrails-and-audit
- **Goal:** Establish automated drift detection and queue audits for the full backend surface.
- **Surfaces:** `scripts/` (guardrail tooling), CI configs, `.genie/wishes/upstream-reintegration/qa/`, audit list covering remaining backend crates (executors, deployment, utils, server, services, db, local-deployment) plus backlog for any follow-on areas.
- **Deliverables:** Script or test that diffs critical files against upstream (e.g., CI job running `diff -ru` with allowed extension paths); TODO tracker enumerating follow-up audits; status log updates and migration backlog entries.
- **Evidence:** `.genie/wishes/upstream-reintegration/qa/group-c.txt` with command outputs; updated status log referencing future audit tasks.
- **Suggested personas:** specialists/tests, specialists/project-manager.
- **External tracker:** TBD.

## Validation Plan
- `cargo fmt --all -- --check`
- `cargo clippy --all --all-targets --all-features -- -D warnings`
- `cargo test --workspace`
- `cargo run -p server --bin generate_types -- --check`
- `cargo run -p forge-app --bin generate_forge_types -- --check`
- Drift guardrail command (to be defined in Group C) executed and logged.

Artifacts stored under `.genie/wishes/upstream-reintegration/qa/` with subfolders per execution group.

## Blocker Protocol
- **Escalation:** Document blockers in Status Log as `BLOCKER-#` with owner and unblock steps. Escalate to human champion if unresolved after two work sessions.
- **Fallback:** If upstream lacks extension seam, raise `BLOCKER-EXT` and propose upstream PR or temporary shim with documented debt.

## Status Log
- 2025-10-08 – Initialized wish in DRAFT status.

## Branch & Tracker Strategy
- Working branches: `feature/upstream-reintegration/<group-letter>` spawned per execution group, based off latest main with isolated worktrees managed by specialists/git-workflow.
- Tracker linkage: Add external tracker ID to spec contract once assigned; mirror status in tracker and wish status log.
- Evidence storage: `.genie/wishes/upstream-reintegration/qa/<group>`; include guardrail artifacts and diff outputs.

## Approvals & Checkpoints
- Human approval required before launching `/forge` for each execution group.
- Post-implementation review via `/review` referencing Evaluation Matrix.
- Final sign-off once guardrails verified and blockers resolved/accepted.
