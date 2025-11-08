---
name: Parallel Execution Framework
description: Run independent tasks in parallel, maintain visibility into all threads
genie:
  executor: [CLAUDE_CODE, CODEX, OPENCODE]
forge:
  CLAUDE_CODE:
    model: sonnet
  CODEX: {}
  OPENCODE: {}
---

# Parallel Execution Framework

**Purpose:** Manage parallel work without losing clarity.

**Success criteria:**
✅ Run tasks in parallel only when independent.
✅ Summaries capture status of each thread; human has visibility into all threads.
