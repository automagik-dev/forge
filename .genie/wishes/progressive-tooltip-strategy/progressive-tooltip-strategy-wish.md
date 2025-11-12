# 🧞 PROGRESSIVE DISCLOSURE TOOLTIP STRATEGY WISH
**Status:** DRAFT
**Roadmap Item:** UX-ENHANCEMENT-001 – UI/UX Improvements for Git Operations
**Mission Link:** Automagik Forge - Human-AI Collaborative Development Platform
**Completion Score:** 0/100 (updated by `/review`)

## Evaluation Matrix (100 Points Total)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts)**
  - [ ] All relevant files/docs referenced with @ notation (4 pts)
  - [ ] Background persona outputs captured in context ledger (3 pts)
  - [ ] Assumptions (ASM-#), decisions (DEC-#), risks documented (3 pts)
- **Scope Clarity (10 pts)**
  - [ ] Clear current state and target state defined (3 pts)
  - [ ] Spec contract complete with success metrics (4 pts)
  - [ ] Out-of-scope explicitly stated (3 pts)
- **Evidence Planning (10 pts)**
  - [ ] Validation commands specified with exact syntax (4 pts)
  - [ ] Artifact storage paths defined (3 pts)
  - [ ] Approval checkpoints documented (3 pts)

### Implementation Phase (40 pts)
- **Code Quality (15 pts)**
  - [ ] Follows project standards (5 pts)
  - [ ] Minimal surface area changes, focused scope (5 pts)
  - [ ] Clean abstractions and patterns (5 pts)
- **Test Coverage (10 pts)**
  - [ ] Unit tests for new behavior (4 pts)
  - [ ] Integration tests for workflows (4 pts)
  - [ ] Evidence of test execution captured (2 pts)
- **Documentation (5 pts)**
  - [ ] Inline comments where complexity exists (2 pts)
  - [ ] Updated relevant external docs (2 pts)
  - [ ] Context preserved for maintainers (1 pt)
- **Execution Alignment (10 pts)**
  - [ ] Stayed within spec contract scope (4 pts)
  - [ ] No unapproved scope creep (3 pts)
  - [ ] Dependencies and sequencing honored (3 pts)

### Verification Phase (30 pts)
- **Validation Completeness (15 pts)**
  - [ ] All validation commands executed successfully (6 pts)
  - [ ] Artifacts captured at specified paths (5 pts)
  - [ ] Edge cases and error paths tested (4 pts)
- **Evidence Quality (10 pts)**
  - [ ] Command outputs (failures → fixes) logged (4 pts)
  - [ ] Screenshots/metrics captured where applicable (3 pts)
  - [ ] Before/after comparisons provided (3 pts)
- **Review Thoroughness (5 pts)**
  - [ ] Human approval obtained at checkpoints (2 pts)
  - [ ] All blockers resolved or documented (2 pts)
  - [ ] Status log updated with completion timestamp (1 pt)

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| User requirement | doc | Progressive disclosure tooltip strategy for Git operations | entire wish |
| `@frontend/src/components/tasks/Toolbar/GitOperations.tsx` | repo | Current Git operations implementation with basic tooltips | implementation |
| `@frontend/src/components/ui/tooltip.tsx` | repo | Radix UI tooltip component (200ms delay) | implementation |
| `@frontend/src/i18n/locales/en/tasks.json` | repo | Existing i18n structure for git operations | implementation |
| `@shared/types.ts` | repo | BranchStatus type definition with conflict detection | implementation |
| User design spec | doc | Three-level tooltip strategy: simple, detailed, contextual | design, implementation |

### Context Variants Considered
- Candidates: C1 (Info icon only), C2 (Hover hold), C3 (Progressive disclosure with info icon)
- Winner: C3 — reason: Balances beginner accessibility with power user needs without cluttering UI

## Discovery Summary
- **Primary analyst:** Human + AI collaboration
- **Key observations:**
  - Current GitOperations component has basic disabled state tooltips only
  - No progressive disclosure or contextual help for git operations
  - Existing i18n structure supports nested translation keys
  - Radix UI tooltip component already integrated with 200ms delay
  - BranchStatus type provides conflict detection data
  - User wants three-level tooltip strategy: simple (always), detailed (info icon), contextual (warnings)
- **Assumptions (ASM-#):**
  - ASM-1: Users need different levels of information based on expertise
  - ASM-2: Info icon pattern is familiar and discoverable
  - ASM-3: Conflict detection logic already exists in backend
  - ASM-4: Translation system supports nested objects for tooltip content
  - ASM-5: No new UI components needed (use existing Radix tooltip)
- **Open questions (Q-#):**
  - Q-1: Should we persist user preference for detailed vs simple tooltips?
  - Q-2: Should conflict detection be real-time or on-demand?
  - Q-3: Should we add first-time user onboarding tooltips?
- **Risks:**
  - RISK-1: Tooltip content may become too verbose and overwhelming
  - RISK-2: Info icon may clutter button UI on small screens
  - RISK-3: Translation maintenance burden increases with detailed content

## Executive Summary
Implement a progressive disclosure tooltip strategy for Git operations (Merge, Create PR/Push, Rebase) in the GitOperations component. The strategy provides three levels of information: (1) simple action-oriented tooltips for all users, (2) detailed technical explanations accessible via info icon for power users, and (3) contextual warnings when conflicts are detected. This enhances usability for beginners while providing depth for advanced users without cluttering the interface.

## Current State
- **What exists today:**
  - `@frontend/src/components/tasks/Toolbar/GitOperations.tsx` - Git operations toolbar with three buttons (Merge, PR/Push, Rebase)
  - Basic tooltips only show disabled state reasons (e.g., "Merge in progress", "No commits ahead")
  - No explanatory tooltips for enabled states
  - No progressive disclosure or contextual help
  - No conflict warnings in tooltips
  - Existing i18n structure at `@frontend/src/i18n/locales/*/tasks.json` with `git.states` and `git.errors` sections
  - Radix UI tooltip component at `@frontend/src/components/ui/tooltip.tsx` with 200ms delay
  - BranchStatus type in `@shared/types.ts` provides conflict detection data

- **Gaps/Pain points:**
  - Beginners don't understand what git operations do
  - No explanation of what happens when clicking buttons
  - No warning when conflicts are likely
  - Power users can't access technical details
  - Disabled state reasons are helpful but enabled state lacks context
  - No progressive disclosure - one-size-fits-all approach

## Target State & Guardrails
- **Desired behaviour:**
  - Three-level tooltip strategy:
    1. **Simple tooltips (Level 1):** Always shown on hover, 1-2 lines, action-oriented, beginner-friendly
    2. **Detailed tooltips (Level 2):** Accessible via info icon, multi-line with technical details, backend operations
    3. **Contextual warnings (Level 3):** Shown when conflicts detected, highlight affected files, suggest resolution
  - Info icon appears on buttons when not in loading state
  - Clicking info icon toggles detailed tooltip view
  - Conflict warnings use warning styling (border-warning, text-warning)
  - All tooltip content internationalized via i18n system
  - Tooltips remain accessible and keyboard-navigable
  - Mobile-responsive (info icon may be hidden on very small screens)

- **Non-negotiables:**
  - Must not break existing tooltip functionality
  - Must maintain accessibility standards (ARIA labels, keyboard navigation)
  - Must support all existing languages (en, es, ja, ko, pt-BR)
  - Must not add new dependencies
  - Must use existing Radix UI tooltip component
  - Must not impact performance (no expensive conflict detection)
  - Must follow existing code patterns and conventions
  - Simple tooltips must remain concise (≤2 lines)

## Execution Groups

### Group A – Tooltip Content Structure & i18n
- **Goal:** Define and implement comprehensive tooltip content structure in i18n files
- **Surfaces:**
  - `@frontend/src/i18n/locales/en/tasks.json` - English translations
  - `@frontend/src/i18n/locales/es/tasks.json` - Spanish translations
  - `@frontend/src/i18n/locales/ja/tasks.json` - Japanese translations
  - `@frontend/src/i18n/locales/ko/tasks.json` - Korean translations
  - `@frontend/src/i18n/locales/pt-BR/tasks.json` - Portuguese translations
- **Deliverables:**
  - Add `git.tooltips` section to tasks.json with nested structure:
    - `git.tooltips.merge.simple` - Simple tooltip for merge button
    - `git.tooltips.merge.title` - Detailed tooltip title
    - `git.tooltips.merge.description` - Detailed tooltip description
    - `git.tooltips.merge.technical` - Technical backend operation info
    - `git.tooltips.merge.conflictWarning` - Conflict warning message
  - Similar structure for `createPr`, `push`, and `rebase` operations
  - Maintain consistency across all 5 languages
  - Follow existing i18n patterns (use `{{count}}` for pluralization, `{{branch}}` for interpolation)
- **Evidence:** Store translation files in `qa/group-a/`, capture before/after diffs
- **Suggested personas:** `forge-coder`
- **External tracker:** N/A

### Group B – GitOperations Component Enhancement
- **Goal:** Implement progressive disclosure tooltip logic in GitOperations component
- **Surfaces:**
  - `@frontend/src/components/tasks/Toolbar/GitOperations.tsx` - Main component
  - `@frontend/src/components/ui/tooltip.tsx` - Tooltip component (verify capabilities)
- **Deliverables:**
  - Add state management for detailed tooltip toggle (useState for showDetailedTooltips)
  - Implement conflict detection logic using BranchStatus data
  - Create renderMergeButton() helper with three tooltip levels
  - Create renderPRButton() helper with three tooltip levels
  - Create renderRebaseButton() helper with three tooltip levels
  - Add Info icon from lucide-react to buttons (conditional rendering)
  - Implement info icon click handler (stopPropagation to prevent button click)
  - Add conditional tooltip content based on showDetailedTooltips state
  - Add conditional warning styling when conflicts detected
  - Ensure tooltips remain accessible (aria-label, keyboard navigation)
- **Evidence:** Store component diffs in `qa/group-b/`, capture screenshots of tooltip states
- **Suggested personas:** `forge-coder`
- **External tracker:** N/A

### Group C – Conflict Detection & Warning Logic
- **Goal:** Implement intelligent conflict detection and contextual warning tooltips
- **Surfaces:**
  - `@frontend/src/components/tasks/Toolbar/GitOperations.tsx` - Component logic
  - `@shared/types.ts` - BranchStatus type (verify conflict data availability)
- **Deliverables:**
  - Implement conflictsLikely useMemo hook analyzing BranchStatus
  - Detect when both local and remote have modified same files
  - Extract conflicted file names from BranchStatus.conflicted_files
  - Render warning icon (AlertTriangle) when conflicts likely
  - Apply warning styling (border-warning, text-warning) to button
  - Show detailed conflict warning in tooltip with affected file list
  - Ensure warning tooltips are prominent and actionable
- **Evidence:** Store conflict detection logic in `qa/group-c/`, capture screenshots of warning states
- **Suggested personas:** `forge-coder`
- **External tracker:** N/A

## Verification Plan
- **Testing approach:**
  - Manual testing of all three tooltip levels for each button
  - Test with different BranchStatus states (ahead, behind, conflicts, clean)
  - Test info icon click behavior (should not trigger button action)
  - Test keyboard navigation and accessibility
  - Test on different screen sizes (desktop, tablet, mobile)
  - Test with all 5 languages to ensure translations work
  - Visual regression testing for tooltip positioning and styling

- **Validation commands:**
  ```bash
  # Run frontend in dev mode
  cd frontend && npm run dev
  
  # Run linting
  npm run lint
  
  # Run type checking
  npm run typecheck
  
  # Build frontend to verify no build errors
  npm run build
  ```

- **Evidence storage:** 
  - Screenshots in `qa/screenshots/` showing all tooltip states
  - Screen recordings in `qa/recordings/` demonstrating tooltip interactions
  - Translation file diffs in `qa/translations/`
  - Component code diffs in `qa/components/`
  - Build output logs in `qa/build-logs/`

- **Branch strategy:** 
  - Create feature branch: `devin/progressive-tooltip-strategy`
  - Commit changes incrementally by execution group
  - Create PR with screenshots and demo video

### Evidence Checklist
- **Validation commands (exact):**
  - `cd frontend && npm run lint` - Must pass with no errors
  - `cd frontend && npm run typecheck` - Must pass with no errors
  - `cd frontend && npm run build` - Must complete successfully
  - Manual testing checklist (see qa/manual-testing-checklist.md)

- **Artefact paths (where evidence lives):**
  - `qa/screenshots/` - Visual evidence of tooltip states
  - `qa/recordings/` - Video demonstrations
  - `qa/translations/` - Translation file diffs
  - `qa/components/` - Component code diffs
  - `qa/build-logs/` - Build and lint output
  - `qa/manual-testing-checklist.md` - Testing checklist with results
  - `reports/` - Any blockers or issues encountered

- **Approval checkpoints (human sign-off required before work starts):**
  - Checkpoint 1: Review tooltip content structure and i18n keys (after Group A)
  - Checkpoint 2: Review component implementation and UI/UX (after Group B)
  - Checkpoint 3: Review conflict detection logic and warning behavior (after Group C)
  - Final checkpoint: Review complete implementation with all evidence

## <spec_contract>
- **Scope:**
  - Implement three-level progressive disclosure tooltip strategy for Git operations
  - Add simple tooltips (always shown) for Merge, Create PR/Push, and Rebase buttons
  - Add detailed tooltips (info icon) with technical explanations
  - Add contextual warning tooltips when conflicts are detected
  - Internationalize all tooltip content in 5 languages (en, es, ja, ko, pt-BR)
  - Maintain accessibility standards (ARIA, keyboard navigation)
  - Use existing Radix UI tooltip component
  - Follow existing code patterns and i18n structure

- **Out of scope:**
  - Persisting user preference for tooltip detail level (defer to future enhancement)
  - First-time user onboarding tooltips (defer to separate feature)
  - Real-time conflict detection (use existing BranchStatus data)
  - Adding new UI components or dependencies
  - Tooltips for other components beyond GitOperations
  - Automated testing (manual testing only for this iteration)
  - Tooltip animations beyond existing Radix defaults
  - Custom tooltip positioning logic
  - Tooltip content for disabled states (already exists)

- **Success metrics:**
  - All three buttons (Merge, PR/Push, Rebase) have simple tooltips
  - Info icon appears on all three buttons when enabled
  - Clicking info icon shows detailed tooltip without triggering button action
  - Conflict warnings appear when BranchStatus indicates conflicts
  - All tooltip content translated in 5 languages
  - No accessibility regressions (keyboard navigation works)
  - No TypeScript errors
  - No linting errors
  - Frontend builds successfully
  - Tooltips render correctly on desktop and mobile

- **External tasks:** N/A

- **Dependencies:**
  - Existing Radix UI tooltip component
  - Existing i18n system and translation files
  - Existing BranchStatus type and data
  - Existing lucide-react icon library (Info, AlertTriangle)
  - No new dependencies required

</spec_contract>

## Blocker Protocol
1. Pause work and create `reports/blocker-<slug>-<timestamp>.md` inside the wish folder describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after the wish status/log is updated.

## Status Log
- [2025-11-11 06:07Z] Wish created

## Design Decisions (DEC-#)
- **DEC-1:** Use info icon pattern for detailed tooltips (familiar, discoverable, doesn't clutter UI)
- **DEC-2:** Toggle detailed tooltips via click, not hover-hold (more reliable, works on mobile)
- **DEC-3:** Show conflict warnings automatically, not behind info icon (safety-critical information)
- **DEC-4:** Use existing BranchStatus.conflicted_files for conflict detection (no new backend logic)
- **DEC-5:** Apply warning styling to entire button when conflicts likely (more prominent)
- **DEC-6:** Keep simple tooltips to 1-2 lines maximum (avoid overwhelming beginners)
- **DEC-7:** Include backend operation details in detailed tooltips (helps power users understand)
- **DEC-8:** Use nested i18n structure (git.tooltips.merge.simple) for organization

## Implementation Notes
- **Pattern to follow:** Examine existing tooltip usage in GitOperations.tsx (lines 281-350)
- **Icon import:** `import { Info, AlertTriangle } from 'lucide-react'`
- **State management:** Use `useState` for `showDetailedTooltips` per button
- **Conflict detection:** Use `useMemo` to calculate `conflictsLikely` from BranchStatus
- **Tooltip content:** Use `useTranslation('tasks')` hook with `t('git.tooltips.merge.simple')`
- **Info icon styling:** `className="h-3 w-3 ml-1 opacity-50 hover:opacity-100 transition-opacity"`
- **Warning button styling:** `className="border-warning text-warning hover:bg-warning"`
- **Tooltip max width:** `className="max-w-xs"` for simple, `className="max-w-sm"` for detailed
- **Stop propagation:** `onClick={(e) => { e.stopPropagation(); setShowDetailedTooltips(true); }}`

## Detailed Tooltip Content Structure

### Merge Button Tooltips
**Simple (Level 1):**
- "Merge changes into target branch"

**Detailed (Level 2):**
- Title: "Merge and complete task"
- Description: "This will merge your changes from the task branch into the target branch. Your work will be integrated and the task can be marked as complete."
- Technical: "Backend: git merge operation"

**Contextual Warning (Level 3):**
- Title: "⚠️ Conflicts possible"
- Description: "Both you and the target branch have modified the same files. Manual conflict resolution may be required."
- Affected files: List from BranchStatus.conflicted_files

### Create PR / Push Button Tooltips
**Simple (Level 1):**
- "Create pull request" (when no PR exists)
- "Push changes to PR" (when PR exists)

**Detailed (Level 2):**
- Title: "Create pull request and share work"
- Description: "This will push your changes to the remote repository and create a pull request for team review."
- Steps: "1. Push to remote branch, 2. Create PR with task details, 3. Notify team"
- Technical: "Backend: git push + GitHub API"

**Contextual Warning (Level 3):**
- Title: "⚠️ Conflicts detected"
- Description: "Your changes conflict with the target branch. Resolve conflicts before creating PR."
- Affected files: List from BranchStatus.conflicted_files

### Rebase Button Tooltips
**Simple (Level 1):**
- "Rebase onto target branch"

**Detailed (Level 2):**
- Title: "Rebase and update with latest changes"
- Description: "This will rebase your task branch onto the latest target branch. Your commits will be replayed on top of the target branch's latest changes."
- Technical: "Backend: git fetch + git rebase"

**Contextual Warning (Level 3):**
- Title: "⚠️ Rebase may cause conflicts"
- Description: "The target branch has changes that may conflict with your work. You may need to resolve conflicts during rebase."
- Affected files: List from BranchStatus.conflicted_files

## Accessibility Considerations
- Maintain existing `aria-label` attributes on buttons
- Ensure info icon is keyboard accessible (tab navigation)
- Ensure tooltips are announced by screen readers
- Maintain existing tooltip keyboard shortcuts (Escape to close)
- Ensure sufficient color contrast for warning styling
- Test with keyboard-only navigation
- Test with screen reader (VoiceOver, NVDA, JAWS)

## Mobile Responsiveness
- Info icon may be hidden on very small screens (<640px) to prevent button overflow
- Use responsive max-width classes for tooltips
- Ensure touch targets are at least 44x44px
- Test tooltip positioning on mobile (may need side="top" instead of side="bottom")
- Consider using TooltipProvider with longer delay on mobile (300ms vs 200ms)

## Translation Guidelines
- Keep simple tooltips concise (≤10 words)
- Use active voice and imperative mood ("Merge changes" not "This will merge changes")
- Avoid technical jargon in simple tooltips
- Include technical details only in detailed tooltips
- Use consistent terminology across all tooltips
- Provide context for translators in comments
- Test all languages for text overflow and wrapping
- Ensure RTL languages (future) are considered in design

## Future Enhancements (Out of Scope)
- Persist user preference for tooltip detail level in localStorage
- Add first-time user onboarding tooltips with "Don't show again" option
- Add animated tooltip transitions beyond Radix defaults
- Add tooltip content for disabled states (already partially exists)
- Add tooltips for other components beyond GitOperations
- Add automated visual regression testing for tooltips
- Add real-time conflict detection with file watching
- Add tooltip analytics to track which tooltips are most helpful
- Add customizable tooltip positioning per user preference
- Add tooltip search/help system for discovering features
