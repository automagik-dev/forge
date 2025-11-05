# Commit Advisory – GitHub Actions Submodule Checkout

**Generated:** 2025-10-10T15:30:00Z

## Snapshot
- Branch: `restructure/upstream-as-library-migration`
- Commit: `d19469a20edec1de02fd4ad75c467609872bb031`
- Related: Infrastructure hardening for upstream submodule integration

## Changes by Domain

### CI/CD Workflows (4 files)
- `.github/workflows/build-all-platforms.yml` - Added `submodules: recursive` to 2 checkout steps
- `.github/workflows/pre-release-simple.yml` - Added `submodules: recursive` to 1 checkout step
- `.github/workflows/pre-release.yml` - Added `submodules: recursive` to 5 checkout steps
- `.github/workflows/test.yml` - Added `submodules: recursive` to 1 checkout step

**Total:** 9 checkout actions updated across all workflows

## Pre-commit Gate Results

```
Checklist: [lint, type, tests, docs, changelog, security, formatting]
Status: {
  lint: n/a (YAML-only change),
  type: n/a (YAML-only change),
  tests: n/a (YAML-only change),
  docs: n/a (no docs update required for CI config),
  changelog: n/a (infrastructure change),
  security: pass (workflow hardening),
  formatting: fail (Rust fmt found issues in existing code, unrelated to this change)
}
Blockers: None for this change
NextActions: [Run `cargo fmt --all` to fix pre-existing formatting issues in separate commit]
Verdict: ready (confidence: high)
```

## Commit Message
```
ci: enable submodule checkout in all GitHub Actions workflows

Configure all actions/checkout@v4 steps to automatically initialize
and fetch submodules, ensuring the upstream/ submodule (now at
v0.0.106-namastex) is available during builds and tests.

Fixes build failures where upstream source code was missing during
CI runs. Enables proper npm packaging with upstream dependencies.

- build-all-platforms.yml: 2 checkout steps updated
- pre-release.yml: 5 checkout steps updated
- pre-release-simple.yml: 1 checkout step updated
- test.yml: 1 checkout step updated
```

## Validation Checklist
- [x] All 9 checkout actions include `submodules: recursive`
- [x] Workflow YAML syntax is valid
- [x] No secrets or credentials exposed
- [x] Changes committed successfully
- [ ] Test workflow run confirms submodule checkout works
- [ ] Build artifacts include upstream source code

## Risks & Follow-ups
1. **Pre-existing formatting issues:** Rust code has formatting violations unrelated to this change - should be addressed in separate commit with `cargo fmt --all`
2. **Submodule tag verification:** After merge, verify CI checks out upstream at v0.0.106-namastex (commit 687f439e)
3. **Build time impact:** Submodule checkout adds ~5-10s to each workflow job startup
4. **Testing recommended:** Trigger a workflow run to validate submodule checkout functions correctly

## Outcome
✅ **Commit successful**
- Hash: `d19469a20edec1de02fd4ad75c467609872bb031`
- Branch: `restructure/upstream-as-library-migration` (2 commits ahead of origin)
- Files changed: 4 workflow files
- Changes: +14 insertions, -2 deletions

## Next Actions
1. **Push to remote:** `git push origin restructure/upstream-as-library-migration`
2. **Test in CI:** Trigger a workflow run to validate changes
3. **Address formatting:** Run `cargo fmt --all` and commit separately
4. **Create PR:** Once validated, create PR to merge into main
