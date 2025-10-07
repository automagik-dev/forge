# Forge Plan: upgrade-upstream-0-0-104

**Generated:** 2025-10-07T17:24:00Z
**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Task Files:** `.genie/wishes/upgrade-upstream-0-0-104/task-*.md`
**Branch:** `feat/genie-framework-migration` (existing branch)
**Project ID:** `2c3f62d6-4829-4a81-8889-152a7a2916fd`

---

## Summary

Upgrade upstream vibe-kanban submodule from v0.0.101 to v0.0.104 (3 releases, 68 files, +1835/-975 lines). Refactor all 25 frontend overrides via focused 1:1 upstream comparison, preserving ONLY minimal Forge customizations.

**Key Changes:**
- Discord integration (guild: 1095114867012292758)
- New Copilot executor
- MCP server refactor (896 lines)
- Override drift elimination

**Breaking Changes:** Accepted (no backwards compatibility)

---

## Spec Contract (from wish)

### Functional Completeness
1. ✅ Upstream submodule pointer updated to v0.0.104-20251006165551
2. ✅ All 25 frontend overrides audited (report generated)
3. ✅ High/medium priority overrides refactored from upstream base
4. ✅ Discord widget functional with Forge guild (1095114867012292758)
5. ✅ GitHub OAuth flow works without errors
6. ✅ All 8 executors present and functional (Copilot included)
7. ✅ MCP tools respond correctly
8. ✅ Omni features work
9. ✅ PR creation workflow completes
10. ✅ Keyboard shortcuts functional (hjkl)

### Quality Gates
1. ✅ `cargo test --workspace` passes with no new failures
2. ✅ `cargo clippy` passes with no warnings
3. ✅ `cd frontend && pnpm run lint` passes
4. ✅ `cd frontend && pnpm run check` passes
5. ✅ Type generation succeeds (core + forge)
6. ✅ Regression harness passes
7. ✅ No console errors in browser

### Evidence & Documentation
1. ✅ Override audit report completed
2. ✅ Before/after screenshots captured
3. ✅ Baseline vs upgraded comparison documented
4. ✅ All evidence checklist items present
5. ✅ Refactoring decisions documented

---

## Proposed Groups (30 Tasks)

### Phase 1: Preparation

#### Task A - Submodule Update & Baseline
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-a.md`
- **Scope:** Update upstream submodule pointer, create baselines, backup overrides
- **Inputs:** `@upstream/`, `@.genie/wishes/upgrade-upstream-0-0-104-wish.md`
- **Deliverables:**
  - Submodule at v0.0.104-20251006165551 (staged, not committed)
  - baseline-upstream.txt, baseline-executors.json, baseline-tests.txt
  - forge-overrides-backup/ directory
  - Type generation check passes
- **Evidence:** `.genie/wishes/upgrade-upstream-0-0-104/qa/task-a/`
- **Tracker:** `upgrade-upstream-0-0-104-task-a`
- **Persona:** implementor
- **Dependencies:** None
- **Effort:** XS

---

### Phase 2: Override Audit

#### Task B - Comprehensive Override Audit
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-b.md`
- **Scope:** Audit all 25 overrides, identify new upstream files, generate drift report
- **Inputs:** `@forge-overrides/frontend/src/`, `@upstream/frontend/src/`, wish
- **Deliverables:**
  - override-audit.md (comprehensive drift analysis)
  - For each file: diff, customizations, priority, recommendation
  - New upstream files list with override recommendations
- **Evidence:** `.genie/wishes/upgrade-upstream-0-0-104/qa/task-b/`
- **Tracker:** `upgrade-upstream-0-0-104-task-b`
- **Persona:** implementor
- **Dependencies:** Task A
- **Effort:** S
- **Human Review Gate:** Approve audit before proceeding to C-tasks

---

### Phase 3: Override Refactoring (25 Individual Files)

**Protocol for C-tasks:**
1. Read override audit report
2. If upstream exists: Copy v0.0.104 as base, layer customizations
3. If no upstream: Verify compatibility only
4. Add `// FORGE CUSTOMIZATION:` comments
5. Lint + type check in isolation

#### Task C-01 - GitHubLoginDialog.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-01.md`
- **Override:** `forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx`
- **Priority:** HIGH
- **Upstream:** Yes
- **Customizations:** Branding (Automagik Forge), modal flow fix
- **Tracker:** `upgrade-upstream-0-0-104-task-c-01`
- **Dependencies:** Task B

#### Task C-02 - DisclaimerDialog.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-02.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Customizations:** Disclaimer text (Forge-specific)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-02`

#### Task C-03 - OnboardingDialog.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-03.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-03`

#### Task C-04 - PrivacyOptInDialog.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-04.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-04`

