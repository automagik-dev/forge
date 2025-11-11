# Performance Monitoring & Optimization Strategy

**Purpose:** Performance budgets, monitoring, and optimization guidelines for mobile app  
**Status:** 📋 Planning Complete  
**Last Updated:** 2025-11-11

---

## Table of Contents

1. [Performance Budgets](#performance-budgets)
2. [Monitoring Strategy](#monitoring-strategy)
3. [Optimization Techniques](#optimization-techniques)
4. [Bundle Analysis](#bundle-analysis)
5. [Runtime Performance](#runtime-performance)
6. [Network Performance](#network-performance)
7. [Testing & Validation](#testing--validation)

---

## 1. Performance Budgets

### 1.1 Bundle Size Targets

| Asset Type | Target | Maximum | Current | Status |
|------------|--------|---------|---------|--------|
| **Initial JS** | 200 KB | 250 KB | TBD | 🎯 Target |
| **Initial CSS** | 30 KB | 50 KB | TBD | 🎯 Target |
| **Total (gzipped)** | 300 KB | 500 KB | TBD | 🎯 Target |
| **Images** | 100 KB | 200 KB | TBD | 🎯 Target |
| **Fonts** | 50 KB | 100 KB | TBD | 🎯 Target |

**Measurement:**
```bash
# Build and analyze
npm run build
npx vite-bundle-visualizer

# Check gzipped sizes
du -sh dist/*.js | awk '{print $1}'
gzip -c dist/assets/*.js | wc -c
```

### 1.2 Runtime Performance Targets

| Metric | Target | Maximum | Device | Measurement |
|--------|--------|---------|--------|-------------|
| **First Paint (FP)** | <1.0s | 1.5s | 3G | Lighthouse |
| **First Contentful Paint (FCP)** | <1.2s | 1.8s | 3G | Lighthouse |
| **Largest Contentful Paint (LCP)** | <2.0s | 2.5s | 3G | Lighthouse |
| **Time to Interactive (TTI)** | <2.5s | 3.5s | 3G | Lighthouse |
| **Total Blocking Time (TBT)** | <200ms | 300ms | 3G | Lighthouse |
| **Cumulative Layout Shift (CLS)** | <0.1 | 0.25 | All | Lighthouse |
| **Frame Rate** | 60 FPS | 55 FPS | All | DevTools |
| **Animation Jank** | <5% | 10% | All | DevTools |

### 1.3 Network Performance Targets

| Metric | Target | Maximum | Network | Measurement |
|--------|--------|---------|---------|-------------|
| **API Response Time** | <200ms | 500ms | WiFi | Network tab |
| **API Response Time** | <500ms | 1000ms | 3G | Network tab |
| **WebSocket Latency** | <100ms | 200ms | WiFi | Custom |
| **Image Load Time** | <500ms | 1000ms | 3G | Network tab |

### 1.4 Memory Targets

| Metric | Target | Maximum | Device | Measurement |
|--------|--------|---------|--------|-------------|
| **Initial Memory** | <50 MB | 75 MB | Low-end | DevTools |
| **Peak Memory** | <150 MB | 200 MB | Low-end | DevTools |
| **Memory Leaks** | 0 | 0 | All | DevTools |

---

## 2. Monitoring Strategy

### 2.1 Performance Monitoring Service

**File:** `frontend/src/lib/performance/monitor.ts`

```typescript
import { Platform } from '../platform';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  // Web Vitals
  fcp?: number;  // First Contentful Paint
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay
  cls?: number;  // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  routeChangeTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
  
  // Device info
  platform: string;
  connection?: string;
  memory?: number;
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static observer: PerformanceObserver | null = null;

  /**
   * Initialize performance monitoring
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;

    // Web Vitals
    this.observeWebVitals();

    // Navigation timing
    this.observeNavigationTiming();

    // Resource timing
    this.observeResourceTiming();

    // Long tasks
    this.observeLongTasks();
  }

  /**
   * Observe Web Vitals
   */
  private static observeWebVitals(): void {
    // FCP - First Contentful Paint
    this.observeMetric('first-contentful-paint', (entry) => {
      this.recordMetric('fcp', entry.startTime);
    });

    // LCP - Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry) => {
      this.recordMetric('lcp', entry.startTime);
    });

    // FID - First Input Delay
    this.observeMetric('first-input', (entry: any) => {
      this.recordMetric('fid', entry.processingStart - entry.startTime);
    });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    this.observeMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        this.recordMetric('cls', clsValue);
      }
    });
  }

  /**
   * Observe navigation timing
   */
  private static observeNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // TTFB - Time to First Byte
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric('ttfb', ttfb);

        // DOM Content Loaded
        const dcl = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        this.recordMetric('domContentLoaded', dcl);

        // Load Complete
        const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
        this.recordMetric('loadComplete', loadComplete);
      }
    });
  }

  /**
   * Observe resource timing
   */
  private static observeResourceTiming(): void {
    this.observeMetric('resource', (entry: PerformanceResourceTiming) => {
      // Track slow resources
      if (entry.duration > 1000) {
        console.warn('Slow resource:', entry.name, entry.duration);
        
        this.sendToAnalytics('slow_resource', {
          url: entry.name,
          duration: entry.duration,
          type: entry.initiatorType
        });
      }
    });
  }

  /**
   * Observe long tasks
   */
  private static observeLongTasks(): void {
    try {
      this.observeMetric('longtask', (entry) => {
        console.warn('Long task detected:', entry.duration);
        
        this.sendToAnalytics('long_task', {
          duration: entry.duration,
          startTime: entry.startTime
        });
      });
    } catch (error) {
      // Long task API not supported
    }
  }

  /**
   * Observe specific metric type
   */
  private static observeMetric(
    type: string,
    callback: (entry: PerformanceEntry) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Record metric
   */
  private static recordMetric(name: string, value: number): void {
    const metric: PerformanceMetrics = {
      [name]: value,
      platform: Platform.getPlatform(),
      connection: this.getConnectionType(),
      memory: this.getMemoryUsage()
    };

    this.metrics.push(metric);

    // Send to analytics
    this.sendToAnalytics('performance_metric', {
      name,
      value,
      ...metric
    });
  }

  /**
   * Measure custom operation
   */
  static measure(name: string, fn: () => void | Promise<void>): void {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      result.then(() => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
      });
    } else {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    }
  }

  /**
   * Mark performance point
   */
  static mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Measure between marks
   */
  static measureBetween(name: string, startMark: string, endMark: string): void {
    try {
      performance.measure(name, startMark, endMark);
      
      const measure = performance.getEntriesByName(name)[0];
      this.recordMetric(name, measure.duration);
    } catch (error) {
      console.warn('Failed to measure:', error);
    }
  }

  /**
   * Get connection type
   */
  private static getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Get memory usage
   */
  private static getMemoryUsage(): number | undefined {
    const memory = (performance as any).memory;
    return memory?.usedJSHeapSize;
  }

  /**
   * Send to analytics
   */
  private static sendToAnalytics(event: string, data: any): void {
    // Send to PostHog, Sentry, or custom analytics
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event, data);
    }
  }

  /**
   * Get all metrics
   */
  static getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  React.useEffect(() => {
    PerformanceMonitor.initialize();
  }, []);

  const measure = (name: string, fn: () => void | Promise<void>) => {
    PerformanceMonitor.measure(name, fn);
  };

  const mark = (name: string) => {
    PerformanceMonitor.mark(name);
  };

  return {
    measure,
    mark,
    getMetrics: PerformanceMonitor.getMetrics
  };
}
```

### 2.2 Bundle Size Monitoring

**File:** `scripts/check-bundle-size.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const BUDGETS = {
  'index.js': 250 * 1024,      // 250 KB
  'index.css': 50 * 1024,      // 50 KB
  'total': 500 * 1024          // 500 KB
};

function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

function checkBundleSize() {
  const distDir = path.join(__dirname, '../dist/assets');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/assets directory not found. Run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  let totalSize = 0;
  let failed = false;

  console.log('\n📦 Bundle Size Report\n');
  console.log('File                                Size      Budget    Status');
  console.log('─'.repeat(70));

  for (const file of files) {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const size = getGzippedSize(filePath);
      totalSize += size;

      const budget = BUDGETS[file] || Infinity;
      const percentage = (size / budget * 100).toFixed(1);
      const status = size <= budget ? '✅' : '❌';

      if (size > budget) failed = true;

      console.log(
        `${file.padEnd(35)} ${formatSize(size).padEnd(9)} ${formatSize(budget).padEnd(9)} ${status} ${percentage}%`
      );
    }
  }

  console.log('─'.repeat(70));
  
  const totalBudget = BUDGETS.total;
  const totalPercentage = (totalSize / totalBudget * 100).toFixed(1);
  const totalStatus = totalSize <= totalBudget ? '✅' : '❌';
  
  if (totalSize > totalBudget) failed = true;

  console.log(
    `${'TOTAL'.padEnd(35)} ${formatSize(totalSize).padEnd(9)} ${formatSize(totalBudget).padEnd(9)} ${totalStatus} ${totalPercentage}%`
  );
  console.log('');

  if (failed) {
    console.error('❌ Bundle size exceeds budget!\n');
    process.exit(1);
  } else {
    console.log('✅ Bundle size within budget!\n');
  }
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

checkBundleSize();
```

### 2.3 Lighthouse CI Configuration

**File:** `.lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Mobile emulation
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 250000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 200000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 500000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

---

## 3. Optimization Techniques

### 3.1 Code Splitting

**Vite Configuration:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog'],
          
          // Feature chunks
          'mobile': [
            './src/components/mobile/BottomNavigation',
            './src/components/mobile/BottomSheet',
            './src/lib/gestures'
          ],
          'native': [
            './src/lib/native/camera',
            './src/lib/native/notifications',
            './src/lib/native/haptics'
          ],
          'offline': [
            './src/lib/offline/db',
            './src/lib/offline/queue',
            './src/lib/offline/sync'
          ]
        }
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500
  }
});
```

### 3.2 Lazy Loading

**Route-based code splitting:**

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const ProjectTasks = lazy(() => import('./pages/project-tasks'));
const Settings = lazy(() => import('./pages/Settings'));
const FullAttemptLogs = lazy(() => import('./pages/full-attempt-logs'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/projects/:id/tasks" element={<ProjectTasks />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/logs/:id" element={<FullAttemptLogs />} />
      </Routes>
    </Suspense>
  );
}
```

**Component-based lazy loading:**

```typescript
// Heavy components loaded on demand
const DiffViewer = lazy(() => import('./components/DiffViewer'));
const CodeEditor = lazy(() => import('./components/CodeEditor'));
const PreviewFrame = lazy(() => import('./components/PreviewFrame'));
```

### 3.3 Image Optimization

**Configuration:**

```typescript
// vite.config.ts
import imagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true }
        ]
      },
      webp: { quality: 80 }
    })
  ]
});
```

**Usage:**

```typescript
// Use WebP with fallback
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="..." loading="lazy" />
</picture>

