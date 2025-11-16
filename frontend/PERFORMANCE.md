# Performance Baselines

**Last Updated:** 2025-11-16
**PR:** #159 Mobile Implementation (Phase 0-3)
**Purpose:** Track performance metrics and ensure mobile-first implementation meets targets

## Overview

This document tracks performance baselines and targets for the Automagik Forge frontend. Performance validation tests run automatically in CI/CD to prevent regressions.

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Bundle Size (gzipped) | <500 KB | ❌ 1,138.77 KB |
| Initial Load Time | <1.5s | ⚠️ Not measured |
| Lighthouse Performance | >90 | ⚠️ Not measured |
| Lighthouse Accessibility | >90 | ⚠️ Not measured |
| Lighthouse Best Practices | >90 | ⚠️ Not measured |
| Lighthouse SEO | >90 | ⚠️ Not measured |
| Animation Frame Rate | 60 FPS | ⚠️ Not measured |

## Current Measurements (2025-11-16)

### Bundle Size Analysis

**Measurement Date:** 2025-11-16
**Build Configuration:** Production build with Vite

#### Bundle Breakdown

| File | Size (KB) | Gzipped (KB) | Status |
|------|-----------|--------------|--------|
| `index-NmHeNSga.js` | 3,622.34 | 1,138.77 | ❌ Exceeds target by 638.77 KB |
| `web-CgTFttvH.js` | 1.50 | 0.71 | ✅ Within target |
| **Total** | **3,623.83** | **1,139.48** | **❌ Needs optimization** |

**Analysis:**
- Main bundle is 2.3x over the 500KB target
- Opportunities for improvement:
  - Code splitting for lazy-loaded routes
  - Dynamic imports for mobile-specific components
  - Tree-shaking unused dependencies
  - Analyzing large dependencies with `stats.html` visualizer

**Recommendation:** Implement code splitting strategy to break down the monolithic bundle into smaller chunks. Priority areas:
1. Mobile components (7 components, 1,403 lines)
2. Breadcrumb git-actions (4 components, 360 lines)
3. Route-based code splitting
4. Vendor bundle separation

### Load Time Metrics

**Status:** ⚠️ Not yet measured (requires running dev server)

**How to measure:**
```bash
# Terminal 1: Start development server
pnpm run preview

# Terminal 2: Run load time test
pnpm run perf:load-time
```

**Expected Metrics:**
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <1.5s
- DOM Content Loaded: Track baseline
- Load Complete: Track baseline

### Lighthouse Scores

**Status:** ⚠️ Not yet measured (requires running dev server)

**How to measure:**
```bash
# Terminal 1: Start development server
pnpm run preview

# Terminal 2: Run Lighthouse CI
pnpm run perf:lighthouse
```

**Target Scores (all >90):**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### Animation Performance

**Status:** ⚠️ Not yet measured (requires running dev server)

**Test Coverage:**
- Bottom Navigation transitions
- Bottom Sheet open/close animations
- Drawer animations
- Mobile layout transitions

**How to measure:**
```bash
# Terminal 1: Start development server
pnpm run preview

# Terminal 2: Run animation FPS test
pnpm run perf:animation
```

**Target:** Maintain 60 FPS (16.67ms per frame) during all animations

## Performance Test Suite

### Available Commands

```bash
# Build and measure bundle size
pnpm run perf:baseline

# Individual tests
pnpm run perf:bundle          # Bundle size analysis
pnpm run perf:lighthouse      # Lighthouse CI audit
pnpm run perf:load-time       # Load time measurement
pnpm run perf:animation       # Animation FPS testing

# Run all performance tests
pnpm run perf:all
```

### Test Files

- `performance-tests/bundle-size.test.ts` - Bundle size validation
- `performance-tests/lighthouserc.js` - Lighthouse CI configuration
- `performance-tests/load-time.test.ts` - Initial load time measurement
- `performance-tests/animation-fps.test.ts` - Frame rate profiling

### Bundle Visualization

After building, view the interactive bundle analyzer:
```bash
pnpm run build
# Open frontend/dist/stats.html in browser
```

## CI/CD Integration

Performance tests run automatically in CI/CD:

### Current CI Steps
1. ✅ Build frontend (`npm run build`)
2. ✅ Bundle size analysis (fails if >500KB gzipped)
3. ⚠️ Lighthouse CI (pending integration)
4. ⚠️ Load time validation (pending integration)

### GitHub Actions Configuration

Performance checks will be added to `.github/workflows/test.yml`:

```yaml
- name: Performance Tests
  run: |
    cd frontend
    npm run perf:baseline
    # Future: Add lighthouse and load-time tests
```

## Performance Budget

### Resource Limits

| Resource Type | Budget | Current | Status |
|---------------|--------|---------|--------|
| JavaScript (gzipped) | 500 KB | 1,138.77 KB | ❌ |
| CSS (gzipped) | 100 KB | 17.71 KB | ✅ |
| Images | 200 KB | TBD | - |
| Fonts | 100 KB | TBD | - |
| Total Page Weight | 1 MB | TBD | - |

### Metric Budgets

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint | 1.5s | TBD | - |
| Largest Contentful Paint | 2.5s | TBD | - |
| Time to Interactive | 1.5s | TBD | - |
| Total Blocking Time | 300ms | TBD | - |
| Cumulative Layout Shift | 0.1 | TBD | - |

## Historical Trends

### Bundle Size History

| Date | Version | Main Bundle (gzipped) | Change | Notes |
|------|---------|----------------------|--------|-------|
| 2025-11-16 | 0.7.2 | 1,138.77 KB | Baseline | Initial measurement for PR #159 |

## Optimization Roadmap

### Phase 1: Code Splitting (Target: -400KB)
- [ ] Implement route-based code splitting
- [ ] Lazy load mobile-specific components
- [ ] Separate vendor bundles
- [ ] Dynamic imports for large dependencies

### Phase 2: Dependency Analysis (Target: -100KB)
- [ ] Audit large dependencies in stats.html
- [ ] Replace heavy libraries with lighter alternatives
- [ ] Remove unused dependencies
- [ ] Tree-shake unused exports

### Phase 3: Asset Optimization (Target: -50KB)
- [ ] Optimize images and icons
- [ ] Implement lazy loading for images
- [ ] Use modern image formats (WebP, AVIF)
- [ ] Optimize font loading

### Phase 4: Runtime Performance
- [ ] Implement performance monitoring (Sentry)
- [ ] Add Core Web Vitals tracking
- [ ] Optimize animation performance
- [ ] Reduce JavaScript execution time

## Related Documentation

- [Vite Build Configuration](./vite.config.ts) - Build and bundle settings
- [Mobile Implementation PR #159](https://github.com/namastexlabs/automagik-forge/pull/159) - Context for performance requirements
- [Performance Test Suite](./performance-tests/) - Test implementation details

## Notes

### Known Issues
1. **Bundle Size:** Main bundle significantly exceeds 500KB target. Root cause: Monolithic bundle without code splitting.
2. **Missing Baselines:** Load time, Lighthouse, and animation metrics require running development server for measurement.

### Next Steps
1. ✅ Complete bundle size baseline measurement
2. ⏳ Measure load time and Lighthouse scores (requires dev server)
3. ⏳ Integrate performance tests into CI/CD
4. ⏳ Implement code splitting to reduce bundle size
5. ⏳ Set up performance monitoring in production
