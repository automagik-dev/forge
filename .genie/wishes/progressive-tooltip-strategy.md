# WISH: Progressive Disclosure Tooltips for Git Operations

**Issue:** [#135](https://github.com/namastexlabs/automagik-forge/issues/135)
**Branch:** `feature/git-ops-tooltips`
**Status:** 📋 READY FOR IMPLEMENTATION
**Priority:** 🔴 HIGH (UX improvement, reduces support questions)

---

## Problem Statement

Forge's Git Operations UI lacks progressive disclosure tooltips:
- ❌ Users don't understand what git operations do
- ❌ No explanation of consequences or side effects
- ❌ No warning when conflicts are likely
- ❌ No tooltips for different user expertise levels (beginners vs power users)
- ❌ 9 hard-coded disabled button reasons aren't translated

**Current State:** 3 buttons (Merge, PR, Rebase) with minimal tooltips only on disabled states
**User Impact:** Beginners confused, power users can't access technical details, support burden high

---

## Desired Outcome

Implement 4-level progressive disclosure tooltip system:

**Level 1 (Everyone):** Simple 1-line tooltip on hover
- "Merge changes into target branch"
- "Create pull request for code review"
- "Rebase onto target branch"

**Level 2 (Power Users):** Detailed technical info via info icon click
- Multi-line explanation with steps and side effects
- Git backend commands (git merge, git push, git rebase)
- Technical details about what happens

**Level 3 (Risk Detection):** Contextual conflict warnings
- Automatic detection when conflicts likely
- List specific conflicted files
- Warning styling (border-warning, text-warning)

**Level 4 (Bonus):** Collapsible status panel
- Branch names and commit counts
- Remote status
- Suggested next action

---

## Solution Overview

### Implementation Roadmap (5 Phases)

**Phase 1: Core Tooltips** ← START HERE
- Add `showDetailedTooltips` state to GitOperations
- Implement info icon for 3 buttons
- Create simple & detailed tooltip content
- Add translation keys

**Phase 2: Conflict Detection**
- Detect files modified by both parties
- Extract conflicted file names
- Show warning icon and styling

**Phase 3: First-Time User Help**
- Show educational alerts on first use
- Store preference in localStorage
- "Don't show again" button

**Phase 4: Translation Coverage**
- Add 9 disabled button reasons (all 5 languages)
- Add 12+ tooltip keys (all 5 languages)
- Total: 21+ keys × 5 languages = 105+ translations

**Phase 5: Status Panel (Bonus)**
- Collapsible detailed sync status section
- Branch names, commit counts
- Suggested next action

### Files to Update

**Components (3 files):**
- `frontend/src/components/git-operations/GitOperations.tsx` (555 lines)
- `frontend/src/components/git-actions/GitActionsDialog.tsx` (250+ lines)
- `frontend/src/components/git-actions/CreatePRDialog.tsx`

**Translations (5 files, 5 languages each):**
- `frontend/public/locales/en/tasks.json` (+21 keys)
- `frontend/public/locales/pt-BR/tasks.json`
- `frontend/public/locales/es/tasks.json`
- `frontend/public/locales/ja/tasks.json`
- `frontend/public/locales/ko/tasks.json`

### Dependencies

✅ **ALL AVAILABLE (no new dependencies needed):**
- @radix-ui/react-tooltip (already imported)
- lucide-react icons (Info, AlertTriangle)
- i18n with 5 language support

---

## Key Metrics

| Metric | Target |
|--------|--------|
| Simple tooltips | ✅ All 3 buttons |
| Detailed tooltips | ✅ All 3 buttons via info icon |
| Conflict detection | ✅ Automatic when both modified same files |
| Translation coverage | ✅ 100% (21+ keys × 5 languages) |
| Disabled reason translations | ✅ 9 hard-coded strings → i18n |
| Test coverage | ✅ Manual checklist (20+ test cases) |
| Accessibility | ✅ WCAG 2.1 AA compliant |

---

## Success Criteria

### Phase 1: Core Tooltips
- [ ] All 3 buttons have simple tooltips on hover
- [ ] Info icon toggles detailed tooltip content
- [ ] Detailed tooltips show multi-line content
- [ ] Technical backend info visible
- [ ] Icons animate on hover

### Phase 2: Conflict Detection
- [ ] Conflict detection identifies modified files
- [ ] Warning banner appears when needed
- [ ] Modified files listed in warning
- [ ] Button changes color/icon when conflicts likely

### Phase 3: First-Time User Help
- [ ] Help alert shown on first use (fresh session)
- [ ] Alert explains what operation does
- [ ] "Don't show again" works

### Phase 4: Translations
- [ ] All 9 disabled reasons translated (5 languages)
- [ ] All 12+ tooltip keys present (5 languages)
- [ ] No hard-coded strings in dialogs
- [ ] No text overflow in any language

### Phase 5: Status Panel (Bonus)
- [ ] Collapsible status section below buttons
- [ ] Shows branch names and commit counts
- [ ] Shows suggested next action
- [ ] Optional (not blocking completion)

---

## Folder Structure

```
.genie/wishes/progressive-tooltip-strategy/
├── README.md                                  # Folder navigation
├── progressive-tooltip-strategy-wish.md       # Full spec (100-point evaluation)
├── qa/                                        # Evidence & test results
│   ├── group-a/                              # i18n translation work
│   ├── group-b/                              # Component implementation
│   └── group-c/                              # Conflict detection work
├── research/                                  # Analysis & references
│   └── (design docs, exploration results)
└── reports/                                   # Status & blockers
    └── (blockers, done reports, learnings)
```

---

## Quick Start

1. **Read the full spec:**
   ```bash
   cat .genie/wishes/progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/git-ops-tooltips
   ```

3. **Begin Phase 1 (Group A - i18n):**
   - Update `frontend/public/locales/en/tasks.json`
   - Add `git.tooltips` section with nested keys
   - Copy structure to 4 other language files

4. **Store evidence in `qa/group-a/`**

5. **Test using manual checklist in spec**

6. **Create PR when Phase 1 complete**

---

## Related Resources

- **Main Specification:** `./progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md`
- **GitHub Issue:** #135
- **Component:** `frontend/src/components/git-operations/GitOperations.tsx`
- **Translations:** `frontend/public/locales/{en,pt-BR,es,ja,ko}/tasks.json`

---

**Last Updated:** 2025-11-11
**Status:** Ready for Phase 1 implementation
