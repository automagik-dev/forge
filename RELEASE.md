# Release Process

Automagik Forge uses an automated RC (Release Candidate) → Stable release system, identical to automagik-genie.

## Quick Start

### Automatic Releases (Recommended)

**Merge PR to `main`** → Auto RC published to npm@next → **Ready for testing**

When stable → Run `pnpm release:stable` → Published to npm@latest

### Manual RC Bumps

```bash
pnpm bump:rc          # Increment RC (0.4.6-rc.1 → 0.4.6-rc.2)
git push --follow-tags
```

## Release Flow

### 1. Development → RC

**Automatic when merging to main:**

```
PR merged → main
  ↓
Commit detected (feat/fix)
  ↓
Auto RC bump (0.4.5 → 0.4.6-rc.1)
  ↓
Publish to npm@next
  ↓
GitHub pre-release created
  ↓
Binary builds triggered
```

**Skips release for:**
- `docs:` commits
- `chore:` commits
- `style:` commits
- Version bump commits (prevents loops)

### 2. RC → Stable

**Manual promotion when ready:**

```bash
# Promote RC to stable
pnpm release:stable

# This will:
# 1. Remove -rc.X suffix (0.4.6-rc.1 → 0.4.6)
# 2. Publish to npm@latest
# 3. Create GitHub release (non-prerelease)
# 4. Trigger binary builds
```

## Available Commands

### Version Bumping

```bash
pnpm bump:patch       # 0.4.5 → 0.4.6-rc.1
pnpm bump:minor       # 0.4.5 → 0.5.0-rc.1
pnpm bump:major       # 0.4.5 → 1.0.0-rc.1
pnpm bump:rc          # 0.4.6-rc.1 → 0.4.6-rc.2
```

### Release Promotion

```bash
pnpm release:stable   # 0.4.6-rc.1 → 0.4.6
```

## What Gets Updated Automatically

When bumping versions, these files are updated:

- ✅ `package.json`
- ✅ `npx-cli/package.json`
- ✅ `frontend/package.json`
- ✅ All `Cargo.toml` files (excluding `upstream/`)
- ✅ `Cargo.lock` (if not ignored)
- ✅ `pnpm-lock.yaml`

## Workflows

### `.github/workflows/release.yml`

**Triggers:**
- Push to `main` (auto RC for feat/fix)
- PR merged to `main`
- Tag push (`v*`)
- Manual dispatch

**Actions:**
- Bump version
- Generate changelog
- Run tests (skipped for RC in CI)
- Publish to npm
- Create GitHub release
- Trigger binary builds

### `.github/workflows/build-all-platforms.yml`

**Triggered by:**
- Tag push
- Workflow dispatch
- Release workflow (for RCs)

**Builds:**
- Linux x64, ARM64
- macOS ARM64
- Windows x64

## NPM Tags

| Version Pattern | NPM Tag | Install Command |
|----------------|---------|-----------------|
| `0.4.6-rc.1`   | `next`  | `npm install automagik-forge@next` |
| `0.4.6`        | `latest`| `npm install automagik-forge` |

## Version Format

```
MAJOR.MINOR.PATCH-rc.RC_NUMBER

Examples:
- 0.4.6-rc.1    (RC)
- 0.4.6-rc.2    (RC)
- 0.4.6         (Stable)
- 0.5.0-rc.1    (RC for minor bump)
- 1.0.0-rc.1    (RC for major bump)
```

## Changelog Generation

Changelogs are generated automatically from commit messages:

**Conventional Commits:**
- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes
- Others → 📚 Other Changes

**Example:**

```markdown
## 0.4.6-rc.1

**2025-10-26**

### ✨ Features
- Add Genie Master Widget (02d8352)
- Update upstream to v0.0.110-namastex-3 (bfebccb)

### 🐛 Bug Fixes
- Resolve PostHog Node.js conflicts (02d8352)
- Suppress AJV warnings (387b0ea)

### 📊 Statistics
- **Total Commits**: 22
- **Contributors**: 1
```

## Manual Release (Advanced)

For special cases, you can manually trigger releases:

```bash
# Via GitHub Actions UI
Actions → 🚀 Unified Release → Run workflow

Options:
- bump-rc: Create new RC
- promote-to-stable: Promote RC to stable
- manual-tag: Publish specific tag
```

## Troubleshooting

### RC already exists

```bash
# Clean conflicting tags
git tag -d v0.4.6-rc.2
git push origin :refs/tags/v0.4.6-rc.2

# Then bump again
pnpm bump:rc
```

### Publish failed

```bash
# Check npm authentication
npm whoami

# Check if version exists
npm view automagik-forge@0.4.6-rc.1

# Manually publish
cd npx-cli
npm publish --tag next
```

### Binary builds not triggered

```bash
# Manually trigger
gh workflow run build-all-platforms.yml --ref v0.4.6-rc.1
```

## Comparison with Old System

| Old System | New System |
|-----------|-----------|
| Manual version bumps | Automatic RC bumps |
| Manual PR creation | Auto-triggered on merge |
| Workflow dispatch required | Runs automatically |
| Single npm tag | RC (@next) + Stable (@latest) |
| No changelog | Auto-generated changelog |

## Best Practices

1. **Use conventional commits** - Enables better changelogs
2. **Test RCs thoroughly** - Before promoting to stable
3. **Don't skip RCs** - Always go through RC → Stable
4. **Monitor CI** - Check GitHub Actions after merges
5. **Version stability** - Only promote to stable when confident

## References

- [automagik-genie release workflow](https://github.com/namastexlabs/automagik-genie/blob/main/.github/workflows/release.yml)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
