# Upstream Merge Analysis Report - PR #3

## Executive Summary
Upstream PR #3 (branch `origin/upstream-merge-20250917-173057`) diverges sharply from our last v0.3.8 tag (`v0.3.8-20250903203030`). The branch rebrands the product, replaces our Windows OpenSSL build flow, rewires Docker packaging, and overhauls major frontend areas. These edits collide with fork-critical customizations—GENIE personality, pnpm-first tooling, release automation, and worktree safety—so a direct merge would likely break CI and product workflows.

**Latest upstream synced:** `023e52e5` (fix: codex session forking regression)

**Outstanding upstream/main commits to integrate:**
- [x] `941fe3e2` — refactoring: Filter soft-deleted processes in the backend (#773)
- [x] `9810de7d` — Codex: remove ask-for-approval flag (#771)
- [x] `c60c1a8f` — Alex/refactor create pr (#746)
- [x] `9c0743e9` — truncate the middle rather than the end (#751)
- [x] `4c7e3589` — Fix dropdown (vibe-kanban) (#764)
- [x] `a069304f` — Fix todos and delete useProcessesLogs (vibe-kanban) (#755)
- [x] `cc66eb96` — update mintlify creds (#774)
- [x] `75205c06` — docs: remove all references to /user-guide (vibe-kanban) (#747)
- [x] `c44edf33` — open the frontend by default when running the dev command (#717)
- [x] `73bc2396` — chore: bump version to 0.0.91
- [x] `904827e4` — refactor: TaskfollowupSection followup (#762)

## Changed Files Analysis
### [x] .github/workflows/build-all-platforms.yml
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** HIGH_RISK_CONFLICT
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows build YES · MCP NO
- **Specific Concerns:** Against the published `v0.3.9-20250910051659` tag (latest successful release) the upstream branch removes the Chocolatey-driven OpenSSL install/dynamic path detection that our Windows jobs currently rely on, and instead forces vendored OpenSSL via Strawberry Perl + NASM (`lines 73-132`).
- **Recommendation:** Retain the proven 0.3.9 workflow or demonstrate the vendored toolchain works on GitHub-hosted and self-hosted Windows runners before adopting it.

### [x] .github/workflows/pre-release.yml
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** HIGH_RISK_CONFLICT
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows build YES · MCP NO
- **Specific Concerns:** Relative to the working 0.3.9 pipeline, `lines 245-275` drop the `choco install openssl.light` + hard failure guard, replacing it with vendored OpenSSL env vars.
- **Recommendation:** Keep the 0.3.9 behaviour or validate the vendored flow with a Windows pre-release dry run before merging.

### [x] .github/workflows/publish.yml.disabled
- **Change Type:** Renamed (disabled)
- **Custom Modifications Present:** Yes
- **Risk Level:** LOW (verified)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows build NO · MCP NO
- **Specific Concerns:** Commit `160cfd5` explains the disablement—`build-all-platforms.yml` already handles npm publishing and the old workflow failed looking for a `.tgz` artifact.
- **Recommendation:** Leave disabled; ensure `build-all-platforms.yml` remains the single source of truth for npm publish.

### [x] .mcp.json
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (resolved)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP YES
- **Specific Concerns:** Upstream adds a `forge` MCP entry invoking `npx -y automagik-forge --mcp`. Our current config intentionally lists only vetted MCP endpoints; adding this would change client behaviour.
- **Recommendation:** Keep the existing `.mcp.json` from 0.3.9 (do not add the new entry) unless we plan a coordinated MCP rollout.

### [x] CLAUDE.md
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** HIGH_RISK_CONFLICT
- **Conflict Analysis:** branch naming NO · GENIE YES · Windows NO · MCP NO
- **Specific Concerns:** `lines 22-171` rewrite GENIE persona for automagik-forge; tooling instructions needed pnpm alignment.
- **Recommendation:** Keep updated persona while correcting pnpm commands (typo fixed at `cd frontend && pnpm exec tsc --noEmit`).

### [x] Cargo.toml (workspace)
- **Change Type:** Modified
- **Custom Modifications Present:** Indirect
- **Risk Level:** NEEDS_MANUAL_REVIEW (resolved)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP YES (via new deps)
- **Specific Concerns:** New dependencies (`schemars`, `axum` websocket feature) support upstream APIs we intend to adopt.
- **Recommendation:** Accept additions and ensure type generation/tests cover the new features.
- [x] 2025-09-18 merge: retained fork versioning (`0.3.9`) across crate manifests while keeping upstream dependency bumps for conflict-handling work.

### [x] Dockerfile
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (resolved)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP NO
- **Specific Concerns:** Upstream multi-stage build is desirable; we need to swap `npm` commands back to `pnpm` and confirm runtime binary name `server` matches our release artifact.
- **Recommendation:** Keep upstream structure, convert commands to `pnpm`, and validate the resulting image against 0.3.9 runtime expectations.

### [x] package.json
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (resolved)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP INDIRECT
- **Specific Concerns:** Upstream added useful scripts/dependencies but reintroduced `npm` command usage.
- **Recommendation:** Preserve new package additions while converting scripts to `pnpm` equivalents and coordinating versioning with our release cadence.
- [x] 2025-09-18 merge: kept `automagik-forge` metadata & `0.3.9` versioning, while porting upstream `@ebay/nice-modal-react` dependency and retaining pnpm scripts.

### pnpm-lock.yaml
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW
- **Conflict Analysis:** all NO
- **Specific Concerns:** Lockfile drift requires reinstall after command reconciliation.
- **Recommendation:** Regenerate lockfile after updating scripts to `pnpm` equivalents.

### [x] crates/services/src/services/git.rs
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (keep watch)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP NO
- **Specific Concerns:** Upstream introduces richer conflict detection/recovery. We want these features, but must regression-test our worktree safety guarantees and branch template interactions.
- **Recommendation:** Accept upstream logic, rerun `crates/services/tests/git_ops_safety.rs`, and add targeted tests if needed to prove branch safety.

### [x] crates/server/src/mcp/task_server.rs
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (keep watch)
- **Conflict Analysis:** branch naming NO · GENIE YES · Windows NO · MCP YES
- **Specific Concerns:** Branding update aligns with fork direction. Need to ensure external MCP consumers handle the new `automagik-forge` identifier.
- **Recommendation:** Accept change and verify MCP integration tests still pass.

### [x] npx-cli/bin/cli.js & npx-cli/package.json
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (keep watch)
- **Conflict Analysis:** branch naming YES · others NO
- **Specific Concerns:** Need to ensure upstream updates retain our `forge-{title}-{uuid}` branch template while adopting any CLI improvements.
- **Recommendation:** Merge upstream logic, then smoke-test CLI branch creation to confirm naming pattern.
- [x] 2025-09-18 merge: preserved CLI naming (`automagik-forge`) and kept version `0.3.9` while absorbing upstream CLI fixes.

### [x] frontend/vite.config.ts
- **Change Type:** Modified
- **Custom Modifications Present:** Yes
- **Risk Level:** NEEDS_MANUAL_REVIEW (resolved)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP NO
- **Specific Concerns:** Upstream opens the browser by default via npm dev workflow; we must expose the opt-in while keeping pnpm-friendly config and sourcemaps.
- **Recommendation:** Adopt the `VITE_OPEN` toggle but keep ports/env resolution intact.
- [x] 2025-09-18 merge: added `open: process.env.VITE_OPEN === "true"` alongside existing server config and retained our `pnpm`-oriented build block.

### [x] Frontend task & hook modules (multiple)
- **Change Type:** Added/Modified/Deleted
- **Custom Modifications Present:** Possible
- **Risk Level:** NEEDS_MANUAL_REVIEW (keep watch)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP INDIRECT
- **Specific Concerns:**
  - New coordination hooks (`useTaskViewManager`, `useAttemptBranch`) and toolbar updates still surface `selectedAttempt.branch`; branch naming stays dictated by backend responses.
  - Follow-up editor overhaul introduces autosave/variant queues—retain feature but verify MCP-driven follow ups behave under our workflows.
  - Removed dialogs replaced by modernised components; ensure no fork-specific UI (e.g., branch selection, attempt creation) disappeared.
- **Recommendation:** Adopt upstream UX improvements and run targeted UI smoke tests covering attempt creation, branch display, and follow-up submission to confirm parity with our custom flows.
- [x] 2025-09-18 merge: pulled in follow-up autosave context + modal refactor, flagged need to rerun attempt creation & follow-up queue smoke tests under fork branch template.

### [x] shared/types.ts
- **Change Type:** Modified
- **Custom Modifications Present:** Yes (generated)
- **Risk Level:** NEEDS_MANUAL_REVIEW (keep watch)
- **Conflict Analysis:** branch naming NO · GENIE NO · Windows NO · MCP YES
- **Specific Concerns:** Syncs with upstream Rust additions—new `ConflictOp`, branch status fields, MCP config shape, capability values. These must be regenerated via `generate_types` once backend merges land.
- **Recommendation:** Accept upstream types and ensure we regenerate after applying Rust changes (covers CLI conflict handling).

### Docs and assets additions (docs/**, genie/wishes/**, etc.)
- **Change Type:** Added
- **Custom Modifications Present:** No
- **Risk Level:** SAFE_TO_MERGE
- **Conflict Analysis:** all NO
- **Specific Concerns:** Marketing content only.

## High Risk Conflicts
- .github/workflows/build-all-platforms.yml
- .github/workflows/pre-release.yml
- .github/workflows/publish.yml.disabled
- CLAUDE.md
- Dockerfile
- package.json
- crates/services/src/services/git.rs

## Manual Review Required
- .mcp.json
- Cargo.toml
- pnpm-lock.yaml
- crates/server/src/mcp/task_server.rs
- Frontend task components and hooks (`frontend/src/components/tasks/**`, `frontend/src/hooks/**`)
- shared/types.ts
- npx-cli/bin/cli.js, npx-cli/package.json
- crates/services/src/services/omni/** and new routes (`crates/server/src/routes/omni.rs`)
- New DB migrations & models (`crates/db/**`)

## Safe to Merge
- Documentation and asset additions (`docs/**`, `genie/wishes/**`, etc.)
- `.dockerignore`, `.npmrc`, `.gitignore` adjustments
- `.claude/agents/**`, `.claude/commands/**` branding updates
- SQLx cache updates matching migrations

## Final Recommendation
**PENDING QA** — Upstream commits through `941fe3e2` are merged into `upstream-merge-20250917-173057` with pnpm tooling, Windows OpenSSL safeguards, GENIE persona, and branch template customizations preserved. Proceed once targeted smoke tests (CLI branch naming, UI follow-up flows) and DB migration validation complete.

## TODO Actions
- [x] Restore bespoke Windows OpenSSL handling in `.github/workflows/build-all-platforms.yml`.
- [x] Restore bespoke Windows OpenSSL handling in `.github/workflows/pre-release.yml`.
- [x] Confirm build-all-platforms workflow covers npm publishing (publish.yml remains disabled).
- [x] Fix `CLAUDE.md` persona copy and command usage (replace `pnpx` typo).
- [x] Reconcile Dockerfile with pnpm workflow and binary naming.
- [x] Reinstate pnpm-first scripts in `package.json` and align versioning strategy.
- [ ] Audit `crates/services/src/services/git.rs` to ensure branch safety and update tests.
- [x] Keep current `.mcp.json` (skip upstream forge entry unless coordinated).
- [ ] Verify new dependencies (`schemars`, axum ws) are required and compatible.
- [x] Re-run type generation (`pnpm run generate-types`) after Rust changes.
- [ ] Smoke-test CLI branch creation for `forge-{title}-{uuid}` pattern.
- [ ] Run frontend MCP/task attempt flows (attempt creation, branch display, follow-up queue) to confirm parity.
- [ ] Apply new DB migrations safely and confirm generated SQLx data.

## Validation Run — 2025-09-18
- [x] pnpm install --frozen-lockfile
- [x] pnpm run generate-types
- [x] cargo test --workspace
- [x] pnpm run check

## Merge Execution Plan
- [ ] `git checkout main && git pull origin main`
- [ ] `git checkout -b analysis-upstream-pr3-$(date +%Y%m%d)`
- [ ] `git fetch origin upstream-merge-20250917-173057:pr3-branch`
- [ ] `git diff v0.3.8-20250903203030...pr3-branch --name-status > changed_files.txt`
- [ ] Back up high-risk files (`git show main:path > backups/path`)
- [ ] `git checkout -b temp-merge-test && git merge pr3-branch --no-commit --no-ff`
- [ ] Reapply fork customizations (Windows OpenSSL, pnpm scripts, GENIE copy, Dockerfile, git service tests)
- [ ] Resolve conflicts and regenerate types (`pnpm run generate-types`)
- [ ] Run validation suite (`cargo test --workspace`, `pnpm run check`, targeted frontend smoke tests)
- [ ] If green, `git checkout -b upstream-merge-pr3-final`
- [ ] `git merge pr3-branch --no-ff -m "Merge upstream PR #3 preserving custom modifications"`
- [ ] Push branch and open PR summarizing preserved customizations
