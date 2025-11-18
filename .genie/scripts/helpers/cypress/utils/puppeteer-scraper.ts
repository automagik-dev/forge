/**
 * Puppeteer Web Scraper
 * Extracted from cypress-mcp (lines 640-652)
 *
 * Scrapes web pages using Puppeteer and parses with Cheerio
 */

import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { ScraperOptions } from '../core/types.js'

/**
 * Scrape a web page and return Cheerio instance
 * @param options Scraper configuration
 * @returns Cheerio API instance with loaded HTML
 */
export async function scrapePage(options: ScraperOptions): Promise<CheerioAPI> {
  const browser = await puppeteer.launch({
    headless: options.headless ?? true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    await page.goto(options.url, {
      waitUntil: options.waitUntil ?? 'networkidle2',
      timeout: options.timeout ?? 30000
    })

    const html = await page.content()
    return cheerio.load(html)
  } finally {
    await browser.close()
  }
}

/**
 * Scrape multiple pages in parallel
 * @param urls Array of URLs to scrape
 * @param options Shared scraper options (except URL)
 * @returns Array of Cheerio instances
 */
export async function scrapePages(
  urls: string[],
  options: Omit<ScraperOptions, 'url'> = {}
): Promise<CheerioAPI[]> {
  const results = await Promise.all(
    urls.map((url) =>
      scrapePage({
        ...options,
        url
      })
    )
  )

  return results
}
