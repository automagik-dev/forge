# Done Report: self-learn-background-monitoring-202510030555

## Scope
- Violation type: ORCHESTRATION_COMPLIANCE (severity: HIGH)
- Trigger: Response ended immediately after dispatching a background specialist, leaving the session unmonitored.
- Impacted assets: `@AGENTS.md`, `@.genie/agents/README.md`, `@.genie/agents/plan.md`

## Working Tasks
- [x] Analyze violation evidence
- [x] Create/update learning entry in AGENTS.md
- [x] Update affected agent prompts
- [x] Verify propagation with git diff
- [ ] Monitor next execution (follow-up needed)

## Learning Entry Created
```xml
<entry date="2025-10-03" violation_type="ORCHESTRATION_COMPLIANCE" severity="HIGH">
  <trigger>Ended a response immediately after launching a background specialist, leaving the session unmonitored.</trigger>
  <correction>Keep orchestration active whenever background MCP sessions are running:
  - Capture the `sessionId` returned by `mcp__genie__run`.
  - Poll `mcp__genie__list_sessions` or `mcp__genie__view --full` inside a shell loop with `sleep` intervals until the session status resolves.
  - Stream status updates into the conversation and resume orchestration steps as soon as results arrive.
  - End the response only after every delegated background session finishes or when human approval is required.</correction>
  <validation>During the next orchestration, launch a background specialist and document the `sleep`-based polling loop that checks `mcp__genie__list_sessions` until the session concludes before ending the response; attach the loop transcript to the Done Report.</validation>
</entry>
```

## Files Updated
- `@AGENTS.md:501` – Added ORCHESTRATION_COMPLIANCE learning entry.
- `@.genie/agents/README.md:244` – Documented monitoring loop pattern with example commands and guardrails.
- `@.genie/agents/plan.md:201` – Embedded background session monitoring protocol into planning workflow.

## Validation Evidence
- `git diff -- AGENTS.md`
- `git diff -- .genie/agents/README.md`
- `git diff -- .genie/agents/plan.md`

## Propagation Checklist
- [x] AGENTS.md updated with learning entry
- [x] Affected agent prompts reference the new rule
- [x] Validation steps documented in relevant sections
- [ ] Follow-up monitoring plan defined

## Monitoring Plan
- Observe the next orchestration run that launches a background specialist; capture the polling loop transcript in its Done Report.
- If any session still ends without an active monitoring loop, escalate with additional corrective guidance.
