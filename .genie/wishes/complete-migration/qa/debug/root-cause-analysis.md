# NPM Package Deployment Root Cause Analysis

## Investigation Summary

Date: 2025-10-06
Status: Root cause identified

## Findings

### 1. Frontend Build Status ✅
**Hypothesis**: forge-app embedding wrong directory
**Verdict**: FALSE

Evidence:
- `forge-app/src/router.rs:35` correctly embeds `#[folder = "../frontend/dist"]`
- `frontend/dist/` contains properly built assets:
  - `index.html` (463 bytes) with correct asset references
  - `assets/index-B7z1qmx3.js` (2.8MB minified, 760 lines)
  - `assets/index-BMxr6zC8.css` (22K)
- Test server (forge-app) correctly serves:
  - `GET /` → Returns correct index.html
  - `GET /assets/index-B7z1qmx3.js` → Returns 2.8MB React bundle (HTTP 200)
  - Content includes React runtime, not minimal stub

### 2. Build Script Analysis ✅
**File**: `local-build.sh`
**Verdict**: Builds frontend correctly

```bash
# Line 29-30
echo "🔨 Building frontend with pnpm..."
pnpm --filter frontend build
```

Frontend is built BEFORE Rust binaries, ensuring `frontend/dist/` exists when rust-embed compiles.

### 3. Upstream vs Frontend Comparison ✅
**Evidence**:

`frontend/dist/index.html` (CORRECT):
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/forge.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Automagik Forge</title>
    <script type="module" crossorigin src="/assets/index-B7z1qmx3.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BMxr6zC8.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

`upstream/frontend/dist/index.html` (PLACEHOLDER):
```html
<!DOCTYPE html>
<html><head><title>Build frontend first</title></head>
<body><h1>Please build the frontend</h1></body></html>
```

### 4. Auto-Open Browser Investigation ❌
**Hypothesis**: Missing browser auto-open functionality
**Verdict**: TRUE - ROOT CAUSE

**Upstream behavior** (`upstream/crates/server/src/main.rs:90-101`):
```rust
if !cfg!(debug_assertions) {
    tracing::info!("Opening browser...");
    tokio::spawn(async move {
        if let Err(e) = open_browser(&format!("http://127.0.0.1:{actual_port}")).await {
            tracing::warn!(
                "Failed to open browser automatically: {}. Please open http://127.0.0.1:{} manually.",
                e,
                actual_port
            );
        }
    });
}
```

**Forge behavior** (`forge-app/src/main.rs`):
```rust
// Lines 42-43 - NO AUTO-OPEN
tracing::info!("Forge app listening on {}", actual_addr);
axum::serve(listener, app).await?;
```

**Missing**:
1. Import: `use utils::browser::open_browser;`
2. Auto-open logic after listener bind
3. Production mode check (`!cfg!(debug_assertions)`)

## Root Cause

**Primary Issue**: forge-app missing auto-open browser functionality present in upstream

**Secondary Issue**: User confusion about "blue screen" likely refers to:
- Browser NOT opening automatically → manual navigation required
- Possible confusion with dev vs prod modes

## Required Fixes

### Fix 1: Add Auto-Open Browser to forge-app

**File**: `forge-app/src/main.rs`

**Changes**:
1. Add import: `use utils::browser::open_browser;`
2. Add auto-open logic after listener bind (lines 40-42)

**Implementation**:
```rust
let actual_addr = listener.local_addr()?;
tracing::info!("Forge app listening on {}", actual_addr);

// Auto-open browser in release mode
if !cfg!(debug_assertions) {
    tracing::info!("Opening browser...");
    let url = format!("http://127.0.0.1:{}", actual_addr.port());
    tokio::spawn(async move {
        if let Err(e) = open_browser(&url).await {
            tracing::warn!(
                "Failed to open browser automatically: {}. Please open {} manually.",
                e,
                url
            );
        }
    });
}

axum::serve(listener, app).await?;
```

### Fix 2: No build script changes needed ✅
`local-build.sh` already builds frontend correctly.

### Fix 3: No router changes needed ✅
`forge-app/src/router.rs` already embeds correct dist directory.

## Validation Plan

1. Apply fix to `forge-app/src/main.rs`
2. Run `./local-build.sh`
3. Run `npm link` in `npx-cli/`
4. Run `npx automagik-forge`
5. Verify:
   - Browser opens automatically
   - Correct UI loads (Automagik Forge kanban)
   - No blue screen or placeholder content

## Evidence Files

- `served-index.html` - Actual HTML served by forge-app (✅ CORRECT)
- `root-cause-analysis.md` - This file
