# Wish: Upgrade Upstream Submodule to v0.0.105

**Slug:** `upgrade-upstream-0-0-104` (keeping original slug for compatibility)
**Actual Version:** v0.0.105-20251007161830
**Branch:** `feat/genie-framework-migration` (current branch - staying here)
**Status:** In Progress - Submodule updated, overrides pending
**Created:** 2025-10-07
**Updated:** 2025-10-07 (v0.0.105 upgrade completed)
**Effort:** Large (L) - 35 individual tasks
**Task Count:** 1 prep + 1 audit + 25 frontend + 6 backend + 2 integration = **35 tasks**

---

## Overview

**UPDATE 2025-10-07:** Upgraded to v0.0.105-20251007161830 (skipping v0.0.104). Repository now independent from BloopAI, using namastexlabs/vibe-kanban fork.

Upgrade the upstream vibe-kanban submodule from v0.0.101 (commit d8fc7a98) to v0.0.105, incorporating 4 releases with additional changes beyond original scope. Refactor all 25 forge-overrides via focused 1:1 upstream comparison, preserving ONLY minimal Forge customizations (branding, forge-api, Omni integration, repository links).

**Override Strategy:** Prioritize upstream structure - avoid merge conflicts, eliminate drift bugs.

**Breaking Change Policy:** Accepted - no backwards compatibility concerns.

---

## Context

**Current State (as of commit 9c0d5506):**
- Upstream: v0.0.105 (ad1696cd) ✅ upgraded from v0.0.101 (d8fc7a98)
- Branch: `feat/genie-framework-migration`
- Override files: **25 files** in `forge-overrides/frontend/src/` (need refactoring)
- Repository: Independent from BloopAI, using namastexlabs/vibe-kanban fork ✅
- Known issues: Potential bugs from override drift vs upstream (to be addressed)

**Target State:**
- Upstream: v0.0.105-20251007161830 ✅ (achieved)
- Repository: Independent from BloopAI, using namastexlabs/vibe-kanban fork ✅ (achieved)
- All 25 overrides refactored via 1:1 upstream comparison (in progress)
- Minimal customizations preserved (branding, forge-api, Omni, links)
- Discord integration enabled (guild ID: 1095114867012292758)
- Codex executor refactor validated (new split architecture)
- New Copilot executor integrated
- MCP server refactor validated
- Override drift eliminated

**Why Now:**
- Accumulating technical debt from 3 missed releases
- Upstream bug fixes needed (modal flows, memory leaks, markdown renderer)
- New features desired (Copilot executor, IDE icons, Discord widget)
- Override drift causing bugs (per user feedback)

---

## User Stories

**As a Forge developer,**
I want the upstream submodule updated to v0.0.104,
So that I can leverage latest bug fixes and features.

**As a Forge user,**
I want the UI to work correctly without override-related bugs,
So that my development workflow is reliable.

**As a Forge maintainer,**
I want all overrides audited and refactored,
So that future upstream syncs are easier.

---

## Scope

### In Scope

**Phase 1: Submodule Update**
- Update `upstream/` submodule pointer to v0.0.104-20251006165551
- Stage submodule change (DO NOT commit until validation passes)

**Phase 2: Frontend Override Refactoring (25 Individual Tasks)**
- **One Forge task per override file** for focused 1:1 comparison
- For each file:
  1. Check if upstream equivalent exists
  2. If exists: Copy upstream (v0.0.104) as base
  3. Diff current override vs upstream
  4. Layer ONLY minimal Forge customizations
  5. Add comment: `// FORGE CUSTOMIZATION: [reason]`
  6. Test in isolation (lint + type check)
- **High-priority files:**
  - `navbar.tsx` - Discord widget (guild 1095114867012292758) + Forge links
  - `GitHubLoginDialog.tsx` - Modal flow fix + Forge branding
  - `GeneralSettings.tsx` - Button pattern + OmniCard integration
  - Omni files (B-10 to B-13) - Forge-specific features, verify compatibility
- **Forge-specific files (no upstream):**
  - 6 files: OmniCard, OmniModal, omni/api, omni/types, forge-api, companion-install-task
  - Action: Verify lint/type-check compatibility with v0.0.104 dependencies

**Phase 3: Backend Integration Validation**
- Test MCP server compatibility (`task_server.rs` refactor)
- Verify new Copilot executor loads
- Validate executor profile migration
- Run type generation (core + forge extensions)

**Phase 4: Full Integration Testing**
- Start full dev environment
- Test all 8 executors (including Copilot)
- Verify Omni features
- Test PR creation workflow
- Validate keyboard shortcuts (hjkl)
- Check sound notifications

**Phase 5: Regression Testing**
- Run full test suite (cargo + frontend)
- Run regression harness
- Visual regression (screenshot comparison)
- MCP tool response validation

### Out of Scope

- Backwards compatibility flags
- Legacy behavior preservation
- Custom Discord widget customization beyond guild ID
- Major architectural changes to override strategy

---

## Success Criteria

### Functional Requirements

✅ Upstream submodule updated to v0.0.104
✅ All frontend overrides refactored to match upstream structure
✅ Discord widget renders with Forge guild online count
✅ GitHub OAuth flow completes without errors
✅ All 8 executors listed and functional (Copilot included)
✅ MCP tools respond correctly (`list_projects`, `create_task`, etc.)
✅ Omni features work without errors
✅ PR creation workflow completes
✅ No console errors in browser
✅ Keyboard shortcuts functional (hjkl navigation)

