# /upmerge - Upstream Merge & Release Orchestration

---
description: 🔄 Automate upstream syncs end to end — branch prep, diff analysis, conflict resolution, validation, PR review, and release packaging
---

## 🧭 OVERVIEW

Use `/upmerge` whenever upstream publishes new changes (tag, branch, or PR) that we must fold into our fork. This command encodes the proven process from `UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md` and `UPSTREAM_MERGE_REVIEW_PR3.md`, combining them with the prompting patterns from `.claude/commands/prompt.md`. `/upmerge` handles the merge execution; once the branch is ready, trigger `/review-merge-pr` for a separate, file-by-file review pass.

### Required Auto-Context
```
@.claude/commands/prompt.md
@UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md
@UPSTREAM_MERGE_REVIEW_PR3.md
```

## 🔁 WORKFLOW

<task_breakdown>
1. [Preparation] Align branches, identify targets, snapshot customizations
2. [Merge Execution] Fetch upstream, merge safely, resolve conflicts with guardrails
3. [Post-Merge Checks] Update reports, run validations, capture per-file notes
4. [Review & Release] Hand off to `/review-merge-pr`, craft PR, prep release
</task_breakdown>

---
### Phase 1 – Preparation

<context_gathering>
Goal: Establish baseline quickly without redundant searches.

Method:
- Verify remotes (`origin` = fork, `upstream` = bloopai repo). Add if missing.
- Determine target: prefer tag (e.g., latest `v*`) else branch/PR specified by user argument.
- Capture current release tag (`git describe --tags --abbrev=0`).
- Read existing customization inventory from analysis/review docs.
- Confirm CI guardrails: scan `.github/workflows/**/*` for accidental `npm` fallbacks and queue pnpm replacements before merging.

Early stop criteria:
- Upstream ref identified
- Last-fork release confirmed
- Custom hotspots enumerated (workflows, CLAUDE persona, branch naming, MCP, pnpm)
</context_gathering>

**Commands to run**
```bash
# Update fork baseline
git checkout main
git pull origin main

# Naming convention
NEW_BRANCH=upmerge-$(date +%Y%m%d-%H%M)
git checkout -b "$NEW_BRANCH"
```

> ℹ️ **Continuing a prior merge?** If a branch such as `upstream-merge-<date>` already holds the in-flight work, skip the new branch creation above and `git checkout` that branch instead. Reuse its analysis/report artifacts rather than starting fresh.

**Snapshot key files (optional but recommended)**
```
mkdir -p backup/upmerge
for path in .github/workflows/build-all-platforms.yml \
            .github/workflows/pre-release.yml \
            Dockerfile package.json CLAUDE.md \
            crates/services/src/services/git.rs \
            crates/server/src/mcp/task_server.rs; do
  git show HEAD:"$path" > "backup/upmerge/${path//\//__}"
done
```

> ✅ Clean up `backup/upmerge/` once the merge is committed so the worktree returns to a tidy state.
> ✅ When updating CI, standardize on `pnpm` (`pnpm/action-setup`, `pnpm install --frozen-lockfile`, `pnpm --filter frontend run build`) so merges remain reproducible.

---
### Phase 2 – Merge Execution

<persistence>
Remain proactive: if conflicts arise, resolve using documented fork rules before handing control back.
</persistence>

**2.1 Fetch upstream target**
```bash
git fetch upstream
# For tags
TARGET_REF=${1:-upstream/main}
# Example override: /upmerge upstream/pull/3/head
if [[ "$TARGET_REF" == upstream/pull/*/head ]]; then
  git fetch upstream "${TARGET_REF#upstream/}:pr-upstream" && TARGET_REF=pr-upstream
fi
```

**2.2 Analyze before merging**
```bash
git diff $(git describe --tags --abbrev=0)..."$TARGET_REF" --name-status > /tmp/upmerge_changed_files.txt
```
Use the diff plus existing reports to flag high-risk files. Update `UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md` as a living log for the new pull.

