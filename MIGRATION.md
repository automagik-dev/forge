# Migration Guide

## Upgrading to v0.7.3

### Overview
Version 0.7.3 introduces mobile native app (Phase 0-3), progressive disclosure tooltips, and critical WebSocket performance improvements. This guide helps you upgrade from v0.7.2.

---

### Required Actions

#### 1. Node.js 20+ Environment 🔴 REQUIRED

**Current Requirement:** Node.js >= 20 (CI currently runs Node 22)

**Why:** The repo root (`package.json`) and GitHub Actions workflows target Node 20+, and the pre-release pipeline currently provisions Node 22. Staying on 20.x or 22.x keeps parity with CI.

**How to Verify or Upgrade:**
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Optionally track Node 22 if you want parity with CI
nvm install 22
nvm alias default 22

# Verify version
node --version  # Should show v20.x.x or v22.x.x
```

**Alternative:** Download from [nodejs.org](https://nodejs.org/)

---

#### 2. Clean Dependency Install 🟡 RECOMMENDED

**Reason:** Dependency restructuring (Cypress 15.6.0, PostHog updates)

**Command:**
```bash
# Install using the checked-in pnpm-lock.yaml (do NOT delete it)
pnpm install

# Verify
pnpm run check
pnpm run lint
```

---

### Breaking Changes

#### 1. PostHog Telemetry Default On (Configurable) ⚠️ BREAKING

**Previous Behavior:**
- Could disable via `VITE_POSTHOG_API_KEY=""`
- Telemetry opt-out possible

**New Behavior:**
- Default-enabled with hardcoded API key, but respects user opt-out through Settings → Analytics
- PostHog project key: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`

**Why:**
- Project API key is write-only (safe for client-side)
- No sensitive data exposed
- Helps track app usage for improvements

**Impact:**
- Analytics starts enabled for new installs
- Users can disable it (toggles `config.analytics_enabled` used in `frontend/src/App.tsx`)

**Opt-out paths (choose one):**

1. **In-app toggle (preferred):** Settings → Analytics → disable “Allow Automagik to collect product analytics.”
2. **Config file:** Set `"analytics_enabled": false` inside `dev_assets/user-config.json`.
3. **Network-level blocking (last resort):** Block `us.i.posthog.com`.

**Hosts file example:**
```bash
# /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 us.i.posthog.com
```

**Browser extension:** Use uBlock Origin with custom filter:
```
||us.i.posthog.com^
```

**Proxy mode:** Route through analytics-blocking proxy

---

#### 2. Node.js Version Requirement ⚠️ BREAKING

**Previous:** Node.js 18+
**Now:** Node.js 22+

**Impact:** Users on Node.js 18/20 must upgrade (see upgrade instructions above)

---

### New Features

#### 1. Mobile Native App (Phase 0-3) 📱

**What's New:**
- Bottom navigation (Tasks, Chat, New, Me)
- Tasks list view (phase-based: WISH → FORGE → REVIEW → DONE)
- Universal design system (native + mobile web + desktop web)
- Bottom sheets (mobile-friendly modals)
- Persistent input bar (ChatGPT/Claude-style UX)
- FAB for quick actions

**How to Use:**
- Access on mobile browser (responsive design)
- Touch-optimized interactions
- Thumb-accessible navigation

**Related Files:**
- `frontend/src/components/mobile/TasksListView.tsx`
- `frontend/src/components/mobile/BottomNavigation.tsx`
- `frontend/src/components/mobile/MobileLayout.tsx`

---

#### 2. Progressive Disclosure Tooltip Strategy 🔧

**What's New:**
- 3-level tooltip system (Simple, Detailed, Contextual)
- Info icons on Git action buttons (Approve, Create PR, Push)
- Conflict warnings with file lists
- 5 languages (en, es, ja, ko, pt-BR)

**How to Use:**
- Hover over Git action buttons for simple tooltip
- Click info icon for detailed explanation
- Conflict tooltips appear automatically when conflicts detected

**Related Files:**
- `frontend/src/components/breadcrumb/git-actions/ApproveButton.tsx`
- `frontend/src/components/breadcrumb/git-actions/CreatePRButton.tsx`
- `frontend/src/i18n/locales/*/tasks.json`

---

#### 3. WebSocket Performance Improvements 🚀

**What Changed:**
- N+1 query problem fixed in agent filtering
- Batch query + O(1) HashSet lookup

**Impact:**
- **Before:** ~250ms for 10 tasks (25ms per task)
- **After:** ~10ms total (single batch query)
- **Improvement:** 25x faster for large task lists

**No migration needed** - Automatic performance improvement.

---

### Configuration Changes

#### 1. Port Configuration (Enhanced Documentation)

**New Environment Variables:**
- `BACKEND_PORT` - Backend server port (default: 3333)
- `FRONTEND_PORT` - Frontend dev server port (default: 5173)

**Makefile Enhancement:**
- Dynamic port discovery using `lsof`
- Automatic process detection
- Better error messages

**No breaking changes** - Existing setups continue to work.

---

#### 2. PUBLIC_BASE_URL (Enhanced Documentation)

**Clarification:**
- Used for frontend → backend communication
- Default: `http://localhost:3333`
- Must be set for production deployments

**Example (.env):**
```bash
PUBLIC_BASE_URL=https://api.example.com
```

---

### Critical Fixes

#### 1. WebSocket Agent Filtering Performance Fix

**Issue:** WebSocket agent filtering caused N database queries (one per task)

**Fix:** Batch query + O(1) HashSet lookup

**Impact:** 25x performance improvement for large task lists

**Location:** `forge-app/src/routes/ws.rs:66`

---

#### 2. Git Hooks Fast Unit Tests

**Issue:** Git hooks were running slow package validation tests

**Fix:** Pre-push hook now runs fast unit tests only

**Impact:** Faster commit/push workflow

---

### Troubleshooting

#### Problem: Node.js version mismatch
```
Error: Cypress requires Node.js 22+
```

**Solution:**
```bash
nvm use 22
# or upgrade Node.js from nodejs.org
```

---

#### Problem: Git submodule warnings (legacy clones only)
```
warning: Could not unset core.worktree setting in submodule 'upstream'
```

**Solution:** This applied only to repositories cloned before the upstream submodule was removed (≤ v0.6). If you still see the warning, remove the leftover metadata:
```bash
git submodule deinit -f upstream || true
rm -rf .git/modules/upstream
```
Fresh clones on v0.7.3+ can ignore this section.

---

#### Problem: PostHog telemetry concerns

**Solution:**
- Block `us.i.posthog.com` via hosts file (see Breaking Changes section)
- Note: Project API key is write-only, no sensitive data exposed

---

#### Problem: TypeScript errors after upgrade

**Solution:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run check
```

---

#### Problem: Cypress tests failing

**Solution:**
```bash
# Ensure Node.js 22
node --version

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Run tests
pnpm run test:e2e
```

---

### Rollback Instructions

If you need to rollback to v0.7.2:

```bash
git checkout v0.7.2
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Note:** Database migrations are backward-compatible for this release.

---

### Support

**Issues:** https://github.com/namastexlabs/automagik-forge/issues
**Discussions:** https://github.com/namastexlabs/automagik-forge/discussions
**Discord:** https://discord.gg/xcW8c7fF3R

---

### What's Next

**Upcoming (Phase 4+):**
- Offline support
- Full gesture system
- iOS native app
- Widgets and extensions

See our [Roadmap](https://github.com/orgs/namastexlabs/projects/9/views/1?filterQuery=project%3Aforge) for more details.
