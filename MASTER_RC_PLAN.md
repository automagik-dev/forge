# Master RC Plan: The Automagik Circuit 🪄

**Date:** December 1, 2025
**Objective:** Validate the End-to-End CI/CD Circuit for Forge Release Candidates.
**Context:** Branch `fix/dev-core-workspace-inheritance` contains uncommitted fixes for workspace inheritance.

---

## 🧙‍♂️ Council Review & Routing

### 1. Analysis of Current State (@architect)
*   **Observation:** Uncommitted changes in `.cargo/config.toml` and `Cargo.toml` indicate a fix for the `dev-core` mode (likely allowing `forge` to inherit dependencies/config from `forge-core` correctly).
*   **Verdict:** These changes are foundational. The "Circuit" cannot be tested if the build configuration is broken.
*   **Directive:** **COMMIT** immediately to stabilize the foundation.

### 2. The Circuit Blueprint (@deployer & @operator)
We are testing the "Full Circuit": `PR -> Merge -> RC Tag -> Build -> Sync`.

**The Pipeline:**
1.  **Code Ingestion:** Fixes committed to `fix/dev-core-workspace-inheritance`.
2.  **Integration:** PR created targeting `dev` (or the release branch).
3.  **Release Trigger:**
    *   `sync-forge-core-tag.yml`: listens for `forge-core` updates.
    *   `deploy-on-rc.yml`: listens for `release` events with `rc` tags.
4.  **Execution (The "Test"):** We will simulate the Release Candidate generation using `scripts/unified-release.cjs`.

### 3. Observability & Verification (@measurer)
How do we know it worked?
*   **Version Check:** Does `package.json` match `Cargo.toml`?
*   **Tag Check:** Is the git tag `vX.Y.Z-rc.N` created correctly?
*   **Dependency Check:** Does `forge` point to the correct `forge-core` version?

---

## 📜 Execution Plan

### Phase 1: Stabilization (Immediate Action)
- [ ] **Review Changes:** confirm `.cargo/config.toml` and `Cargo.lock` changes are valid.
- [ ] **Commit:** `fix: stabilize dev-core workspace inheritance configuration`
- [ ] **Verification:** Run `cargo check` to ensure the workspace resolves.

### Phase 2: Simulation (Local RC Generation)
- [ ] **Dry Run:** Execute `node scripts/unified-release.cjs --action bump-rc --dry-run`
    *   *Expectation:* Output shows version bumping from `X.Y.Z` to `X.Y.Z-rc.1` (or incrementing current RC).
- [ ] **Analysis:** Verify `deploy-on-rc.yml` conditions would be met by the generated tag.

### Phase 3: The Circuit (Remote Integration)
- [ ] **Push:** Push `fix/dev-core-workspace-inheritance` to origin.
- [ ] **PR:** Create a Pull Request (User Action or CLI).
- [ ] **Tag:** Manually trigger the `sync-forge-core-tag` workflow (or wait for event) if applicable, OR run the release script to push a real RC tag.

---

## 🗳️ Council Vote
*   **@architect:** APPROVE (pending commit)
*   **@sentinel:** PASS (no security implications seen in config changes)
*   **@deployer:** APPROVE (Proceed to Phase 2 immediately after commit)

**Next Step:** Execute Phase 1.
