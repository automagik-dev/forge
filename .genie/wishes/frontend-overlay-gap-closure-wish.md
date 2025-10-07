# 🧞 FRONTEND OVERLAY GAP CLOSURE WISH

**Status:** DRAFT → Needs Human Approval  
**Roadmap Link:** @.genie/product/roadmap.md §Infrastructure  
**Mission Anchor:** @.genie/product/mission.md §Developer Experience  
**Standards:** @.genie/standards/best-practices.md §Frontend | @.genie/standards/naming.md §TypeScript  
**Completion Score:** 0/100 (updates via `/review`)

---

## Evaluation Matrix

| Phase | Focus | Points |
| --- | --- | --- |
| Discovery | Context completeness, scope clarity, evidence plan | 30 |
| Implementation | Code quality, behavioral alignment, docs, testing | 40 |
| Verification | Validation coverage, artifact capture, review trail | 30 |

---

## Context Ledger

| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Human conversation | discovery | Migration left Forge UI falling back to upstream styles/copy | whole wish |
| @frontend/index.html | repo | Brand metadata removed; now points at missing `/forge.svg` | Group A |
| forge-overrides/frontend/public | repo | Forge favicons/logos moved here but never copied to build | Group A |
| diff(origin/main ⟷ upstream/frontend) | analysis | 98 Forge-specific files missing from overlays (branch template excluded) | Groups B–F |
| `.genie/wishes/complete-migration/qa` | evidence | Build/dev server validated but didn’t check customization parity | verification |
| @frontend/package.json | repo | No `check` script; documented workflow fails (`pnpm --filter frontend exec tsc --noEmit`) | Group G |
| AGENTS.md:10-157 | repo | Docs still describe forked frontend + `frontend-forge` commands | Group H |

---

## Discovery Summary

- Forge branding/assets were deleted from `frontend/public/` during migration. Overlays never reintroduced them, so upstream favicons, fonts, and copy render.
- Only nine overlay files exist (`logo`, `navbar`, `omni/*`, `GeneralSettings`, `styles/index.css`). 98 Forge-specific components/hooks still fall back to upstream versions.
- Branch template customizations (TaskTemplateEditDialog, BranchSelector, useProjectBranches) must remain removed.
- Workflow automation (`pnpm run check`) and docs reference the old fork layout, leaving type checks and contributor guidance broken.

**Assumptions**
- Forge overrides should live under `forge-overrides/frontend/src` (and `public/` for assets), never mutating `upstream/`.
- We can copy Forge assets from `origin/main:frontend/public` into overlay public dir, then mount them via Vite.
- Unit coverage is minimal; we rely on build + manual smoke + evidence capture (existing QA folder).

**Risks**
- Partial ports could regress overlay resolution; must stage per dependency layer.
- Large batch porting may exceed diff review comfort—phase gating and evidence per group mitigate.
- Need to ensure we don’t accidentally revive branch-template UI (explicit out-of-scope).

---

## Executive Summary

Complete the overlay migration by porting Forge-specific frontend customizations from `origin/main` into `forge-overrides`, restoring branded assets, and fixing workflow/docs so the Forge UI again reflects Automagik design and copy. Execution proceeds in dependency-friendly phases (shell, UI primitives, data surfaces, dialogs, tasks, hooks, docs).

---

## Target State

- `pnpm run build` emits Forge-themed bundle with correct favicons, fonts, and copy.
- All Forge-specific React components/hooks/types resolved via overlays; no accidental upstream fallbacks for branded or functionality-critical surfaces.
- Type-check script restored (`pnpm run check` or equivalent) and documentation updated to match overlay architecture.
- QA evidence captured per group in `.genie/wishes/frontend-overlay-gap-closure/qa/`.

**Out of Scope**
- Reintroducing branch template customization (TaskTemplateEditDialog, BranchSelector, useProjectBranches).
- Changing upstream submodule or inventing new features.
- Backend or MCP modifications beyond doc references.

---

## Execution Groups

### Group A — Shell & Branding Restoration
**Goal:** Recreate Forge branding and HTML shell within overlay architecture.
- Surfaces: `@frontend/index.html`, `@forge-overrides/frontend/public/*`, `@frontend/vite.config.ts` (public asset copy if needed).
- Deliverables:
  - Restore head tags (fonts, icons, manifest) using overlay assets.
  - Ensure Forge icons (`forge-dark.svg`, etc.) served from dev/build outputs.
  - Verify `pnpm run build` injects correct metadata.
