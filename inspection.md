# Rust/Cargo Delta Inspection (fork vs upstream/main)

This document summarizes all Rust/Cargo differences between this fork and upstream `BloopAI/vibe-kanban@main`, so we can address them one by one.

## Legend
- Upstream: how it looks in upstream/main
- Fork: how it currently looks in this repository (HEAD)
- Impact: practical consequences or notes

---

## Root and Toolchain

### rust-toolchain.toml
- Upstream: `channel = "nightly-2025-05-18"`
- Fork: `channel = "stable"`
- Impact: Builds/tested on stable toolchain instead of pinned nightly. May hide nightly-only warnings or breakage that upstream expects.

What this file is and what “channel” means:
- `rust-toolchain.toml` is read by rustup/Cargo to select a toolchain automatically when you work in this repo. It ensures everyone and CI use the same Rust toolchain unless a workflow overrides it.
- `channel` selects which toolchain to use. Valid forms include:
  - `stable` (rolling latest stable at install/update time)
  - A pinned stable version like `"1.80.1"` (reproducible stable)
  - `beta` (rolling beta)
  - `nightly` (rolling nightly)
  - A dated nightly snapshot like `"nightly-YYYY-MM-DD"` (e.g., `nightly-2025-05-18`) for reproducible nightly

Difference between stable and nightly:
- Stable: Only stabilized language features; updated roughly every 6 weeks. No unstable features allowed without feature flags (which are rejected on stable).
- Nightly: Includes unstable features and the newest compiler/lints. Can change or break more frequently. Using a dated snapshot (e.g., `nightly-2025-05-18`) pins to an exact nightly build for reproducibility.

“What’s the date of the stable?”
- `stable` is not date-based; it tracks the current stable release on your machine. To make it reproducible, pin a specific version, e.g. `channel = "1.80.1"`.
- You can see the exact toolchain in use with:
```bash
rustc --version
rustup show active-toolchain
```

Current vs pinned nightly details (for reference):
- Active stable here: `rustc 1.89.0 (29483883e 2025-08-04)`
- Nightly snapshot `nightly-2025-05-18` maps to:
  - `rustc 1.89.0-nightly (777d37277 2025-05-17)`
  - `cargo 0.90.0-nightly (47c911e9e 2025-05-14)`

When to choose which:
- Use `stable` for maximum compatibility and fewer surprises.
- Use a pinned stable (e.g., `"1.80.1"`) for reproducible builds across machines/CI.
- Use a dated nightly (e.g., `"nightly-2025-05-18"`) if the code or dependencies rely on nightly-only features or specific nightly behavior, and you want reproducibility.

### Cross.toml (added)
- Upstream: not present
- Fork: adds cross compilation config (osxcross images, Windows/Linux cross images) and passes env for vendored libs (`OPENSSL_STATIC`, `LIBSQLITE3_SYS_USE_PKG_CONFIG`, `LIBZ_SYS_STATIC`).
- Impact: Enables cross builds locally/CI as configured; not part of upstream.

---

## Cargo manifests

### crates/server/Cargo.toml (version change only)
- Upstream: `version = "0.0.70"`, `git2 = "0.18"`
- Fork: `version = "0.3.3"`, `git2 = "0.18"`
- Impact: Version diverges for packaging; git2 usage matches upstream now.

### crates/services/Cargo.toml (version change only)
- Upstream: `version = "0.0.70"`, `git2 = "0.18"`
- Fork: `version = "0.3.3"`, `git2 = "0.18"`
- Impact: Version diverges; git2 usage matches upstream now.

### crates/utils/Cargo.toml
- Upstream: depends on `directories = "6.0.0"`
- Fork: adds `dirs = "5.0"` alongside `directories = "6.0.0"`
- Impact: Code uses both crates for paths; behavior may differ from upstream (see `utils/src/assets.rs`).

### crate versions (db, deployment, executors, local-deployment, utils)
- Upstream: `0.0.70`
- Fork: `0.3.3`
- Impact: Package version divergence only.

