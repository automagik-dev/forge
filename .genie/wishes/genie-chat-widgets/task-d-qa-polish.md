# Task D: QA, Polish & Final Validation

**Phase**: 4 of 4
**Agent**: `specialists/qa`, `specialists/polish`
**Status**: 🔴 Pending
**Created**: 2025-10-23

---

## Overview

Final quality assurance, polish, and validation. This phase ensures all components work together seamlessly, meets accessibility standards, performs well, and is ready for production.

---

## Discovery

### What We've Built (Tasks A-C)
1. **Task A**: Component library (ColumnHeader, SubGenieWidget, WorkflowButton, SkillToggle)
2. **Task B**: State management (Context, hooks, API service, configurations)
3. **Task C**: Kanban board integration with column renaming and task filtering

### What Needs QA
- Component rendering and interaction
- State management correctness
- API integration (mock and real)
- Accessibility (keyboard, screen reader)
- Performance (rendering speed, memory leaks)
- Cross-browser compatibility
- Responsive design
- Code quality (linting, type checking, formatting)

---

## Phase 1: Code Quality & Linting

### Step 1: Run Full TypeScript Check
```bash
pnpm --filter frontend-forge exec tsc --noEmit
```

**Expected**: Zero errors

**Evidence**:
- [ ] TypeScript compilation log (pass/fail)
- [ ] Number of errors: ___

### Step 2: Run ESLint
```bash
pnpm --filter frontend-forge run lint
```

**Expected**: Zero violations

**Evidence**:
- [ ] ESLint report
- [ ] Rules violated (if any): ___

### Step 3: Run Prettier (Format Check)
```bash
pnpm --filter frontend-forge run format:check
```

**Expected**: All files properly formatted

**Evidence**:
- [ ] Prettier check report
- [ ] Files needing formatting: ___

### Remediation
If any issues found:
- Run `pnpm --filter frontend-forge run format` to auto-fix
- Update code to resolve linting violations
- Re-run checks until passing

---

## Phase 2: Unit & Component Tests

### Step 4: Run Component Tests
**File**: `frontend-forge/src/components/genie-widgets/__tests__/` (CREATE if needed)

Create tests for:
- ColumnHeader (renders icon, labels, task count)
- SubGenieWidget (open/close, send message, click workflows, toggle skills)
- WorkflowButton (renders label, icon, loading state)
- SkillToggle (renders, toggles state, shows tooltip)

```bash
pnpm --filter frontend-forge run test
```

**Expected**: All tests pass, >80% coverage

**Evidence**:
- [ ] Test execution log
- [ ] Coverage report (attach screenshot)
- [ ] Number of tests: ___
- [ ] Pass rate: ___%

### Step 5: Test State Management
Test the SubGenieContext and useSubGenieWidget hook:
- Verify widget state toggles correctly
- Verify message history adds correctly
- Verify skills toggle correctly
- Verify no memory leaks on unmount

**Evidence**:
- [ ] Context tests pass
- [ ] Hook tests pass
- [ ] Memory leak check (passed/failed)

---

## Phase 3: Integration Testing

### Step 6: Manual Integration Testing

#### Scenario 1: Open Chat Widget
1. Load Kanban board
2. Click Sparkles (Wish) icon
3. Verify widget opens
4. Verify widget displays chat box, workflows, skills
5. Click widget close button
6. Verify widget closes

**Evidence**:
- [ ] Video/screenshots of interaction
- [ ] Result (pass/fail)

#### Scenario 2: Send Message to Sub-Genie
1. Open Wish widget
2. Type: "Can you refine this task?"
3. Click Send
4. Verify message appears in chat history
5. Verify response from Wishh appears (mock or real)
6. Verify no errors in console

**Evidence**:
- [ ] Screenshot of chat interaction
- [ ] Browser console (no errors)
- [ ] Result (pass/fail)

#### Scenario 3: Click Workflow Button
1. Open Forge widget
2. Click "Start Build" workflow
3. Verify loading state appears
4. Verify workflow result appears in chat
5. Verify no errors in console

**Evidence**:
- [ ] Screenshots of workflow execution
- [ ] Result (pass/fail)

#### Scenario 4: Toggle Skill
1. Open Review widget
2. Click "Express Review" skill toggle
3. Verify skill toggles on (visual feedback)
4. Verify message appears in chat
5. Click again to toggle off
6. Verify skill toggles off

**Evidence**:
- [ ] Screenshots of skill toggle
- [ ] Result (pass/fail)

#### Scenario 5: Verify Agent Tasks Hidden
1. Load Kanban board
2. Inspect task count in each column
3. Verify count doesn't include agent tasks
4. Open browser DevTools → Network → API calls
5. Verify `/api/tasks` returns filtered tasks (no `status: "agent"`)

**Evidence**:
- [ ] Screenshot of Kanban task counts
- [ ] API response showing filtered tasks
- [ ] Result (pass/fail)

