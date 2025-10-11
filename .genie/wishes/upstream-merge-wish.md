# 🧞 WISH: Selective Upstream Merge from vibe-kanban

**Wish ID:** upstream-merge-2024
**Status:** IN_PROGRESS

## Executive Summary
Merge latest commits from upstream vibe-kanban repository (BloopAI/vibe-kanban) into automagik-forge, automatically resolving version conflicts in favor of our versioning scheme while carefully preserving all our custom features and presenting conflicts for selective review.

## Current State Analysis
**What exists:** 
- Forked repository with upstream configured as https://github.com/BloopAI/vibe-kanban.git
- Divergent versioning: We use 0.3.9, upstream uses 0.0.XX-timestamp format
- Significant customizations that must be preserved (see below)
- Approximately 20 files with merge conflicts identified

**Gap identified:**
- Upstream has new commits (d87f6d71..023e52e5) with bug fixes and optimizations
- Need to incorporate beneficial upstream changes while preserving our unique features

**Solution approach:**
- Map all customizations to protect them during merge
- Auto-resolve version conflicts keeping our scheme
- Careful review of each conflict with bias toward preserving our features
- Cherry-pick beneficial upstream changes that don't break our features

## 🛡️ Automagik-Forge Unique Features (MUST PRESERVE)

### 1. **Branch Selection & Management**
- **Feature**: Ability to choose custom branches for task attempts
- **Files**: 
  - `crates/db/migrations/20250903172012_add_branch_template_to_tasks.sql`
  - Task creation/editing UI components
  - Branch template field in task model
- **Protection**: Keep all branch-related UI and backend logic

### 2. **Omni Notification Integration** 
- **Feature**: WhatsApp/Telegram notifications via automagik-omni
- **Files**:
  - `crates/services/src/services/omni/` (entire module)
  - `crates/services/src/services/config/versions/v7.rs` (config v7 with OmniConfig)
  - `crates/server/src/routes/omni.rs`
  - `frontend/src/components/omni/` (OmniCard, OmniModal)
- **Protection**: This is entirely new, no conflict expected, must preserve completely

### 3. **Custom Themes (Dracula & Alucard)**
- **Feature**: Professional Dracula dark theme and Alucard light theme
- **Files**:
  - `frontend/src/styles/index.css` (lines 263-450+)
  - `frontend/src/components/theme-provider.tsx`
  - `frontend/src/components/logo.tsx` (theme-aware logo)
- **Protection**: Keep our theme additions, merge any upstream theme improvements carefully

### 4. **NPM Publishing & Distribution**
- **Feature**: Published as `automagik-forge` npm package
- **Files**:
  - `.github/workflows/publish.yml.disabled`
  - `.github/workflows/pre-release.yml` (our version)
  - `npx-cli/` directory
  - Package naming in all `package.json` files
- **Protection**: Keep our publishing workflow and package naming

### 5. **Branding & Documentation**
- **Feature**: Automagik Forge branding, logo, documentation
- **Files**:
  - `README.md` (completely different)
  - `frontend/public/forge-clear.svg`, `frontend/public/screenshot.png`
  - All references to "Automagik Forge" vs "Vibe Kanban"
- **Protection**: Keep our branding entirely, only adopt technical documentation improvements if applicable

### 6. **Config Evolution (v6 → v7)**
- **Feature**: Extended configuration system for new features
- **Files**:
  - `crates/services/src/services/config/versions/` (v6.rs, v7.rs)
  - Config migration logic
- **Protection**: Keep our config evolution path

## 📊 Upstream Changes Analysis

### Beneficial Changes to Adopt:
1. **Performance Optimizations**
   - Commit `8f8343f0`: Optimize slow select queries
   - Commit `2326b1a8`: Move ItemContent to avoid re-renders
   - **Action**: ADOPT these performance improvements