---

## Rust source changes

### crates/executors/src/logs/plain_text_processor.rs
- Upstream: includes `PlainTextBuffer::line_count()`
- Fork: method removed
- Impact: If any caller expects `line_count()`, it will fail. Otherwise, no functional change.

### crates/local-deployment/src/container.rs
- Upstream:
  - Has `async fn get_worktree_path(...)`
  - `process_file_changes(...)` takes `project_repo_path: &Path`
- Fork:
  - Removes `get_worktree_path(...)`
  - Renames parameter to `_project_repo_path` (unused) in `process_file_changes(...)`
- Impact: Removal suggests it was unused; underscore prevents warnings. Any external reliance on `get_worktree_path` would break.

### crates/services/src/services/config/versions/v1.rs
- Upstream: `ThemeMode` without `Dracula`
- Fork: adds `Dracula` variant
- Impact: Enables a new theme value in v1 config.

### crates/services/src/services/config/versions/v2.rs
- Upstream: `ThemeMode` without `Dracula`; `From<v1::ThemeMode>` lacks `Dracula` mapping
- Fork: adds `Dracula` and maps `v1::ThemeMode::Dracula → v2::ThemeMode::Dracula`
- Impact: Maintains forward-compatibility for the new theme; aligns with frontend changes.

### crates/services/src/services/events.rs
- Upstream: `EventService` has `db: DBService` and `entry_count: Arc<RwLock<usize>>`; constructor wires them
- Fork: removes those fields; constructor accepts but ignores the params
- Impact: Decouples event service from DB and counter tracking; any logic relying on these fields no longer runs.

### crates/services/src/services/file_ranker.rs
- Upstream: `RepoHistoryCache` stores `generated_at: Instant`
- Fork: removes `Instant` usage and field
- Impact: Time-based invalidation/aging removed; cache keyed on HEAD only (may be staler until HEAD changes).

### crates/services/src/services/filesystem_watcher.rs
- Upstream: uses `StreamExt` and contains `async_watch(...)` helper
- Fork: drops `StreamExt` usage and deletes `async_watch`
- Impact: Helper removed; if unused, no functional change. If referenced elsewhere, it would break.

### crates/services/src/services/git.rs
- Upstream: contains `#[cfg(feature = "cloud")] fn clone_repository(...)`
- Fork: removes that cloud-only helper
- Impact: If the `cloud` feature is enabled, this functionality is missing; otherwise neutral.

### crates/services/src/services/github_service.rs
- Upstream: contains `#[cfg(feature = "cloud")] async fn list_repositories(...)` and helper with retry
- Fork: removes those cloud-only methods
- Impact: Same as above—reduced API when `cloud` feature is enabled; otherwise neutral.

---

## Notable behavior change in utils assets path
- File: `crates/utils/src/assets.rs`
- Fork behavior:
  - Linux: `~/.automagik-forge`
  - Windows: `%APPDATA%\automagik-forge` (via `dirs::data_dir()`)
  - macOS: `~/Library/Application Support/automagik-forge` (via `directories::ProjectDirs`)
- Upstream likely relies solely on `directories`. Mixing `dirs` and `directories` may change path locations.

---

## Suggested next steps (checklist)
1) Decide on toolchain parity: keep `stable` or restore upstream `nightly-2025-05-18`.
2) Cross.toml: keep (local convenience) or remove for parity.
3) Utils path logic: standardize on `directories` (upstream) vs `dirs`.
4) Theme additions: keep `Dracula` or revert to upstream.
5) EventService coupling: restore DB/entry_count fields or keep decoupled.
6) FileRanker cache policy: restore `Instant`-based aging or keep simplified.
7) Filesystem watcher: reintroduce `async_watch` if needed.
8) Cloud feature functions: restore `clone_repository` and `list_repositories` or keep leaner API.
9) Version numbers: align to upstream or keep forked versioning.

For any item, I can open precise diffs and propose an edit PR.