**2.3 Merge**
```bash
git merge "$TARGET_REF" --no-commit --no-ff
```
Resolve conflicts guided by the report:
- ✅ Preserve pnpm workflow, Windows OpenSSL logic, CLAUDE persona, branch template logic
- ✅ Accept upstream features when compatible (schemars, conflict handling, follow-up UX)
- ✅ Document every resolved conflict inside the report (checkboxes + notes)

After resolution:
```bash
git add -A
git commit -m "Merge $TARGET_REF into $NEW_BRANCH honoring fork customizations"
```

---
### Phase 3 – Review & Release

**3.1 Refresh analysis/review docs**
- Duplicate `UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md` → new dated report or update sections with `[x]` markers.
- Mirror findings in `UPSTREAM_MERGE_REVIEW_PR3.md` for PR narration.
- Record outstanding TODOs (tests, type generation, follow-up UI checks).

**3.2 Prepare manual review inputs**
- Export touched files: `git diff --name-only $(git merge-base HEAD "$TARGET_REF")..HEAD > /tmp/upmerge_files.txt`
- In the analysis log, flag high-risk files and annotate why they need deep inspection.
- Capture any external payload expectations (e.g., API response samples) so `/review-merge-pr` can verify assumptions file by file.

**3.3 Validation suite**
```bash
pnpm install --frozen-lockfile
pnpm run generate-types
cargo test --workspace
pnpm run check
```
Document outcomes (pass/fail) in both report and PR description. When `pnpm install` prompts to reinstall modules, answer `Y` to confirm.

**3.4 PR authoring**
Use `/forge` if large, else manual. PR template:
```
Title: chore: upstream merge {tag-or-branch}
Summary:
- Accepted upstream features: ...
- Preserved custom logic: ...

Validation:
- [ ] pnpm run generate-types
- [ ] cargo test --workspace
- [ ] pnpm run check
- [ ] Frontend smoke (attempt creation / follow-up queue)
```
Link to updated analysis/review docs.

**3.5 Release readiness**
If final release:
- Tag candidate (`git tag -a vX.Y.Z-<timestamp> -m "Upstream merge"`)
- Push branch + tags (`git push origin "$NEW_BRANCH" --tags`)
- Trigger `build-all-platforms.yml` workflow manually if needed.

---
## ✅ SUCCESS CRITERIA
<success_criteria>
✅ Upstream ref merged into dedicated branch without breaking custom features
✅ `UPSTREAM_MERGE_ANALYSIS_PR3_REPORT.md` updated with checkboxes + notes
✅ Tests and type generation executed (or failures documented with follow-ups)
✅ Manual file-by-file review queued via `/review-merge-pr` with notes ready
✅ PR created with clear summary of preserved customizations
✅ Release checklist complete or explicitly deferred (manual QA items tracked in analysis report)
</success_criteria>

## 🚫 NEVER DO
<never_do>
❌ Merge into `main` directly
❌ Overwrite branch naming (`forge-{title}-{uuid}`) or pnpm workflow
❌ Remove GENIE persona sections
❌ Disable Windows OpenSSL safeguards without validation
❌ Ship without updating analysis/review docs
❌ Skip the dedicated `/review-merge-pr` pass after merging
</never_do>

## 📓 New Learnings (Living Log)
- **2025-09-18 · Omni API schema drift:** Upstream changed `/api/v1/instances` from an envelope to a bare array. Record real payload samples during merges and document mapping assumptions so downstream validation stays aligned.

## 🧪 COMMAND USAGE
```
/upmerge [upstream-ref]
```
Examples:
- `/upmerge` → defaults to `upstream/main`
- `/upmerge upstream/v0.3.10` → merge specific tag
- `/upmerge upstream/pull/3/head` → merge upstream PR #3 (fetches into local `pr-upstream`)

Document final outcomes in the analysis report before handing back to the user.
