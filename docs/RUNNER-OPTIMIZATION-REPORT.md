# Self-Hosted Runner Optimization Report

**Date:** 2025-12-02
**Issue:** E2E CI taking 7-8 minutes despite 180 cores and 1TB RAM
**Workflow:** `.github/workflows/playwright-e2e.yml`
**PR:** #292

---

## Executive Summary

The Playwright E2E workflow on the self-hosted runner is taking **7-8 minutes per run** when it should complete in **2-3 minutes** given the available hardware (180 cores, 1TB RAM). The bottleneck is **Rust compilation** which is not utilizing the available parallelism.

---

## Current Performance Breakdown

| Step | Duration | Notes |
|------|----------|-------|
| Checkout | ~2s | Fast |
| Cache cargo | ~5s | Restoring ~2GB cache |
| Setup Node | ~3s | Fast |
| Install dependencies (pnpm) | ~3s | Cached |
| Install Playwright browsers | ~1s | Pre-installed |
| Build frontend | ~50s | Single-threaded Vite build |
| **Build backend (cargo)** | **5-6 min** | **BOTTLENECK** |
| Run Playwright tests | ~1 min | Actual tests |
| Upload artifacts | ~5s | Fast |

**Total: ~8 minutes** (should be ~2-3 minutes)

---

## Root Cause Analysis

### Problem 1: Cargo Not Using Available Cores

Rust/Cargo compilation is the main bottleneck. By default, `cargo build` uses `num_cpus` for parallelism, but:

1. **Container CPU limits** - If the runner is in a Docker container with CPU limits, cargo only sees the limited cores
2. **No explicit job parallelism** - We're not setting `CARGO_BUILD_JOBS` to force higher parallelism
3. **Linker bottleneck** - Even with parallel compilation, linking is often single-threaded

**Evidence:** Build backend step takes 5-6 minutes even with "cached" dependencies. A 180-core machine should compile forge-app in under 30 seconds.

### Problem 2: Cache Restoration Location

The cargo cache is being restored to:
```yaml
path: |
  ~/.cargo/registry
  ~/.cargo/git
  target
```

But `target` is a **relative path**, which means:
- If working directory changes between runs, cache misses
- If runner uses different checkout paths, cache misses

### Problem 3: Release Build Without LTO Skip

We're building with `--release` which by default may include LTO (Link-Time Optimization), which is:
- Single-threaded
- Extremely slow
- Not needed for E2E tests

### Problem 4: Potential I/O Bottleneck

Even with 1TB RAM and 180 cores, if the runner is on:
- Network-attached storage (NFS/NAS)
- Slow SSD/HDD
- Container with volume mounts

Cargo compilation is **I/O heavy** (reads/writes thousands of files).

---

## Recommended Fixes

### Fix 1: Force Cargo Parallelism (Immediate)

Add to workflow:
```yaml
- name: Build backend
  run: |
    source "$HOME/.cargo/env"
    cargo build --release --bin forge-app -j 64
  env:
    SQLX_OFFLINE: 'true'
    CARGO_BUILD_JOBS: 64
    RUSTFLAGS: "-C link-arg=-fuse-ld=lld"  # Use faster linker
```

### Fix 2: Install and Use LLD Linker (High Impact)

The default `ld` linker is single-threaded. LLD is parallel:

```bash
# On the runner, install lld:
sudo apt-get install -y lld

# Then in workflow, add RUSTFLAGS:
RUSTFLAGS="-C link-arg=-fuse-ld=lld"
```

**Expected improvement:** 50-70% faster linking

### Fix 3: Use sccache for Distributed Caching (High Impact)

