# Rust/Cargo Delta Inspection (fork vs upstream/main)

This document summarizes all Rust/Cargo differences between this fork and upstream `BloopAI/vibe-kanban@main`, so we can address them one by one.

## Legend
- Upstream: how it looks in upstream/main
- Fork: how it currently looks in this repository (HEAD)
- Impact: practical consequences or notes

---

## Remaining differences

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

---

## Suggested next steps (checklist)
1) Utils path logic: standardize on `directories` (upstream) vs `dirs`.
2) [intentionally kept] Theme additions (Dracula): no action needed.
3) EventService coupling: restore DB/entry_count fields or keep decoupled.
4) FileRanker cache policy: restore `Instant`-based aging or keep simplified.
5) Filesystem watcher: reintroduce `async_watch` if needed.
6) Cloud feature functions: restore `clone_repository` and `list_repositories` or keep leaner API.
7) Version numbers: align to upstream or keep forked versioning.

For any item, I can open precise diffs and propose an edit PR.
