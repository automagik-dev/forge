# WISH: Progressive Disclosure Tooltips for Git Operations

**GitHub Issue:** [#135](https://github.com/namastexlabs/automagik-forge/issues/135)
**Status:** READY FOR IMPLEMENTATION
**Complexity:** Medium (~2-3 sprints)
**Priority:** High

---

## 🎯 Quick Summary

Enhance Git Operations UI (Merge, PR, Rebase buttons) with progressive disclosure tooltips and contextual descriptions. Users get:
- **Level 1:** Simple 1-line tooltip on hover (for everyone)
- **Level 2:** Detailed technical info via info icon (for power users)
- **Level 3:** Conflict warnings with file list (when risky)
- **Level 4:** Collapsible status panel (optional bonus)

## 📁 This Folder Structure

```
progressive-tooltip-strategy/
├── README.md (this file)
├── progressive-tooltip-strategy-wish.md (main spec with 100-point evaluation matrix)
├── qa/                          # Evidence and test results
│   ├── group-a/                # i18n translation work
│   ├── group-b/                # Component implementation work
│   └── group-c/                # Conflict detection work
├── research/                    # Analysis and reference docs
│   └── (reference materials, explorations, design docs)
└── reports/                     # Blockers, completions, learnings
    └── (status updates, blockers, done reports)
```

## 🚀 Getting Started

1. **Read the main spec:**
   ```bash
   cat progressive-tooltip-strategy-wish.md
   ```

2. **Start Phase 1 (Core Tooltips):**
   - Begin with execution group A (translation files)
   - Create feature branch: `git checkout -b feature/git-ops-tooltips`
   - Update `frontend/public/locales/*/tasks.json`

3. **Evidence goes in `qa/group-a/`, `qa/group-b/`, `qa/group-c/`**

4. **Report blockers in `reports/` folder**

## 📋 Main Specification

See `progressive-tooltip-strategy-wish.md` for:
- Complete acceptance criteria
- Execution groups A, B, C with deliverables
- Context ledger with file references
- Design decisions with rationale
- Verification plan with validation commands
- Implementation notes and code patterns
- Translation guidelines for 21+ keys × 5 languages
- Accessibility and mobile responsiveness guidelines

## 🔗 Quick Links

- **GitHub Issue:** #135
- **Component:** `frontend/src/components/git-operations/GitOperations.tsx`
- **Translation Files:** `frontend/public/locales/{en,pt-BR,es,ja,ko}/tasks.json`
- **Types:** `frontend/src/shared/types.ts`

## 💾 Wish Metadata

| Property | Value |
|----------|-------|
| Created | 2025-11-11 |
| Last Updated | 2025-11-11 |
| Issue | #135 |
| Status | READY FOR IMPLEMENTATION |
| Phases | 5 (1 = Core, 2 = Conflicts, 3 = First-time help, 4 = Translations, 5 = Status panel) |
| Implementation Groups | 3 (A = i18n, B = Component, C = Conflict Detection) |
| Files to Update | 8 (3 components + 5 translation files) |
| Dependencies | 0 new (uses existing Radix + lucide-react) |
