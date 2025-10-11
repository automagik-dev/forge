# 🧞 UPSTREAM FRONTEND OVERLAY ARCHITECTURE WISH

**Status:** DRAFT
**Roadmap Item:** INFRA-ARCH-001 – @.genie/product/roadmap.md §Infrastructure
**Mission Link:** @.genie/product/mission.md §Developer Experience
**Standards:** @.genie/standards/best-practices.md §Code Organization
**Completion Score:** 0/100 (updated by `/review`)

---

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

---

## Context Ledger

| Source | Type | Summary | Routed To |
|--------|------|---------|-----------|
| Human conversation | discovery | Identified 76MB duplication, ~20 Forge-specific files | entire wish |
| @pnpm-workspace.yaml | repo | Three frontend packages (upstream, main, forge-overlay) → REDUCE TO ONE | wish, implementation |
| @frontend/package.json | repo | Forge customizations: branding, no i18n, v0.3.10 | wish, migration plan |
| @upstream/frontend/package.json | repo | Vibe Kanban v0.0.55 with i18n dependencies | wish, baseline |
| @upstream-config.json | repo | Tracks upstream sync at v0.0.95 | wish, sync strategy |
| @scripts/sync-upstream.sh | repo | Manual upstream sync process | implementation |
| @forge-overrides/ | repo | Currently empty (8KB placeholder) | target directory |
| @AGENTS.md | repo | Documents pnpm workspace structure + --filter commands | documentation updates |
| @CLAUDE.md | repo | Frontend build commands with --filter | documentation updates |
| `diff -qr frontend/src upstream/frontend/src` | analysis | ~20 modified files identified | migration scope |
| Human feedback | refinement | "Clean up that filter bullshit, only one frontend" | workspace simplification |

---

## Discovery Summary

- **Primary analyst:** Human + GENIE
- **Key observations:**
  - Current `frontend/` is a 76MB fork with ~20 Forge customizations mixed in
  - `upstream/frontend/` (4MB submodule) is clean Vibe Kanban reference at v0.0.95
  - `forge-overrides/` exists but contains only `.gitkeep` (8KB)
  - Duplication causes slower clones, unclear diff attribution, merge conflicts on upstream syncs
  - Forge changes are minimal: branding (10 files), i18n removal, GitHub URLs
  - **CRITICAL:** Having 3 frontend packages forces `pnpm --filter` on every command (unnecessary complexity)

