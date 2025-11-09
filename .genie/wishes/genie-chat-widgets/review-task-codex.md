# Review Task: PR #39 (Codex - Architecture)

@.genie/agents/specialists/qa.md
@.genie/wishes/genie-chat-widgets-wish.md

## Mission
QA review of PR #39 focusing on **system architecture and backend integration**.

## PR Context
- **URL**: https://github.com/namastexlabs/automagik-forge/pull/39
- **Branch**: `forge/49a4-genie-widget`
- **Commit**: `f6257ec5a84b30a60d1b61631319e7fe8c1c3fac`
- **Changes**: +3,523 / -1,799 (76 files)

## Focus Areas

### 1. Backend Integration (HIGH PRIORITY)
**Files**:
- @frontend/src/services/subGenieApi.ts
- @frontend/src/hooks/useAgentTasks.ts
- @shared/types.ts
- forge-app/migrations/ (database migrations for task status)

**Validate**:
- API endpoints match backend (`/api/tasks`, `/api/task-attempts`)
- Executor variant system (wish/forge/review) correct
- TaskStatus enum includes "agent"
- Variant parsing logic (`"claude_code:wish"` → `"wish"`)

**Commands**:
```bash
# Check backend migration
cat forge-app/migrations/20251020000001_add_agent_task_status.sql

# Verify shared types
grep "TaskStatus" shared/types.ts

# Test API integration logic
grep -r "executeWorkflow\|getAgentTasks" forge-overrides/frontend/src/
```

### 2. Task Filtering Logic (HIGH PRIORITY)
**Files**:
- @frontend/src/hooks/useFilteredTasks.ts
- @frontend/src/hooks/useAgentTasks.ts
- @frontend/src/utils/taskStatusMapping.ts

**Validate**:
- Agent tasks (`status="agent"`) filtered from main Kanban
- Widget tasks filtered by variant correctly
- No tasks shown in wrong widget

### 3. Component Architecture (MEDIUM PRIORITY)
**Files**:
- @frontend/src/components/genie-widgets/
- @frontend/src/context/SubGenieContext.tsx
- @frontend/src/config/genie-configs.ts

**Validate**:
- State management pattern sound
- Component composition logical
- Data flow unidirectional
- No prop drilling issues

## Evidence Storage
`.genie/wishes/genie-chat-widgets/qa/codex-review/`

## Done Report
Save to: `.genie/reports/done-qa-pr39-codex-<YYYYMMDDHHmm>.md`

Include:
- Architecture diagram (if issues found)
- Data flow analysis
- Integration test scenarios
- Approval verdict

## Success Criteria
✅ Backend API calls correct
✅ Variant system works as designed
✅ Task filtering logic sound
✅ Clear verdict (APPROVED / WITH COMMENTS / CHANGES REQUESTED)
