# Review Task: PR #39 (OpenCode - Security)

@.genie/agents/specialists/qa.md
@.genie/wishes/genie-chat-widgets-wish.md

## Mission
QA review of PR #39 focusing on **security, error handling, and best practices**.

## PR Context
- **URL**: https://github.com/namastexlabs/automagik-forge/pull/39
- **Branch**: `forge/49a4-genie-widget`
- **Commit**: `f6257ec5a84b30a60d1b61631319e7fe8c1c3fac`
- **Changes**: +3,523 / -1,799 (76 files)

## Focus Areas

### 1. Input Validation & Security (HIGH PRIORITY)
**Files**:
- @frontend/src/frontend/src/services/subGenieApi.ts
- @frontend/src/frontend/src/components/genie-widgets/SubGenieWidget.tsx
- @frontend/src/frontend/src/hooks/useSubGenieWidget.ts

**Validate**:
- User input sanitized before API calls
- No XSS vulnerabilities in chat display
- No injection risks in workflow execution
- API error responses handled securely (no sensitive data leaked)

**Commands**:
```bash
# Check for dangerous patterns
grep -r "innerHTML\|dangerouslySetInnerHTML" forge-overrides/frontend/src/

# Check input validation
grep -r "message.trim()\|validation" forge-overrides/frontend/src/

# Check error handling
grep -r "catch\|error" forge-overrides/frontend/src/services/
```

### 2. Error Boundary & Async Handling (HIGH PRIORITY)
**Validate**:
- All async functions have try/catch
- API errors don't crash UI
- Loading states prevent race conditions
- No unhandled promise rejections

### 3. State Mutation Safety (MEDIUM PRIORITY)
**Files**:
- @frontend/src/frontend/src/context/SubGenieContext.tsx
- @frontend/src/frontend/src/hooks/useSubGenieWidget.ts

**Validate**:
- State updates are immutable
- No direct state mutations
- Context updates don't leak data

### 4. Authentication & Authorization (MEDIUM PRIORITY)
**Validate**:
- API calls include proper headers
- No hardcoded credentials
- Token/session handling secure

## Evidence Storage
`.genie/wishes/genie-chat-widgets/qa/opencode-review/`

## Done Report
Save to: `.genie/reports/done-qa-pr39-opencode-<YYYYMMDDHHmm>.md`

Include:
- Security findings matrix
- Code examples of vulnerabilities
- Recommended fixes
- Approval verdict

## Success Criteria
✅ No XSS/injection vulnerabilities
✅ All async errors handled
✅ Input validation present
✅ Clear verdict (APPROVED / WITH COMMENTS / CHANGES REQUESTED)
