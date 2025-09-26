
# /forge - Wish Breakdown & Task Creation

---
description: Analyze an approved wish, propose task groups, gather human approval, then create forge tasks via `forge-master`
---

[CONTEXT]
- Use after a wish is READY_FOR_EXECUTION and the human wants to spin up isolated forge tasks.
- Output includes a planning report and, once approved, calls to `forge-master` for each group.
- Every action is recorded in `genie/reports`; final chat response references task IDs and the report path.

[SUCCESS CRITERIA]
✅ Planning report saved to `genie/reports/forge-plan-<wish-slug>-<YYYYMMDDHHmm>.md` (UTC).
✅ Human explicitly approves grouping before any task creation.
✅ Exactly one forge task per approved group; branches reference the origin branch.
✅ Chat reply lists tasks, branch names, and links to the report.

[NEVER DO]
❌ Create forge tasks without human approval.
❌ Fragment work beyond the approved grouping.
❌ Omit dependency chains or agent responsibilities.
❌ Forget to capture the Death Testament path.

```
<task_breakdown>
1. [Discovery] Summarize wish goals, constraints, and existing progress.
2. [Planning] Propose logical task groups with agent and evidence expectations.
3. [Approval] Present plan; wait for human confirmation or revisions.
4. [Creation] Invoke `forge-master` once per approved group and record results.
</task_breakdown>
```

## Step 1 – Discovery
- Load `/genie/wishes/<slug>-wish.md`.
- Note status, scope, risks, and orchestration strategy.
- Identify natural groupings that map to single-agent execution.

## Step 2 – Plan Draft
- For each proposed group capture:
  - Name/slug (short kebab-case)
  - Scope of work
  - Primary agent (e.g., `hive-coder`, `hive-tests`)
  - Expected evidence (Death Testament references, tests, QA)
  - Dependencies
- Store the draft plan in `genie/reports/forge-plan-<wish-slug>-<timestamp>.md` under a “Planning” section.
- Share a concise summary in chat and ask for approval (Yes/No/Adjust).

## Step 3 – Approval Loop
- Update the plan report until the human explicitly approves.
- Record approval (time, initials) in the report before proceeding.

## Step 4 – Task Creation
For each approved group:
1. Prepare a `forge-master` prompt containing the wish summary, approved plan excerpt, group scope, agent, and dependencies.
2. Call `forge-master` once per group; capture task ID and branch name.
3. Append an “Execution” section to the report listing group, task ID, branch, and follow-up guidance for the assigned agent.
4. Do not push branches or modify git state.

## Step 5 – Final Response
Reply in chat with:
1. Numbered summary of groups and created task IDs (include branches).
2. `Death Testament: @genie/reports/forge-plan-<wish-slug>-<timestamp>.md` referencing the stored report.
3. Reminder that subagents must reference this report when delivering their Death Testaments.

## Helpful Planning Template
```markdown
## Planning Summary (example)
- Group A – Resolver foundation (agent: hive-coder)
  - Tasks: build resolver helper, wire config
  - Evidence: Death Testament from hive-coder + tests from hive-tests
  - Dependencies: none
- Group B – CLI integration (agent: hive-coder)
  - Depends on Group A
  - Evidence: CLI tests, README updates
- Group C – Regression testing (agent: hive-tests)
  - Depends on A and B
  - Evidence: pytest suite, QA checklist
```

Keep planning tight: a clear report, captured approval, and well-documented forge tasks keep the pipeline predictable and auditable.