#### Scenario 6: Responsive Design
1. Open Kanban board on desktop (1920x1080)
2. Verify layout is readable
3. Verify widgets don't overflow
4. Open on tablet (768px)
5. Verify layout adjusts appropriately
6. Verify text is readable

**Evidence**:
- [ ] Screenshots (desktop, tablet)
- [ ] Result (pass/fail)

---

## Phase 4: Accessibility Testing

### Step 7: Keyboard Navigation
1. Load Kanban board
2. Use Tab key to navigate
3. Verify focus visible on all interactive elements
4. Verify Enter key opens/closes widgets
5. Verify Space key toggles skills
6. Verify Escape key closes widgets

**Evidence**:
- [ ] Keyboard navigation log
- [ ] Result (pass/fail)

### Step 8: Screen Reader Testing
Use a screen reader (NVDA, JAWS, or VoiceOver):
1. Load Kanban board
2. Verify column headers are announced with icon description
3. Verify chat messages are announced with sender
4. Verify buttons have descriptive labels
5. Verify form inputs have labels
6. Verify all interactive elements are announced

**Expected**: Screen reader can navigate all elements

**Evidence**:
- [ ] Screen reader test log
- [ ] Result (pass/fail)

### Step 9: Color Contrast
Use a contrast checker tool:
1. Verify text color contrast (WCAG AA: 4.5:1 for normal text)
2. Check button colors (especially disabled state)
3. Check icons on colored backgrounds
4. Verify status indicators are not color-only

**Evidence**:
- [ ] Contrast check report
- [ ] WCAG level achieved (A / AA / AAA)
- [ ] Result (pass/fail)

---

## Phase 5: Browser Compatibility

### Step 10: Cross-Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Checklist per browser**:
- [ ] All components render correctly
- [ ] Widgets open/close
- [ ] Chat sends messages
- [ ] Workflows trigger
- [ ] Skills toggle
- [ ] No console errors
- [ ] Icons display correctly
- [ ] Animations smooth

**Evidence**:
- [ ] Screenshots from each browser
- [ ] Test matrix (browser x feature)

---

## Phase 6: Performance Testing

### Step 11: Bundle Size Check
```bash
pnpm --filter frontend-forge run build
```

Check the built bundle size:
- [ ] Main bundle size: ___ KB
- [ ] Genie widgets bundle size: ___ KB
- [ ] No unexpected bloat

### Step 12: Runtime Performance
1. Open Kanban board
2. Open DevTools → Performance tab
3. Record interaction: click widget, send message, trigger workflow
4. Analyze performance metrics:
   - First Contentful Paint (FCP): < 1.5s ✓
   - Largest Contentful Paint (LCP): < 2.5s ✓
   - Cumulative Layout Shift (CLS): < 0.1 ✓
   - Time to Interactive (TTI): < 3.5s ✓

**Evidence**:
- [ ] Performance timeline screenshot
- [ ] Metrics summary

### Step 13: Memory Leak Check
1. Open Kanban board
2. Open DevTools → Memory tab
3. Take heap snapshot (baseline)
4. Open/close widgets 20 times
5. Trigger workflows 10 times
6. Take second heap snapshot
7. Verify memory doesn't grow unbounded

**Evidence**:
- [ ] Heap snapshot comparison
- [ ] Result (no leaks detected / leaks found)

---

## Phase 7: Code Polish

### Step 14: Clean Up Comments & Docs
- [ ] All temporary console.logs removed
- [ ] Comments updated and clear
- [ ] JSDoc comments added to functions
- [ ] Type definitions are well-documented

### Step 15: Code Review
- [ ] Review all new files for:
  - Naming consistency (camelCase, PascalCase)
  - Function size (< 30 lines ideally)
  - Proper error handling
  - No duplicated code
  - Clear variable names

### Step 16: Storybook Polish
If using Storybook:
- [ ] All component stories up-to-date
- [ ] Stories show all component states
- [ ] Stories include controls for props
- [ ] Stories have descriptions
- [ ] Stories render without errors

---

## Phase 8: Documentation

### Step 17: Create Component README
**File**: `frontend-forge/src/components/genie-widgets/README.md`

```markdown
# Genie Chat Widgets

Components for integrating AI agent orchestrators (Wishh, Forge, Review) into the Kanban board.

## Components

### ColumnHeader
Renders column header with icon and task count.

**Props**: See `ColumnHeader.tsx` for full interface.

### SubGenieWidget
Main chat widget with workflows and skills.

**Usage**:
\`\`\`tsx
import { SubGenieWidget } from '@/components/genie-widgets';

<SubGenieWidget
  config={GENIE_CONFIGS.wishh}
  isOpen={isOpen}
  onClose={handleClose}
  // ... other props
/>
\`\`\`

### WorkflowButton
Renders a workflow action button.

### SkillToggle
Renders a skill toggle with tooltip.

## Hooks

### useSubGenie
Access sub-genie context (widget state, actions).

### useSubGenieWidget
Custom hook for widget state and handlers.

## Configuration

See `config/genie-configs.ts` for workflow and skill definitions.

## Testing

Run tests with:
\`\`\`bash
pnpm --filter frontend-forge run test
\`\`\`
```

