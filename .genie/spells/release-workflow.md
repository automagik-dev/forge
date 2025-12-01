---
name: Forge Release Workflow
description: Unified release system with RC builds, zero-rebuild promotion, and dual package publishing
---

# Forge Release Workflow

## Package Names (A/B Testing)

Forge publishes to multiple npm packages for A/B testing:

| Package | Status | Install Command |
|---------|--------|-----------------|
| `@automagik/forge` | Active (scoped) | `npx @automagik/forge` |
| `automagik` | Active (short) | `npx automagik` |
| `automagik-forge` | Deprecated | Do not use |

**Always check the NEW package names** when verifying npm status:
```bash
npm view @automagik/forge version
npm view automagik version
```

## Unified Release System

The release pipeline is orchestrated by `.github/workflows/release.yml`:

```
┌─────────────────────────────────────────────────────────────────┐
│ UNIFIED RELEASE WORKFLOW                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Triggers:                                                      │
│  ├── schedule: cron "0 4 * * *" (nightly builds)               │
│  └── workflow_dispatch: nightly | bump-rc | promote            │
│                                                                 │
│  Actions:                                                       │
│  ├── nightly    → 0.7.5-nightly.YYYYMMDD (@nightly tag)        │
│  ├── bump-rc    → 0.7.5-rc.1 → 0.7.5-rc.2 (@next tag)          │
│  └── promote    → 0.7.5-rc.2 → 0.7.5 (@latest tag, NO REBUILD) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Release Actions

### Nightly Builds (Automated)
- Runs at 4 AM UTC via cron schedule
- Creates version like `0.7.5-nightly.20251127`
- Publishes with `@nightly` npm tag
- Skips if no commits since last nightly

### RC (Release Candidate)
```bash
# From GitHub Actions UI:
# Actions → Unified Release → Run workflow → action: bump-rc

# Or trigger via gh CLI:
gh workflow run release.yml -f action=bump-rc
```

- Bumps version: `0.7.4 → 0.7.5-rc.1` or `0.7.5-rc.1 → 0.7.5-rc.2`
- Publishes with `@next` npm tag
- Full build on all platforms

### Promote to Stable (Zero-Rebuild)
```bash
# From GitHub Actions UI:
# Actions → Unified Release → Run workflow → action: promote

# Or trigger via gh CLI:
gh workflow run release.yml -f action=promote
```

- Promotes RC to stable: `0.7.5-rc.2 → 0.7.5`
- **NO REBUILD** - uses `npm dist-tag add` to move pointer
- Same binaries, just different npm tag
- Version in binary reads from package.json at runtime

## How Zero-Rebuild Promotion Works

1. **Runtime Version Detection**: Binary reads `FORGE_VERSION` env var set by CLI wrapper
2. **CLI Wrapper**: `npx-cli/bin/cli.js` reads version from `package.json` at startup
3. **Promotion**: `npm dist-tag add @automagik/forge@0.7.5-rc.2 latest`
4. **Result**: Same binary, correct version reported

```javascript
// npx-cli/bin/cli.js
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
process.env.FORGE_VERSION = pkg.version;
```

```rust
// forge-app/src/version.rs
pub fn get_version() -> &'static str {
    std::env::var("FORGE_VERSION").unwrap_or_else(|_| "unknown".to_string())
}
```

## npm Tag Strategy

| Version Type | @automagik/forge | automagik |
|--------------|------------------|-----------|
| Nightly | `@nightly` | `@nightly` |
| RC | `@next` | `@next` |
| Stable | `@latest` | `@latest` |

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
   gh run list --workflow="Unified Release" --limit 5
   gh run list --workflow="Build All Platforms" --limit 5
   ```

## Workflow Files

| File | Purpose |
|------|---------|
| `release.yml` | Unified release orchestrator (nightly, RC, promote) |
| `build-all-platforms.yml` | Build + publish (called by release.yml or direct tag push) |
| `build-android-apk.yml` | Separate Android APK builds |
| `test.yml` | PR tests |

## Troubleshooting

### Build failing
1. Check which platform failed in the workflow run
2. Look for Rust compilation errors or npm auth issues
3. For self-hosted runner issues, check CT 200 status

### npm publish failing
1. Verify NPM_TOKEN secret is set in GitHub
2. Check npm trusted publishing configuration
3. Verify version doesn't already exist: `npm view @automagik/forge@0.7.5`

### Promotion failing
1. Verify RC version exists: `npm view @automagik/forge@next`
2. Check that RC version matches expected stable version
3. Ensure npm-publish environment is configured

### Version mismatch after promotion
1. Binary reads version at runtime from `FORGE_VERSION` env var
2. CLI wrapper sets this from package.json
3. If mismatch, check that cli.js changes are deployed
