# Mechanical Rebrand Architecture - Planning Brief

## Discovery Highlights

### Current Pain Points
- **Complex overlay system**: forge-extensions, forge-overrides, forge-overrides-backup creating maintenance burden
- **Upstream merge conflicts**: Every vibe-kanban upstream merge requires manual overlay reconciliation
- **Scattered branding**: 344+ files contain vibe-kanban references across Rust and TypeScript
- **Folder hardcoding**: Asset directory hardcoded in `upstream/crates/utils/src/assets.rs:10`

### Architecture Analysis
- **upstream/**: READ-ONLY submodule from vibe-kanban (which itself merges from its upstream)
- **forge-overrides/**: 20+ custom frontend components just for branding/UI tweaks
- **forge-extensions/**: Omni, config features (the actual value-add)
- **Binary size**: 542MB debug binary carrying all this complexity

## Proposed Solution: Mechanical Rebranding

### Core Concept
Instead of complex overlays, use a **single mechanical script** that:
1. Runs after each upstream merge
2. Replaces ALL branding in-place
3. Makes automagik-forge purely about extra features

### Script Architecture (`scripts/rebrand-mechanical.sh`)
```
Phase 1: Backup
  → tar backup of current state

Phase 2: Text Replacements
  → vibe-kanban → automagik-forge (all variants)
  → VK → AF abbreviations
  → All case permutations

Phase 3: Cleanup Analysis
  → Identify redundant forge-overrides
  → Remove branding-only overrides

Phase 4: Verification
  → cargo check
  → npm type check
  → Report remaining references
```

### What Can Be Eliminated

**Immediately removable:**
- forge-overrides files that only differ in branding
- Complex build overlays for frontend
- Duplicate logo/branding components

**Potentially removable after script stabilizes:**
- Most of forge-overrides/frontend/src/components/
- forge-overrides-backup/
- Custom main.tsx if only branding

**Keep and focus on:**
- forge-extensions/omni/ (real feature)
- forge-extensions/config/ (real feature)
- forge-app/ (composition layer)

## Benefits

### Immediate
- ✅ Upstream merges become trivial: `git submodule update && ./scripts/rebrand-mechanical.sh`
- ✅ No more overlay maintenance
- ✅ Single source of truth for branding
- ✅ 50%+ reduction in custom code

### Long-term
- ✅ Focus purely on feature development
- ✅ Cleaner git history
- ✅ Easier onboarding for contributors
- ✅ Predictable maintenance burden

## Migration Path

### Phase 1: Script Development (DONE)
- [x] Create comprehensive mechanical rebranding script
- [x] Handle all text patterns and case variants
- [x] Include verification and rollback

### Phase 2: Testing
- [ ] Run script on current codebase
- [ ] Verify application still builds/runs
- [ ] Test with real upstream merge

### Phase 3: Cleanup
- [ ] Remove redundant forge-overrides
- [ ] Consolidate remaining custom code
- [ ] Update documentation

### Phase 4: Process
- [ ] Document new workflow in README
- [ ] Create GitHub Action for automated rebranding
- [ ] Archive unnecessary complexity

## Risks & Mitigation

### Risk 1: Script misses edge cases
- **Mitigation**: Comprehensive patterns, backup before each run
- **Validation**: Count remaining references, build verification

### Risk 2: Binary string replacement issues
- **Mitigation**: Only replace text files, skip binaries
- **Validation**: File type detection before replacement

### Risk 3: Breaking functional code
- **Mitigation**: Automated testing after rebrand
- **Validation**: cargo check + npm check in script

## Implementation Complexity: SMALL (4 hours)

The mechanical script is complete and ready to test. This approach will dramatically simplify the maintenance burden.

## Next Actions

1. **Test the script**: `chmod +x scripts/rebrand-mechanical.sh && ./scripts/rebrand-mechanical.sh`
2. **Review changes**: `git diff --stat`
3. **Verify build**: `cargo build -p forge-app && cd frontend && npm run build`
4. **Clean redundant files**: Remove forge-overrides that only had branding
5. **Document new workflow**: Update README with new merge process

## Success Criteria

- ✅ Zero vibe-kanban references after script run
- ✅ Application builds and runs correctly
- ✅ 50%+ reduction in forge-overrides code
- ✅ Upstream merge + rebrand takes < 5 minutes