### Step 18: Update Main README
Update `frontend-forge/README.md` to mention:
- Genie Chat Widgets feature
- How to interact with widgets
- Configuration locations

---

## Validation Checklist

### Code Quality
- [ ] TypeScript compilation: PASS
- [ ] ESLint: PASS
- [ ] Prettier: PASS
- [ ] Tests: PASS (>80% coverage)

### Functionality
- [ ] Chat widget opens/closes
- [ ] Messages send and display
- [ ] Workflows trigger
- [ ] Skills toggle
- [ ] Agent tasks filtered out
- [ ] Task counts accurate

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast WCAG AA
- [ ] Focus visible
- [ ] All inputs labeled

### Browser Support
- [ ] Chrome: PASS
- [ ] Firefox: PASS
- [ ] Safari: PASS
- [ ] Edge: PASS

### Performance
- [ ] Bundle size acceptable
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] No memory leaks
- [ ] Smooth animations

### Documentation
- [ ] Component README created
- [ ] Main README updated
- [ ] Code comments clear
- [ ] JSDoc added

---

## Evidence Storage

All evidence should be stored in:
`.genie/wishes/genie-chat-widgets/qa/`

**File structure**:
```
qa/
├── code-quality/
│   ├── typescript.log
│   ├── eslint.log
│   └── prettier.log
├── unit-tests/
│   ├── test-results.json
│   └── coverage-report.html
├── integration-tests/
│   ├── scenario-1-screenshots/
│   ├── scenario-2-console.log
│   └── ...
├── accessibility/
│   ├── keyboard-test.log
│   ├── screen-reader-test.log
│   └── contrast-check.pdf
├── performance/
│   ├── bundle-analysis.json
│   ├── performance-timeline.png
│   └── memory-heap.json
└── final-report.md
```

---

## Final Validation Report

**Assignee**: Create `.genie/wishes/genie-chat-widgets/qa/final-report.md`

```markdown
# Genie Chat Widgets - Final Validation Report

**Date**: [DATE]
**Tester**: [NAME]
**Status**: ✅ READY FOR PRODUCTION / ❌ BLOCKERS FOUND

## Summary
[Brief overview of testing results]

## Code Quality
- TypeScript: PASS ✅
- ESLint: PASS ✅
- Prettier: PASS ✅
- Tests: PASS ✅ (Coverage: XX%)

## Functionality Testing
[Results for each scenario]

## Accessibility
- Keyboard: PASS ✅
- Screen Reader: PASS ✅
- Contrast: PASS ✅ (WCAG AA)

## Browser Support
[Results for each browser]

## Performance
- Bundle Size: XX KB ✅
- FCP: XX ms ✅
- LCP: XX ms ✅
- Memory: No leaks ✅

## Known Issues
[List any known issues and mitigation plans]

## Recommendations
[Any suggestions for future improvements]

## Sign-Off
- QA: [SIGNATURE]
- Tech Lead: [SIGNATURE]

---
Genie Chat Widgets feature is production-ready.
```

---

## Next Steps

1. **Address Any Blockers**: If any issues found, create sub-tasks or bugs
2. **Deploy to Staging**: Run feature on staging environment
3. **User Acceptance Testing**: Have product team validate
4. **Release**: Merge to main and deploy to production
5. **Monitor**: Watch for bugs and performance issues post-release

---

## Success Criteria (100 Points)

### Code Quality (15 pts)
- [ ] TypeScript passes (5 pts)
- [ ] ESLint passes (5 pts)
- [ ] Prettier passes (5 pts)

### Testing (20 pts)
- [ ] Unit tests pass (10 pts)
- [ ] Integration tests pass (10 pts)

### Functionality (25 pts)
- [ ] Chat widget works (5 pts)
- [ ] Workflows trigger (5 pts)
- [ ] Skills toggle (5 pts)
- [ ] Agent tasks filtered (5 pts)
- [ ] Layout doesn't break (5 pts)

### Accessibility (15 pts)
- [ ] Keyboard navigation (5 pts)
- [ ] Screen reader compatible (5 pts)
- [ ] Color contrast (5 pts)

### Browser Support (10 pts)
- [ ] Chrome (3 pts)
- [ ] Firefox (3 pts)
- [ ] Safari + Edge (4 pts)

### Performance (10 pts)
- [ ] Bundle size acceptable (3 pts)
- [ ] Runtime performance good (4 pts)
- [ ] No memory leaks (3 pts)

### Documentation (5 pts)
- [ ] READMEs updated (5 pts)

**Total: 100 pts**

