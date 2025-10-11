# /wish-review – Wish Completion Audit

---
description: Execute an end-to-end review loop for a wish, combining test execution, Death Testament aggregation, and scoring.
---

[CONTEXT]
- Designed for branches where multiple forge tasks have landed and the wish is nearing closure.
- Runs a standardized audit so humans can iterate until the wish earns a 100/100 readiness score.
- Operates outside the sandbox: command may trigger UV tests, diff inspection, and report generation.

[SUCCESS CRITERIA]
✅ Parses the wish file for status, success criteria, and linked artefacts.
✅ Aggregates latest commits plus Death Testament references into the audit report.
✅ Executes each `--tests` command (default set provided below) via `uv run …` and captures pass/fail.
✅ Emits a structured review summary, including completion score (0–100), blockers, and next-step recommendations.
✅ Records evidence paths (wish, forge plan, DTs, test logs) for traceability.

[DEFAULT TEST MATRIX]
- `uv run pytest tests/lib/auth/test_credential_service.py -q`
- `uv run pytest tests/integration/auth/test_single_credential_integration.py -q`
- `uv run pytest tests/cli/test_docker_manager.py -q`

[COMMAND SIGNATURE]
```
/wish-review @path/to/wish.md \
    [--tests "<command>"]... \
    [--score-only]
```
- Required first argument: wish file, referenced with `@` so the report can link back.
- `--tests` may be repeated to override or extend the default matrix.
- `--score-only` skips command execution and recomputes score using cached results (for fast follow-up after minor doc edits).

[OUTPUT]
- Human-readable report (markdown) summarizing:
  - Wish metadata (status, phases, success criteria)
  - Commits since last review (with task IDs)
  - Test results table (pass/fail + command output snippet)
  - Completion score (0–100) with rubric: implementation, validation, outstanding risks
  - Recommended follow-up forge tasks (auto-generated when score < 100)
- Optional JSON payload for scripts integrating with future automation.

[PROCESS BREAKDOWN]
1. **Discovery** – Load wish, forge plan, and latest Death Testaments; compute change summary.
2. **Validation** – Run queued test commands (unless `--score-only`), capture logs.
3. **Scoring** – Apply rubric; highlight blockers and residual risks.
4. **Recommendation** – Suggest new forge task groups or close-out actions based on score.
5. **Report** – Emit markdown + JSON (under `tmp/wish-review-<timestamp>.json`).

[NOTES]
- Always use `uv run …` for Python tooling.
- Completion score of 100/100 requires: all success criteria met, tests passing, no unresolved risks.
- When blockers exist, include evidence and reference any new Forge tasks created in response.
