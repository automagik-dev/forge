@AGENTS.md

## CRITICAL: Frontend File Editing Rules

**NEVER edit files in `/upstream/frontend/` - this is the upstream submodule and must not be modified directly.**

**ALWAYS edit files in `/frontend/` - this is the Forge-specific frontend overlay.**

When making frontend changes:
- ✅ Edit `/frontend/src/components/tasks/TaskCard.tsx`
- ❌ NEVER edit `/upstream/frontend/src/components/tasks/TaskCard.tsx`

The Forge architecture uses an overlay pattern where local files in `/frontend/` override upstream files.
