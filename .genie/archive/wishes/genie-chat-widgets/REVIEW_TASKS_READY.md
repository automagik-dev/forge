# ✅ PR #39 Review Tasks Created - Ready to Execute!

**Created**: 2025-10-24
**PR**: https://github.com/namastexlabs/automagik-forge/pull/39
**Branch**: `forge/49a4-genie-widget`
**Commit**: `f6257ec5a84b30a60d1b61631319e7fe8c1c3fac`

---

## Overview

Created **3 parallel QA review tasks** for PR #39, each using a different LLM executor to provide diverse perspectives on the Genie Chat Widgets implementation.

---

## Task Files Created

### 1. Claude Sonnet - Type Safety & Code Quality ✅
**File**: `.genie/wishes/genie-chat-widgets/review-task-claude.md`
**Executor**: `CLAUDE_CODE`
**Focus**: TypeScript quality, React best practices, type safety
**Duration**: ~70 minutes

**Key Validation**:
- TypeScript compilation (`pnpm exec tsc --noEmit`)
- ESLint validation
- React.FC typing
- Hook dependencies
- Component prop interfaces

**Deliverable**: `.genie/reports/done-qa-pr39-claude-<timestamp>.md`

---

### 2. Codex - Architecture & Integration ✅
**File**: `.genie/wishes/genie-chat-widgets/review-task-codex.md`
**Executor**: `CODEX`
**Focus**: System architecture, backend integration, data flow
**Duration**: ~70 minutes

**Key Validation**:
- Backend API integration
- Executor variant system (wish/forge/review)
- Task filtering logic (status="agent")
- State management patterns
- Component architecture

**Deliverable**: `.genie/reports/done-qa-pr39-codex-<timestamp>.md`

---

### 3. OpenCode - Security & Best Practices ✅
**File**: `.genie/wishes/genie-chat-widgets/review-task-opencode.md`
**Executor**: `OPENCODE`
**Focus**: Security vulnerabilities, error handling, best practices
**Duration**: ~70 minutes

**Key Validation**:
- Input validation/sanitization
- XSS/injection prevention
- Async error handling
- State mutation safety
- API authentication

**Deliverable**: `.genie/reports/done-qa-pr39-opencode-<timestamp>.md`

---

## How to Execute

### Option 1: Use Forge MCP (Recommended)

Execute all 3 reviews in parallel using the Forge MCP API:

```bash
# Task 1: Claude Review
forge create-task \
  --title "PR #39 Review (Claude - Type Safety)" \
  --description "$(cat .genie/wishes/genie-chat-widgets/review-task-claude.md)" \
  --executor CLAUDE_CODE

# Task 2: Codex Review
forge create-task \
  --title "PR #39 Review (Codex - Architecture)" \
  --description "$(cat .genie/wishes/genie-chat-widgets/review-task-codex.md)" \
  --executor CODEX

# Task 3: OpenCode Review
forge create-task \
  --title "PR #39 Review (OpenCode - Security)" \
  --description "$(cat .genie/wishes/genie-chat-widgets/review-task-opencode.md)" \
  --executor OPENCODE
```

### Option 2: Use Genie MCP

```bash
# Using mcp__genie__run
mcp__genie__run(
  agent="specialists/qa",
  prompt="@.genie/wishes/genie-chat-widgets/review-task-claude.md",
  name="pr39-claude-review"
)

mcp__genie__run(
  agent="specialists/qa",
  prompt="@.genie/wishes/genie-chat-widgets/review-task-codex.md",
  name="pr39-codex-review"
)

mcp__genie__run(
  agent="specialists/qa",
  prompt="@.genie/wishes/genie-chat-widgets/review-task-opencode.md",
  name="pr39-opencode-review"
)
```

### Option 3: Manual Execution

Copy-paste task contents into individual chat sessions with each executor.

---

## Expected Outputs

### Done Reports (3 files)
Each review produces a comprehensive Done Report in `.genie/reports/`:

