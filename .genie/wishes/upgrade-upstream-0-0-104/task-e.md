# Task E: Full Integration Testing

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Group:** E - Integration testing
**Tracker:** `upgrade-upstream-0-0-104-task-e`
**Persona:** qa
**Branch:** `feat/genie-framework-migration` (existing)
**Effort:** M

---

## Scope

Perform end-to-end integration testing of upgraded system: executors, Omni, PR workflow, UI, keyboard shortcuts.

## Context

**Testing Scope:**
- All 8 executors (esp. Copilot)
- Omni features (Forge-specific)
- PR creation workflow
- Discord widget integration
- Forge UI customizations
- Keyboard shortcuts (hjkl)

## Inputs

- @.genie/wishes/upgrade-upstream-0-0-104-wish.md - QA checklist
- Deployed system (frontend + backend running)

## Deliverables

1. **QA Checklist Completion:**
   - All items from wish verified
   - Screenshots captured
   - Console logs clean

2. **Executor Testing:**
   - Test each of 8 executors
   - Focus on Copilot (new)
   - Create test task, run to completion

3. **Omni Testing:**
   - Open Omni modal
   - Send test prompts
   - Verify responses
   - Check settings persistence

4. **PR Workflow Testing:**
   - Create test task attempt
   - Generate PR
   - Verify GitHub integration

5. **UI/UX Testing:**
   - Discord widget shows online count
   - Forge docs/support links work
   - Keyboard shortcuts functional
   - Sound notifications play

## Task Breakdown

```
<task_breakdown>
1. [Discovery]
   - Review QA checklist from wish
   - Prepare test scenarios
   - Set up test project

2. [Implementation]
   - Start full dev environment: pnpm run dev
   - Create test project
   - Test each executor systematically
   - Test Omni features
   - Test PR creation workflow
   - Test UI elements (navbar, settings, etc.)
   - Test keyboard shortcuts
   - Capture screenshots and logs

3. [Verification]
   - Complete QA checklist
   - Review console for errors
   - Compare with baseline screenshots
   - Document any issues found
</task_breakdown>
```

## QA Checklist

```markdown
- [ ] Dev environment starts without errors
- [ ] Can create project
- [ ] Copilot executor selectable in settings
- [ ] Can run task with Copilot
- [ ] Can run task with other executors (test 2-3)
- [ ] Omni modal opens
- [ ] Omni prompts receive responses
- [ ] Omni settings persist
- [ ] Can create PR from task attempt
- [ ] PR links to correct repo (namastexlabs/automagik-forge)
- [ ] hjkl shortcuts navigate tasks
- [ ] Sound plays on task completion
- [ ] Discord widget shows online count (guild 1095114867012292758)
- [ ] Forge docs link works (forge.automag.ik)
- [ ] Forge support link works (namastexlabs/automagik-forge/issues)
- [ ] No console errors in browser
- [ ] No backend errors in logs
```

## Validation

```bash
# Start dev environment
pnpm run dev  # (manual testing follows)

# Check for console errors
# Open browser DevTools Console
# Look for: ❌ errors, ⚠️ warnings

# Test Discord widget
# Open navbar, verify online count displays

# Test executors
# Settings → General → Executor dropdown
# Verify all 8 present, select Copilot

# Test Omni
# Open Omni modal
# Send: "Test prompt"
# Verify response received

# Test PR workflow
# Create task, run to completion
# Click "Create PR"
# Verify PR created on GitHub
```

## Success Criteria

✅ All QA checklist items pass
✅ No console errors
✅ All executors functional
✅ Copilot executor works
✅ Omni features operational
✅ PR workflow completes
✅ Discord widget displays correctly
✅ Forge branding/links correct
✅ Keyboard shortcuts work

## Never Do

❌ Skip any checklist items
❌ Ignore console errors
❌ Proceed if Omni broken
❌ Accept PR links to wrong repo

## Dependencies

- Task D (backend validation must pass)

## Evidence

Store in: `.genie/wishes/upgrade-upstream-0-0-104/qa/task-e/`

- `qa-checklist-completed.md`
- `screenshots/navbar-discord.png`
- `screenshots/settings-omni.png`
- `screenshots/executors-dropdown.png`
- `screenshots/pr-created.png`
- `console-log.txt`
- `backend-log.txt`
- `test-scenarios.md`

## Follow-ups

- If issues found: Create bug reports, may need C-task fixes
- After all tests pass: Proceed to Task F (regression testing)
