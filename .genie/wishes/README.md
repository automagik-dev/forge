# 🧞 Wishes Directory

This directory contains all **persistent wish documents** that guide feature implementation from planning through completion.

## What is a Wish?

A **wish** is:
- A structured specification document for planned work (code features, content, research)
- Persistent across agent sessions (stored in Genie database)
- Linked to GitHub issues (code wishes) or roadmap items (all wishes)
- Contains spec contracts, execution groups, evidence paths, and acceptance criteria
- Never deleted (archived for history preservation)

## Structure

Each wish lives in its own folder:

```
wishes/
├── progressive-tooltip-strategy/          # Slug: descriptive folder name
│   ├── progressive-tooltip-strategy-wish.md    # Main wish document (spec contract + execution groups)
│   ├── qa/                                # Code domain: evidence & artifacts
│   │   ├── group-a/                      # Evidence for execution group A
│   │   ├── group-b/                      # Evidence for execution group B
│   │   └── group-c/                      # Evidence for execution group C
│   ├── validation/                        # Create domain: validation evidence
│   └── reports/                          # Blockers, done reports, advisories
│
└── mobile-native-app/                    # Another wish example
    ├── mobile-native-app-wish.md
    ├── qa/
    └── reports/
```

## Key Files in This Directory

| File | Purpose |
|------|---------|
| `README.md` | This file - navigation guide |
| `progressive-tooltip-strategy/` | Wish folder for git operations UX enhancement |
| `mobile-native-app/` | Wish folder for mobile app feature |

## Current Active Wishes

### 1. Progressive Disclosure Tooltips for Git Operations
**Folder:** `progressive-tooltip-strategy/`
**Document:** `progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md`
**GitHub Issue:** [#135](https://github.com/namastexlabs/automagik-forge/issues/135)
**Status:** ✅ Ready for Implementation

**Summary:** Enhance Git Operations UI with 4-level progressive disclosure tooltips (simple hover hints, detailed technical info, conflict warnings, status panels).

**Phases:**
- Phase 1: Core tooltips (all 3 buttons)
- Phase 2: Conflict detection & warnings
- Phase 3: First-time user help
- Phase 4: Translation coverage (21+ keys, 5 languages)
- Phase 5: Status panel (bonus)

### 2. Mobile Native App
**Folder:** `mobile-native-app/`
**Document:** `mobile-native-app/mobile-native-app-wish.md`
**GitHub Issue:** [#113](https://github.com/namastexlabs/automagik-forge/issues/113)
**Status:** In Progress

---

## Wish Lifecycle

```
Created → Ready → In Progress → Complete → Archived
  ↓                                          ↓
  • Spec created                      • Moved to history
  • Context analyzed                  • Search capability retained
  • Acceptance criteria defined       • Available for reference
```

## Quick Navigation

**Starting a New Wish:**
```bash
mcp__genie__run(agent="wish", prompt="Create wish for <feature>...")
```

**Finding a Specific Wish:**
1. Look in this directory for the folder name (slug)
2. Read the main wish document (`<slug>-wish.md`)
3. Find evidence in `qa/` (code) or `validation/` (create)
4. Check `reports/` for blockers or completion notes

**Understanding Wish Content:**

- **Context Ledger:** All referenced files, research, assumptions
- **Execution Groups:** Breakdown into A/B/C with specific deliverables
- **Spec Contract:** Scope, success metrics, external tasks, dependencies
- **Evidence Plan:** Testing strategy, validation commands, artifact storage
- **Design Decisions:** DEC-# entries explaining trade-offs
- **Status Log:** Timeline of updates and milestone completions

---

## Important Rules

### Amendment #1: No Wish Without Issue (Code Domain)
Every code wish **MUST** be linked to a GitHub issue. This creates a single source of truth.

**Process:**
1. Create GitHub issue with feature details
2. Get issue number (e.g., #135)
3. Create wish and reference issue in spec contract
4. Link wish branch to issue (git branch naming)

### Amendment #2: Evidence-Based Framework
Before modifying wish content, use ACE helpers:
- `genie helper embeddings` - Avoid duplicate learnings
- `genie helper count-tokens` - Measure impact
- Evidence must be recorded before committing

### Amendment #3: Orchestration Boundary
Once a wish is delegated to an executor:
- Master Genie **monitors only** (doesn't implement)
- Executor **owns implementation** (in their worktree)
- No duplicate work in main workspace

---

## Wish Anatomy (Code Domain Example)

```markdown
# WISH Title
**Status:** READY / IN PROGRESS / COMPLETE
**GitHub Issue:** #NNN
**Completion Score:** X/100

## Evaluation Matrix (100 Points)
- Discovery Phase (30 pts)
- Implementation Phase (40 pts)
- Verification Phase (30 pts)

## Context Ledger
| Source | Type | Summary | Routed To |

## Executive Summary
High-level overview of what we're building

## Current State
What exists today and what's broken

## Target State & Guardrails
Desired behavior and non-negotiables

## Execution Groups
### Group A – Task Name
- Surfaces: Files to modify
- Deliverables: What we build
- Evidence: Where results are stored

### Group B – Task Name
...

## Verification Plan
- Testing approach
- Validation commands (exact syntax)
- Evidence storage paths
- Branch strategy

## <spec_contract>
- **Scope:** What we're doing
- **Out of scope:** What we're not doing
- **Success metrics:** How we measure success
- **External tasks:** Blockers or dependencies
- **Dependencies:** Required libraries/services
</spec_contract>

## Blocker Protocol
Process if work is blocked

## Status Log
Timeline of key events

## Design Decisions (DEC-#)
Trade-offs and rationale

## Implementation Notes
Code patterns, examples, gotchas
```

---

## Resources

**Wish Templates & Guides:**
- `@.genie/product/templates/wish-template.md` - Template for new wishes
- `@.genie/agents/wish.md` - Universal wish architect agent
- `@.genie/neurons/wish.md` - Wish master orchestrator (persistent)
- `@.genie/spells/wish-lifecycle.md` - Lifecycle management patterns

**Framework Rules:**
- `@AGENTS.md` - Core amendments and rules (read Amendment #1, #2, #3)
- `@.genie/spells/orchestration-boundary-protocol.md` - Master/executor boundary

**Related:**
- Root `WISH.md` - Quick reference for active wishes
- Root `.genie/wish.md` - Wish index with links

---

## Folder Naming Convention

Use slugs (lowercase, hyphens):
- ✅ `progressive-tooltip-strategy` (clear, descriptive)
- ✅ `mobile-native-app` (semantic, follows project naming)
- ❌ `wish-123` (not descriptive)
- ❌ `feature_x` (use hyphens, not underscores)

---

## Questions?

1. **What's a wish?** → Read this file
2. **How do I create one?** → Use `mcp__genie__run(agent="wish", ...)`
3. **Where's the spec?** → Each wish folder has `<slug>-wish.md`
4. **What's my next step?** → Check `.genie/wish.md` for active wishes
5. **How do I implement?** → See Phase X in the wish document

---

**Last Updated:** 2025-11-11
**Framework Version:** Genie v2.5.16
