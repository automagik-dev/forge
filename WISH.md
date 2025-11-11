# 🧞 WISH: Implement Progressive Disclosure for Git Operations Tooltips

**Status:** ✅ READY FOR IMPLEMENTATION
**GitHub Issue:** [#135](https://github.com/namastexlabs/automagik-forge/issues/135)
**Full Spec:** `.genie/wishes/progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md`
**Complexity:** Medium (~2-3 sprints)
**Priority:** High (UX improvement, reduces support questions)

---

## 🎯 Executive Summary

Enhance Git Operations UI (Merge, PR, Rebase buttons) with **progressive disclosure tooltips** and contextual descriptions. Users get simple, action-oriented hints on hover, with option to expand for technical details, conflict warnings, and status panels.

### What This Solves
- ❌ Users don't understand what git operations do
- ❌ No explanation of side effects or consequences
- ❌ No warning when conflicts are likely
- ❌ No progressive disclosure for different user expertise levels
- ✅ **Solution:** 4-level tooltip system tailored to user needs

### The 4 Levels of Progressive Disclosure

| Level | Audience | Trigger | Content | Example |
|-------|----------|---------|---------|---------|
| **Level 1** | Everyone | Hover | Simple 1-line action | "Merge changes into target branch" |
| **Level 2** | Power users | Click info icon | Multi-line technical details | Steps, side effects, git commands |
| **Level 3** | Risk detection | Automatic | Conflict warnings | List of modified files, resolution tips |
| **Level 4** | Power users | Expand panel | Complete git status | Branch names, commits ahead/behind, next action |

---

## 📋 Implementation Roadmap

### Phase 1: Core Tooltips ✅ Ready to Start
**Goal:** Simple + Detailed tooltips for all 3 buttons

- [ ] Add `showDetailedTooltips` state to GitOperations component
- [ ] Implement info icon (from lucide-react)
- [ ] Create simple tooltip content for Merge button
- [ ] Create detailed tooltip content for Merge button
- [ ] Repeat for PR and Rebase buttons
- [ ] Add translation keys to `en/tasks.json`
- [ ] Verify no TypeScript errors

**Files:** `GitOperations.tsx`, `en/tasks.json`

### Phase 2: Conflict Detection 🔄 Next
**Goal:** Detect conflicts and show warnings

- [ ] Implement `conflictsLikely` useMemo calculation
- [ ] Extract modified files from BranchStatus
- [ ] Add warning icon and styling when conflicts detected
- [ ] Show detailed conflict warning in tooltip
- [ ] List affected files in warning message

**Files:** `GitOperations.tsx`

### Phase 3: First-Time User Help 🔄 Next
**Goal:** Help new users understand git operations

- [ ] Create first-time user alerts
- [ ] Store preference in localStorage (per button type)
- [ ] Show help alert on first attempt
- [ ] Add "Don't show again" button
- [ ] Test with fresh browser session

**Files:** `GitOperations.tsx`, `tasks.json`

### Phase 4: Translation Coverage 🔄 Next
**Goal:** 100% translation coverage

- [ ] Add 9 disabled button reason keys (all 5 languages)
- [ ] Add 12+ tooltip content keys (all 5 languages)
- [ ] Add 4 conflict warning keys (all 5 languages)
- [ ] Total: 21+ keys × 5 languages = 105+ translations
- [ ] Test all languages for text overflow
- [ ] Verify no broken key references

**Files:** `en/tasks.json`, `pt-BR/tasks.json`, `es/tasks.json`, `ja/tasks.json`, `ko/tasks.json`

### Phase 5: Status Panel (Optional Bonus) ⭐
**Goal:** Power users can see detailed git status

- [ ] Create collapsible "View detailed sync status" section
- [ ] Show current branch name
- [ ] Show target branch name
- [ ] Show commits ahead/behind counts
- [ ] Show remote status
- [ ] Show suggested next action
- [ ] Make it toggle-able without expanding tooltips

**Files:** `GitOperations.tsx`, `tasks.json`

---

## 🎯 Acceptance Criteria

### Phase 1: Core Tooltips
- [ ] All 3 buttons have simple tooltips on hover
- [ ] Info icon appears on all 3 buttons (when not loading)
- [ ] Clicking info icon shows detailed tooltip
- [ ] Info icon does NOT trigger button action (uses stopPropagation)
- [ ] Detailed tooltips show multi-line content
- [ ] Technical backend info in detailed tooltips
- [ ] No TypeScript errors after changes

### Phase 2: Conflict Detection
- [ ] Conflict detection identifies modified files
- [ ] Conflict warning banner appears when needed
- [ ] Modified files listed in warning
- [ ] Button changes color/icon (⚠️) when conflicts likely
- [ ] Conflict warning styling applied (border-warning, text-warning)

### Phase 3: First-Time User Help
- [ ] Help alert shown on first Merge attempt
- [ ] Help alert shown on first PR attempt
- [ ] Help alert shown on first Rebase attempt
- [ ] Alert explains what operation does
- [ ] "Don't show again" button works
- [ ] Preference stored in localStorage
- [ ] Test with fresh browser session

### Phase 4: Translations
- [ ] All 9 disabled button reasons translated (5 languages)
- [ ] All 12+ tooltip keys present in all languages
- [ ] No hard-coded strings in GitActionsDialog
- [ ] No hard-coded strings in CreatePRDialog
- [ ] All tooltips render without text overflow
- [ ] Verified in en, pt-BR, es, ja, ko

### Phase 5: Status Panel (Bonus)
- [ ] Collapsible section below buttons
- [ ] Shows branch names and commit counts
- [ ] Shows suggested next action
- [ ] Accessible without expanding tooltips
- [ ] Optional (not blocking completion)

---

## 📐 Technical Details

### Components to Update
1. **GitOperations.tsx** (555 lines)
   - Add `showDetailedTooltips` state
   - Add `conflictsLikely` useMemo calculation
   - Add info icon to 3 buttons
   - Add conditional tooltip content
   - Add warning styling logic

2. **GitActionsDialog.tsx** (250+ lines)
   - Translate 3-4 hard-coded strings
   - Add contextual help for merge conflicts

3. **CreatePRDialog.tsx**
   - Add progressive disclosure tooltips
   - Translate dialog descriptions

### Translation Files to Update
- `frontend/public/locales/en/tasks.json` (add 21+ keys)
- `frontend/public/locales/pt-BR/tasks.json`
- `frontend/public/locales/es/tasks.json`
- `frontend/public/locales/ja/tasks.json`
- `frontend/public/locales/ko/tasks.json`

### Dependencies (All Available)
- ✅ `@radix-ui/react-tooltip` (already imported)
- ✅ `lucide-react` (Info, AlertTriangle icons)
- ✅ i18n with 5 language support
- ✅ TypeScript with proper typing
- ❌ NO new dependencies needed

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Hover over each button → simple tooltip appears
- [ ] Click info icon → detailed tooltip appears
- [ ] Detailed tooltip shows multi-line content
- [ ] Info icon click doesn't trigger button action
- [ ] Clicking button (not icon) works normally
- [ ] Conflict warning appears when conflicts exist
- [ ] Warning button styling visible
- [ ] Warning lists affected files correctly
- [ ] First-time help alert shows (fresh session)
- [ ] "Don't show again" works
- [ ] All 5 languages display correctly
- [ ] Tooltips responsive on mobile
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Build completes successfully

### Visual Testing
- Tooltip positioning (no overflow)
- Icon visibility and hover states
- Color changes for conflict warnings
- Responsive behavior on mobile (<640px)
- Text overflow in all languages

---

## 📦 Deliverables

1. ✅ **Enhanced GitOperations.tsx** with 2-level tooltips
2. ✅ **Translated disabled button reasons** (all 5 languages)
3. ✅ **Conflict detection & warning UI**
4. ✅ **First-time user help alerts**
5. ✅ **Updated translation files** (21+ keys)
6. ✅ **Full test coverage** (manual checklist)
7. ✅ **No breaking changes** (backward compatible)

---

## 🔍 Context & References

### GitHub Issue
[Issue #135: Implement Progressive Disclosure for Git Operations Tooltips & Descriptions](https://github.com/namastexlabs/automagik-forge/issues/135)

### Full Specification
See `.genie/wishes/progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md` for:
- Complete acceptance criteria (100-point evaluation matrix)
- Context ledger with all file references
- Execution groups A, B, C with specific deliverables
- Verification plan with exact validation commands
- Design decisions with rationale
- Accessibility considerations
- Translation guidelines
- Future enhancements (out of scope)

### Related Files
- **Component:** `frontend/src/components/git-operations/GitOperations.tsx`
- **Tooltip UI:** `frontend/src/components/ui/tooltip.tsx`
- **Types:** `frontend/src/shared/types.ts`
- **Translation Base:** `frontend/public/locales/en/tasks.json`

### Key Implementation Notes

**Pattern to Follow:**
```tsx
// 1. Add state for detailed tooltips
const [showDetailedTooltips, setShowDetailedTooltips] = useState(false);

// 2. Calculate conflicts with useMemo
const conflictsLikely = useMemo(() => {
  // Logic to detect conflicts from branchStatus
}, [branchStatus]);

// 3. Render with conditional tooltips
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>
        🔄 Merge
        <Info className="h-3 w-3" onClick={(e) => {
          e.stopPropagation();
          setShowDetailedTooltips(true);
        }} />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {showDetailedTooltips ? <DetailedContent /> : <SimpleContent />}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Translation Structure:**
```json
{
  "git": {
    "tooltips": {
      "merge": {
        "simple": "Merge changes into target branch",
        "title": "Merge and complete task",
        "description": "...",
        "technical": "Backend: git merge"
      }
    }
  }
}
```

---

## 🚀 Next Steps

1. **Review** this wish document
2. **Create feature branch:** `git checkout -b feature/git-ops-tooltips`
3. **Start Phase 1:** Implement core tooltips
4. **Test frequently:** Use manual checklist
5. **Commit regularly:** One commit per acceptance criterion
6. **Create PR** when Phase 1 complete
7. **Get review** before moving to Phase 2

---

## 📞 Questions?

Refer to:
- **Full spec:** `.genie/wishes/progressive-tooltip-strategy/progressive-tooltip-strategy-wish.md`
- **GitHub issue:** #135
- **Code patterns:** Existing tooltips in GitOperations.tsx (lines 281-350)
- **Translation patterns:** Existing keys in `tasks.json`

---

**Status:** ✅ Ready for implementation
**Created:** 2025-11-11
**Updated:** 2025-11-11
