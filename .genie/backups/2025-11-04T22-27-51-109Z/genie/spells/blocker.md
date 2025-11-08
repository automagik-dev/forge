---
name: Blocker Protocol
description: Log blockers timestamped in wishes, wait for guidance before resuming
genie:
  executor: [CLAUDE_CODE, CODEX, OPENCODE]
forge:
  CLAUDE_CODE:
    model: sonnet
  CODEX: {}
  OPENCODE: {}
---

# Blocker Protocol

**When encountering blockers:**

1. Log the blocker directly in the wish (timestamped entry with findings and status).
2. Update the wish status log and notify stakeholders.
3. Resume only after guidance is updated.
