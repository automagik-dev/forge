# Performance Test Suite

Automated performance validation tests for Automagik Forge frontend.

## Quick Start

```bash
# Build and measure bundle size (fastest)
pnpm run perf:baseline

# Run all performance tests (requires dev server)
pnpm run perf:all
```

## Test Coverage

### 1. Bundle Size Analysis (`bundle-size.test.ts`)

**Purpose:** Validate that JavaScript bundles stay within acceptable size limits

**Target:** <500KB gzipped per bundle

**Usage:**
```bash
pnpm run perf:bundle
```

**What it checks:**
- Gzipped size of all JavaScript bundles
- Total bundle size
- Per-bundle size limits
- Identifies oversized bundles

**Output:**
```
📦 Bundle Size Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ index-NmHeNSga.js
   Size: 3622.34 KB | Gzip: 1138.77 KB
   ⚠️  Exceeds limit by 638.77 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Lighthouse CI (`lighthouserc.js`)

**Purpose:** Comprehensive web performance audit

**Target:** >90 for all metrics (Performance, Accessibility, Best Practices, SEO)

**Prerequisites:** Development server must be running on `localhost:3000`

**Usage:**
```bash
# Terminal 1: Start dev server
pnpm run preview

# Terminal 2: Run Lighthouse
pnpm run perf:lighthouse
```

**What it checks:**
- Performance score (>90)
- Accessibility score (>90)
- Best Practices score (>90)
- SEO score (>90)
- First Contentful Paint (<1.5s)
- Largest Contentful Paint (<2.5s)
- Time to Interactive (<3s)
- Speed Index (<2s)
- Total Blocking Time (<300ms)
- Cumulative Layout Shift (<0.1)
- Resource budgets (JS, CSS, images, fonts)

**Configuration:** `lighthouserc.js`

### 3. Load Time Test (`load-time.test.ts`)

**Purpose:** Measure real-world page load performance

**Target:** <1.5s Time to Interactive (TTI)

**Prerequisites:** Development server must be running on `localhost:3000`

**Usage:**
```bash
# Terminal 1: Start dev server
pnpm run preview

# Terminal 2: Run load time test
pnpm run perf:load-time
```

**What it measures:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- DOM Content Loaded
- Load Complete
- Time to Interactive (TTI)

**Technology:** Uses Puppeteer to measure metrics in headless Chrome

### 4. Animation FPS Test (`animation-fps.test.ts`)

**Purpose:** Validate smooth 60 FPS animations

**Target:** 60 FPS (16.67ms per frame, minimum 55 FPS acceptable)

**Prerequisites:** Development server must be running on `localhost:3000`

**Usage:**
```bash
# Terminal 1: Start dev server
pnpm run preview

# Terminal 2: Run animation FPS test
pnpm run perf:animation
```

**What it tests:**
- Bottom Navigation transitions
- Drawer open/close animations
- Mobile layout animations
- Frame drop detection

**Technology:** Uses Puppeteer to profile animations in mobile viewport

## Test Configuration

### Environment Variables

```bash
# Override test URL (default: http://localhost:3000)
TEST_URL=http://localhost:3000 pnpm run perf:load-time
```

### Targets and Thresholds

All performance targets are defined in the test files:

- **Bundle Size:** `TARGET_GZIP_SIZE_KB = 500` (bundle-size.test.ts:22)
- **Load Time:** `TARGET_LOAD_TIME_MS = 1500` (load-time.test.ts:18)
- **Animation FPS:** `TARGET_FPS = 60`, `MIN_ACCEPTABLE_FPS = 55` (animation-fps.test.ts:16-17)
- **Lighthouse:** Configured in `lighthouserc.js`

## CI/CD Integration

### Current Status

✅ **Bundle Size** - Runs automatically on every build
⏳ **Lighthouse** - Pending CI integration
⏳ **Load Time** - Pending CI integration
⏳ **Animation FPS** - Pending CI integration

### GitHub Actions

Performance tests will be added to `.github/workflows/test.yml`:

```yaml
- name: Build frontend
  run: cd frontend && pnpm run build

- name: Bundle Size Check
  run: cd frontend && pnpm run perf:bundle

# Future: Add server-based tests
# - name: Start preview server
#   run: cd frontend && pnpm run preview &
#
# - name: Wait for server
#   run: npx wait-on http://localhost:3000
#
# - name: Run Lighthouse CI
#   run: cd frontend && pnpm run perf:lighthouse
```

## Bundle Visualization

After building, view an interactive visualization of your bundles:

```bash
pnpm run build
# Open frontend/dist/stats.html in browser
```

The visualizer shows:
- Size breakdown by module
- Gzipped and Brotli sizes
- Module dependencies
- Largest modules

## Interpreting Results

### Bundle Size

**✅ Pass:** All bundles under 500KB gzipped
**❌ Fail:** One or more bundles exceed 500KB gzipped

**When failing:**
1. Check `dist/stats.html` for largest modules
2. Look for opportunities to:
   - Lazy load large dependencies
   - Use dynamic imports
   - Replace heavy libraries
   - Remove unused code

### Load Time

**✅ Pass:** TTI < 1.5s
**❌ Fail:** TTI > 1.5s

**When failing:**
1. Check FCP and LCP metrics
2. Optimize critical rendering path
3. Reduce JavaScript execution time
4. Improve bundle size

### Lighthouse

**✅ Pass:** All scores > 90
**❌ Fail:** Any score < 90

**When failing:**
1. Review specific failing audits
2. Check Lighthouse report for recommendations
3. Focus on lowest-scoring category first

### Animation FPS

**✅ Pass:** Average FPS ≥ 55
**❌ Fail:** Average FPS < 55

**When failing:**
1. Check for dropped frames
2. Optimize animation performance:
   - Use CSS transforms instead of position
   - Avoid layout thrashing
   - Use `will-change` sparingly
   - Reduce JavaScript during animations

## Troubleshooting

### "Port 3000 already in use"

Kill existing process:
```bash
lsof -ti:3000 | xargs kill -9
```

### Puppeteer Installation Issues

Approve Puppeteer builds:
```bash
pnpm approve-builds
```

Or manually install Chromium:
```bash
npx puppeteer browsers install chrome
```

### "dist folder not found"

Build the frontend first:
```bash
pnpm run build
```

### Lighthouse CI Fails to Connect

Ensure preview server is running:
```bash
# Check if server is running
curl http://localhost:3000

# Restart preview server
pnpm run preview
```

## Performance Budget

Current performance budget (see `PERFORMANCE.md` for details):

| Resource | Budget |
|----------|--------|
| JavaScript (gzipped) | 500 KB |
| CSS (gzipped) | 100 KB |
| Images | 200 KB |
| Fonts | 100 KB |
| Total Page Weight | 1 MB |

## Related Documentation

- [PERFORMANCE.md](../PERFORMANCE.md) - Performance baselines and historical trends
- [vite.config.ts](../vite.config.ts) - Build configuration
- [Vite Bundle Analysis Guide](https://vitejs.dev/guide/build.html#load-performance)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)

## Contributing

### Adding New Performance Tests

1. Create test file in `performance-tests/`
2. Add npm script to `package.json`
3. Update this README
4. Update `PERFORMANCE.md` with new baseline
5. Add CI/CD integration

### Updating Performance Targets

1. Modify target constants in test files
2. Update `PERFORMANCE.md` targets table
3. Update this README
4. Document rationale in PR description
