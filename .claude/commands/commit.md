# /commit — Commit Advisory Assistant

---
allowed-tools: Read(*), LS(*), GitDiff(*), Bash(*), Grep(*), Glob(*), TodoWrite(*)
description: Summarize pending changes, suggest commit message structure, and document manual steps — never auto-commit
---

[CONTEXT]
- Automagik Hive commits and pushes are human-owned. This command prepares guidance only.
- Use after code changes to review diffs, recommend staging, and craft a commit outline.
- Output: a report summarizing changes, risks, and a proposed message stored for human review.

[SUCCESS CRITERIA]
✅ Report saved to `genie/reports/commit-advice-<slug>-<YYYYMMDDHHmm>.md` with:
   - Files changed (grouped by area)
   - Notable diffs / risks / follow-up tasks
   - Suggested commit message and checklist (tests run, docs updated)
✅ Human receives concise summary + report reference; no git commands executed.

[NEVER DO]
❌ Run `git add`, `git commit`, `git push`, or destructive git commands.
❌ Stage or discard changes automatically.
❌ Invent changes that aren’t present in the diff.
❌ Skip mentioning untested areas or TODOs found during review.

```
<task_breakdown>
1. [Discovery] Review git status and diffs.
2. [Assessment] Group changes, note risks/tests/docs.
3. [Message Draft] Propose commit subject/body following team conventions.
4. [Reporting] Save guidance to reports folder and share summary + link.
</task_breakdown>
```

## Step 1 – Discovery
- `git status --short` to see staged/unstaged files.
- `git diff` / `git diff --cached` to capture modifications.
- Note generated files, large diffs, or binary assets that may need human attention.

## Step 2 – Assessment
- Group files by feature/component.
- Identify tests that should be run (or already run) and note coverage gaps.
- Flag docs or configuration updates required.
- Record any TODOs or follow-ups for the human.

## Step 3 – Message Draft
- Suggest a commit subject in Conventional Commit style (`feat:`, `fix:`, etc.).
- Provide bullet list for commit body summarizing key changes.
- Include `Co-Authored-By: Automagik Genie <genie@namastex.ai>` reminder if relevant.

## Step 4 – Reporting & Response
- Write full advisory to `genie/reports/commit-advice-<slug>-<YYYYMMDDHHmm>.md`:
  - Git status snapshot
  - Grouped change summary
  - Proposed commit message (subject + body)
  - Tests run/tests recommended
  - Risks, TODOs, and manual steps for the human
- Reply in chat with:
  1. Numbered recap (e.g., “1. 5 files changed across API + tests… 2. Suggested subject: …”).
  2. `Death Testament: @genie/reports/<generated-filename>`.
- Remind the human to review diffs, stage files manually, and run tests before committing.

## Helpful Commands
```bash
# Git status overview
git status --short

# View unstaged changes by file
git diff --stat

# Detailed diff for a specific file
git diff path/to/file

# List newly added files
git ls-files --others --exclude-standard
```

Remember: this command advises—it never mutates git state. The human remains in control of staging, committing, and pushing.
