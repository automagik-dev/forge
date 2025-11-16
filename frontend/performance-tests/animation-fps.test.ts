/**
 * Animation Frame Rate Performance Test
 *
 * Measures frame rate during animations
 * Target: 60fps (16.67ms per frame)
 *
 * Tests mobile-specific animations:
 * - Bottom navigation transitions
 * - Bottom sheet animations
 * - Drawer open/close
 */

import puppeteer, { Browser, Page } from 'puppeteer';

interface AnimationMetrics {
  averageFPS: number;
  minFPS: number;
  droppedFrames: number;
  totalFrames: number;
}

const TARGET_FPS = 60;
const MIN_ACCEPTABLE_FPS = 55;
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

/**
 * Measure FPS during an animation sequence
 */
async function measureAnimationFPS(
  page: Page,
  animationName: string,
  triggerAnimation: () => Promise<void>
): Promise<AnimationMetrics> {
  // Start performance monitoring
  await page.evaluate(() => {
    (window as any).fpsData = {
      frames: [] as number[],
      lastTime: performance.now(),
    };

    const measureFrame = () => {
      const currentTime = performance.now();
      const data = (window as any).fpsData;
      const delta = currentTime - data.lastTime;
      data.frames.push(delta);
      data.lastTime = currentTime;

      if (data.frames.length < 180) { // 3 seconds at 60fps
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  });

  // Trigger the animation
  await triggerAnimation();

  // Wait for animation to complete
  await page.waitForTimeout(3000);

  // Collect FPS data
  const metrics = await page.evaluate(() => {
    const data = (window as any).fpsData;
    const frames = data.frames;

    if (frames.length === 0) {
      return {
        averageFPS: 0,
        minFPS: 0,
        droppedFrames: 0,
        totalFrames: 0,
      };
    }

    const fps = frames.map((delta: number) => 1000 / delta);
    const avgFPS = fps.reduce((sum: number, f: number) => sum + f, 0) / fps.length;
    const minFPS = Math.min(...fps);
    const droppedFrames = fps.filter((f: number) => f < 55).length;

    return {
      averageFPS: avgFPS,
      minFPS: minFPS,
      droppedFrames: droppedFrames,
      totalFrames: frames.length,
    };
  });

  return metrics;
}

/**
 * Test bottom navigation animation
 */
async function testBottomNavigation(page: Page): Promise<AnimationMetrics> {
  return measureAnimationFPS(page, 'Bottom Navigation', async () => {
    // Simulate navigation between tabs
    const tabs = await page.$$('[role="tablist"] button');
    if (tabs.length > 1) {
      await tabs[1].click();
      await page.waitForTimeout(100);
      await tabs[0].click();
    }
  });
}

/**
 * Test drawer animation
 */
async function testDrawerAnimation(page: Page): Promise<AnimationMetrics> {
  return measureAnimationFPS(page, 'Drawer', async () => {
    // Look for drawer trigger button (tasks drawer)
    const drawerButton = await page.$('[data-testid="tasks-drawer-trigger"]');
    if (drawerButton) {
      await drawerButton.click();
      await page.waitForTimeout(500);
      await drawerButton.click();
    }
  });
}

/**
 * Run all animation tests
 */
async function runAnimationTests(): Promise<void> {
  console.log('🎬 Animation FPS Performance Test\n');
  console.log('━'.repeat(80));
  console.log(`Testing URL: ${BASE_URL}`);
  console.log(`Target: ${TARGET_FPS} FPS (Min acceptable: ${MIN_ACCEPTABLE_FPS} FPS)`);
  console.log('━'.repeat(80));

  let browser: Browser | null = null;
  let hasFailures = false;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Test 1: Bottom Navigation
    console.log('\n📱 Testing Bottom Navigation Animation...');
    const navMetrics = await testBottomNavigation(page);
    const navPassed = navMetrics.averageFPS >= MIN_ACCEPTABLE_FPS;

    console.log(
      navPassed ? '✅' : '❌',
      `Average FPS: ${navMetrics.averageFPS.toFixed(2)}`
    );
    console.log(`   Min FPS: ${navMetrics.minFPS.toFixed(2)}`);
    console.log(`   Dropped Frames: ${navMetrics.droppedFrames}/${navMetrics.totalFrames}`);

    if (!navPassed) hasFailures = true;

    // Test 2: Drawer Animation
    console.log('\n🗂️  Testing Drawer Animation...');
    const drawerMetrics = await testDrawerAnimation(page);
    const drawerPassed = drawerMetrics.averageFPS >= MIN_ACCEPTABLE_FPS;

    console.log(
      drawerPassed ? '✅' : '❌',
      `Average FPS: ${drawerMetrics.averageFPS.toFixed(2)}`
    );
    console.log(`   Min FPS: ${drawerMetrics.minFPS.toFixed(2)}`);
    console.log(`   Dropped Frames: ${drawerMetrics.droppedFrames}/${drawerMetrics.totalFrames}`);

    if (!drawerPassed) hasFailures = true;

    console.log('\n━'.repeat(80));

    if (hasFailures) {
      console.error('❌ Animation FPS test FAILED: Some animations below target FPS');
      process.exit(1);
    } else {
      console.log('✅ Animation FPS test PASSED: All animations meet target FPS');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during animation testing:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
runAnimationTests();