#### Task C-05 - ReleaseNotesDialog.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-05.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-05`

#### Task C-06 - dialogs/index.ts
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-06.md`
- **Priority:** LOW
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-06`

#### Task C-07 - CreatePRDialog.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-07.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Customizations:** PR template, GitHub links (namastexlabs)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-07`

#### Task C-08 - navbar.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-08.md`
- **Priority:** HIGH
- **Upstream:** Yes
- **Customizations:** Discord guild 1095114867012292758, Forge links
- **Tracker:** `upgrade-upstream-0-0-104-task-c-08`

#### Task C-09 - logo.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-09.md`
- **Priority:** LOW
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-09`

#### Task C-10 - OmniCard.tsx (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-10.md`
- **Priority:** HIGH
- **Upstream:** No (Forge feature)
- **Action:** Verify compatibility only
- **Tracker:** `upgrade-upstream-0-0-104-task-c-10`

#### Task C-11 - OmniModal.tsx (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-11.md`
- **Priority:** HIGH
- **Upstream:** No (Forge feature)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-11`

#### Task C-12 - omni/api.ts (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-12.md`
- **Priority:** HIGH
- **Upstream:** No (Forge API client)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-12`

#### Task C-13 - omni/types.ts (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-13.md`
- **Priority:** MEDIUM
- **Upstream:** No (Forge types)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-13`

#### Task C-14 - PreviewTab.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-14.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-14`

#### Task C-15 - NoServerContent.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-15.md`
- **Priority:** LOW
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-15`

#### Task C-16 - AgentSettings.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-16.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-16`

#### Task C-17 - GeneralSettings.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-17.md`
- **Priority:** HIGH
- **Upstream:** Yes
- **Customizations:** OmniCard, forgeApi, GitHub button pattern
- **Tracker:** `upgrade-upstream-0-0-104-task-c-17`

#### Task C-18 - McpSettings.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-18.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-18`

#### Task C-19 - SettingsLayout.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-19.md`
- **Priority:** LOW
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-19`

#### Task C-20 - settings/index.ts
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-20.md`
- **Priority:** LOW
- **Upstream:** Yes
- **Tracker:** `upgrade-upstream-0-0-104-task-c-20`

#### Task C-21 - main.tsx
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-21.md`
- **Priority:** MEDIUM
- **Upstream:** Yes
- **Customizations:** Forge providers, analytics
- **Tracker:** `upgrade-upstream-0-0-104-task-c-21`

#### Task C-22 - index.css
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-22.md`
- **Priority:** LOW
- **Upstream:** Yes
- **Customizations:** Forge brand colors
- **Tracker:** `upgrade-upstream-0-0-104-task-c-22`

#### Task C-23 - forge-api.ts (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-23.md`
- **Priority:** HIGH
- **Upstream:** No (Forge API client)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-23`

#### Task C-24 - shims.d.ts (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-24.md`
- **Priority:** LOW
- **Upstream:** No (Forge types)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-24`

#### Task C-25 - companion-install-task.ts (Forge-specific)
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-c-25.md`
- **Priority:** MEDIUM
- **Upstream:** No (Forge utility)
- **Tracker:** `upgrade-upstream-0-0-104-task-c-25`

**C-Tasks Summary:**
- **Total:** 25 files
- **With upstream:** 19 files (copy + layer customizations)
- **Forge-specific:** 6 files (verify compatibility)
- **HIGH priority:** 6 files
- **MEDIUM priority:** 11 files
- **LOW priority:** 8 files
- **Parallelizable:** Yes (after Task B approval)

---

### Phase 4: Backend & Integration

#### Task D - Backend Integration Validation
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-d.md`
- **Scope:** Validate type generation, MCP server, executor profiles, new Copilot
- **Inputs:** Backend crates, MCP server, executor configs
- **Deliverables:**
  - Type generation passes (core + forge)
  - MCP tools functional
  - 8 executors present (Copilot included)
  - Executor profiles API working
- **Evidence:** `.genie/wishes/upgrade-upstream-0-0-104/qa/task-d/`
- **Tracker:** `upgrade-upstream-0-0-104-task-d`
- **Persona:** implementor
- **Dependencies:** All C-tasks
- **Effort:** S
- **Human Review Gate:** Backend validation approval

#### Task E - Full Integration Testing
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-e.md`
- **Scope:** End-to-end QA: executors, Omni, PR workflow, UI, keyboard shortcuts
- **Deliverables:**
  - QA checklist completed
  - All executors tested (esp. Copilot)
  - Omni features verified
  - PR workflow tested
  - UI screenshots captured
  - Console logs clean