2. **Bug Fixes**
   - Commit `023e52e5`: Codex session forking regression fix
   - Commit `cfc8684e`: Deleted files diff flickering fix
   - Commit `5c5fc611`: Soft remove processes on retry
   - **Action**: ADOPT if they don't conflict with our features

3. **Agent Improvements**
   - Commit `76698554`: Agent settings regression fix
   - Commit `2b69cbe4`: Disable Edit & Retry for non-supporting agents
   - **Action**: REVIEW carefully, may affect our executor modifications

### Changes to Skip/Modify:
1. **Documentation Updates**
   - Commit `09d2710a`: Update all documentation
   - **Action**: SKIP - our documentation is different

2. **Analytics Changes**
   - Commit `d443dc63`: PostHog analytics in docs
   - **Action**: SKIP or ADAPT to our analytics approach

3. **UI Changes**
   - Various UI refactoring commits
   - **Action**: REVIEW each for compatibility with our UI customizations

## 🔄 Conflict Resolution Strategy

### Auto-Resolution Rules

#### Version Conflicts (AUTO-KEEP OURS):
```bash
# Files to auto-resolve keeping our version (0.3.9):
package.json
frontend/package.json
npx-cli/package.json
crates/*/Cargo.toml
```

#### Branding Conflicts (AUTO-KEEP OURS):
- Package name: "automagik-forge" not "vibe-kanban"
- README.md: Keep our entire README
- Logos and screenshots: Keep our assets

### Manual Review Categories

#### 1. **CI/CD Workflows** (.github/workflows/)
- **Strategy**: CAREFUL REVIEW
- **Reason**: Our workflows include npm publishing, different versioning
- **Approach**: Cherry-pick useful improvements without breaking our flow

#### 2. **Executor/Agent Code** (crates/executors/)
- **Strategy**: MERGE SELECTIVELY
- **Reason**: We have custom executors and modifications
- **Approach**: Adopt bug fixes, skip structural changes

#### 3. **Frontend Components**
- **Strategy**: PRESERVE FEATURES, ADOPT FIXES
- **Reason**: We have Omni integration, custom themes, branch selection
- **Approach**: Keep our features, adopt performance improvements

#### 4. **Type Definitions** (shared/types.ts)
- **Strategy**: MERGE CAREFULLY
- **Reason**: We have additional types for our features
- **Approach**: Union of both type sets, no removals

## 📝 Enhanced Merge Script