- Customizations vs Upstream:
  - `frontend/index.html` — Forge version swaps upstream Vibe favicon set for `/forge-*.svg`, injects Automagik-specific fonts and page title, and removes unused upstream links.
  - `frontend/public/android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`, `forge-clear.png`, `forge-clear.svg`, `forge-dark.png`, `forge-dark.svg`, `screenshot.png`, `viba-kanban-favicon.png` — Provide Automagik Forge iconography and product imagery that override Vibe visuals.
  - `frontend/public/site.webmanifest` — Updates `name`, `short_name`, theme/background colors, and icon declarations to Forge branding.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-a/build.log`
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-a/head-diff.txt`
  - Screenshot or HTML snippet showing Forge favicon/branding.

### Group B — Theme & Logo Styling
**Goal:** Reinstate Automagik-specific typography and theme palette.
- Surfaces: `@forge-overrides/frontend/src/styles/index.css`, `@forge-overrides/frontend/src/components/logo.tsx`.
- Deliverables:
  - Restore Automagik fonts (Alegreya Sans, Manrope) and theme tokens (including Alucard/Dracula variants).
  - Ensure logo swaps based on active theme and system dark mode.
- Customizations vs Upstream:
  - `styles/index.css` — Adds Automagik font imports, color tokens, and custom theme classes beyond upstream defaults.
  - `components/logo.tsx` — Chooses Forge logo assets based on theme (light vs dark) and system preference.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-b/theme-diff.txt`
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-b/logo-diff.txt`

### Group C — Navigation & External Links
**Goal:** Keep top navigation aligned with Automagik docs/support.
- Surfaces: `@forge-overrides/frontend/src/components/layout/navbar.tsx`.
- Deliverables:
  - Ensure navbar links point to forge.automag.ik docs/support.
  - Maintain Automagik logo usage in header.
- Customizations vs Upstream:
  - Adds `useCallback` ref wiring for search input (matching previous Forged UX) and updates external link destinations to Automagik URLs.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-c/navbar-diff.txt`
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-c/dev-server.log`

### Group D — Omni Entry & Settings Integration
**Goal:** Keep Omni surfaces wired into upstream UI.
- Surfaces: `@forge-overrides/frontend/src/main.tsx`, `@forge-overrides/frontend/src/components/omni/{api.ts,OmniCard.tsx,OmniModal.tsx,types.ts}`, `@forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx`.
- Deliverables:
  - Upstream entry point loads Forge overlay that registers Omni modals and telemetry.
  - Omni modal/card continue to render in settings page.
- Customizations vs Upstream:
  - `main.tsx` — Replaces upstream App bootstrap with Forge overlay to register Omni modals, Sentry tags, and theme.
  - Omni component files — Provide Automagik Omni UI not present upstream.
  - `pages/settings/GeneralSettings.tsx` — Injects `OmniCard` panel and Automagik analytics copy.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-d/omni-diff.txt`
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-d/settings-screenshot.png`

### Group E — Auth & Onboarding Copy
**Goal:** Preserve Automagik branding in auth and onboarding flows.
- Surfaces: `@forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx`, `@forge-overrides/frontend/src/components/dialogs/global/{OnboardingDialog.tsx,PrivacyOptInDialog.tsx,ReleaseNotesDialog.tsx}`.
- Deliverables:
  - GitHub login dialog references Automagik Forge, not Vibe Kanban.
  - Onboarding & privacy dialogs use Automagik copy and analytics messaging.
  - Release notes dialog highlights Forge release stream.
- Customizations vs Upstream:
  - Each dialog swaps brand copy and retains Automagik-specific CTAs while adopting upstream UI improvements (e.g., `Alert` usage).
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-e/dialog-diff.txt`
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-e/onboarding-notes.md`

### Group F — PR Workflow Branding
**Goal:** Preserve Automagik naming in PR creation flow.
- Surfaces: `@forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx`.
- Deliverables:
  - Default PR title uses `(automagik-forge)` suffix.
  - Retain upstream improvements (alert component, target branch handling) while keeping Automagik copy.
- Customizations vs Upstream:
  - Overrides brand references and call-to-action wording; avoids reintroducing branch-template logic.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-f/create-pr-diff.txt`
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-f/manual-test.md`

### Group G — Workflow & Scripts Alignment
**Goal:** Fix tooling gaps introduced during migration.
- Surfaces: `@frontend/package.json`, `@pnpm-workspace.yaml` (validation), `@package.json` (check script references).
- Deliverables:
  - Reintroduce `check` script (e.g., `tsc --noEmit`) or update docs/commands accordingly.
  - Ensure documented commands (`pnpm run check`, `pnpm exec tsc`) work.