### Quality Requirements

✅ `cargo test --workspace` passes
✅ `cargo clippy --all --all-targets --all-features -- -D warnings` passes
✅ `cd frontend && pnpm run lint` passes
✅ `cd frontend && pnpm run check` passes
✅ Type generation succeeds (core + forge)
✅ Regression harness passes
✅ Visual regression test passes (no unintended UI changes)

### Evidence Requirements

📸 Before/after screenshots (navbar, settings, task page)
📊 MCP response comparisons (baseline vs upgraded)
📋 Test suite output (all green)
📋 Executor list API response (8 executors present)
📋 Override audit report (file-by-file drift analysis)

---

## Technical Approach

### Override Refactoring Protocol

**For each override file:**

1. **Identify Customizations**
   - Read current override
   - List Forge-specific changes (branding, forge-api, Omni, links)

2. **Copy Upstream Base**
   - Get latest upstream version of file
   - Use as starting point

3. **Layer Customizations**
   - Add back only essential Forge changes
   - Keep structure identical to upstream where possible
   - Document why each customization exists

4. **Test in Isolation**
   - Lint: `cd frontend && pnpm run lint`
   - Type check: `cd frontend && pnpm exec tsc --noEmit`
   - Visual: Load component in browser

5. **Document Drift**
   - Record lines changed vs upstream
   - Note any bugs fixed by refactoring

### Validation Sequence

**Pre-Upgrade Baseline:**
```bash
# Capture current state
git log -1 upstream > baseline-upstream.txt
curl http://localhost:PORT/api/executors/profiles > baseline-executors.json
cargo test --workspace 2>&1 | tee baseline-tests.txt
```

**Post-Upgrade Validation:**
```bash
# Update submodule
cd upstream && git checkout v0.0.104-20251006165551
cd .. && git add upstream

# Type generation
cargo run -p server --bin generate_types -- --check
cargo run -p forge-app --bin generate_forge_types -- --check

# Test suite
cargo test --workspace
cd frontend && pnpm run lint && pnpm run check

# Integration test
pnpm run dev
# Manual: Create project, run task with Copilot, test Omni, create PR

# Regression
./scripts/run-forge-regression.sh
```

---

## Risks & Mitigations

**RISK-1: MCP Server Breaking Changes** (HIGH impact, MEDIUM likelihood)
- Mitigation: Test all MCP tools immediately after upgrade
- Rollback: `git checkout upstream d8fc7a98` if critical breakage

**RISK-2: Override Refactoring Introduces New Bugs** (MEDIUM impact, MEDIUM likelihood)
- Mitigation: Test each override in isolation before integration
- Rollback: Keep backup of old overrides in `forge-overrides-backup/`

**RISK-3: Type Generation Cascade Failure** (HIGH impact, LOW likelihood)
- Mitigation: Run type generation BEFORE committing submodule update
- Rollback: Manual type patches documented in wish

**RISK-4: Executor Profile Schema Migration** (MEDIUM impact, LOW likelihood)
- Mitigation: Diff `default_profiles.json`, test `/api/executors/profiles` endpoint
- Rollback: Restore old profile config in forge-extensions

**RISK-5: Omni Feature Breakage** (HIGH impact, LOW likelihood)
- Mitigation: Manual QA of Omni modal + prompts
- Rollback: Check forge-extensions/omni dependencies on upstream

**RISK-6: Override Drift Causing Bugs** (MEDIUM impact, HIGH likelihood - already happening)
- Mitigation: Full audit + refactor strategy (this wish addresses it)
- Prevention: Document customizations, add upstream diff checker

---

## Assumptions

**ASM-1:** Upstream MCP refactor maintains API compatibility (or we accept breaking changes)
**ASM-2:** New Copilot executor integrates via existing executor pattern
**ASM-3:** Discord widget can be customized with Forge guild ID (1095114867012292758)
**ASM-4:** Forge-overrides use React hooks compatible with upstream's useState/useEffect
**ASM-5:** Type generation handles new executor types automatically
**ASM-6:** Override refactoring from upstream base is faster than manual merge

---

## Decisions

**DEC-1:** Enable Discord integration with Forge guild (1095114867012292758)
**DEC-2:** Accept all breaking changes - no backwards compatibility
**DEC-3:** Direct upgrade 0.0.101 → 0.0.104 (not incremental)
**DEC-4:** Refactor overrides from upstream base, not merge
**DEC-5:** Accept all new IDE icons (IntelliJ, Windsurf, Xcode, Zed)
**DEC-6:** Stay on `feat/genie-framework-migration` branch
**DEC-7:** Full override audit (all 23 files) before commit

---

## Open Questions

None - all questions answered by human:
1. Discord integration: ✅ Enable with guild 1095114867012292758
2. Executor profiles: ✅ Direct migration
3. Breaking changes: ✅ No concerns
4. IDE icons: ✅ Accept all
5. Override strategy: ✅ Refactor from upstream

---

## Task Breakdown

### Task A: Submodule Update & Preparation
**Owner:** implementor
**Effort:** XS

**Setup (REQUIRED - worktree isolation):**
```bash
git submodule update --init --recursive
```

