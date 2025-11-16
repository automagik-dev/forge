/**
 * Puppeteer Web Scraper
 * Scrapes web pages and returns parsed HTML for element detection
 *
 * Features:
 * - Headless browser launch
 * - Proper wait conditions (networkidle2)
 * - Modal handling (skipOnboarding)
 * - Mobile viewport support
 * - Error handling
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { ScrapeOptions } from '../types'

/**
 * Default scrape options
 */
const DEFAULT_OPTIONS: ScrapeOptions = {
  url: '',
  waitUntil: 'networkidle2',
  timeout: 30000,
  viewport: {
    width: 393,
    height: 852,
  },
  skipOnboarding: true,
}

/**
 * Launches Puppeteer browser
 */
async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  })
}

/**
 * Injects script to handle modals and overlays
 * Simulates the skipOnboarding() Cypress command
 */
async function handleModals(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Remove any fixed overlays
    const overlays = document.querySelectorAll('.fixed.inset-0')
    overlays.forEach(overlay => overlay.remove())

    // Try to set config to skip onboarding
    try {
      const config = {
        disclaimer_acknowledged: true,
        onboarding_acknowledged: true,
        github_login_acknowledged: true,
        telemetry_acknowledged: true,
        show_release_notes: false,
        showcases: {
          seen_features: [
            'mobile-pwa',
            'mobile-bottom-nav',
            'mobile-gestures',
            'all',
          ],
        },
      }

      // Try to set in localStorage
      localStorage.setItem('forge_config', JSON.stringify(config))

      // Try to set in sessionStorage
      sessionStorage.setItem('forge_config', JSON.stringify(config))
    } catch (err) {
      console.log('Could not set config in storage:', err)
    }
  })
}

/**
 * Waits for page to be ready (no loading spinners, overlays gone)
 */
async function waitForPageReady(page: Page, timeout: number = 10000): Promise<void> {
  try {
    // Wait for app root
    await page.waitForSelector('[data-testid="app-root"]', { timeout })

    // Wait a bit for any animations to complete
    await page.waitForTimeout(1000)

    // Check if there are still overlays and remove them
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('.fixed.inset-0')
      overlays.forEach(overlay => overlay.remove())
    })
  } catch (err) {
    console.log('Warning: Could not wait for app-root, continuing anyway')
  }
}

/**
 * Scrapes a web page and returns Cheerio instance
 */
export async function scrapePage(options: Partial<ScrapeOptions>): Promise<CheerioAPI> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!opts.url) {
    throw new Error('URL is required')
  }

  let browser: Browser | null = null
  let page: Page | null = null

  try {
    // Launch browser
    console.log(`Launching browser...`)
    browser = await launchBrowser()

    // Create new page
    page = await browser.newPage()

    // Set viewport (mobile by default)
    if (opts.viewport) {
      await page.setViewport(opts.viewport)
      console.log(`Set viewport: ${opts.viewport.width}x${opts.viewport.height}`)
    }

    // Navigate to URL
    console.log(`Navigating to: ${opts.url}`)
    await page.goto(opts.url, {
      waitUntil: opts.waitUntil,
      timeout: opts.timeout,
    })

    // Handle modals if requested
    if (opts.skipOnboarding) {
      console.log('Handling modals and overlays...')
      await handleModals(page)
    }

    // Wait for page to be ready
    console.log('Waiting for page to be ready...')
    await waitForPageReady(page, opts.timeout)

    // Get rendered HTML
    console.log('Extracting HTML...')
    const html = await page.content()

    // Close browser
    await browser.close()

    // Parse with Cheerio
    console.log('Parsing HTML with Cheerio...')
    const $ = cheerio.load(html)

    console.log('✓ Scraping complete!')
    return $
  } catch (error) {
    // Cleanup on error
    if (page) {
      try {
        await page.close()
      } catch (e) {
        // Ignore
      }
    }
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        // Ignore
      }
    }

    throw new Error(`Failed to scrape page: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Scrapes multiple pages in sequence
 */
export async function scrapePages(urls: string[], options?: Partial<ScrapeOptions>): Promise<CheerioAPI[]> {
  const results: CheerioAPI[] = []

  for (const url of urls) {
    console.log(`\n--- Scraping ${url} ---`)
    const $ = await scrapePage({ ...options, url })
    results.push($)
  }

  return results
}

/**
 * Takes a screenshot of a page (useful for debugging)
 */
export async function takeScreenshot(
  url: string,
  outputPath: string,
  options?: Partial<ScrapeOptions>
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  let browser: Browser | null = null
  let page: Page | null = null

  try {
    browser = await launchBrowser()
    page = await browser.newPage()

    if (opts.viewport) {
      await page.setViewport(opts.viewport)
    }

    await page.goto(url, {
      waitUntil: opts.waitUntil,
      timeout: opts.timeout,
    })

    if (opts.skipOnboarding) {
      await handleModals(page)
    }

    await waitForPageReady(page, opts.timeout)

    await page.screenshot({ path: outputPath, fullPage: true })
    console.log(`Screenshot saved to: ${outputPath}`)

    await browser.close()
  } catch (error) {
    if (page) await page.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})
    throw error
  }
}