- Customizations vs Upstream:
  - `frontend/package.json` — Forge scripts wire `lint`, `format`, `test`, and should regain `check` pointing to `tsc --noEmit`; upstream lacks this pipeline.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-g/check-command.log`

### Group H — Documentation Refresh
**Goal:** Align contributor docs with overlay architecture.
- Surfaces: `@AGENTS.md`, any other references to old fork layout.
- Deliverables:
  - Update structure descriptions (remove `frontend-forge`, highlight overlays).
  - Update commands to run overlays + type checks.
- Customizations vs Upstream:
  - `AGENTS.md` — Needs Automagik-specific project structure (overlay directories, Forge commands) replacing outdated fork instructions.
- Evidence:
  - `.genie/wishes/frontend-overlay-gap-closure/qa/group-h/docs-diff.txt`

---

## Verification Plan

Validation commands (record outputs in group-specific QA folders):
```bash
pnpm install
pnpm run build 2>&1 | tee .genie/wishes/frontend-overlay-gap-closure/qa/group-a/build.log
pnpm exec tsc --noEmit 2>&1 | tee .genie/wishes/frontend-overlay-gap-closure/qa/group-b/tsc.log
pnpm run dev &
DEV_PID=$!
sleep 10
curl -I http://localhost:${FRONTEND_PORT:-5174} > .genie/wishes/frontend-overlay-gap-closure/qa/group-c/http-head.txt
kill $DEV_PID
```
Additional manual checks:
- Visual inspect disclaimer/onboarding dialogs.
- Confirm Omni card copy matches Automagik branding.
- Ensure settings pages show Forge-specific text.

Artifacts stored under `.genie/wishes/frontend-overlay-gap-closure/qa/group-{a..h}/`.

---

## Spec Contract

1. Restore Forge branding (HTML head + assets) without reintroducing upstream icons/fonts.
2. Reinstate Automagik theme/logo styling and navbar links via overlays.
3. Preserve Omni integration and Automagik-branded dialogs/PR workflow while adopting upstream improvements.
4. Exclude branch template customizations (TaskTemplateEditDialog, BranchSelector, useProjectBranches).
5. Re-enable type-check workflow (`pnpm run check` or updated command) and ensure docs reflect overlay setup.
6. Capture validation evidence for each execution group (build logs, diffs, manual notes).
7. Maintain overlay-first resolution (`forge-overrides` → `upstream`) without touching upstream submodule files, keeping `pnpm run build`, `pnpm exec tsc --noEmit`, and dev server output clean.

Success metrics:
- Build + type check succeed.
- Visual inspection shows Forge branding/theme.
- QA evidence complete per group.
- Docs accurately describe overlay architecture and commands.

---

## Blocker Protocol

1. Pause work; create `.genie/reports/blocker-frontend-overlay-gap-closure-<timestamp>.md` documenting issue, logs, attempted fixes.
2. Update wish status log with timestamped blocker summary.
3. Notify human for decision; resume only after guidance is added.

Common blockers: overlay resolution conflicts, missing dependency port causing build failure, asset pipeline misconfiguration, doc/tooling approvals.

---

## Status Log

- **[Pending]** Human approval of wish scope & phase plan.
- **[2025-10-07 01:53Z]** Group A – Completed branding restore (`frontend/index.html`, `frontend/public/*`); build log at `qa/group-a/build.log`.
- **[2025-10-07 01:53Z]** Group B – Completed theme/logo verification; diffs at `qa/group-b/theme-diff.txt` and `qa/group-b/logo-diff.txt`.
- **[2025-10-07 02:05Z]** Group C – Verified navbar overlays (docs/support links, active state); diff at `qa/group-c/navbar-diff.txt`.
- **[2025-10-07 02:17Z]** Group D – Confirmed Omni entry + settings overlays; diffs logged in `qa/group-d/omni-diff.txt`.
- **[2025-10-07 02:17Z]** Group E – Restored Automagik copy for auth/onboarding dialogs; see `qa/group-e/dialog-diff.txt`.
- **[2025-10-07 02:17Z]** Group F – Updated PR dialog branding; diff at `qa/group-f/create-pr-diff.txt`.
- **[2025-10-07 02:17Z]** Group G – Reintroduced `pnpm run check` script (tsc); output captured in `qa/group-g/check-command.log`.
- **[2025-10-07 02:17Z]** Group H – Documentation aligned with overlay workflow (`AGENTS.md`).
- **[2025-10-07 02:59Z]** Regression cleanup – Overrode dialog index to surface Automagik copy and clarified dev host instructions (no accidental 0.0.0.0 binding).
- **[Pending]** Final full-system validation once sandbox access available.

---

## Branch & Tracker Strategy

- Work from `feat/genie-framework-migration` unless instructed otherwise.
- No external tracker entries required; annotate commits/tasks within wish directory.
- Each execution group may use dedicated worktree per Forge protocol.

---

## Next Actions

1. Human review/approve this wish.
2. Once approved, spawn plan → forge workflow to assign Group A.
3. After each group completes, update status log and attach evidence to QA folder.

---

**Catchphrase:** Let’s spawn some agents and make the Forge UI sparkle again! ✨
