# PR #39 Review Tasks - 3 LLM Perspectives

Created: 2025-10-24
PR: https://github.com/namastexlabs/automagik-forge/pull/39
Branch: `forge/49a4-genie-widget`
Commit: `f6257ec5a84b30a60d1b61631319e7fe8c1c3fac`

## Overview

Three parallel QA reviews of the Genie Chat Widgets PR, each focusing on different aspects using different LLM executors.

## Task 1: Claude Sonnet - Code Quality & Type Safety
**Focus**: TypeScript quality, React best practices, type safety
**Executor**: CLAUDE_CODE
**Duration**: ~70 minutes

**Key Validation Areas**:
- TypeScript compilation (`pnpm exec tsc --noEmit`)
- ESLint validation (`pnpm run lint`)
- React.FC typing and hook dependencies
- API type alignment with backend
- Component prop interfaces

**Deliverable**: `.genie/reports/done-qa-pr39-claude-<timestamp>.md`

---

## Task 2: Codex - Architecture & Integration
**Focus**: System architecture, backend integration, data flow
**Executor**: CODEX
**Duration**: ~70 minutes

**Key Validation Areas**:
- Backend API integration correctness
- Executor variant system (wish/forge/review)
- Task filtering logic (status="agent")
- State management patterns
- Component architecture and composition

**Deliverable**: `.genie/reports/done-qa-pr39-codex-<timestamp>.md`

---

## Task 3: OpenCode - Security & Best Practices
**Focus**: Security vulnerabilities, best practices, error handling
**Executor**: OPENCODE
**Duration**: ~70 minutes

**Key Validation Areas**:
- Input validation and sanitization
- Error boundary implementation
- XSS/injection prevention
- Async error handling
- API authentication/authorization
- State mutation safety

**Deliverable**: `.genie/reports/done-qa-pr39-opencode-<timestamp>.md`

---

## Execution Strategy

**Run in parallel** using Forge MCP:
1. Create 3 separate task attempts
2. Each uses different executor (CLAUDE_CODE, CODEX, OPENCODE)
3. All reference same PR and wish context
4. Each produces independent Done Report
5. Synthesize findings after all complete

**Success Criteria**:
- All 3 reviews complete within 24 hours
- Each produces comprehensive Done Report
- Findings categorized (Critical/High/Medium/Low)
- Actionable recommendations with code examples
- Final consensus verdict: APPROVED / APPROVED WITH COMMENTS / CHANGES REQUESTED
