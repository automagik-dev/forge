# 🧞 COMPLETE UPSTREAM MIGRATION WISH

**Status:** DRAFT → Needs Human Approval
**Roadmap Item:** INFRA-ARCH-001 – @.genie/product/roadmap.md §Infrastructure
**Mission Link:** @.genie/product/mission.md §Developer Experience
**Standards:** @.genie/standards/best-practices.md §Code Organization
**Completion Score:** 0/100 (updated by `/review`)

---

## Evaluation Matrix (100 Points Total)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts)**
  - [ ] All relevant files/docs referenced with @ notation (4 pts)
  - [ ] Background verification outputs captured in context ledger (3 pts)
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
| Human conversation | discovery | Migration branch incomplete: frontend build broken, upstream not consumed correctly | entire wish |
| Commit 2fa77027 | repo | Completed overlay architecture but left frontend stub broken | wish, implementation |
| @frontend/package.json | repo | Minimal deps (only react/react-dom), missing upstream dependencies | wish, Group A |
| @frontend/src/App.tsx | repo | Imports full upstream UI (react-router-dom, i18n, pages, components) | wish, Group A |
| @frontend/vite.config.ts | repo | Overlay resolver correct: `@` → forge-overrides → upstream | wish, validation |
| @forge-overrides/frontend/src/ | repo | 9 files: logos + omni components | wish, inventory |
| @upstream/frontend/ | submodule | v0.0.101 full vibe-kanban UI (4.2MB) | wish, dependency |
| @forge-app/src/router.rs | repo | Embeds `frontend/dist/`, serves at `/` | wish, deployment |
| Verification report | analysis | Previous wish document hallucinated; migration actually 80% complete | wish, correction |
| Build error | test | Missing react-router-dom dependency breaks frontend build | wish, blocker |

---

## Discovery Summary

- **Primary analyst:** GENIE + Human verification
- **Key observations:**
  - Commit 2fa77027 (2025-10-03) COMPLETED 80% of migration successfully
  - Overlay resolver in `vite.config.ts` is correct and functional
  - `forge-overrides/frontend/` has 9 customization files (logos + omni)
  - `frontend/src/App.tsx` imports upstream UI components via `@` alias
  - **BLOCKER:** `frontend/package.json` lacks upstream dependencies
  - **MISSING:** Mechanism to consume `upstream/frontend/` as dependency or build input
  - **DOCUMENTATION:** Fixed stale `/legacy` references (no such route exists)