Install [sccache](https://github.com/mozilla/sccache) on the runner:

```bash
cargo install sccache
export RUSTC_WRAPPER=sccache
export SCCACHE_DIR=/opt/sccache  # Persistent directory
```

Then in workflow:
```yaml
env:
  RUSTC_WRAPPER: sccache
  SCCACHE_DIR: /opt/sccache
```

**Expected improvement:** Near-instant builds after first compilation

### Fix 4: Absolute Cache Paths

Change cache configuration to use absolute paths:
```yaml
- name: Cache cargo
  uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      /opt/actions-runner-automagik/_work/forge/forge/target
    key: cargo-${{ runner.os }}-${{ hashFiles('Cargo.lock') }}
```

### Fix 5: Skip LTO for CI Builds

Add to `Cargo.toml` or use a CI-specific profile:
```toml
[profile.ci]
inherits = "release"
lto = false
codegen-units = 16
```

Then build with:
```bash
cargo build --profile ci --bin forge-app
```

### Fix 6: Pre-compile and Cache Binary (Nuclear Option)

Instead of compiling every run, cache the compiled binary:

```yaml
- name: Cache compiled binary
  uses: actions/cache@v4
  with:
    path: target/release/forge-app
    key: forge-app-${{ runner.os }}-${{ hashFiles('Cargo.lock', 'forge-app/**/*.rs') }}

- name: Build backend (if not cached)
  if: steps.cache-binary.outputs.cache-hit != 'true'
  run: cargo build --release --bin forge-app
```

---

## Runner Configuration Checklist

Please verify the following on the self-hosted runner:

### CPU Access
```bash
# Check available CPUs
nproc
cat /proc/cpuinfo | grep processor | wc -l

# If in Docker, check limits:
cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us
cat /sys/fs/cgroup/cpu/cpu.cfs_period_us
```

If `cfs_quota_us / cfs_period_us` is much less than 180, the container is CPU-limited.

### Disk Performance
```bash
# Quick I/O test
dd if=/dev/zero of=/tmp/test bs=1G count=1 oflag=direct
```

Should be >500MB/s for SSD.

### Memory
```bash
free -h
```

Verify cargo can use RAM for compilation (not swapping).

### Linker
```bash
which lld
ld.lld --version
```

If lld is not installed, install it.

### Cargo Configuration
```bash
cat ~/.cargo/config.toml
```

Should include:
```toml
[build]
jobs = 64  # Or appropriate number

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]
```

---

## Expected Results After Optimization

| Step | Current | Optimized |
|------|---------|-----------|
| Build backend | 5-6 min | 20-30s |
| Total workflow | 7-8 min | 2-3 min |

---

## Implementation Priority

1. **Immediate (5 min):** Add `CARGO_BUILD_JOBS=64` and `-j 64` flag
2. **Quick win (30 min):** Install lld, add RUSTFLAGS
3. **Medium effort (1 hour):** Set up sccache with persistent storage
4. **Long-term:** Binary caching, CI-specific Cargo profile

---

## Contact

For questions about this report or the workflow changes made in PR #292, reach out to the team.

---

## Appendix: Current Workflow Configuration

```yaml
# .github/workflows/playwright-e2e.yml (as of PR #292)
jobs:
  e2e:
    runs-on: [self-hosted, Linux, X64]
    timeout-minutes: 45

    steps:
      - uses: actions/checkout@v4

      - name: Cache cargo
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: cargo-${{ runner.os }}-${{ hashFiles('Cargo.lock') }}
          restore-keys: cargo-${{ runner.os }}-

      # ... (node setup, pnpm install, playwright install)

      - name: Build frontend
        run: cd frontend && pnpm build

      - name: Build backend
        run: |
          source "$HOME/.cargo/env"
          cargo build --release --bin forge-app
        env:
          SQLX_OFFLINE: 'true'

      - name: Setup test database directory
        run: mkdir -p dev_assets

      - name: Run Playwright tests
        env:
          SKIP_FRONTEND_BUILD: 'true'
          USE_RELEASE_BINARY: 'true'
        run: npx playwright test
```

## Appendix: Recent CI Runs

| Run ID | Duration | Result | Issue |
|--------|----------|--------|-------|
| 19848546110 | in progress | - | Latest with fixes |
| 19848342528 | 7m58s | failure | webServer timeout |
| 19848164312 | 7m4s | failure | missing dev_assets |
| 19847978688 | 8m0s | failure | missing DATABASE_URL |
| 19847893155 | 1m58s | failure | cargo not in PATH |

All failures after the first are **webServer startup issues**, not compilation. But **5-6 min of every run is still spent on Rust compilation** which should take 30 seconds on this hardware.