**Steps:**
1. Update upstream submodule pointer to v0.0.105
2. Create baseline snapshots (executors, tests, MCP responses)
3. Backup current overrides to `forge-overrides-backup/`
4. Run initial type generation check

**Validation:**
```bash
# Initialize submodules first
git submodule update --init --recursive

# Update submodule
cd upstream && git checkout v0.0.105
cd .. && git add upstream
git diff --cached upstream  # Should show submodule pointer change
test -d forge-overrides-backup  # Backup exists
```

**Evidence:** `baseline-*.txt` files, backup directory listing

---

## Override Audit & Analysis

### Task B: Comprehensive Override Audit
**Owner:** implementor
**Effort:** S

**Setup (REQUIRED - worktree isolation):**
```bash
git submodule update --init --recursive
```

**Purpose:** Analyze ALL existing overrides + identify new upstream files before refactoring.

**Steps:**
1. **Audit Existing Overrides (25 files):**
   - For each file in `forge-overrides/frontend/src/`:
     - Check if upstream equivalent exists
     - Generate diff vs upstream (v0.0.104)
     - Identify Forge customizations (branding/forge-api/Omni/links)
     - Detect drift-related bugs
     - Assign priority: HIGH/MEDIUM/LOW

2. **Check for New Upstream Files (v0.0.104):**
   - Compare upstream file tree: v0.0.101 vs v0.0.104
   - Identify new files we might want to override:
     - New components
     - New utilities
     - New types
   - Recommend: Override or leave as upstream default?

3. **Generate Override Audit Report:**
   - File: `.genie/wishes/upgrade-upstream-0-0-104/override-audit.md`
   - For each file:
     - Path (both override and upstream)
     - Lines changed vs upstream
     - Customizations found
     - Drift bugs identified
     - Refactor priority
     - Recommended action

**Validation:**
```bash
# Report exists with all files
test -f .genie/wishes/upgrade-upstream-0-0-104/override-audit.md

# Count entries (should be 25 existing + any new recommendations)
grep -c "^### " .genie/wishes/upgrade-upstream-0-0-104/override-audit.md

# Check for new upstream files
cd upstream && git diff --name-only d8fc7a98..v0.0.104-20251006165551 -- frontend/src/ | \
  grep -v "$(cd ../../forge-overrides/frontend/src && find . -type f)"
```

**Evidence:** Override audit report with drift analysis for all 25+ files

---

## Frontend Override Refactoring (25 Individual Tasks)

**Protocol for each task (C-01 through C-25):**
1. Read override audit report for this file
2. If upstream exists: Copy v0.0.104 as base
3. If no upstream: Verify compatibility only
4. Layer ONLY customizations from audit report
5. Add comment: `// FORGE CUSTOMIZATION: [reason]`
6. Test in isolation (lint + type check)
7. Document changes in task evidence

---

### Task C-01: GitHubLoginDialog.tsx
**File:** `forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** HIGH (known conflict)

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx`

**Forge Customizations to Preserve:**
- Branding text: "Automagik Forge" (vs "Vibe Kanban")
- Apply modal flow fix from v0.0.104 (lines 57-64: resolve → hide → setState order)

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/auth/GitHubLoginDialog.tsx
grep "Automagik Forge" forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx
# Test: OAuth flow completes, modal closes correctly
```

**Evidence:** Linted file, OAuth screenshot

---

### Task C-02: DisclaimerDialog.tsx
**File:** `forge-overrides/frontend/src/components/dialogs/global/DisclaimerDialog.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/global/DisclaimerDialog.tsx`

**Forge Customizations to Preserve:**
- Disclaimer text (Forge-specific wording)
- Legal/safety warnings tailored to Automagik Forge

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/global/DisclaimerDialog.tsx
diff upstream/frontend/src/components/dialogs/global/DisclaimerDialog.tsx \
     forge-overrides/frontend/src/components/dialogs/global/DisclaimerDialog.tsx | head -20
```

**Evidence:** Diff output, linted file

---

### Task C-03: OnboardingDialog.tsx
**File:** `forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/global/OnboardingDialog.tsx`

**Forge Customizations to Preserve:**
- Onboarding content (Forge-specific features)
- Welcome message branding

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/global/OnboardingDialog.tsx
```

**Evidence:** Linted file

---

### Task C-04: PrivacyOptInDialog.tsx
**File:** `forge-overrides/frontend/src/components/dialogs/global/PrivacyOptInDialog.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/global/PrivacyOptInDialog.tsx`

**Forge Customizations to Preserve:**
- Privacy policy text (Forge-specific)
- Analytics opt-in wording

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/global/PrivacyOptInDialog.tsx
```

**Evidence:** Linted file

---

### Task C-05: ReleaseNotesDialog.tsx
**File:** `forge-overrides/frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx`

**Forge Customizations to Preserve:**
- Release notes content (Forge versions, not Vibe Kanban)
- Changelog styling/branding

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/global/ReleaseNotesDialog.tsx
```

**Evidence:** Linted file

---

### Task C-06: dialogs/index.ts
**File:** `forge-overrides/frontend/src/components/dialogs/index.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/index.ts`

**Forge Customizations to Preserve:**
- Forge-specific dialog exports (if any)

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/index.ts
diff upstream/frontend/src/components/dialogs/index.ts \
     forge-overrides/frontend/src/components/dialogs/index.ts
```

