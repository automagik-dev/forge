# Upstream-as-Library Foundation Documentation

## Task 1 Completion Summary - 2025-09-21

### Overview
Successfully established the minimal scaffold for migrating automagik-forge to an upstream-as-library architecture. The repository now has the new directory structure in place with empty but compiling crates, ready for Task 2 feature extraction.

### Directory Structure Created

```
automagik-forge/
├── upstream/                           # Git submodule placeholder (README with instructions)
│   └── README.md                       # Submodule initialization instructions
│
├── forge-extensions/                   # Forge-specific features (scaffold ready)
│   ├── omni/                          # Omni notification system (to be populated in Task 2)
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── branch-templates/              # Branch template feature (to be populated in Task 2)
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── config/                        # Config v7 extensions (to be populated in Task 2)
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   └── genie/                         # Genie/Claude integration (to be populated in Task 2)
│       ├── Cargo.toml
│       └── src/lib.rs
│
├── forge-overrides/                   # Reserved for future conflicts
│   └── README.md                      # Guidelines for when to use
│
├── forge-app/                         # Main application compositor
│   ├── Cargo.toml                    # Dependencies on forge-extensions
│   └── src/
│       ├── main.rs                   # Application entry point
│       ├── router.rs                 # Health check endpoint
│       └── services/
│           └── mod.rs                # Service composition placeholder
│
├── frontend-forge/                    # New frontend (to be populated in Task 3)
│   ├── package.json                  # Minimal package.json
│   └── src/
│       └── index.html                # Placeholder HTML
│
└── [existing structure]               # Unchanged for now
    ├── crates/                       # Current backend (will become upstream in future)
    ├── frontend/                     # Current frontend (will become upstream in future)
    └── ...
```

### Verification Results

#### 1. Cargo Workspace Build ✅
```bash
$ cargo check --workspace
```
- **Result**: SUCCESS
- All crates compile including new forge-extensions and forge-app
- 2 minor warnings in forge-app (unused imports) - expected for scaffold
- Build time: ~49s (initial build with dependency downloads)

#### 2. Forge-App Check ✅
```bash
$ cargo check -p forge-app
```
- **Result**: SUCCESS
- forge-app binary compiles independently
- Ready for service composition in Task 2

#### 3. PNPM Install ✅
```bash
$ pnpm install
```
- **Result**: SUCCESS with expected warning
- Recognizes all 3 workspace projects (frontend, frontend-forge, npx-cli)
- Warning about lockfile is expected (read-only mode)
- All dependencies installed successfully

#### 4. Upstream Diff Audit ✅
```bash
$ ./scripts/run-upstream-audit.sh
```
- **Result**: SUCCESS
- Updated docs/upstream-diff-latest.txt with current fork differences
- Generated full patch file for reference
- Ready for comparison after migration

### Upstream Submodule Setup

Due to sandbox environment limitations, the upstream submodule is represented as a placeholder. To initialize it locally:

```bash
# From repository root
rm upstream/README.md
git submodule add https://github.com/BloopAI/vibe-kanban.git upstream
cd upstream && git checkout main && cd ..
git add .gitmodules upstream
git commit -m "Add upstream vibe-kanban as submodule"
```

Once initialized, update Cargo.toml to include upstream crates:
```toml
members = [
    # ... existing members ...
    "upstream/crates/*"  # Add this line
]
```

### Local Snapshot Workflow

To prepare for data migration testing (Tasks 2-3):

```bash
# Copy your local forge data for regression testing
./scripts/collect-forge-snapshot.sh

# This creates dev_assets_seed/forge-snapshot/from_home/
# The directory is git-ignored to protect sensitive data
```

### Important Notes

1. **No Business Logic Moved**: All forge features remain in their original locations. This task only creates the scaffold.

2. **No Upstream Modifications**: The upstream/ directory contains only documentation. No upstream code has been copied or modified.

3. **Backward Compatible**: The existing application continues to work unchanged. The new structure is additive only.

4. **Compilation Clean**: All verification commands pass, repository builds successfully with new structure.

### Task 2 Prerequisites

Before starting Task 2, ensure:

1. Upstream submodule is initialized (or understand the manual process)
2. Local snapshot is collected via `./scripts/collect-forge-snapshot.sh`
3. All current tests pass: `cargo test --workspace`
4. Baseline artifacts are preserved in `docs/regression/`

### Open Items for Task 2

1. **Feature Extraction**:
   - Extract Omni notification system to forge-extensions/omni
   - Extract branch templates to forge-extensions/branch-templates
   - Extract config v7 to forge-extensions/config
   - Extract Genie features to forge-extensions/genie

2. **Database Migration**:
   - Create auxiliary table schemas
   - Write migration scripts for forge-specific data
   - Implement compatibility views

3. **Service Composition**:
   - Wire forge-extensions into forge-app
   - Create service adapters for upstream integration
   - Implement API routing

### Files Modified in Task 1

- **Created**:
  - upstream/README.md
  - forge-extensions/*/Cargo.toml and src/lib.rs (4 crates)
  - forge-app/Cargo.toml and src/* files
  - forge-overrides/README.md
  - frontend-forge/package.json and src/index.html
  - docs/upstream-as-library-foundation.md (this file)

- **Modified**:
  - Cargo.toml (added new workspace members)
  - pnpm-workspace.yaml (added frontend-forge)

- **Updated by scripts**:
  - docs/upstream-diff-latest.txt (via run-upstream-audit.sh)
  - docs/upstream-diff-full.patch (via run-upstream-audit.sh)

### Success Criteria Met ✅

- [x] New directory skeleton exists with empty compiling crates
- [x] `cargo check --workspace` succeeds
- [x] `pnpm install` succeeds with expected warnings
- [x] Documentation explains snapshot collection process
- [x] Upstream diff artifacts generate cleanly
- [x] No forge business logic moved (Task 2 work)
- [x] No upstream files modified (only placeholder README)

## Summary

Task 1 has successfully established the foundation for the upstream-as-library migration. The scaffold is in place, all verification checks pass, and the repository is ready for Task 2 feature extraction. The existing application continues to function unchanged while the new architecture is built alongside it.