- **Evidence:** `.genie/wishes/upgrade-upstream-0-0-104/qa/task-e/`
- **Tracker:** `upgrade-upstream-0-0-104-task-e`
- **Persona:** qa
- **Dependencies:** Task D
- **Effort:** M

#### Task F - Regression Testing & Final Validation
- **File:** `.genie/wishes/upgrade-upstream-0-0-104/task-f.md`
- **Scope:** Full test suite, regression harness, baseline comparison
- **Deliverables:**
  - cargo test passes
  - clippy passes
  - frontend lint/type checks pass
  - regression harness passes
  - comparison reports (baseline vs upgraded)
- **Evidence:** `.genie/wishes/upgrade-upstream-0-0-104/qa/task-f/`
- **Tracker:** `upgrade-upstream-0-0-104-task-f`
- **Persona:** qa
- **Dependencies:** Task E
- **Effort:** S
- **Human Review Gate:** Final approval to commit + push

---

## Validation Hooks

### Per-Task Validation
- **Task A:** Submodule at correct version, baselines created, backup exists
- **Task B:** Audit report complete, all 25 files analyzed, priorities assigned
- **Tasks C-01 to C-25:** Lint + type check pass, customizations documented
- **Task D:** Type gen succeeds, MCP functional, 8 executors present
- **Task E:** QA checklist complete, no console errors
- **Task F:** All tests pass, no regressions vs baseline

### Evidence Storage Paths
```
.genie/wishes/upgrade-upstream-0-0-104/
├── task-a.md, task-b.md, task-c-01.md ... task-f.md
├── override-audit.md (from Task B)
└── qa/
    ├── task-a/ (baselines, backup manifest)
    ├── task-b/ (audit report, diffs)
    ├── task-c-01/ ... task-c-25/ (lint/type outputs, diffs)
    ├── task-d/ (type gen logs, MCP responses, executor JSON)
    ├── task-e/ (QA checklist, screenshots, console logs)
    └── task-f/ (test outputs, comparison reports)
```

---

## Branch Strategy

**Branch:** `feat/genie-framework-migration` (existing)
**Justification:** Work already started on this branch, continue here to avoid fragmentation
**Commit Strategy:** DO NOT commit until Task F passes and human approves
**PR Target:** `main`

---

## Approval Log

| Date | Event | Approver | Status |
|------|-------|----------|--------|
| 2025-10-07T17:24Z | Forge plan generated | genie | ✅ Complete |
| Pending | Task B audit review | Human | ⏳ Awaiting |
| Pending | Task D backend validation | Human | ⏳ Awaiting |
| Pending | Task F final approval | Human | ⏳ Awaiting |

---

## Follow-up Checklist

**Before Execution:**
- [ ] Human reviews and approves forge plan
- [ ] Human reviews Task A baseline strategy
- [ ] Confirm project ID: `2c3f62d6-4829-4a81-8889-152a7a2916fd`

**During Execution:**
- [ ] After Task B: Human reviews override audit report
- [ ] After Task D: Human reviews backend validation results
- [ ] After Task F: Human reviews regression test results

**After Execution:**
- [ ] Commit to `feat/genie-framework-migration` with wish reference
- [ ] Create PR to `main` with forge plan reference
- [ ] Update wish status to COMPLETE
- [ ] Archive forge plan and evidence

---

## Risk Mitigation

**RISK-1: MCP Server Breaking Changes**
- **Mitigation:** Task D validates MCP tools immediately
- **Rollback:** Blocker report, investigate task_server.rs refactor

**RISK-2: Override Drift Bugs**
- **Mitigation:** Task B audits ALL files, Task C refactors systematically
- **Rollback:** Restore from forge-overrides-backup/

**RISK-3: Type Generation Failures**
- **Mitigation:** Task A validates early, Task D re-validates
- **Rollback:** Manual type patches, document in wish

**RISK-4: Omni Feature Breakage**
- **Mitigation:** Task E tests Omni thoroughly (C-10 to C-13 are HIGH priority)
- **Rollback:** Check forge-extensions/omni dependencies

**RISK-5: New Copilot Executor Missing**
- **Mitigation:** Task D specifically checks for Copilot in executor list
- **Rollback:** Check default_profiles.json merge

---

## Summary

**30 Tasks Created:**
- 1 preparation (A)
- 1 audit (B) with human review gate
- 25 file refactoring (C-01 to C-25) - parallelizable after B
- 3 validation (D, E, F) with human review gates

**Branch:** `feat/genie-framework-migration` (existing)
**Total Effort:** Large (L) - 30 individual tasks
**Parallelization:** C-tasks can run concurrently after Task B approval

**Next Step:** Human reviews forge plan → Approve → Begin execution with Task A

**Forge Plan:** `@.genie/state/reports/forge-plan-upgrade-upstream-0-0-104-202510071724.md`
