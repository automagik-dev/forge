# Version Management

This document explains how version numbers are managed in Automagik Forge.

## Version Sources

There are **two independent version systems** in this repository:

### 1. Forge Version (JavaScript + Forge Crates)
**Version**: `0.5.1-rc.1`

**Applies to**:
- Root `package.json`
- `npx-cli/package.json`
- `frontend/package.json`
- `forge-app/Cargo.toml` (Rust binary that wraps upstream server)
- `forge-extensions/config/Cargo.toml` (Forge config extension)
- `forge-extensions/omni/Cargo.toml` (Forge omni extension)

**Purpose**: Public-facing version for Automagik Forge releases.

### 2. Upstream Version (Upstream Crates)
**Version**: `0.0.113`

**Applies to**:
- `upstream/crates/server/Cargo.toml`
- `upstream/crates/db/Cargo.toml`
- `upstream/crates/executors/Cargo.toml`
- `upstream/crates/services/Cargo.toml`
- `upstream/crates/utils/Cargo.toml`
- `upstream/crates/local-deployment/Cargo.toml`
- `upstream/crates/deployment/Cargo.toml`

**Purpose**: Tracks the upstream vibe-kanban version in the submodule.

---

## How to Bump Versions

### Automated (Recommended) - GitHub Workflow

Use the GitHub Actions workflow for consistent version bumps:

1. Go to **Actions** → **Create GitHub Pre-Release**
2. Click **Run workflow**
3. Select version bump type:
   - `patch`: 0.5.1 → 0.5.2
   - `minor`: 0.5.1 → 0.6.0
   - `major`: 0.5.1 → 1.0.0
   - `prerelease`: 0.5.1-rc.1 → 0.5.1-rc.2

The workflow automatically:
- Bumps all JavaScript packages
- Bumps all Forge crates using `cargo set-version --workspace`
- Commits changes
- Creates a git tag
- Builds and publishes release

**Note**: The workflow uses `cargo set-version --workspace` which updates ALL workspace members. This includes both upstream and forge crates.

### Manual (If Needed)

If you must bump versions manually, **you MUST update all locations**:

```bash
# 1. Update JavaScript packages
NEW_VERSION="0.5.2-rc.1"
npm version $NEW_VERSION --no-git-tag-version --allow-same-version
cd npx-cli && npm version $NEW_VERSION --no-git-tag-version --allow-same-version && cd ..
cd frontend && npm version $NEW_VERSION --no-git-tag-version --allow-same-version && cd ..

# 2. Update Forge crates only (not upstream)
cargo set-version --package forge-app $NEW_VERSION
cargo set-version --package forge-config $NEW_VERSION
cargo set-version --package forge-omni $NEW_VERSION

# 3. Commit
git add package.json pnpm-lock.yaml npx-cli/package.json frontend/package.json
git add forge-app/Cargo.toml forge-extensions/*/Cargo.toml
git commit -m "chore: bump version to $NEW_VERSION"
```

**NEVER** manually bump only one location and forget the others!

---

## Verification

To verify all versions are in sync:

```bash
# Check JavaScript
echo "JS Versions:"
jq -r '.version' package.json npx-cli/package.json frontend/package.json

# Check Forge crates
echo "Forge Crate Versions:"
grep "^version" forge-app/Cargo.toml forge-extensions/*/Cargo.toml

# Check upstream crates (should be independent)
echo "Upstream Versions:"
grep "^version" upstream/crates/*/Cargo.toml
```

All Forge versions should match. Upstream versions are independent.

---

## Why Two Version Systems?

- **Forge version**: User-facing version for our fork
- **Upstream version**: Tracks the original vibe-kanban project we forked from
- Upstream versions are managed in the submodule and shouldn't be changed manually
- When we sync upstream, their version updates automatically via git submodule

---

## Common Issues

### ❌ Issue: Forge crates show old version
**Cause**: Versions were bumped manually without updating Cargo.toml files

**Fix**:
```bash
NEW_VERSION=$(jq -r '.version' package.json)
cargo set-version --package forge-app $NEW_VERSION
cargo set-version --package forge-config $NEW_VERSION
cargo set-version --package forge-omni $NEW_VERSION
```

### ❌ Issue: npm packages out of sync
**Cause**: One package.json was updated but not others

**Fix**:
```bash
NEW_VERSION=$(jq -r '.version' package.json)
cd npx-cli && npm version $NEW_VERSION --no-git-tag-version --allow-same-version && cd ..
cd frontend && npm version $NEW_VERSION --no-git-tag-version --allow-same-version && cd ..
```

---

## Best Practices

1. ✅ **ALWAYS** use the GitHub Actions workflow for version bumps
2. ✅ Verify versions after manual changes with the verification script above
3. ✅ Keep forge versions synchronized across all files
4. ❌ **NEVER** manually edit `upstream/crates/*/Cargo.toml` versions
5. ❌ **NEVER** bump only one package and forget the others
