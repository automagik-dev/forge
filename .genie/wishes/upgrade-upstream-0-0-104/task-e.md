# Task E: Full Integration Testing

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** qa
**Effort:** M
**Priority:** HIGH

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

---

## Discovery

### Objective
End-to-end integration testing of upgraded v0.0.105 system.

---

## Implementation

### Test Sequence

1. **Initialize submodules:**
   ```bash
   git submodule update --init --recursive
   ```

2. **Start dev environment:**
   ```bash
   pnpm run dev
   ```

3. **Manual QA Checklist:**
   - [ ] Dev environment starts without errors
   - [ ] Can create project
   - [ ] Copilot executor selectable in settings
   - [ ] Can run task with Copilot
   - [ ] Omni modal opens and responds
   - [ ] Can create PR from task attempt
   - [ ] hjkl shortcuts navigate tasks
   - [ ] Sound plays on task completion
   - [ ] Discord widget shows online count (guild: 1095114867012292758)
   - [ ] Forge docs/support links work
   - [ ] No console errors

---

## Verification

### Success Criteria
- [ ] All QA checklist items pass
- [ ] Screenshots captured (navbar, settings, task page)
- [ ] Console log clean

### Evidence
- QA checklist: `.genie/wishes/upgrade-upstream-0-0-104/evidence/e-qa-checklist.md`
- Screenshots: `.genie/wishes/upgrade-upstream-0-0-104/evidence/e-screenshots/`
- Console log: `.genie/wishes/upgrade-upstream-0-0-104/evidence/e-console.txt`
