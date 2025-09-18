# /review-merge-pr – Upmerge PR Code Review Playbook

---
description: 🔍 Perform risk-first review of upstream merge PRs, focusing on fork customizations, validation evidence, and regression traps
---

## 📥 Auto-Context
```
@UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md
@UPSTREAM_MERGE_REVIEW_PR3.md
@.claude/commands/upmerge.md
```

Add the PR diff or branch refs explicitly when invoking the command, e.g. `@origin/upstream-merge-20250917-173057...upstream/main`.

## 🔁 REVIEW WORKFLOW

<task_breakdown>
1. [Baseline] Confirm scope, upstream coverage, and fork guardrails
2. [Diff Inspection] Walk high-risk areas first, then medium risk
3. [Validation] Check reported test evidence and residual TODOs
4. [Report] Surface blockers, risks, and follow-up actions
</task_breakdown>

### Phase 1 – Baseline Intel

<context_gathering>
Goal: Orient review quickly; reuse prior analysis.

Method:
- Read analysis & review docs for latest synced upstream commit and TODO list
- Inspect `git log --oneline <merge-base>..HEAD` to confirm commit coverage
- Generate `git diff --stat <merge-base>..HEAD` to identify hotspots
- Verify custom guardrails list (pnpm, Windows OpenSSL, GENIE persona, branch naming, MCP)

Early stop criteria:
- Upstream target commit hash confirmed
- High-risk files enumerated with references in analysis doc
- Outstanding TODO/QA items understood
</context_gathering>

If review resumes mid-stream, ensure the branch under review already contains the previously merged commits; if not, request alignment before continuing.

### Phase 2 – Diff Inspection (Risk-Ordered)

**2.1 Critical Customizations**
- `.github/workflows/*build-all-platforms*.yml` – ensure Windows OpenSSL safeguards intact
- `package.json`, `frontend/package.json`, `npx-cli/package.json` – confirm pnpm-first scripts, fork metadata (`automagik-forge`, `0.3.9`) and new deps make sense
- `frontend/vite.config.ts` – verify server config and `VITE_OPEN` toggle wired without regressing proxies
- `CLAUDE.md` – confirm GENIE persona text and pnpm instructions remain accurate
- `crates/*/Cargo.toml` – ensure versions remain `0.3.9`, dependency bumps justified
- `crates/services/src/services/git.rs` & related tests – look for regressions to branch safety rules

**2.2 Upstream Feature Areas**
- Frontend follow-up/editor changes: confirm `EntriesContext` wiring, autosave side effects, branch naming display
- Backend execution process & task routes: verify filtering for soft-deleted processes matches fork expectations
- Docs and marketing updates: confirm they align with fork branding where required

**2.3 Regression Checks**
- Search for reintroduced `npm` commands in scripts
- Verify branch template strings (`forge-{title}-{uuid}`) remain unchanged
- Confirm `.mcp.json` additions align with fork rollout decisions

Use inline notes referencing `file:path:line` and capture specific upstream commit IDs when raising concerns.

### Phase 3 – Validation Evidence

**What to verify**
- Did the branch run `pnpm install --frozen-lockfile`, `pnpm run generate-types`, `cargo test --workspace`, `pnpm run check`? Cross-check timestamps in analysis doc.
- Ensure SQLx cache files match migrations; if DB migrations pending, flag need for dry-run.
- Review TODO checklist in analysis doc; highlight any unchecked items blocking merge (CLI branch naming smoke test, UI follow-ups, migrations).
- If validation missing, request explicit action or justification.

### Phase 4 – Review Report Structure

Deliver findings in severity order:

1. **Blockers** – merge-stoppers (missing safeguards, failing validations, TODOs unresolved)
2. **High Risks** – likely regressions needing code fixes or targeted QA
3. **Medium/Low** – follow-ups, documentation gaps, optional polish

Format template:

```
**Findings**
- [Severity] file:path:line – Issue description + expected behaviour

**Open Questions**
- Clarifications needed for reviewer to sign off

**Validation**
- ✅ pnpm run generate-types (date)
- ⚠️ CLI branch naming smoke test outstanding

**Next Actions**
1. ...
```

Reference analysis/review doc sections when citing evidence (e.g., `UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md:186-205`).

## ✅ SUCCESS CRITERIA
<success_criteria>
✅ Scope confirmed (commit range, upstream coverage)
✅ High-risk customizations reviewed with file references
✅ Validation evidence audited; gaps called out
✅ Findings prioritized by severity with actionable guidance
✅ Review ties back to analysis/report docs for continuity
</success_criteria>

## 🚫 NEVER DO
<never_do>
❌ Approve without verifying fork guardrails (pnpm, Windows OpenSSL, GENIE persona, branch templates)
❌ Ignore unchecked TODOs in analysis report
❌ Assume tests ran without evidence
❌ Reduce severity to “nit” if regression risk exists
❌ Rewrite merge history or force new branches mid-review
</never_do>

## 🧪 Command Usage

```
/review-merge-pr origin/upstream-merge-20250917-173057
```

Optionally add `...upstream/main` to preload diff context for quick navigation.
