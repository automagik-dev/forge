# companion-install-task.ts - CORRECTED Decision

## Original Analysis
**Was:** KEEP in forge-overrides (Group B handles it)

## User Challenge
"Why keep it if Group B rebrand script will rename the entire upstream?"

## Answer
**You're absolutely right!** We should DELETE it.

## What VibeKanbanWebCompanion Actually Is

### The Package
- **npm package:** `vibe-kanban-web-companion@0.0.4`
- **Purpose:** Point-and-click edit functionality for web apps
- **Used by:** BOTH upstream AND forge (in main.tsx line 102)
- **GitHub:** https://github.com/BloopAI/vibe-kanban-web-companion
- **Not a Forge feature** - it's an upstream Vibe Kanban product feature

### The Template File
`companion-install-task.ts` provides **AI agent instructions** for installing the companion package.

**Used in:** `NoServerContent.tsx` (lines 128-129) when showing setup instructions

**Current text differences:**
```diff
- "Install and integrate Vibe Kanban Web Companion"
+ "Install and integrate Automagik Omni Companion"

- "vibe-kanban-web-companion"
+ "web companion"
```

## The Logic Flow

### Group B Rebrand Script
Group B will create a mechanical rebrand script that:
```bash
# Replaces ALL text patterns
find upstream -type f -exec sed -i 's/Vibe Kanban/Automagik Forge/g' {} \;
```

This will automatically change:
- "Vibe Kanban Web Companion" → "Automagik Forge Web Companion"
- In companion-install-task.ts
- In NoServerContent.tsx
- Everywhere else

### Why forge-override is Unnecessary
1. ✅ Group B script handles text replacement automatically
2. ✅ No functional difference - just branding text
3. ✅ Keeping override adds maintenance burden
4. ✅ If upstream changes the template, forge-override would be stale

## Corrected Decision

### ❌ Do NOT keep in forge-overrides
**Previous reasoning was flawed:** "Group B will handle it" meant we should DELETE it, not KEEP it!

### ✅ DELETE from forge-overrides
**Correct reasoning:**
- Group B mechanical rebrand handles ALL text patterns
- No need for manual override
- Reduces maintenance burden
- Upstream template + rebrand script = correct result

## Updated Categorization

**Previous:** KEEP (11 files)
**Correct:** DELETE (add to 14 → 15 files)

**Updated counts:**
- DELETE: 15 files (was 14)
- KEEP: 10 files (was 11)
- Frontend reduction: 60% (was 56%)

## For Cleanup Script

Add to cleanup.sh:
```bash
rm -fv forge-overrides/frontend/src/utils/companion-install-task.ts
```

Update FEATURE_FILES verification:
```bash
# Remove from verification list (not a feature)
```

## Summary

- ✅ Delete companion-install-task.ts override
- ✅ Group B rebrand script handles text replacement
- ✅ No manual upstream migration needed
- ✅ Cleaner separation: features vs mechanical rebrand

**User was 100% correct - I was overthinking it!**