**Evidence:** Diff output (likely identical to upstream)

---

### Task C-07: CreatePRDialog.tsx
**File:** `forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx`

**Forge Customizations to Preserve:**
- PR template references (Forge repo vs Vibe Kanban repo)
- GitHub links pointing to namastexlabs/automagik-forge

**Validation:**
```bash
cd frontend && pnpm run lint src/components/dialogs/tasks/CreatePRDialog.tsx
grep "namastexlabs/automagik-forge" forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
```

**Evidence:** Linted file, verified Forge repo links

---

### Task C-08: navbar.tsx
**File:** `forge-overrides/frontend/src/components/layout/navbar.tsx`
**Owner:** implementor
**Effort:** S
**Priority:** HIGH (known conflict + Discord integration)

**Upstream Equivalent:** `upstream/frontend/src/components/layout/navbar.tsx`

**Forge Customizations to Preserve:**
- EXTERNAL_LINKS: Docs → `https://forge.automag.ik/`
- EXTERNAL_LINKS: Support → `https://github.com/namastexlabs/automagik-forge/issues`
- Discord guild ID: `1095114867012292758` (update from upstream's guild)

**Validation:**
```bash
cd frontend && pnpm run lint src/components/layout/navbar.tsx
grep "1095114867012292758" forge-overrides/frontend/src/components/layout/navbar.tsx
grep "forge.automag.ik" forge-overrides/frontend/src/components/layout/navbar.tsx
grep "namastexlabs/automagik-forge" forge-overrides/frontend/src/components/layout/navbar.tsx
# Test: Discord widget fetches online count, Forge links work
```

**Evidence:** Linted file, screenshot of navbar with Discord + Forge links

---

### Task C-09: logo.tsx
**File:** `forge-overrides/frontend/src/components/logo.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW

**Upstream Equivalent:** `upstream/frontend/src/components/logo.tsx`

**Forge Customizations to Preserve:**
- Automagik Forge logo (SVG/component)
- Branding colors/styling

**Validation:**
```bash
cd frontend && pnpm run lint src/components/logo.tsx
# Test: Logo renders correctly
```

**Evidence:** Linted file, logo screenshot

---

### Task C-10: OmniCard.tsx (Forge-Specific)
**File:** `forge-overrides/frontend/src/components/omni/OmniCard.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** HIGH (Forge feature)

**Upstream Equivalent:** N/A (Forge-specific feature)

**Action:**
- Verify file lints and type-checks against v0.0.104 dependencies
- No refactoring needed (no upstream equivalent)
- Check for API/import changes that might break Omni

**Validation:**
```bash
cd frontend && pnpm run lint src/components/omni/OmniCard.tsx
cd frontend && pnpm exec tsc --noEmit src/components/omni/OmniCard.tsx
```

**Evidence:** Linted file, type check pass

---

### Task C-11: OmniModal.tsx (Forge-Specific)
**File:** `forge-overrides/frontend/src/components/omni/OmniModal.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** HIGH (Forge feature)

**Upstream Equivalent:** N/A (Forge-specific feature)

**Action:**
- Verify file lints and type-checks
- Check NiceModal pattern compatibility with upstream updates

**Validation:**
```bash
cd frontend && pnpm run lint src/components/omni/OmniModal.tsx
cd frontend && pnpm exec tsc --noEmit src/components/omni/OmniModal.tsx
```

**Evidence:** Linted file, type check pass

---

### Task C-12: omni/api.ts (Forge-Specific)
**File:** `forge-overrides/frontend/src/components/omni/api.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** HIGH (Forge feature)

**Upstream Equivalent:** N/A (Forge-specific API)

**Action:**
- Verify API client pattern matches upstream conventions
- Check for breaking changes in fetch/axios patterns

**Validation:**
```bash
cd frontend && pnpm run lint src/components/omni/api.ts
cd frontend && pnpm exec tsc --noEmit src/components/omni/api.ts
```

**Evidence:** Linted file, type check pass

---

### Task C-13: omni/types.ts (Forge-Specific)
**File:** `forge-overrides/frontend/src/components/omni/types.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM (Forge feature)

**Upstream Equivalent:** N/A (Forge-specific types)

**Action:**
- Verify types compatible with `shared/forge-types.ts`
- Check for conflicts with upstream type changes

**Validation:**
```bash
cd frontend && pnpm run lint src/components/omni/types.ts
cd frontend && pnpm exec tsc --noEmit src/components/omni/types.ts
```

**Evidence:** Linted file, type check pass

---

### Task C-14: PreviewTab.tsx
**File:** `forge-overrides/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx`

**Forge Customizations to Preserve:**
- Forge-specific preview rendering (if any)
- Custom NoServerContent integration

**Validation:**
```bash
cd frontend && pnpm run lint src/components/tasks/TaskDetails/PreviewTab.tsx
diff upstream/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx \
     forge-overrides/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx
```

**Evidence:** Linted file, diff output

---

### Task C-15: NoServerContent.tsx
**File:** `forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW

**Upstream Equivalent:** `upstream/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx`

**Forge Customizations to Preserve:**
- Forge-specific messaging

**Validation:**
```bash
cd frontend && pnpm run lint src/components/tasks/TaskDetails/preview/NoServerContent.tsx
```

**Evidence:** Linted file

---

### Task C-16: AgentSettings.tsx
**File:** `forge-overrides/frontend/src/pages/settings/AgentSettings.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/pages/settings/AgentSettings.tsx`

**Forge Customizations to Preserve:**
- Forge-specific agent configuration UI

**Validation:**
```bash
cd frontend && pnpm run lint src/pages/settings/AgentSettings.tsx
```

**Evidence:** Linted file

---

### Task C-17: GeneralSettings.tsx
**File:** `forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx`
**Owner:** implementor
**Effort:** S
**Priority:** HIGH (known conflict + OmniCard)

**Upstream Equivalent:** `upstream/frontend/src/pages/settings/GeneralSettings.tsx`

**Forge Customizations to Preserve:**
- OmniCard integration (around line 666-674)
- forgeApi.getGlobalSettings() / setGlobalSettings() calls
- GitHub login button pattern update (remove `.finally()` wrapper per v0.0.104)

**Validation:**
```bash
cd frontend && pnpm run lint src/pages/settings/GeneralSettings.tsx
grep "OmniCard" forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx
grep "forgeApi" forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx
# Test: Settings save, Omni settings persist
```

**Evidence:** Linted file, settings save screenshot

---

### Task C-18: McpSettings.tsx
**File:** `forge-overrides/frontend/src/pages/settings/McpSettings.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/pages/settings/McpSettings.tsx`

**Forge Customizations to Preserve:**
- Forge-specific MCP configuration UI (if any)

**Validation:**
```bash
cd frontend && pnpm run lint src/pages/settings/McpSettings.tsx
```

**Evidence:** Linted file

---

### Task C-19: SettingsLayout.tsx
**File:** `forge-overrides/frontend/src/pages/settings/SettingsLayout.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW

**Upstream Equivalent:** `upstream/frontend/src/pages/settings/SettingsLayout.tsx`

**Forge Customizations to Preserve:**
- Forge-specific layout tweaks (if any)

**Validation:**
```bash
cd frontend && pnpm run lint src/pages/settings/SettingsLayout.tsx
```

**Evidence:** Linted file

---

### Task C-20: settings/index.ts
**File:** `forge-overrides/frontend/src/pages/settings/index.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW

**Upstream Equivalent:** `upstream/frontend/src/pages/settings/index.ts`

**Forge Customizations to Preserve:**
- Forge-specific settings exports

**Validation:**
```bash
cd frontend && pnpm run lint src/pages/settings/index.ts
diff upstream/frontend/src/pages/settings/index.ts \
     forge-overrides/frontend/src/pages/settings/index.ts
```

**Evidence:** Diff output

---

### Task C-21: main.tsx
**File:** `forge-overrides/frontend/src/main.tsx`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM

**Upstream Equivalent:** `upstream/frontend/src/main.tsx`

**Forge Customizations to Preserve:**
- Forge-specific providers/wrappers
- Analytics initialization
- Global styles import

**Validation:**
```bash
cd frontend && pnpm run lint src/main.tsx
diff upstream/frontend/src/main.tsx forge-overrides/frontend/src/main.tsx
```

**Evidence:** Linted file, diff output

---

### Task C-22: index.css
**File:** `forge-overrides/frontend/src/styles/index.css`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW

**Upstream Equivalent:** `upstream/frontend/src/styles/index.css`

**Forge Customizations to Preserve:**
- Forge brand colors
- Custom styling overrides

**Validation:**
```bash
# CSS doesn't lint via pnpm, verify manually
diff upstream/frontend/src/styles/index.css \
     forge-overrides/frontend/src/styles/index.css
```

**Evidence:** Diff output, visual check

---

### Task C-23: forge-api.ts (Forge-Specific)
**File:** `forge-overrides/frontend/src/lib/forge-api.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** HIGH (Forge feature)

**Upstream Equivalent:** N/A (Forge-specific API client)

**Action:**
- Verify API client pattern matches upstream conventions
- Check import paths still valid after upstream changes

**Validation:**
```bash
cd frontend && pnpm run lint src/lib/forge-api.ts
cd frontend && pnpm exec tsc --noEmit src/lib/forge-api.ts
```

**Evidence:** Linted file, type check pass

---

### Task C-24: shims.d.ts (Forge-Specific)
**File:** `forge-overrides/frontend/src/types/shims.d.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** LOW (Forge types)

**Upstream Equivalent:** N/A (Forge-specific type shims)

**Action:**
- Verify type declarations compatible with upstream types
- Check for conflicts with `shared/types.ts`, `shared/forge-types.ts`

**Validation:**
```bash
cd frontend && pnpm exec tsc --noEmit src/types/shims.d.ts
```

**Evidence:** Type check pass

---

### Task C-25: companion-install-task.ts (Forge-Specific)
**File:** `forge-overrides/frontend/src/utils/companion-install-task.ts`
**Owner:** implementor
**Effort:** XS
**Priority:** MEDIUM (Forge utility)

**Upstream Equivalent:** N/A (Forge-specific utility)

**Action:**
- Verify utility functions compatible with upstream task models
- Check import paths still valid

**Validation:**
```bash
cd frontend && pnpm run lint src/utils/companion-install-task.ts
cd frontend && pnpm exec tsc --noEmit src/utils/companion-install-task.ts
```

**Evidence:** Linted file, type check pass

---

## Backend Extension Validation (Phase 4)

**Note:** All tasks MUST initialize submodules first (worktree isolation issue):
```bash
git submodule update --init --recursive
```

---

### Task D-01: Omni Extension Validation
**Owner:** implementor
**Effort:** S
**Files:** `forge-extensions/omni/{client.rs,types.rs,service.rs,lib.rs}`

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Compile against v0.0.105: `cargo build -p forge-omni`
2. Run tests: `cargo test -p forge-omni`
3. Check type compatibility with `shared/forge-types.ts`
4. Test Omni API endpoints (requires running server)

**Commands:**
```bash
cargo build -p forge-omni
cargo test -p forge-omni
cargo clippy -p forge-omni -- -D warnings
```

**Evidence:** Compilation success, test output, clippy clean

---

### Task D-02: Config Extension Validation
**Owner:** implementor
**Effort:** XS
**Files:** `forge-extensions/config/{types.rs,service.rs,lib.rs}`

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Compile against v0.0.105: `cargo build -p forge-config`
2. Run tests: `cargo test -p forge-config`
3. Verify config storage/retrieval

**Commands:**
```bash
cargo build -p forge-config
cargo test -p forge-config
cargo clippy -p forge-config -- -D warnings
```

**Evidence:** Compilation success, test output

---

### Task D-03: Forge-App Binary Validation
**Owner:** implementor
**Effort:** M
**Files:** `forge-app/src/{main.rs,router.rs,services/mod.rs}`

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Compile forge-app: `cargo build -p forge-app`
2. Verify composition of upstream + extensions
3. Check route registration (Omni routes, config routes)
4. Test server startup

**Commands:**
```bash
cargo build -p forge-app
cargo run -p forge-app --bin forge-app &
sleep 5
curl http://localhost:PORT/api/system/config
pkill forge-app
```

**Evidence:** Compilation success, server starts, routes respond

---

### Task D-04: Type Generation Validation
**Owner:** implementor
**Effort:** XS
**Files:** `forge-app/src/bin/generate_forge_types.rs`

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
```bash
cargo run -p server --bin generate_types -- --check
cargo run -p forge-app --bin generate_forge_types -- --check
```

**Evidence:** Both type generators pass, `shared/forge-types.ts` valid

---

### Task D-05: MCP Server Endpoints Validation
**Owner:** qa
**Effort:** S

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Start forge-app server
2. Test all Forge MCP tools
3. Verify responses match schema

**Commands:**
```bash
# Start server
cargo run -p forge-app --bin forge-app &
SERVER_PID=$!

# Test endpoints
curl http://localhost:PORT/api/forge/omni/status
curl http://localhost:PORT/api/forge/config

# Cleanup
kill $SERVER_PID
```

**Evidence:** All endpoints respond, JSON schemas valid

---

### Task D-06: Git Services & Worktree Validation
**Owner:** implementor
**Effort:** S

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Test worktree manager against v0.0.105
2. Verify executor profiles API
3. Check Copilot executor presence

**Commands:**
```bash
# Executors
curl http://localhost:PORT/api/executors/profiles | jq 'keys | length'  # Should be 8
curl http://localhost:PORT/api/executors/profiles | jq 'has("copilot")'  # Should be true
```

**Evidence:** Worktree operations succeed, 8 executors present

---

### Task E: Full Integration Testing
**Owner:** qa
**Effort:** M

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Start full dev environment: `pnpm run dev`
2. Create test project
3. Test each executor (especially Copilot)
4. Test Omni features (modal, prompts, responses)
5. Test PR creation workflow
6. Test keyboard shortcuts (hjkl navigation)
7. Test sound notifications
8. Visual inspection (navbar, settings, task page)

**Validation Checklist:**
- [ ] Dev environment starts without errors
- [ ] Can create project
- [ ] Copilot executor selectable in settings
- [ ] Can run task with Copilot
- [ ] Omni modal opens and responds
- [ ] Can create PR from task attempt
- [ ] hjkl shortcuts navigate tasks
- [ ] Sound plays on task completion
- [ ] Discord widget shows online count
- [ ] Forge docs/support links work
- [ ] No console errors

**Evidence:** QA checklist (all items checked), screenshots, console log clean

---

### Task F: Regression Testing & Final Validation
**Owner:** qa
**Effort:** S

**Setup (REQUIRED):**
```bash
git submodule update --init --recursive
```

**Validation:**
1. Run full test suite
2. Run regression harness
3. Compare baseline vs upgraded (tests, executors, MCP, UI)
4. Document any differences

**Validation Commands:**
```bash
# Full test suite
cargo test --workspace 2>&1 | tee upgraded-tests.txt
cargo clippy --all --all-targets --all-features -- -D warnings
cd frontend && pnpm run lint
cd frontend && pnpm run check

# Regression harness
./scripts/run-forge-regression.sh

# Comparison
diff baseline-tests.txt upgraded-tests.txt
diff baseline-executors.json <(curl http://localhost:PORT/api/executors/profiles)
```

**Evidence:** Test output files, diff reports, regression harness results

---

## Branch Strategy

**Branch:** `feat/genie-framework-migration` (current branch - staying here)
**Naming:** N/A (already on branch)
**PR Target:** `main`
**Merge Strategy:** Squash commits after all validations pass

**Commit Message Template:**
```
feat: upgrade upstream to v0.0.104 + refactor overrides

- Update upstream submodule: v0.0.101 → v0.0.104
- Refactor all frontend overrides to match upstream structure
- Enable Discord integration (guild: 1095114867012292758)
- Integrate Copilot executor
- Fix override drift bugs
- Add new IDE icons (IntelliJ, Windsurf, Xcode, Zed)

Major changes:
- navbar.tsx: Discord widget + Forge branding
- GitHubLoginDialog.tsx: Modal flow fix + branding
- GeneralSettings.tsx: Button pattern update + OmniCard
- 20 additional overrides audited and refactored

Validation:
- All tests passing (cargo + frontend)
- MCP server compatible
- 8 executors functional
- Omni integration verified
- Regression harness passed

Breaking changes: Accepted (per DEC-2)

Closes: #[issue-number-if-any]
```

---

## Tracker Plan

**Forge MCP Tasks (35 total): A + B + 25×C + 6×D + E + F = 35 tasks**

**Phase 1: Preparation (1 task)**
- Task A: `upgrade-upstream-0-0-104-task-a` (Submodule update & baseline)

**Phase 2: Override Audit (1 task)**
- Task B: `upgrade-upstream-0-0-104-task-b` (Comprehensive override audit + new file detection)

**Phase 3: Frontend Override Refactoring (25 individual files)**
- Task C-01: `upgrade-upstream-0-0-104-task-c-01` (GitHubLoginDialog.tsx)
- Task C-02: `upgrade-upstream-0-0-104-task-c-02` (DisclaimerDialog.tsx)
- Task C-03: `upgrade-upstream-0-0-104-task-c-03` (OnboardingDialog.tsx)
- Task C-04: `upgrade-upstream-0-0-104-task-c-04` (PrivacyOptInDialog.tsx)
- Task C-05: `upgrade-upstream-0-0-104-task-c-05` (ReleaseNotesDialog.tsx)
- Task C-06: `upgrade-upstream-0-0-104-task-c-06` (dialogs/index.ts)
- Task C-07: `upgrade-upstream-0-0-104-task-c-07` (CreatePRDialog.tsx)
- Task C-08: `upgrade-upstream-0-0-104-task-c-08` (navbar.tsx - HIGH priority)
- Task C-09: `upgrade-upstream-0-0-104-task-c-09` (logo.tsx)
- Task C-10: `upgrade-upstream-0-0-104-task-c-10` (OmniCard.tsx - Forge-specific)
- Task C-11: `upgrade-upstream-0-0-104-task-c-11` (OmniModal.tsx - Forge-specific)
- Task C-12: `upgrade-upstream-0-0-104-task-c-12` (omni/api.ts - Forge-specific)
- Task C-13: `upgrade-upstream-0-0-104-task-c-13` (omni/types.ts - Forge-specific)
- Task C-14: `upgrade-upstream-0-0-104-task-c-14` (PreviewTab.tsx)
- Task C-15: `upgrade-upstream-0-0-104-task-c-15` (NoServerContent.tsx)
- Task C-16: `upgrade-upstream-0-0-104-task-c-16` (AgentSettings.tsx)
- Task C-17: `upgrade-upstream-0-0-104-task-c-17` (GeneralSettings.tsx - HIGH priority)
- Task C-18: `upgrade-upstream-0-0-104-task-c-18` (McpSettings.tsx)
- Task C-19: `upgrade-upstream-0-0-104-task-c-19` (SettingsLayout.tsx)
- Task C-20: `upgrade-upstream-0-0-104-task-c-20` (settings/index.ts)
- Task C-21: `upgrade-upstream-0-0-104-task-c-21` (main.tsx)
- Task C-22: `upgrade-upstream-0-0-104-task-c-22` (index.css)
- Task C-23: `upgrade-upstream-0-0-104-task-c-23` (forge-api.ts - Forge-specific)
- Task C-24: `upgrade-upstream-0-0-104-task-c-24` (shims.d.ts - Forge-specific)
- Task C-25: `upgrade-upstream-0-0-104-task-c-25` (companion-install-task.ts - Forge-specific)

**Phase 4: Backend Extension Validation (6 component-based tasks)**
- Task D-01: `upgrade-upstream-0-0-104-task-d-01` (Omni extension - 4 Rust files)
- Task D-02: `upgrade-upstream-0-0-104-task-d-02` (Config extension - 3 Rust files)
- Task D-03: `upgrade-upstream-0-0-104-task-d-03` (Forge-app binary validation)
- Task D-04: `upgrade-upstream-0-0-104-task-d-04` (Type generation)
- Task D-05: `upgrade-upstream-0-0-104-task-d-05` (MCP server endpoints)
- Task D-06: `upgrade-upstream-0-0-104-task-d-06` (Git services & worktree)

**Phase 5: Integration & Regression (2 tasks)**
- Task E: `upgrade-upstream-0-0-104-task-e` (Full integration testing)
- Task F: `upgrade-upstream-0-0-104-task-f` (Regression testing)

**Human Review Gates:**
1. After Task B: Review override audit report → approve/modify refactoring plan
2. After each C-task: Quick approval for file refactor (can be batched)
3. After Task D-06: Backend validation review
4. After Task F: Final approval to commit + push

---

## Status Log

| Date | Event | Notes |
|------|-------|-------|
| 2025-10-07 | Wish created | Planning complete, awaiting human approval |
| 2025-10-07 | Repository independence achieved | Removed BloopAI upstream, reconfigured to namastexlabs/vibe-kanban fork (commit 9c0d5506) |
| 2025-10-07 | Submodule upgraded to v0.0.105 | Skipped v0.0.104, now at v0.0.105-20251007161830; wish needs scope adjustment |

---

## Evidence Checklist

### Pre-Upgrade Evidence
- [ ] `baseline-upstream.txt` - Current submodule version
- [ ] `baseline-executors.json` - Current executor list
- [ ] `baseline-tests.txt` - Current test suite output
- [ ] `forge-overrides-backup/` - Backup of current overrides

### Override Audit Evidence
- [ ] `override-audit.md` - File-by-file drift analysis

### Refactoring Evidence
- [ ] Screenshot: navbar with Discord widget + Forge links
- [ ] Screenshot: GitHub OAuth flow completion
- [ ] Screenshot: Settings page with OmniCard
- [ ] Lint output: All override files pass
- [ ] Type check output: All override files pass

### Backend Validation Evidence
- [ ] Type generation output (core)
- [ ] Type generation output (forge)
- [ ] MCP response JSONs (`list_projects`, `create_task`)
- [ ] Executor profiles API response (8 executors)

### Integration Testing Evidence
- [ ] QA checklist (all items checked)
- [ ] Screenshots: navbar, settings, task page
- [ ] Console log: No errors
- [ ] Omni test: Prompt/response flow

### Regression Testing Evidence
- [ ] `upgraded-tests.txt` - New test suite output
- [ ] Diff reports: tests, executors, MCP
- [ ] Regression harness output
- [ ] Visual regression: Before/after screenshots

---

## Context Ledger

| Source | Type | Summary | Routed To | Status |
|--------|------|---------|-----------|--------|
| `git log d8fc7a98..fbb972a5` | repo | 27 commits, 68 files changed | planning | ✅ |
| `git diff --stat` | repo | +1835/-975 lines | risk analysis | ✅ |
| User feedback | human | Enable Discord (guild 1095114867012292758), refactor overrides | DEC-1, DEC-4 | ✅ |
| User feedback | human | No breaking change concerns, direct upgrade | DEC-2, DEC-3 | ✅ |
| User feedback | human | Stay on current branch | DEC-6 | ✅ |
| forge-overrides/ | repo | 23 override files needing audit | Task B, E | ✅ |
| navbar.tsx conflict | repo | Discord + Forge branding | Task C | ✅ |
| GitHubLoginDialog.tsx conflict | repo | Modal flow fix + branding | Task D | ✅ |
| GeneralSettings.tsx conflict | repo | Button pattern + OmniCard | Task D | ✅ |
| MCP refactor | repo | task_server.rs 896 lines changed | Task F | ✅ |
| Copilot executor | repo | New executor (+280 lines) | Task F, G | ✅ |

---

<spec_contract>

## Specification Contract

This wish is considered **COMPLETE** when:

### Functional Completeness
1. ✅ Upstream submodule pointer updated to v0.0.104-20251006165551
2. ✅ All 23 frontend overrides audited (report generated)
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

### Human Approval
1. ✅ Override audit approved (after Task B)
2. ✅ Refactored overrides approved (after Task E)
3. ✅ Final validation approved (after Task H)
4. ✅ Ready to commit to `feat/genie-framework-migration`

</spec_contract>

---

## Notes

**IMPORTANT UPDATE (2025-10-07):**
Repository has been upgraded to v0.0.105-20251007161830, superseding the original v0.0.104 target. Changes between v0.0.104 and v0.0.105 include:
- Major: Codex executor refactored (1352 lines → split into client.rs, jsonrpc.rs, normalize_logs.rs, session.rs)
- API route updates (approvals, projects, task_attempts, task_templates)
- Version bumps across all crates

**Recommended Action:**
- Option 1: Rename wish to `upgrade-upstream-0-0-105` and update all task references
- Option 2: Continue with existing wish structure but update target version throughout

**Override Refactoring Philosophy:**
- Upstream structure is source of truth
- Forge customizations are minimal, surgical additions
- When in doubt, prefer upstream version
- Document every customization with comment: `// FORGE CUSTOMIZATION: [reason]`

**Rollback Strategy:**
If critical issues discovered:
```bash
# Restore upstream
cd upstream && git checkout d8fc7a98

# Restore overrides
rm -rf forge-overrides/frontend/src
cp -r forge-overrides-backup/frontend/src forge-overrides/frontend/

# Unstage changes
git reset HEAD upstream forge-overrides/

# Document rollback reason
echo "Rolled back due to: [specific issue]" >> .genie/wishes/upgrade-upstream-0-0-104-wish.md
```

**Future Upstream Sync Process:**
1. Run override audit tool (to be created): `./scripts/audit-overrides.sh`
2. Create wish for sync
3. Refactor overrides per protocol
4. Validate + merge

---

**Wish Status:** ✅ READY FOR APPROVAL

**Next Steps:**
1. Human reviews wish
2. If approved → Run `/forge upgrade-upstream-0-0-104` to generate task files
3. Execute tasks A→H with validation gates
4. Commit to `feat/genie-framework-migration` after final approval
