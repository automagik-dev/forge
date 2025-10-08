# 🧞 Mechanical Rebrand System WISH
**Status:** DRAFT
**Roadmap Item:** INFRA-001 – Maintenance Simplification
**Mission Link:** @.genie/product/mission.md §Pitch
**Standards:** @.genie/standards/best-practices.md §Core Principles
**Completion Score:** 0/100

## Evaluation Matrix (100 Points Total)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts)**
  - [ ] All branding patterns identified (4 pts)
  - [ ] Upstream merge workflow documented (3 pts)
  - [ ] Current pain points quantified (3 pts)
- **Scope Clarity (10 pts)**
  - [ ] Clear separation: one-time cleanup vs recurring rebrand (3 pts)
  - [ ] Dynamic replacement strategy defined (4 pts)
  - [ ] Success metrics established (3 pts)
- **Evidence Planning (10 pts)**
  - [ ] Test upstream merge scenario (4 pts)
  - [ ] Verification commands specified (3 pts)
  - [ ] Before/after metrics defined (3 pts)

### Implementation Phase (40 pts)
- **Code Quality (15 pts)**
  - [ ] Script handles all text patterns dynamically (5 pts)
  - [ ] Clean, maintainable bash/sed/perl code (5 pts)
  - [ ] Efficient file processing (5 pts)
- **Test Coverage (10 pts)**
  - [ ] Script tested on real upstream merge (4 pts)
  - [ ] All file types verified (4 pts)
  - [ ] Build verification included (2 pts)
- **Documentation (5 pts)**
  - [ ] Script usage documented (2 pts)
  - [ ] Workflow in README (2 pts)
  - [ ] Pattern list maintained (1 pt)
- **Execution Alignment (10 pts)**
  - [ ] One-time cleanup completed (4 pts)
  - [ ] Recurring script ready (3 pts)
  - [ ] Process automated (3 pts)

### Verification Phase (30 pts)
- **Validation Completeness (15 pts)**
  - [ ] Zero vibe-kanban references remain (6 pts)
  - [ ] Application builds successfully (5 pts)
  - [ ] All tests pass (4 pts)
- **Evidence Quality (10 pts)**
  - [ ] Replacement count logged (4 pts)
  - [ ] Build output captured (3 pts)
  - [ ] Timing metrics recorded (3 pts)
- **Review Thoroughness (5 pts)**
  - [ ] Redundant overrides identified (2 pts)
  - [ ] Cleanup recommendations documented (2 pts)
  - [ ] Process finalized (1 pt)

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Current analysis | discovery | 344+ files with vibe-kanban references | script patterns |
| upstream/crates/utils/src/assets.rs:10 | critical | Hardcoded folder name | primary target |
| forge-overrides/* | analysis | Many files only differ in branding | cleanup list |

## Discovery Summary
- **Primary analyst:** Human + GENIE
- **Key observations:**
  - Upstream submodule gets regular updates with vibe-kanban branding
  - Current overlay system creates maintenance burden
  - Need dynamic pattern matching for evolving codebase
- **Assumptions (ASM):**
  - ASM-1: Upstream structure remains similar across versions
  - ASM-2: Text patterns sufficient (no binary patching needed)
  - ASM-3: Mechanical replacement is deterministic
- **Risks:**
  - Pattern matching might miss new naming conventions
  - File locations might change between versions

## Executive Summary
Create a mechanical rebranding system that automatically converts all vibe-kanban references to automagik-forge after each upstream merge, eliminating manual overlay maintenance.

## Current State
- **What exists today:** Complex overlay system with forge-overrides maintaining branded versions
- **Gaps/Pain points:** Weeks of maintenance per upstream merge, 344+ files need updating

## Target State & Guardrails
- **Desired behaviour:** Single script execution after upstream pull converts entire codebase
- **Non-negotiables:** Must be idempotent, must verify build success, must handle dynamic locations

## Execution Groups

### Group A – One-Time Cleanup
- **Goal:** Identify and remove redundant forge-overrides
- **Surfaces:** All forge-overrides/* files
- **Deliverables:** List of files to delete, cleanup script
- **Evidence:** Before/after file count, size reduction metrics

### Group B – Mechanical Rebrand Script
- **Goal:** Create robust replacement script for recurring use
- **Surfaces:** `scripts/rebrand.sh`
- **Deliverables:** Script that handles all patterns dynamically
- **Evidence:** Replacement counts, build success, zero remaining references

### Group C – Process Documentation
- **Goal:** Document new workflow for upstream merges
- **Surfaces:** README.md, .github/workflows/
- **Deliverables:** Clear process, optional GitHub Action
- **Evidence:** Successful test merge with new process

## Verification Plan
- Run script on current codebase
- Pull latest upstream and test
- Verify zero vibe-kanban references: `grep -r "vibe-kanban" upstream frontend`
- Verify build: `cargo build -p forge-app && cd frontend && npm run build`

### Evidence Checklist
- **Validation commands (exact):**
  ```bash
  grep -r "vibe-kanban\|Vibe Kanban" upstream frontend | wc -l  # Should be 0
  cargo check --workspace  # Should pass
  cd frontend && npm run check  # Should pass
  ```
- **Artifact paths:** `.genie/wishes/mechanical-rebrand/metrics.txt`
- **Approval checkpoints:** After script test, before cleanup execution

## <spec_contract>
- **Scope:**
  - One-time: Identify redundant forge-overrides
  - Recurring: Script to rebrand after each upstream pull
- **Out of scope:**
  - Binary patching
  - Automated upstream pulls
  - Git commit automation
- **Success metrics:**
  - Zero manual intervention after upstream merge
  - < 1 minute execution time
  - 100% pattern coverage
- **Dependencies:** bash, sed, grep, find

</spec_contract>

## Blocker Protocol
1. If patterns change significantly, update script
2. If build fails after rebrand, identify new patterns
3. Document any manual fixes needed

## Status Log
- [2024-01-08 08:00Z] Wish created
- [2024-01-08 08:01Z] Script v1 created