// Lazy load images
<img 
  src="/placeholder.jpg" 
  data-src="/actual-image.jpg"
  loading="lazy"
  className="lazy-image"
/>
```

### 3.4 Tree Shaking

**Package.json configuration:**

```json
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

**Import optimization:**

```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only what's needed
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// ✅ Good - named imports
import { debounce, throttle } from 'lodash-es';
```

### 3.5 Memoization

**React optimization:**

```typescript
// Memoize expensive computations
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => a.priority - b.priority);
}, [tasks]);

// Memoize callbacks
const handleTaskClick = useCallback((taskId: string) => {
  navigate(`/tasks/${taskId}`);
}, [navigate]);

// Memoize components
const TaskCard = memo(({ task }: { task: Task }) => {
  return <div>{task.title}</div>;
});
```

---

## 4. Bundle Analysis

### 4.1 Analysis Tools

**Install:**
```bash
npm install --save-dev vite-bundle-visualizer
npm install --save-dev rollup-plugin-visualizer
```

**Configuration:**

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

**Usage:**
```bash
npm run build
# Opens stats.html in browser
```

### 4.2 Bundle Analysis Checklist

- [ ] Identify largest chunks
- [ ] Check for duplicate dependencies
- [ ] Verify tree shaking is working
- [ ] Check for unused code
- [ ] Verify code splitting strategy
- [ ] Check vendor chunk sizes
- [ ] Identify optimization opportunities

