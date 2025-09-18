# PR REVIEW PROMPT: Upstream Merge Analysis for PR #3

### ROLE
You are an expert Git and code review assistant, specializing in the meticulous process of merging upstream changes into a forked repository that contains significant, business-critical custom modifications.

### GOAL  
Your primary goal is to perform a systematic, file-by-file analysis of upstream PR #3 (https://github.com/namastexlabs/automagik-forge/pull/3). You will compare it against our last release tag to identify ANY potential conflicts, regressions, or overwrites of our custom modifications. Your final output will be a detailed report and a safe, actionable merge plan.

### CONTEXT
- **@UpstreamRepoURL:** `https://github.com/bloopai/automagik-forge`
- **@OurForkRepoURL:** `https://github.com/namastexlabs/automagik-forge`  
- **@LastReleaseTag:** `v0.3.8` (or determine from git tags)
- **@UpstreamPR_URL:** `https://github.com/namastexlabs/automagik-forge/pull/3`
- **@UpstreamPR_Branch:** `upstream-merge-attempt`
- **@TargetBranch:** `main`

### AUTO-CONTEXT LOADING
@.github/workflows/test.yml
@crates/server/src/mcp/mod.rs
@crates/services/src/git_operations.rs
@crates/services/src/worktree_manager.rs
@frontend/src/components/TaskCard.tsx
@frontend/src/pages/TaskAttemptDetail.tsx
@CLAUDE.md
@package.json
@Cargo.toml

## Status Update — 2025-09-18
- [x] Pulled upstream/main through commit `46d3f3c7` into `upstream-merge-20250917-173057`, keeping pnpm workflows, Windows OpenSSL safeguards, GENIE persona, and branch template logic intact.
- [x] Validation passes: `pnpm install --frozen-lockfile`, `pnpm run generate-types`, `cargo test --workspace`, `pnpm run check`, `pnpm run prepare-db`.
- [x] Follow-ups closed: branch naming tests added (`generate_branch_name_*`), WebSocket follow-up stream reviewed, migrations applied.


### CUSTOM MODIFICATIONS INVENTORY

<task_breakdown>
1. [Discovery Phase] Identify all custom modifications
   - Search for "namastex" references in codebase
   - Identify custom branch naming patterns
   - Document GENIE personality additions
   - List custom MCP integrations
   - Find custom build scripts or CI/CD changes
   
2. [Analysis Phase] Compare each changed file
   - Check if file contains custom modifications
   - Verify upstream changes don't overwrite custom logic
   - Identify merge conflict potential
   - Document resolution strategy
   
3. [Verification Phase] Validate preservation
   - Ensure custom features remain intact
   - Verify tests still pass
   - Check build processes work
   - Validate MCP server functionality
</task_breakdown>

### KNOWN CUSTOM MODIFICATIONS

**Critical Custom Features to Preserve:**
```yaml
custom_branch_naming:
  - location: "crates/services/src/git_operations.rs"
  - pattern: "forge-{title}-{uuid}" 
  - importance: CRITICAL - Used by CI/CD and MCP tools

genie_personality:
  - location: "CLAUDE.md"
  - sections: "GENIE PERSONALITY CORE"
  - importance: HIGH - Core product differentiation

github_actions:
  - location: ".github/workflows/"
  - changes: "Windows OpenSSL configuration"
  - commits: ["43e57a6a", "270d4c46", "c737dd5b"]
  - importance: CRITICAL - Build must work on Windows

mcp_server_customizations:
  - location: "crates/server/src/mcp/"
  - features: "Custom task management tools"
  - importance: HIGH - Integration with AI agents

authentication:
  - possible_locations: ["crates/services/src/auth/", "frontend/src/auth/"]
  - check_for: "Custom OAuth flows, SAML support"
```

### ANALYSIS METHODOLOGY

For EACH file changed in the PR, perform:

<context_gathering>
Goal: Identify conflicts fast. Parallelize discovery.

Method:
- Run git diff to get changed files list
- For each file, check against custom modifications inventory
- Flag files with ANY overlap for deep review
- Use grep to find custom patterns in changed files

Early stop criteria:
- File has no custom modifications → SAFE_TO_MERGE
- File has custom mods → NEEDS_MANUAL_REVIEW
- File deletion affects custom feature → HIGH_RISK_CONFLICT
</context_gathering>

### FILE-BY-FILE ANALYSIS TEMPLATE

```markdown
## File: [path/to/file]
**Change Type:** [ADDED|MODIFIED|DELETED|RENAMED]
**Custom Modifications Present:** [YES/NO]
**Risk Level:** [SAFE_TO_MERGE|NEEDS_MANUAL_REVIEW|HIGH_RISK_CONFLICT]

### Conflict Analysis:
- Does this affect custom branch naming? [YES/NO]
- Does this affect GENIE personality? [YES/NO]  
- Does this affect Windows build? [YES/NO]
- Does this affect MCP server? [YES/NO]

### Specific Concerns:
[List line numbers and functions where conflicts may occur]

### Recommendation:
[Specific action to take for this file]
```

### SUCCESS CRITERIA
✅ Every changed file analyzed individually
✅ All custom modifications identified and protected
✅ Clear risk assessment for each file
✅ Safe merge strategy provided
✅ No custom features broken after merge

### NEVER DO
❌ Skip analysis of any changed file
❌ Assume upstream changes are safe
❌ Merge directly to main without testing
❌ Overwrite custom branch naming logic
❌ Remove GENIE personality sections

### PROPOSED SAFE MERGE WORKFLOW

```bash
# 1. Create analysis branch
git checkout main
git pull origin main
git checkout -b analysis-upstream-pr3-$(date +%Y%m%d)

# 2. Fetch upstream changes
git remote add upstream https://github.com/bloopai/automagik-forge.git || true
git fetch upstream
git fetch origin pull/3/head:pr3-branch

# 3. Analyze diff (DO NOT MERGE YET)
git diff v0.3.8...pr3-branch --name-status > changed_files.txt
git diff v0.3.8...pr3-branch > full_diff.patch

# 4. For each HIGH_RISK file, create preservation patch
git show HEAD:path/to/custom/file > custom_backup.txt

# 5. Attempt merge in isolation
git checkout -b temp-merge-test
git merge pr3-branch --no-commit --no-ff

# 6. Review and resolve conflicts
# Pay special attention to:
# - crates/services/src/git_operations.rs (custom branch naming)
# - CLAUDE.md (GENIE personality)
# - .github/workflows/* (Windows build fixes)

# 7. Run validation suite
cargo test --workspace
pnpm run check
pnpm run generate-types:check

# 8. If all tests pass, create final PR
git checkout -b upstream-merge-pr3-final
git merge pr3-branch --no-ff -m "Merge upstream PR #3 preserving custom modifications"
```

### OUTPUT REQUIREMENTS

Provide analysis in this format:

```markdown
# Upstream Merge Analysis Report - PR #3

## Executive Summary
[1-3 sentences on overall risk and key findings]

## Changed Files Analysis
[File-by-file breakdown using template above]

## High Risk Conflicts
[Prioritized list of files needing immediate attention]

## Manual Review Required
[List of files needing careful human review]

## Safe to Merge
[List of files with no conflicts]

## Final Recommendation
[GO/NO-GO decision with conditions]

## Merge Execution Plan
[Step-by-step commands to safely execute merge]
```

---

**EXECUTION INSTRUCTION:**
Begin by running `git diff v0.3.8...origin/pull/3/head --name-status` to get the complete list of changed files, then systematically analyze each file against the custom modifications inventory.
