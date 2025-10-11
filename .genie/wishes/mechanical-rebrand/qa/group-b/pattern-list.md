# Complete Pattern List for Bulletproof Rebrand

## All Patterns Replaced by Script

### Text Patterns
1. `Vibe Kanban` → `Automagik Forge`
2. `vibe-kanban` → `automagik-forge`
3. `vibe_kanban` → `automagik_forge`
4. `vibeKanban` → `automagikForge`
5. `VibeKanban` → `AutomagikForge`
6. `VIBE_KANBAN` → `AUTOMAGIK_FORGE`
7. `vibe kanban` → `automagik forge` (case-insensitive)

### Abbreviation Patterns
8. `\bVK\b` → `AF` (word boundaries)
9. `\bvk\b` → `af` (word boundaries)
10. `"vk"` → `"af"` (quoted)
11. `'vk'` → `'af'` (single quoted)
12. `vk_` → `af_` (prefix)
13. `VK_` → `AF_` (uppercase prefix)

### Package/Dependency Patterns
14. `"vibe-kanban"` → `"automagik-forge"` (package.json names)
15. `@vibe-kanban` → `@automagik-forge` (scoped packages)
16. `name = "vibe-kanban"` → `name = "automagik-forge"` (Cargo.toml)

### Special Cases
17. `ProjectDirs::from("ai", "bloop", "vibe-kanban")` → `ProjectDirs::from("ai", "bloop", "automagik-forge")` (assets.rs)
18. `vibe-kanban-web-companion` → `automagik-forge-web-companion` (companion package)

## Files Excluded from Processing
- Binary files (detected via `file` command)
- `.git` directories and git internal files
- Build artifacts in `target/`, `node_modules/`, `dist/`

## File Types Processed
- Rust: `*.rs`
- TypeScript/JavaScript: `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- Configuration: `*.json`, `*.toml`, `*.yml`, `*.yaml`
- Documentation: `*.md`, `*.txt`
- Web: `*.html`, `*.css`, `*.scss`
- Scripts: `*.sh`, `Dockerfile`
- Database: `*.sql`

## Current Known References (Before Script)
Count: 16 references across:
- `frontend/package.json` - companion package
- `frontend/tsconfig.json` - companion paths
- `frontend/README.md` - documentation
- `forge-overrides/frontend/src/main.tsx` - component import
- `forge-overrides/frontend/src/utils/companion-install-task.ts` - instructions
- `forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx` - comment
- `forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx` - comment
- `forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx` - comment
- `forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx` - comment

## Verification Strategy
Script MUST verify ZERO references remain using:
```bash
grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN" \
    upstream frontend forge-overrides 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" || true
```

## Success Criteria
- ✅ Script replaces ALL pattern variants
- ✅ Script FAILS (exit 1) if ANY reference remains
- ✅ Zero vibe-kanban references after execution
- ✅ Zero VK/vk abbreviations remain
- ✅ Application builds successfully (`cargo check -p forge-app`)
- ✅ Clear reporting of replacements made