---

## 5. Runtime Performance

### 5.1 React DevTools Profiler

**Usage:**

```typescript
import { Profiler } from 'react';

function App() {
  const onRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <YourApp />
    </Profiler>
  );
}
```

### 5.2 Chrome DevTools Performance

**Recording:**
1. Open DevTools → Performance tab
2. Click Record
3. Perform actions
4. Stop recording
5. Analyze flame chart

**Key metrics to check:**
- Long tasks (>50ms)
- Layout thrashing
- Forced reflows
- Memory leaks
- Frame drops

### 5.3 Memory Profiling

**Heap snapshots:**
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare snapshots
6. Identify memory leaks

---

## 6. Network Performance

### 6.1 API Response Caching

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});
```

### 6.2 Request Batching

```typescript
// Batch multiple API calls
async function batchFetch(requests: Request[]): Promise<Response[]> {
  return Promise.all(requests.map(req => fetch(req)));
}

// Debounce API calls
const debouncedSearch = debounce(async (query: string) => {
  const results = await api.search(query);
  setResults(results);
}, 300);
```

### 6.3 Compression

**Vite configuration:**

```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
});
```

---

## 7. Testing & Validation

### 7.1 Performance Testing Script

**File:** `scripts/test-performance.sh`

```bash
#!/bin/bash

