# Review Task: PR #39 (Claude - Type Safety)

@.genie/agents/specialists/qa.md
@.genie/wishes/genie-chat-widgets-wish.md

## Mission
QA review of PR #39 focusing on **TypeScript type safety and React code quality**.

## PR Context
- **URL**: https://github.com/namastexlabs/automagik-forge/pull/39
- **Branch**: `forge/49a4-genie-widget`
- **Commit**: `f6257ec5a84b30a60d1b61631319e7fe8c1c3fac`
- **Changes**: +3,523 / -1,799 (76 files)

## Focus Areas

### 1. TypeScript Quality (HIGH PRIORITY)
**Files**:
- @forge-overrides/frontend/src/components/genie-widgets/types.ts
- @forge-overrides/frontend/src/components/genie-widgets/*.tsx
- @forge-overrides/frontend/src/hooks/*.ts
- @forge-overrides/frontend/src/services/subGenieApi.ts
- @shared/types.ts

**Validate**:
- No `any` types (except documented)
- Proper React.FC typing
- Complete hook dependencies
- API return types match backend

**Commands**:
```bash
cd forge-overrides/frontend
pnpm exec tsc --noEmit 2>&1 | tee typescript-check.log
pnpm run lint 2>&1 | tee lint-check.log
```

### 2. React Best Practices (HIGH PRIORITY)
- useCallback/useMemo usage
- Event handler typing
- Conditional rendering safety
- Component prop interfaces

### 3. State Management (MEDIUM PRIORITY)
- Context provider typing
- Immutable state updates
- Hook return stability

## Evidence Storage
`.genie/wishes/genie-chat-widgets/qa/claude-review/`

## Done Report
Save to: `.genie/reports/done-qa-pr39-claude-<YYYYMMDDHHmm>.md`

Include:
- Findings matrix (Critical/High/Medium/Low)
- Code examples for issues
- Validated strengths
- Approval verdict

## Success Criteria
✅ TypeScript/ESLint pass
✅ All components typed
✅ Code examples for issues
✅ Clear verdict (APPROVED / WITH COMMENTS / CHANGES REQUESTED)