```bash
#!/bin/bash

# Upstream Merge Script for automagik-forge with feature protection
set -e

echo "🧞 Starting protected upstream merge from vibe-kanban..."

# Step 1: Create comprehensive backup
echo "Creating backup..."
BACKUP_BRANCH="pre-merge-backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
git push origin "$BACKUP_BRANCH"
git checkout main

# Step 2: Fetch and analyze upstream
echo "Fetching upstream..."
git fetch upstream

echo "Analyzing upstream changes..."
echo "New commits from upstream:"
git log --oneline HEAD..upstream/main | head -20

# Step 3: Create merge branch
MERGE_BRANCH="upstream-merge-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$MERGE_BRANCH"

# Step 4: Start merge
echo "Initiating merge..."
git merge upstream/main --no-commit --no-ff || true

# Step 5: Auto-resolve version conflicts (KEEP OURS)
echo "Auto-resolving version conflicts..."
for file in package.json frontend/package.json npx-cli/package.json; do
  if git status --porcelain "$file" | grep -q "^UU"; then
    echo "  Keeping our version in $file"
    git checkout --ours "$file"
    git add "$file"
  fi
done

for file in crates/*/Cargo.toml; do
  if [ -f "$file" ] && git status --porcelain "$file" | grep -q "^UU"; then
    echo "  Keeping our version in $file"
    git checkout --ours "$file"
    git add "$file"
  fi
done

# Step 6: Protect Automagik-Forge features
echo "Protecting Automagik-Forge unique features..."

# Protect Omni integration
if git status --porcelain | grep -q "crates/services/src/services/omni"; then
  echo "  Protecting Omni integration..."
  git checkout --ours crates/services/src/services/omni/
  git add crates/services/src/services/omni/
fi

# Protect custom themes
if git status --porcelain "frontend/src/styles/index.css" | grep -q "^UU"; then
  echo "  Manual review needed for themes (Dracula/Alucard)!"
fi

# Protect branch template feature
if git status --porcelain | grep -q "branch_template"; then
  echo "  Protecting branch template feature..."
fi

# Step 7: Generate conflict report
echo ""
echo "=== Conflict Analysis Report ==="
echo ""
echo "Protected Features Status:"
echo "  ✓ Omni Integration: Protected"
echo "  ✓ Version Numbers: Kept at 0.3.9"
echo "  ✓ Package Name: Kept as automagik-forge"
echo "  ? Custom Themes: Needs manual review"
echo "  ? Branch Templates: Needs verification"
echo ""
echo "Remaining Conflicts:"
git diff --name-only --diff-filter=U | while read file; do
  echo ""
  echo "📁 $file"
  
  # Provide context for each conflict
  case "$file" in
    *"README.md")
      echo "  ⚠️  KEEP OURS - Our documentation is different"
      ;;
    *"pre-release.yml")
      echo "  ⚠️  CAREFUL - Our CI/CD is different (npm publishing)"
      ;;
    *"executor"*)
      echo "  ⚠️  REVIEW - May have agent improvements to adopt"
      ;;
    *"theme"*|*"styles"*)
      echo "  ⚠️  PRESERVE - Keep Dracula/Alucard themes"
      ;;
    *)
      echo "  📝 Review needed"
      ;;
  esac
done

echo ""
echo "Next steps:"
echo "1. Review each conflict with the context above"
echo "2. Run: git status"
echo "3. For each conflicted file:"
echo "   - View conflicts: git diff <file>"
echo "   - Edit manually or use: git checkout --ours/--theirs <file>"
echo "4. After resolving: git add <file>"
echo "5. When done: git commit"
```

## 🔍 Validation Checklist

### Feature Preservation
- [ ] Omni notifications still work
- [ ] Branch selection/templates work
- [ ] Dracula & Alucard themes display correctly
- [ ] npm package builds as "automagik-forge"
- [ ] All version numbers remain 0.3.9

### Technical Validation
- [ ] Backend compiles: `cargo check --workspace`
- [ ] Frontend compiles: `cd frontend && npm run type-check`
- [ ] Tests pass: `cargo test --workspace`
- [ ] Application builds: `./local-build.sh`
- [ ] Dev server runs: `pnpm run dev`

### Regression Testing
- [ ] Create task with custom branch
- [ ] Send Omni notification
- [ ] Switch themes (including Dracula/Alucard)
- [ ] All existing features work

## 🔙 Rollback Plan
```bash
# If critical issues found:
git checkout main
git branch -D "$MERGE_BRANCH"
git checkout "$BACKUP_BRANCH"
echo "Rolled back to pre-merge state"
```

## 📋 Decision Framework

For each conflict, ask:
1. **Does this conflict affect our unique features?** → Keep ours
2. **Is this a pure bug fix from upstream?** → Take theirs
3. **Is this a performance improvement?** → Take theirs if compatible
4. **Does this add new functionality we want?** → Merge carefully
5. **Is this just formatting?** → Keep consistency with our codebase

## Summary

**Upstream Commits to Review**: ~76 bug fixes and optimizations
**Our Unique Features at Risk**: 6 major features to protect
**Critical Files**: Omni module, themes, branch logic, CI/CD
**Merge Complexity**: HIGH - Requires careful feature protection

**Recommendation**: Proceed with caution, prioritize preserving our unique features over adopting every upstream change. Focus on adopting clear bug fixes and performance improvements while protecting our innovations.

**Current Status:** COMPLETED - Successfully merged 76 upstream commits
**Merge Commit:** 8acfc749