- **Assumptions (ASM-#):**
  - **ASM-1:** Frontend should build by consuming `upstream/frontend/package.json` dependencies
  - **ASM-2:** Overlay resolver works but needs upstream deps installed
  - **ASM-3:** No changes needed to Rust backend (forge-app already correct)
  - **ASM-4:** Omni components in `forge-overrides/` will work once build succeeds

- **Decisions (DEC-#):**
  - **DEC-1:** Install upstream frontend as pnpm workspace dependency
  - **DEC-2:** Keep overlay resolver as-is (already correct)
  - **DEC-3:** Add upstream/frontend deps to frontend/package.json
  - **DEC-4:** Test build + dev server to validate completion

- **Open questions (Q-#):**
  - **Q-1:** Should `upstream/frontend` be in pnpm workspace or consumed differently?
  - **Q-2:** Do we copy upstream deps or link to upstream/frontend/node_modules?
  - **Q-3:** Any upstream components need patching beyond overlay files?

- **Risks:**
  - **R-1:** Upstream dependency changes could break future builds
  - **R-2:** Overlay imports might fail if upstream structure changes
  - **R-3:** Build complexity increases with dual dependency management
  - **R-4:** Dev server HMR may not work correctly across overlay boundaries

---

## Executive Summary

**Complete the 80%-finished upstream migration** by fixing frontend build configuration. Migration branch successfully created overlay architecture (commit 2fa77027) but left `frontend/package.json` minimal, causing build failures. Add upstream frontend dependencies so `frontend/src/App.tsx` can import upstream UI via overlay resolver. Result: Clean submodule-based architecture with working builds.

---

## Current State

- **What exists today:**
  - ✅ `upstream/` submodule at v0.0.101 (vibe-kanban base)
  - ✅ `forge-overrides/frontend/` with 9 customizations (logos + omni)
  - ✅ `frontend/vite.config.ts` overlay resolver (forge-overrides → upstream)
  - ✅ `frontend/src/App.tsx` imports upstream UI via `@` alias
  - ✅ `forge-app` router serves frontend at `/` (no `/legacy`)
  - ✅ `pnpm-workspace.yaml` simplified to single `'frontend'` package
  - ❌ `frontend/package.json` minimal (missing dependencies)
  - ❌ Frontend build broken: "failed to resolve react-router-dom"

- **Gaps/Pain points:**
  - Cannot build frontend: `pnpm run build` fails
  - Cannot start dev server: missing dependencies
  - `App.tsx` imports `@/i18n`, `@/pages/*`, `@/components/*` but deps not installed
  - Unclear if upstream/frontend should be workspace member or copied deps

---

## Target State & Guardrails

- **Desired behaviour:**
  - `cd frontend && pnpm run build` succeeds
  - `pnpm run dev` starts working frontend + backend
  - Overlay resolver: `@` imports check `forge-overrides/` then `upstream/frontend/src/`
  - Omni components render correctly (from `forge-overrides/`)
  - Build artifacts in `frontend/dist/` embed in `forge-app` successfully

- **Non-negotiables:**
  - Zero functional regressions from main branch
  - Preserve overlay architecture (no reverting to fork)
  - Keep `upstream/` submodule readonly (no modifications)
  - Maintain single `frontend/` workspace package
  - Dev server HMR must work

---

## Execution Groups

### Group A – Fix Frontend Dependencies (`task-a.md`)

- **Goal:** Install upstream frontend dependencies so frontend builds successfully

- **Surfaces:**
  - @frontend/package.json – Add upstream dependencies
  - @upstream/frontend/package.json – Source of dependency list
  - @pnpm-workspace.yaml – Potentially add upstream/frontend as workspace member
  - @frontend/vite.config.ts – Verify overlay resolver still works

- **Deliverables:**
  - Updated `frontend/package.json` with all required dependencies
  - Working build: `cd frontend && pnpm run build` succeeds
  - OR configured `upstream/frontend` as pnpm workspace dependency
  - Dependencies installed: `pnpm install` runs cleanly

- **Evidence:**
  - `.genie/wishes/complete-migration/qa/group-a/build-success.log` – `pnpm run build` output
  - `.genie/wishes/complete-migration/qa/group-a/package-diff.txt` – Added dependencies
  - `.genie/wishes/complete-migration/qa/group-a/dist-contents.txt` – `ls -la frontend/dist/`

- **Suggested personas:** `specialists/implementor`
- **External tracker:** N/A

### Group B – Validate Dev Server & HMR (`task-b.md`)

- **Goal:** Ensure dev server starts and hot module reload works with overlay architecture

- **Surfaces:**
  - @frontend/vite.config.ts – Dev server configuration
  - @forge-overrides/frontend/src/components/omni/ – Test HMR on overlay files
  - @upstream/frontend/src/components/layout/navbar.tsx – Test upstream imports

- **Deliverables:**
  - Dev server starts: `pnpm run dev` runs without errors
  - Frontend accessible at `http://localhost:3000` (or FRONTEND_PORT)
  - HMR works: Edit `forge-overrides/frontend/src/components/omni/OmniCard.tsx`, see live update
  - Overlay resolver functional: Forge overrides take precedence over upstream

- **Evidence:**
  - `.genie/wishes/complete-migration/qa/group-b/dev-server-start.log` – Server startup output
  - `.genie/wishes/complete-migration/qa/group-b/hmr-test.md` – HMR validation steps + results
  - `.genie/wishes/complete-migration/qa/group-b/browser-screenshot.png` – Frontend loads correctly

- **Suggested personas:** `specialists/qa`, `specialists/implementor`
- **External tracker:** N/A

### Group C – End-to-End Validation & Cleanup (`task-c.md`)

- **Goal:** Verify full stack works, clean up stale files, update documentation

- **Surfaces:**
  - @forge-app/src/router.rs – Verify embeds frontend/dist/ correctly
  - @AGENTS.md – Update with corrected architecture
  - @CLAUDE.md – Verify commands documented correctly
  - @docs/upstream-as-library-foundation.md – Update completion status

- **Deliverables:**
  - Full stack test: Start backend + frontend, create task, verify UI works
  - Omni feature test: Verify omni components render from `forge-overrides/`
  - Documentation updated: Remove any stale migration TODOs
  - Git status clean: No untracked scaffold files

- **Evidence:**
  - `.genie/wishes/complete-migration/qa/group-c/full-stack-test.log` – Backend + frontend logs
  - `.genie/wishes/complete-migration/qa/group-c/omni-feature-test.md` – Omni functionality validated
  - `.genie/wishes/complete-migration/qa/group-c/git-status.txt` – Clean working tree

- **Suggested personas:** `specialists/qa`, `specialists/polish`
- **External tracker:** N/A

---

## Verification Plan

### Validation Commands (Exact)

```bash
# Group A - Build validation
cd frontend
pnpm install
pnpm run build 2>&1 | tee ../.genie/wishes/complete-migration/qa/group-a/build-success.log
ls -la dist/ > ../.genie/wishes/complete-migration/qa/group-a/dist-contents.txt
git diff package.json > ../.genie/wishes/complete-migration/qa/group-a/package-diff.txt

# Group B - Dev server validation
cd ..
pnpm run dev &
DEV_PID=$!
sleep 10
curl http://localhost:${FRONTEND_PORT:-3000} > .genie/wishes/complete-migration/qa/group-b/frontend-response.html
# Edit forge-overrides/frontend/src/components/omni/OmniCard.tsx, verify HMR
kill $DEV_PID

# Group C - Full stack test
pnpm run dev &
STACK_PID=$!
sleep 15
# Manual: Open browser, create project, create task, verify Omni components visible
curl http://localhost:${BACKEND_PORT:-8000}/health > .genie/wishes/complete-migration/qa/group-c/backend-health.json
curl http://localhost:${FRONTEND_PORT:-3000}/ > .genie/wishes/complete-migration/qa/group-c/frontend-index.html
kill $STACK_PID

# Type validation
cd frontend && pnpm run lint 2>&1 | tee ../.genie/wishes/complete-migration/qa/group-c/tsc-validation.log

# Git status
git status --short > .genie/wishes/complete-migration/qa/group-c/git-status.txt
```

### Artifact Paths

- `.genie/wishes/complete-migration/qa/` – All test outputs
- `.genie/wishes/complete-migration/qa/group-a/` – Build validation artifacts
- `.genie/wishes/complete-migration/qa/group-b/` – Dev server + HMR tests
- `.genie/wishes/complete-migration/qa/group-c/` – Full stack validation

### Approval Checkpoints

1. **Before Group A:** Human approves dependency strategy (workspace vs copy)
2. **After Group A:** Human validates build succeeds and dist/ contains expected files
3. **After Group B:** Human confirms dev server works and HMR functions correctly
4. **After Group C:** Human tests Omni features in browser, approves completion
5. **Final:** Human reviews all QA artifacts and closes wish

---

## <spec_contract>

### Scope

1. Fix `frontend/package.json` by adding upstream dependencies (or configuring workspace)
2. Validate frontend build succeeds: `cd frontend && pnpm run build`
3. Validate dev server works: `pnpm run dev` starts frontend + backend
4. Test HMR with overlay files (forge-overrides/frontend/src/)
5. Verify full stack: Backend serves frontend/dist/, UI loads correctly
6. Test Omni components render from `forge-overrides/` overlays
7. Clean up any stale migration docs or scaffold files
8. Update AGENTS.md, CLAUDE.md with completed architecture

### Out of Scope

- Adding new Forge features or UI components
- Refactoring existing Omni implementation
- Modifying upstream submodule contents
- Changing backend Rust code (already correct)
- Automating future upstream syncs
- Performance optimization beyond working builds

### Success Metrics

- **Build success:** `cd frontend && pnpm run build` exits 0
- **Dev server:** `pnpm run dev` starts without errors
- **HMR functional:** Edit overlay file, see live update in browser
- **Full stack:** Backend + frontend run together, UI accessible
- **Omni working:** Omni components render correctly from overlays
- **TypeScript:** `pnpm run lint` passes (no type errors)
- **Documentation:** All migration TODOs resolved or removed

### External Tasks

- None (self-contained completion of existing branch)

### Dependencies

- Upstream submodule at v0.0.101 (already present)
- Existing overlay resolver in `vite.config.ts` (already correct)
- `forge-overrides/frontend/` customizations (already present)
- `forge-app` router configuration (already correct)

</spec_contract>

---

## Blocker Protocol

1. **Pause work** and create `.genie/reports/blocker-complete-migration-<timestamp>.md` describing:
   - Which group/command encountered issue
   - Error messages, build logs, stack traces
   - Attempted resolution steps
   - Recommended next actions or decisions needed

2. **Log blocker** in wish status log with timestamp

3. **Notify owner** (update wish status, add comment)

4. **Resume only after** wish updated with guidance or workaround

Common blocker scenarios:
- **Dependency conflicts:** Upstream deps incompatible with current setup
- **Overlay imports fail:** Import paths don't resolve correctly
- **HMR breaks:** Vite doesn't detect changes in overlay files
- **Build size regression:** Bundle significantly larger than expected
- **Workspace configuration issues:** pnpm workspace members conflict

---

## Status Log

- **[2025-10-06 13:55Z]** Investigation complete – Migration 80% done, frontend build broken
- **[2025-10-06 14:08Z]** Fixed stale documentation (`/legacy` references removed)
- **[2025-10-06 14:20Z]** Wish created – Focused on completing frontend dependencies
- **[PENDING]** Human decision: Add upstream deps to frontend/package.json OR configure workspace?
- **[PENDING]** Group A implementation start

---

## Branch & Tracker Strategy

**Branch naming:** `feat/genie-framework-migration` (CURRENT - finishing this branch)
**Base branch:** `main`
**Merge target:** `main` (after completion + validation)

**Tracker integration:** None required (completing existing migration branch)

**Completion criteria:** All groups pass validation, human approves, ready to merge

---

## Next Actions

1. **Human decision required:**
   - **Q-1:** Should we add `upstream/frontend` to pnpm workspace and link it?
   - **OR:** Copy upstream dependencies to `frontend/package.json`?
   - Recommendation: Add upstream/frontend to workspace (cleaner, automatic sync)

2. **Create task files** (if needed):
   - `.genie/wishes/complete-migration/task-a.md`
   - `.genie/wishes/complete-migration/task-b.md`
   - `.genie/wishes/complete-migration/task-c.md`

3. **Create evidence directory:**
   ```bash
   mkdir -p .genie/wishes/complete-migration/qa/{group-a,group-b,group-c}
   ```

4. **Begin Group A** after human approves dependency strategy

5. **Delete hallucinated wish:**
   ```bash
   rm .genie/wishes/correct-upstream-submodule-migration-wish.md
   ```

---

## Comparison: Before/After This Wish

### BEFORE (Current State - Broken)
```bash
cd frontend && pnpm run build
# ❌ Error: failed to resolve react-router-dom

pnpm run dev
# ❌ Frontend crashes, missing dependencies
```

### AFTER (Desired State - Working)
```bash
cd frontend && pnpm run build
# ✅ Build successful, dist/ populated

pnpm run dev
# ✅ Frontend + backend start
# ✅ Open http://localhost:3000
# ✅ Omni components render from forge-overrides/
# ✅ HMR works when editing overlay files
```

---

## Final Summary for Human 🧞✨

### Discovery Highlights

1. **Migration actually 80% complete!** Commit 2fa77027 did the hard work
2. **Only blocker:** `frontend/package.json` missing upstream dependencies
3. **Everything else works:** Overlay resolver, forge-app router, submodule structure

### Execution Group Overview

- **Group A:** Fix frontend deps (add upstream dependencies)
- **Group B:** Validate dev server + HMR work
- **Group C:** Full stack test + doc cleanup

### Assumptions / Risks / Questions

- **Q-1 NEEDS DECISION:** Add `upstream/frontend` to workspace or copy deps?
- **ASM-1:** Overlay resolver already correct, just needs deps installed
- **R-1:** Future upstream changes could break if they restructure heavily

### What Happens Next

1. **You decide:** Workspace strategy (recommended: add `upstream/frontend` to pnpm workspace)
2. **I implement:** Fix `frontend/package.json` or `pnpm-workspace.yaml`
3. **We validate:** Build works, dev server works, HMR works
4. **We celebrate:** Migration complete, merge to main! 🎉

**Ready to proceed?** Reply with:
- **Option 1:** "Add upstream/frontend to workspace" (recommended)
- **Option 2:** "Copy deps to frontend/package.json" (simpler but manual sync)
- **Option 3:** "I have questions about [specific concern]"

---

**Wish saved at:** `.genie/wishes/complete-upstream-migration-wish.md`
