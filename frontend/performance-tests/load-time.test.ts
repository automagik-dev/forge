/**
 * Load Time Performance Test
 *
 * Measures initial load time and Time to Interactive (TTI)
 * Target: <1.5s initial load
 *
 * This test uses Puppeteer to measure real-world load performance
 */

import puppeteer, { Browser, Page } from 'puppeteer';

interface LoadMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  domContentLoaded: number;
  loadComplete: number;
  timeToInteractive: number;
}

const TARGET_LOAD_TIME_MS = 1500;
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

/**
 * Measure page load metrics using Puppeteer
 */
async function measureLoadTime(url: string): Promise<LoadMetrics> {
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page: Page = await browser.newPage();

    // Enable performance tracking
    await page.evaluateOnNewDocument(() => {
      (window as any).performance.mark('page-start');
    });

    // Navigate to the page
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      const paintEntries = performance.getEntriesByType('paint');

      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
      const lcp = (performance as any).getEntriesByType('largest-contentful-paint')[0];

      return {
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? lcp.startTime : 0,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        timeToInteractive: timing.domInteractive - timing.navigationStart,
      };
    });

    return metrics;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Run multiple measurements and calculate average
 */
async function runLoadTimeTest(): Promise<void> {
  console.log('⏱️  Load Time Performance Test\n');
  console.log('━'.repeat(80));
  console.log(`Testing URL: ${BASE_URL}`);
  console.log(`Target: <${TARGET_LOAD_TIME_MS}ms initial load`);
  console.log('━'.repeat(80));
  console.log('\nRunning 3 test iterations...\n');

  const results: LoadMetrics[] = [];

  for (let i = 0; i < 3; i++) {
    console.log(`Run ${i + 1}/3...`);
    const metrics = await measureLoadTime(BASE_URL);
    results.push(metrics);
  }

  // Calculate averages
  const avgMetrics: LoadMetrics = {
    firstContentfulPaint: results.reduce((sum, m) => sum + m.firstContentfulPaint, 0) / results.length,
    largestContentfulPaint: results.reduce((sum, m) => sum + m.largestContentfulPaint, 0) / results.length,
    domContentLoaded: results.reduce((sum, m) => sum + m.domContentLoaded, 0) / results.length,
    loadComplete: results.reduce((sum, m) => sum + m.loadComplete, 0) / results.length,
    timeToInteractive: results.reduce((sum, m) => sum + m.timeToInteractive, 0) / results.length,
  };

  console.log('\n━'.repeat(80));
  console.log('Average Metrics:');
  console.log('━'.repeat(80));

  const formatMetric = (name: string, value: number, target?: number): string => {
    const status = target && value > target ? '❌' : '✅';
    const comparison = target ? ` (target: <${target}ms)` : '';
    return `${status} ${name}: ${value.toFixed(2)}ms${comparison}`;
  };

  console.log(formatMetric('First Contentful Paint', avgMetrics.firstContentfulPaint));
  console.log(formatMetric('Largest Contentful Paint', avgMetrics.largestContentfulPaint));
  console.log(formatMetric('DOM Content Loaded', avgMetrics.domContentLoaded));
  console.log(formatMetric('Load Complete', avgMetrics.loadComplete));
  console.log(formatMetric('Time to Interactive', avgMetrics.timeToInteractive, TARGET_LOAD_TIME_MS));

  console.log('━'.repeat(80));

  if (avgMetrics.timeToInteractive > TARGET_LOAD_TIME_MS) {
    const excess = avgMetrics.timeToInteractive - TARGET_LOAD_TIME_MS;
    console.error(`\n❌ Load time test FAILED: TTI exceeds target by ${excess.toFixed(2)}ms`);
    process.exit(1);
  } else {
    console.log('\n✅ Load time test PASSED: All metrics within targets');
    process.exit(0);
  }
}

// Run the test
runLoadTimeTest().catch(error => {
  console.error('Error running load time test:', error);
  process.exit(1);
});