echo "🚀 Running performance tests..."

# Build app
echo "📦 Building app..."
npm run build

# Check bundle size
echo "📊 Checking bundle size..."
node scripts/check-bundle-size.js

# Run Lighthouse
echo "💡 Running Lighthouse..."
npm run lighthouse

# Check for console errors
echo "🔍 Checking for console errors..."
# Add custom script to check for errors

echo "✅ Performance tests complete!"
```

### 7.2 CI/CD Integration

**GitHub Actions:**

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main, dev]

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Check bundle size
        run: node scripts/check-bundle-size.js
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            // Post performance results to PR
```

### 7.3 Performance Testing Checklist

**Bundle Size:**
- [ ] Total bundle < 500 KB gzipped
- [ ] Initial JS < 250 KB gzipped
- [ ] Initial CSS < 50 KB gzipped
- [ ] No duplicate dependencies
- [ ] Tree shaking working

**Runtime Performance:**
- [ ] FCP < 1.8s on 3G
- [ ] LCP < 2.5s on 3G
- [ ] TTI < 3.5s on 3G
- [ ] TBT < 300ms
- [ ] CLS < 0.1
- [ ] 60 FPS during animations
- [ ] No memory leaks

**Network Performance:**
- [ ] API responses < 500ms
- [ ] WebSocket latency < 200ms
- [ ] Images optimized (WebP)
- [ ] Compression enabled
- [ ] Caching configured

**Mobile-Specific:**
- [ ] Touch response < 100ms
- [ ] Scroll performance 60 FPS
- [ ] Gesture recognition < 50ms
- [ ] Haptic feedback < 10ms
- [ ] Offline mode functional

---

## 8. Performance Optimization Roadmap

### Phase 1 (Weeks 1-2)
- [ ] Setup performance monitoring
- [ ] Configure bundle analysis
- [ ] Implement code splitting
- [ ] Add lazy loading

### Phase 2 (Weeks 3-5)
- [ ] Optimize images
- [ ] Implement caching strategy
- [ ] Add compression
- [ ] Optimize API calls

### Phase 3 (Weeks 6-8)
- [ ] Memory optimization
- [ ] Animation optimization
- [ ] Network optimization
- [ ] Offline optimization

### Phase 4 (Weeks 9-10)
- [ ] Final performance audit
- [ ] Fix remaining issues
- [ ] Validate against budgets
- [ ] Document optimizations

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Complete