1. `done-qa-pr39-claude-<YYYYMMDDHHmm>.md`
   - TypeScript/React findings
   - Code quality matrix
   - Type safety recommendations

2. `done-qa-pr39-codex-<YYYYMMDDHHmm>.md`
   - Architecture analysis
   - Integration validation
   - Data flow review

3. `done-qa-pr39-opencode-<YYYYMMDDHHmm>.md`
   - Security findings
   - Error handling review
   - Best practices audit

### Evidence Files
Each review stores evidence in `.genie/wishes/genie-chat-widgets/qa/<executor>-review/`:

**Claude**:
- `typescript-check.log`
- `lint-check.log`
- `type-issues.md`
- `react-issues.md`

**Codex**:
- `architecture-diagram.md`
- `integration-analysis.md`
- `data-flow.md`

**OpenCode**:
- `security-findings.md`
- `error-handling-review.md`
- `input-validation.md`

---

## Success Criteria

### Per-Review Success
✅ **Claude**: TypeScript/ESLint pass, all components typed, code examples provided
✅ **Codex**: Backend integration correct, variant system validated, architecture sound
✅ **OpenCode**: No XSS/injection risks, async errors handled, input validated

### Overall Success
✅ All 3 reviews complete within 24 hours
✅ Each produces comprehensive Done Report
✅ Findings categorized (Critical/High/Medium/Low)
✅ Code examples for all issues
✅ Final consensus verdict reached

---

## Consensus Verdict Process

After all 3 reviews complete:

1. **Collect verdicts** from each Done Report
2. **Synthesize findings**:
   - Critical issues (any executor) → MUST FIX
   - High issues (2+ executors agree) → SHOULD FIX
   - Medium/Low → NICE TO HAVE
3. **Final decision**:
   - **APPROVED**: No critical/high issues
   - **APPROVED WITH COMMENTS**: Minor issues, can merge
   - **CHANGES REQUESTED**: Critical/high issues must be addressed

---

## Task Summary Matrix

| Task | Executor | Focus | Priority Areas | Duration | Status |
|------|----------|-------|----------------|----------|--------|
| **Claude** | CLAUDE_CODE | Type Safety & Code Quality | TypeScript, React, hooks | ~70 min | ⏳ Ready |
| **Codex** | CODEX | Architecture & Integration | Backend API, data flow | ~70 min | ⏳ Ready |
| **OpenCode** | OPENCODE | Security & Best Practices | Input validation, error handling | ~70 min | ⏳ Ready |

---

## Next Steps

1. **Execute all 3 tasks** (use Option 1 or 2 above)
2. **Monitor progress** via Forge MCP dashboard or Genie sessions
3. **Wait for completion** (~2-3 hours for all 3 in parallel)
4. **Review Done Reports** in `.genie/reports/`
5. **Synthesize consensus verdict**
6. **Address findings** if needed
7. **Merge PR** when approved

---

## Files Reference

**Task Files**:
- `.genie/wishes/genie-chat-widgets/review-task-claude.md` ✅
- `.genie/wishes/genie-chat-widgets/review-task-codex.md` ✅
- `.genie/wishes/genie-chat-widgets/review-task-opencode.md` ✅
- `.genie/wishes/genie-chat-widgets/review-tasks-summary.md` ✅
- `.genie/wishes/genie-chat-widgets/REVIEW_TASKS_READY.md` (this file) ✅

**Context Files**:
- `.genie/agents/specialists/qa.md` (QA specialist prompt)
- `.genie/wishes/genie-chat-widgets-wish.md` (Original wish)

**PR Context**:
- https://github.com/namastexlabs/automagik-forge/pull/39

---

## 🚀 Ready to Execute!

All 3 review tasks are created and ready. Execute in parallel for fastest results, or sequentially if preferred.

**Recommended**: Use Forge MCP Option 1 for parallel execution with proper task tracking! 🎯
