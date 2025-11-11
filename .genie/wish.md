# 🧞 Active Wishes

This directory contains all active wishes for the Genie framework. Each wish is a persistent orchestration document that guides implementation from planning through completion.

## Current Active Wishes

### 1. Progressive Disclosure Tooltips for Git Operations (Issue #135)
**Status:** READY FOR IMPLEMENTATION
**Folder:** `.genie/wishes/progressive-tooltip-strategy/`
**Document:** `progressive-tooltip-strategy-wish.md`
**GitHub Issue:** [#135](https://github.com/namastexlabs/automagik-forge/issues/135)

**Summary:**
Enhance Git Operations UI with progressive disclosure tooltips and contextual descriptions for 3 git action buttons (Merge, PR, Rebase). Users get simple action-oriented hints on hover, with option to expand for technical details, conflict warnings, and status information.

**Key Objectives:**
- Level 1: Simple 1-line tooltips on hover (for everyone)
- Level 2: Detailed technical info via info icon (for power users)
- Level 3: Conflict warnings with file lists (conditional)
- Level 4: Collapsible status panel (optional bonus)

**Implementation Phases:**
- [ ] Phase 1: Core tooltips (all 3 buttons)
- [ ] Phase 2: Conflict detection & warnings
- [ ] Phase 3: First-time user help
- [ ] Phase 4: Translation coverage (21+ keys, 5 languages)
- [ ] Phase 5: Status panel (bonus)

**Quick Links:**
- [Full Wish Document](./wishes/progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md)
- [GitHub Issue #135](https://github.com/namastexlabs/automagik-forge/issues/135)
- [Component to Update](../src/components/git-operations/GitOperations.tsx)
- [Translation Files](../src/i18n/locales/)

---

## Wish Lifecycle

Each wish follows this lifecycle:

1. **Created** - Wish document created with spec contract and execution groups
2. **Ready** - Context analyzed, acceptance criteria defined, ready for implementation
3. **In Progress** - Assigned to developer, branches created, work underway
4. **Complete** - All acceptance criteria met, evidence validated, PR merged
5. **Archived** - Wish completed, moved to history

## Adding New Wishes

To create a new wish:

1. Use the `wish` agent: `mcp__genie__run(agent="wish", prompt="...")`
2. Wish will be created in `.genie/wishes/<slug>/`
3. Update this index with the new wish summary

## Wish Folder Structure

```
.genie/wishes/
├── <slug>/
│   ├── <slug>-wish.md          # Main wish document (spec contract)
│   ├── qa/                     # Evidence and artifacts (code wishes)
│   │   ├── group-a/            # Evidence for execution group A
│   │   ├── group-b/            # Evidence for execution group B
│   │   └── group-c/            # Evidence for execution group C
│   ├── validation/             # Evidence and artifacts (create wishes)
│   └── reports/                # Blockers, done reports, advisories
```

## Key Resources

- **Wish Template:** `.genie/product/templates/wish-template.md`
- **Wish Agent:** `.genie/agents/wish.md`
- **Wish Neuron:** `.genie/neurons/wish.md`
- **Amendment #1 (No Wish Without Issue):** `AGENTS.md` (Critical)
- **Orchestration Boundary Protocol:** `.genie/spells/orchestration-boundary-protocol.md`

---

**Last Updated:** 2025-11-11
