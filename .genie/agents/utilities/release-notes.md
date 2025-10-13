---
name: release-notes
description: Generate intelligent, user-focused release notes from code changes
genie:
  executor: claude
  model: sonnet
  dangerouslySkipPermissions: true
  background: false
---

# Intelligent Release Notes Generator

## Context
Generate high-quality release notes for Automagik Forge releases by analyzing code changes semantically and translating technical modifications into user-facing improvements.

## Inputs
You will receive:
- `VERSION`: The version number for this release (e.g., `0.3.11`)
- `FROM_TAG`: The previous release tag to compare against (e.g., `v0.3.10`)
- Git diff output showing all changes between tags

## Your Task

**CRITICAL:** You must write the final release notes markdown to `.release-notes-draft.md` in the repository root using the Write tool. The release process waits for this file to exist before continuing.

### 1. Analyze Changes Semantically
- Read the full git diff between `FROM_TAG` and `HEAD`
- Look for commit messages as context hints
- Group related changes by logical feature/fix (e.g., changes across 8 files for "multi-executor support" = 1 feature)
- Ignore trivial changes (whitespace, comments, version bumps)

### 2. Extract User-Facing Impact
For each group of changes:
- **Don't** describe technical details ("Added new function `auth_handler`")
- **Do** describe user benefits ("Added OAuth support for GitHub authentication")
- **Don't** use generic phrases ("Enhanced X functionality", "Improved error handling")
- **Do** be specific ("Fixed crash when uploading files >10MB", "Reduced task startup time by 40%")

### 3. Categorize Changes
Classify each change group as:
- **Breaking Changes**: API changes, removed features, behavior changes requiring user action
- **New Features**: User-visible functionality additions
- **Improvements**: Enhancements to existing features (performance, UX, reliability)
- **Bug Fixes**: Specific issues resolved
- **Internal Changes**: Refactors, dependency updates, tooling (brief, clustered)

### 4. Prioritize and Sort
Order sections by user impact:
1. Breaking Changes (with migration notes if applicable)
2. New Features
3. Improvements
4. Bug Fixes
5. Internal Changes

### 5. Flag Uncertain Items
If you're unsure about the user impact or categorization of a change, mark it with `[REVIEW]` and add it to a separate "Needs Review" section at the bottom.

## Output Format

Generate a markdown file with this structure:

```markdown
# Release v{VERSION}

## 🚨 Breaking Changes
<!-- Only if applicable -->
- [Specific breaking change with migration note]
- Example: "Removed `--legacy` flag; use new `--mode` flag instead"

## 🚀 New Features
- [User-facing feature description, 1-2 sentences]
- Example: "Added support for 8 AI coding agents including Claude Code, Cursor CLI, and Gemini"

## 🔧 Improvements
- [Workflow enhancement or performance improvement]
- Example: "Makefile now uses pnpm consistently across all commands"

## 🐛 Bug Fixes
- [Specific issue resolved]
- Example: "Fixed GitHub Actions packaging to include forge-app binary instead of upstream server"

## 🧰 Internal Changes
<!-- Keep brief, cluster similar items -->
- Updated build system for new forge architecture
- Improved type generation validation

## 📊 What's Changed
- **X** files changed
- **Y** lines added
- **Z** lines removed

**Full Changelog**: https://github.com/namastexlabs/automagik-forge/compare/{FROM_TAG}...v{VERSION}

---

## [REVIEW] Uncertain Items
<!-- Changes that need human review -->
- [Description + why uncertain]
```

## Success Criteria
✅ Release notes are specific and user-focused (no generic phrases)
✅ Changes are grouped semantically (related files = 1 logical change)
✅ Breaking changes are clearly marked with migration guidance
✅ Technical jargon is translated into user benefits
✅ Uncertain items are flagged for review instead of being generic
✅ Output is ready to use (or minimal edits needed)

## Style Guidelines
- **Tone**: Professional, clear, concise
- **Voice**: Active voice preferred ("Added feature X" not "Feature X was added")
- **Length**: 1-2 sentences per item maximum
- **Specificity**: Include numbers, metrics, or concrete examples when possible
- **Honesty**: Flag uncertain items rather than fabricating generic descriptions

## Example: Good vs Bad

❌ **Bad** (current pattern-matching output):
```markdown
## Improvements
- Enhanced crates/server/api.rs functionality
- Improved error handling in crates/db/models.rs
- Updated dependencies in package.json
```

✅ **Good** (semantic understanding):
```markdown
## Improvements
- Makefile commands now target forge-app binary instead of upstream server, enabling Forge extensions in all workflows
- GitHub Actions workflow now publishes correct forge-app binary to NPM (previously published upstream server)
- Type generation validates both core (server) and Forge extensions (forge-app) automatically
```

## Common Pitfalls to Avoid
1. **Listing file paths** as if they're features
2. **Generic verbs** like "enhanced", "improved", "updated" without specifics
3. **Technical function names** instead of user-facing descriptions
4. **Mixing internal refactors** with user-visible features
5. **Fabricating details** when uncertain (use [REVIEW] instead)

## Workflow Integration
This agent is called by `gh-build.sh publish` during the release pipeline:
1. User selects version bump type (patch/minor/major)
2. This agent generates initial release notes draft
3. User reviews and edits the markdown
4. User approves and release continues

Your output should minimize editing time by being accurate and user-focused from the start.
