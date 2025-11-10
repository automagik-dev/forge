# Automagik Forge - Dev Branch Stability Fixes

**Date:** 2025-11-10  
**Tested:** Fresh clone of `dev` branch + `make dev`  
**Status:** ✅ All blocking issues resolved

---

## Issues Found & Fixed

### Issue #1: codex-protocol Thread Safety ✅ FIXED
**Severity:** CRITICAL - Blocks compilation  
**Location:** External dependency - `https://github.com/openai/codex.git` rev `488ec061`  
**File:** `codex-rs/protocol/src/num_format.rs:21`

**Error:**
```
error[E0277]: `Rc<Box<[u8]>>` cannot be sent between threads safely
   --> .cargo/git/checkouts/codex-.../src/num_format.rs:21:23
    |
 21 |     static FORMATTER: OnceLock<DecimalFormatter> = OnceLock::new();
    |                       ^^^^^^^^^^^^^^^^^^^^^^^^^^ `Rc<Box<[u8]>>` cannot be sent between threads safely
```

**Root Cause:**  
The ICU `DecimalFormatter` type contains non-thread-safe `Rc` pointers. Using it in a `static OnceLock` requires `Send + Sync`, which `Rc` doesn't implement.

**Fix Applied:**  
Modified `~/.cargo/git/checkouts/codex-9eee5d47a939c68c/488ec06/codex-rs/protocol/src/num_format.rs`:
- Removed `use std::sync::OnceLock`
- Changed from static caching to on-demand creation
- Renamed `fn formatter() -> &'static DecimalFormatter` to `fn create_formatter() -> DecimalFormatter`
- Updated call sites in `format_with_separators()` and `format_si_suffix()`

**Impact:**  
Minimal - formatter only used for UI number display, not performance-critical paths.

**Recommended Action for PR:**  
Create a patch file and use Cargo's `[patch]` mechanism or fork the codex repo.

---

### Issue #2: Missing Frontend Build ✅ FIXED
**Severity:** HIGH - Blocks compilation  
**Error:**
```
error[E0277]: the trait bound `Frontend: Embed` is not satisfied
  --> forge-app/src/router.rs:39
   |
39 | #[folder = "../frontend/dist"]
   | struct Frontend;
```

**Root Cause:**  
`forge-app` uses `rust-embed` to bundle `frontend/dist/`, but the directory didn't exist.

**Fix:**
```bash
cd frontend && pnpm run build
```

**Recommended Action for PR:**  
Update `make dev` or add build script to ensure frontend builds before backend.

---

### Issue #3: macOS AppKit Framework Linkage ✅ FIXED
**Severity:** HIGH - Blocks linking on macOS  
**Error:**
```
Undefined symbols for architecture arm64:
  "_OBJC_CLASS_$_NSImage", referenced from:
       in libmac_notification_sys-ac643d2698b5a7a9.rlib
ld: symbol(s) not found for architecture arm64
```

**Root Cause:**  
`mac-notification-sys` crate (transitive dependency via `notify-rust`) requires macOS AppKit framework, but linker wasn't configured to include it.

**Fix:**  
Created `.cargo/config.toml`:
```toml
[target.aarch64-apple-darwin]
rustflags = ["-C", "link-args=-framework AppKit"]

[target.x86_64-apple-darwin]
rustflags = ["-C", "link-args=-framework AppKit"]
```

**Recommended Action for PR:**  
Commit `.cargo/config.toml` to the repository.

---

## Verification

**Build Test:**
```bash
cargo clean
cargo build -p forge-app --bin forge-app
```
✅ **Result:** Compiled successfully in 2m 22s

**Note:** `make dev` times out after 60 seconds on fresh builds. This is a script configuration issue, not a compilation failure. The binary compiles successfully when given adequate time.

---

## Surgical PRs Recommended

### PR #1: Add macOS AppKit Framework Configuration
**Files:** `.cargo/config.toml` (new)
**Commit Message:**
```
fix: Add AppKit framework linkage for macOS builds

Adds .cargo/config.toml to link macOS AppKit framework, required by
mac-notification-sys transitive dependency. Fixes "Undefined symbols"
linker error on macOS (both arm64 and x86_64).

Fixes compilation on macOS by ensuring AppKit framework is linked.
```

### PR #2: Codex Protocol Thread Safety Patch
**Option A - Use Cargo Patch:**
Add to `Cargo.toml`:
```toml
[patch."https://github.com/openai/codex.git"]
codex-protocol = { path = "./patches/codex-protocol" }
```

**Option B - Fork and Fix:**
1. Fork `openai/codex`
2. Apply patch from `codex-protocol-fix.patch`
3. Update dependency in `upstream/crates/executors/Cargo.toml`

**Option C - Document Workaround:**
Add to README with steps to patch `~/.cargo/git/checkouts/...`

### PR #3: Improve Dev Script Timeout
**File:** `scripts/dev-with-dynamic-ports.js` or `Makefile`
**Change:** Increase backend startup timeout from 60s to 180s for fresh builds
**Also:** Add frontend build prerequisite

---

## Files Created/Modified

**New Files:**
- `.cargo/config.toml` - macOS framework configuration
- `FIXES_SUMMARY.md` - This document

**Modified Files (in Cargo cache):**
- `~/.cargo/git/checkouts/codex-9eee5d47a939c68c/488ec06/codex-rs/protocol/src/num_format.rs`

**Built Artifacts:**
- `frontend/dist/` - Frontend production build
- `target/debug/forge-app` - Backend binary

---

## Next Steps

1. Review this document with team
2. Decide on codex-protocol fix strategy (patch vs fork vs workaround)
3. Create PRs for `.cargo/config.toml` and dev script improvements
4. Update documentation with fresh clone setup steps
5. Consider CI/CD implications (cache the cargo git checkouts with patch applied)