- **Assumptions (ASM-#):**
  - **ASM-1:** Vite alias resolution can handle overlay pattern (`forge-overrides/` → `upstream/`)
  - **ASM-2:** All 20 modified files can be cleanly extracted without breaking imports
  - **ASM-3:** Build performance won't degrade with alias resolution overhead
  - **ASM-4:** No runtime dependencies on removed i18n packages
  - **ASM-5:** Renaming `frontend-forge/` → `frontend/` won't break existing workflows

- **Decisions (DEC-#):**
  - **DEC-1:** Use `upstream/frontend/` as source of truth
  - **DEC-2:** Store only Forge deltas in `forge-overrides/frontend/src/`
  - **DEC-3:** Delete entire `frontend/` directory after migration validation
  - **DEC-4:** **Rename `frontend-forge/` → `frontend/`** (since it becomes the ONLY frontend)
  - **DEC-5:** **Remove ALL `--filter` commands** - use simple `pnpm run dev`, `pnpm run build`
  - **DEC-6:** Update `pnpm-workspace.yaml` to only include `'frontend'` package

- **Open questions (Q-#):**
  - **Q-1:** Should we use Vite alias or webpack-style module federation?
  - **Q-2:** How to handle future upstream file deletions/renames?
  - **Q-3:** Should `forge-overrides/` be version controlled or git-ignored?

- **Risks:**
  - **R-1:** Import path changes could break deep component dependencies
  - **R-2:** Vite HMR (hot module reload) might not work correctly with overlays
  - **R-3:** Developer confusion on which file to edit (upstream vs override)
  - **R-4:** Upstream sync conflicts if Vibe Kanban modifies same files we override

---

## Executive Summary

Eliminate 76MB of duplicated frontend code AND simplify workspace to a single frontend package by implementing a build-time overlay system where `upstream/frontend/` (git submodule) serves as the base and `forge-overrides/frontend/src/` contains only Forge-specific customizations (~20 files). Rename `frontend-forge/` → `frontend/` and remove all `pnpm --filter` commands, replacing them with simple `pnpm run dev`, `pnpm run build`, etc. This architecture enables transparent upstream syncing, clear diff attribution, faster repository operations, and dramatically improved developer experience.

---

## Current State

- **What exists today:**
  - @frontend/ – 76MB standalone React app forked from Vibe Kanban with mixed Forge changes
  - @upstream/frontend/ – 4MB git submodule tracking Vibe Kanban v0.0.95 (unused in builds)
  - @frontend-forge/ – 728KB minimal Forge extension package (separate Vite app)
  - @forge-overrides/ – 8KB empty directory with `.gitkeep`
  - @pnpm-workspace.yaml – Declares `'frontend'`, `'frontend-forge'`, `'upstream/frontend'`
  - @AGENTS.md, @CLAUDE.md – Document `pnpm --filter frontend run dev` commands

- **Gaps/Pain points:**
  - Cannot easily identify which files are Forge-specific vs upstream
  - `git diff` shows entire file changes, not just deltas
  - Upstream sync requires manual 3-way merge of entire `frontend/`
  - 76MB repo bloat on every clone
  - **Developer friction:** Every command needs `--filter` flag (verbose, confusing)
  - **Three frontends but only one used** in development (waste)
  - @scripts/sync-upstream.sh updates submodule but doesn't propagate to `frontend/`

---

## Target State & Guardrails

- **Desired behaviour:**
  - **Single frontend package:** `frontend/` (renamed from `frontend-forge/`)
  - Developers run **`pnpm run dev`** (no `--filter` needed!)
  - Build resolves imports: `forge-overrides/frontend/src/` → `upstream/frontend/src/` (fallback)
  - Only ~20 customized files live in `forge-overrides/`
  - Running `./scripts/sync-upstream.sh` + rebuild automatically picks up upstream changes
  - `git diff` shows only Forge deltas in `forge-overrides/`
  - @pnpm-workspace.yaml contains **ONLY** `'frontend'` (no duplicates)

- **Non-negotiables:**
  - Zero functional regressions (pixel-perfect UI match)
  - Dev server HMR must work identically
  - Build output size unchanged
  - TypeScript imports resolve without manual path rewrites
  - **All commands work without `--filter` flags**
  - Root `package.json` scripts simplified (no filter logic)

---

## Execution Groups

### Group A – Overlay Build System (`task-a.md`)

- **Goal:** Create Vite configuration that layers `forge-overrides/frontend/src/` over `upstream/frontend/src/`
- **Surfaces:**
  - @frontend-forge/vite.config.ts – New overlay resolver (will become `frontend/vite.config.ts`)
  - @frontend-forge/package.json – Updated scripts
  - @pnpm-workspace.yaml – **Will be updated in Group C** after rename
- **Deliverables:**
  - Vite plugin/config that resolves `@/component` → `forge-overrides/.../component.tsx` OR `upstream/.../component.tsx`
  - Working dev server at `pnpm --filter frontend-forge run dev` (temporary, before rename)
  - Build command producing identical output to current `frontend/`
- **Evidence:**
  - `.genie/wishes/upstream-overlay/qa/build-comparison.md` – File-by-file diff of build outputs
  - `.genie/wishes/upstream-overlay/qa/dev-server-test.log` – HMR validation
- **Suggested personas:** `specialists/implementor`, `specialists/tests`
- **External tracker:** N/A

### Group B – File Migration (`task-b.md`)

- **Goal:** Extract ~20 Forge-customized files from `frontend/src/` → `forge-overrides/frontend/src/`
- **Surfaces:**
  - @frontend/src/App.tsx
  - @frontend/src/components/logo.tsx
  - @frontend/src/components/layout/navbar.tsx
  - @frontend/src/components/dialogs/global/OnboardingDialog.tsx
  - @frontend/src/components/dialogs/global/PrivacyOptInDialog.tsx
  - @frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx
  - @frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
  - @frontend/src/pages/settings/GeneralSettings.tsx
  - ~12 other dialog/component files (from `diff -qr` output)
- **Deliverables:**
  - All Forge branding/customizations in `forge-overrides/frontend/src/`
  - Preserved directory structure matching `upstream/frontend/src/`
  - Import paths validated (no broken references)
- **Evidence:**
  - `.genie/wishes/upstream-overlay/qa/migrated-files.txt` – List of moved files with checksums
  - `.genie/wishes/upstream-overlay/qa/import-validation.log` – TypeScript compiler output
- **Suggested personas:** `specialists/implementor`
- **External tracker:** N/A

### Group C – Workspace Simplification & Cleanup (`task-c.md`)

- **Goal:** Simplify to ONE frontend package, remove `--filter` commands, validate, delete old `frontend/`
- **Surfaces:**
  - @frontend/ – **DELETE entire directory** (76MB gone)
  - @frontend-forge/ – **RENAME to `frontend/`**
  - @pnpm-workspace.yaml – **UPDATE to only `'frontend'`** (remove `'frontend-forge'`, `'upstream/frontend'`)
  - @package.json (root) – **Simplify scripts:** remove all `--filter` flags
  - @CLAUDE.md – **Update to simple commands:** `pnpm run dev`, `pnpm run build`
  - @AGENTS.md – **Update workspace structure** and remove `--filter` examples
  - @README.md – Update architecture description

- **Deliverables:**
  - Single `frontend/` package in workspace
  - Simple commands work: `pnpm run dev`, `pnpm run build`, `pnpm run lint`, `pnpm run format:check`
  - Visual regression test screenshots (before/after)
  - Updated build/dev commands in all docs
  - Successful CI/CD run with new structure
  - 76MB repo size reduction confirmed

- **Evidence:**
  - `.genie/wishes/upstream-overlay/qa/visual-regression/` – Screenshot comparisons
  - `.genie/wishes/upstream-overlay/qa/ci-validation.log` – GitHub Actions output
  - `.genie/wishes/upstream-overlay/qa/repo-size-comparison.txt` – `du -sh` before/after
  - `.genie/wishes/upstream-overlay/qa/command-test.log` – Proof that `pnpm run dev` works without `--filter`

- **Suggested personas:** `specialists/qa`, `specialists/polish`, `specialists/implementor`
- **External tracker:** N/A

---

## Verification Plan

### Validation Commands (Exact)

```bash
# 1. Build output comparison (before rename)
pnpm --filter frontend run build
mv frontend/dist /tmp/old-build
pnpm --filter frontend-forge run build
diff -r /tmp/old-build frontend-forge/dist > .genie/wishes/upstream-overlay/qa/build-diff.log

# 2. Workspace rename and simplification
mv frontend-forge frontend-new
rm -rf frontend
mv frontend-new frontend

# 3. Update pnpm-workspace.yaml (manual edit)
# Remove: 'frontend-forge', 'upstream/frontend'
# Keep: 'frontend'

# 4. Test simple commands (NO --filter)
pnpm run dev &  # Should start frontend dev server
DEV_PID=$!
sleep 10
curl http://localhost:3000 > .genie/wishes/upstream-overlay/qa/dev-response.html
kill $DEV_PID

# 5. TypeScript validation
cd frontend && pnpm exec tsc --noEmit 2>&1 | tee ../.genie/wishes/upstream-overlay/qa/tsc-output.log

# 6. Linting validation
cd frontend && pnpm run lint 2>&1 | tee ../.genie/wishes/upstream-overlay/qa/lint-output.log

# 7. Format check
cd frontend && pnpm run format:check 2>&1 | tee ../.genie/wishes/upstream-overlay/qa/format-output.log

# 8. Type generation check
cargo run -p server --bin generate_types -- --check
cargo run -p forge-app --bin generate_forge_types -- --check

# 9. Repo size comparison
du -sh . > .genie/wishes/upstream-overlay/qa/repo-size-before.txt
# (after deletion)
du -sh . > .genie/wishes/upstream-overlay/qa/repo-size-after.txt

# 10. Verify root package.json scripts work
pnpm run check  # Should run all checks without --filter
```

### Artifact Paths

- `.genie/wishes/upstream-overlay/qa/` – All test outputs, logs, screenshots
- `.genie/wishes/upstream-overlay/qa/visual-regression/` – UI comparison screenshots
- `.genie/wishes/upstream-overlay/migration-checklist.md` – Human approval tracking

### Approval Checkpoints

1. **Before Group A:** Human approves Vite overlay strategy (alias vs plugin approach)
2. **After Group A:** Human validates dev server works identically
3. **After Group B:** Human confirms all imports resolve, no broken components
4. **Before Group C rename:** Human approves workspace simplification plan
5. **Before deletion (Group C):** Human approves visual regression test results
6. **After deletion:** Human confirms CI passes, simple commands work, and docs updated

---

## <spec_contract>

### Scope
- Implement Vite build overlay system for `forge-overrides/frontend/src/` → `upstream/frontend/src/`
- Migrate ~20 Forge-customized files to overlay directory
- **Simplify workspace to ONE frontend package** (`frontend/`)
- **Rename `frontend-forge/` → `frontend/`**
- **Remove ALL `--filter` flags from commands** (use simple `pnpm run dev`, etc.)
- Update `pnpm-workspace.yaml` to only include `'frontend'`
- Delete redundant old `frontend/` directory (76MB reduction)
- Update all documentation (@CLAUDE.md, @AGENTS.md, README.md, package.json scripts)
- Validate zero functional regressions via build comparison + visual testing

### Out of Scope
- Refactoring Forge customizations (maintain exact current behavior)
- Changing build system beyond overlay config
- Modifying upstream submodule contents
- Automating future upstream sync merges (manual process preserved)
- Adding new Forge features or UI changes
- Changing backend or Rust workspace structure

### Success Metrics
- **Repo size reduction:** ≥70MB removed from `.git` and working tree
- **Build output:** `diff -r old-build new-build` produces zero differences (excluding source maps)
- **Dev server startup:** ≤5% performance difference vs current `frontend/`
- **Type safety:** Zero new TypeScript errors introduced
- **Visual match:** 100% pixel-perfect UI (screenshot diff = 0%)
- **CI/CD:** All existing tests pass without modification
- **Developer experience:** Simple commands work without `--filter`: `pnpm run dev`, `pnpm run build`, `pnpm run lint`
- **Workspace simplification:** Only ONE frontend package in `pnpm-workspace.yaml`

### External Tasks
- None (self-contained refactor)

### Dependencies
- **Upstream stability:** Assumes `upstream/frontend/` at v0.0.95 won't change during migration
- **Vite version:** Requires Vite 5.x alias resolution features
- **pnpm workspace:** Existing workspace config must support overlay pattern
- **TypeScript:** ts-rs type generation must work with new paths

</spec_contract>

---

## Blocker Protocol

1. **Pause work** and create `.genie/reports/blocker-upstream-overlay-<timestamp>.md` describing:
   - Which group/file encountered the issue
   - Error messages, stack traces, or visual evidence
   - Attempted resolution steps
   - Recommended next actions
2. **Notify owner** (add comment to wish status log)
3. **Resume only after** wish status updated with guidance or workaround

Common blocker scenarios:
- **Vite alias resolution fails:** Circular import or ambiguous module
- **HMR breaks:** Overlay file changes don't trigger reload
- **Build size regression:** Output bundle larger than expected
- **Type errors:** Shared types not resolving across overlay boundary
- **Workspace rename breaks imports:** pnpm doesn't recognize new package name
- **Root scripts fail:** package.json script updates cause errors

---

## Status Log

- **[2025-10-03 00:00Z]** Wish created – Human identified 76MB duplication issue
- **[2025-10-03 00:00Z]** Discovery phase complete – Confirmed ~20 files need migration
- **[2025-10-03 00:15Z]** Refinement – Human requested workspace simplification (remove `--filter` commands)
- **[PENDING]** Human approval on Vite overlay strategy (Group A approach)
- **[PENDING]** Implementation phase start

---

## Branch & Tracker Strategy

**Branch naming:** `feat/upstream-frontend-overlay`
**Base branch:** `feat/genie-framework-migration` (current active branch)
**Merge target:** `main` (after Genie migration completes)

**Tracker integration:** None required (internal refactor)

**Upstream sync impact:** After this change, running `./scripts/sync-upstream.sh` will update `upstream/` submodule, and a rebuild will automatically incorporate upstream changes (no manual `frontend/` merge needed).

---

## Next Actions

1. **Human decision required:**
   - **Q-1 resolution:** Approve Vite alias approach vs webpack module federation?
   - **Q-3 resolution:** Confirm `forge-overrides/` should be version-controlled?

2. **Run `/forge`** to generate task files:
   ```bash
   ./genie run forge "Break upstream overlay wish into execution groups A/B/C"
   ```

3. **Assign specialists:**
   - Group A → `specialists/implementor` (Vite config + overlay plugin)
   - Group B → `specialists/implementor` (file migration)
   - Group C → `specialists/implementor` (rename/cleanup) + `specialists/qa` (validation) + `specialists/polish` (docs)

4. **Create evidence directory:**
   ```bash
   mkdir -p .genie/wishes/upstream-overlay/qa/visual-regression
   ```

5. **Begin Group A** after human approves overlay strategy

---

**Wish saved at:** `.genie/wishes/upstream-overlay-wish.md`

---

## Before/After Command Comparison

### BEFORE (Current - Verbose)
```bash
pnpm --filter frontend run dev                # Start dev server
pnpm --filter frontend run build              # Build production
pnpm --filter frontend run lint               # Lint code
pnpm --filter frontend run format:check       # Check formatting
pnpm --filter frontend exec tsc --noEmit      # Type check
```

### AFTER (Simplified - Clean)
```bash
pnpm run dev          # Start dev server (automatically targets frontend/)
pnpm run build        # Build production
pnpm run lint         # Lint code
pnpm run format:check # Check formatting
cd frontend && pnpm exec tsc --noEmit  # Type check (or add to root scripts)
```

**Developer happiness:** ⬆️⬆️⬆️

---

## Final Summary for Human 🧞✨

### Discovery Highlights
1. **76MB waste confirmed** – `frontend/` duplicates `upstream/` with only ~20 Forge files modified
2. **Clean separation possible** – Vite alias can layer `forge-overrides/` over `upstream/`
3. **MAJOR DX WIN** – Eliminate 3 frontends → 1 frontend, remove ALL `--filter` commands!

### Execution Group Overview
- **Group A:** Build overlay system (Vite config + dev server validation)
- **Group B:** Migrate ~20 Forge files to `forge-overrides/frontend/src/`
- **Group C:** **Rename `frontend-forge/` → `frontend/`, delete old `frontend/`, update workspace + docs, remove `--filter` everywhere**

### Assumptions / Risks / Questions
- **ASM-1:** Vite alias can handle this (needs validation in Group A)
- **R-2:** HMR might break with overlays (test in Group A dev server)
- **Q-1:** **NEEDS YOUR DECISION:** Vite alias or webpack module federation?

### Branch & Tracker
- Branch: `feat/upstream-frontend-overlay` off `feat/genie-framework-migration`
- No external tracker needed (internal refactor)

### What Happens Next
1. **You decide:** Vite alias approach (recommended) or explore alternatives?
2. **I run `/forge`** to create task files (`task-a.md`, `task-b.md`, `task-c.md`)
3. **Specialists implement** with Done Reports at each group
4. **You validate** visual regression + approve workspace simplification
5. **We celebrate** 76MB gone + ONE frontend + simple commands! 🎉

**Developer commands go from this:**
```bash
pnpm --filter frontend run dev  # 😤
```

**To this:**
```bash
pnpm run dev  # 😎
```

**Ready to proceed?** Reply with:
- **Option 1:** "Approve Vite alias approach, run `/forge`"
- **Option 2:** "Explore module federation first"
- **Option 3:** "I have questions about [specific concern]"
