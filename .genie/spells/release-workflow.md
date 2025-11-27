---
name: Forge Release Workflow
description: How releases work in the Forge repository - triggers, packages, and common mistakes
---

# Forge Release Workflow

## Package Names (A/B Testing)

Forge publishes to multiple npm packages for A/B testing:

| Package | Status | Install Command |
|---------|--------|-----------------|
| `@automagik/forge` | ✅ Active (scoped) | `npx @automagik/forge` |
| `automagik` | ✅ Active (short) | `npx automagik` |
| `automagik-forge` | ❌ Deprecated | Do not use |

**Always check the NEW package names** when verifying npm status:
```bash
npm view @automagik/forge version
npm view automagik version
```

## Release Trigger Mechanism

The automated release pipeline triggers on **git tag push**, not PR merge.

```
┌─────────────────────────────────────────────────────────────────┐
│ RELEASE PIPELINE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  make publish --patch                                           │
│       ↓                                                         │
│  gh-build.sh dispatches pre-release-simple.yml                  │
│       ↓                                                         │
│  Workflow bumps versions (package.json + Cargo.toml)            │
│       ↓                                                         │
│  Creates annotated git tag (v0.x.x)                             │
│       ↓                                                         │
│  Tag push triggers build-all-platforms.yml                      │
│       ↓                                                         │
│  Builds Linux/Windows/macOS binaries                            │
│       ↓                                                         │
│  Publishes to npm with provenance                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key workflow files:**
- `.github/workflows/pre-release-simple.yml` - Version bump + tag creation
- `.github/workflows/build-all-platforms.yml` - Build + publish (triggers on `push: tags: ['v*']`)

## How to Release

### Standard Release (from main branch)
```bash
cd /root/repos/forge
make publish --patch    # For 0.7.4 → 0.7.5
make publish --minor    # For 0.7.x → 0.8.0
make publish --major    # For 0.x.x → 1.0.0
```

### A/B Test Release (from dev branch)
```bash
make publish-automagik
```

### Manual NPM Publish (when automated fails)
```bash
make npm RUN_ID=<github-actions-run-id>
```

## Common Mistakes

### ❌ Assuming PR merge = release
A "release 0.7.5" PR just merges code (dev → main). It does NOT:
- Bump version numbers
- Create git tags
- Trigger the build workflow
- Publish to npm

### ❌ Checking wrong package name
The old `automagik-forge` package is deprecated at v0.5.7.
Always check `@automagik/forge` or `automagik`.

### ❌ Expecting immediate publish after code merge
The build-all-platforms.yml only triggers on tag push.
Merging PRs doesn't create tags.

## Verification Checklist

Before declaring a release complete:

1. **Check git tags:**
   ```bash
   git tag -l "v0.7*" | tail -5
   ```

2. **Check npm versions:**
   ```bash
   npm view @automagik/forge dist-tags
   npm view automagik dist-tags
   ```

3. **Check workflow runs:**
   ```bash
   gh run list --workflow="Build All Platforms" --limit 5
   ```

## Troubleshooting

### Build All Platforms failing
1. Check which platform failed in the workflow run
2. Look for Rust compilation errors or npm auth issues
3. For self-hosted runner issues, check CT 200 status

### npm publish failing
1. Verify NPM_TOKEN secret is set in GitHub
2. Check npm trusted publishing configuration
3. Verify version doesn't already exist: `npm view @automagik/forge@0.7.5`

### Version mismatch
All these must match:
- `package.json` version
- `npx-cli/package.json` version
- `frontend/package.json` version
- `Cargo.toml` versions

The `pre-release-simple.yml` workflow updates all of these automatically.
