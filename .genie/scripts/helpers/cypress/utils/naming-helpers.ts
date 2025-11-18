/**
 * Naming helpers for Cypress test generation
 * Extracted from cypress-mcp (lines 453-513)
 */

import type { CheerioAPI } from 'cheerio'

/**
 * Sanitize element name for use as JavaScript identifier
 * @param name Raw name from HTML attribute or text
 * @returns Sanitized name safe for use in code
 */
export function sanitizeElementName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_')
}

/**
 * Sanitize feature name for file naming
 * @param name Raw feature name
 * @returns Lowercase snake_case name
 */
export function sanitizeFeatureName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Capitalize first letter of string
 * @param str Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Infer a feature/page name from HTML content or URL
 * Extracted from cypress-mcp lines 468-509
 *
 * Priority order:
 * 1. Form name/id attribute
 * 2. Form legend text
 * 3. H1 heading text
 * 4. H2 heading text
 * 5. Page title
 * 6. URL path keywords (login, register, dashboard, etc.)
 * 7. Hostname keywords
 * 8. First URL path part
 * 9. Fallback: 'page'
 */
export function inferFeatureName($: CheerioAPI, url: string): string {
  // Try form name/id
  const formName = $('form').attr('name') || $('form').attr('id')
  if (formName) return sanitizeFeatureName(formName)

  // Try legend inside form
  const legend = $('form legend').first().text().trim()
  if (legend) return sanitizeFeatureName(legend)

  // Try h1/h2
  const h1 = $('h1').first().text().trim()
  if (h1) return sanitizeFeatureName(h1)

  const h2 = $('h2').first().text().trim()
  if (h2) return sanitizeFeatureName(h2)

  // Try page title
  const title = $('title').first().text().trim()
  if (title) return sanitizeFeatureName(title)

  // Try common keywords in URL or path
  const urlObj = new URL(url)
  const pathParts = urlObj.pathname.split('/').filter(Boolean)
  const keywords = [
    'login',
    'register',
    'signup',
    'signin',
    'user',
    'profile',
    'dashboard',
    'settings',
    'admin',
    'account',
    'reset',
    'forgot',
    'password',
    'contact',
    'about',
    'home'
  ]

  // Check path parts for keywords
  for (const part of pathParts) {
    for (const keyword of keywords) {
      if (part.toLowerCase().includes(keyword)) {
        return keyword
      }
    }
  }

  // Check hostname for keywords
  for (const keyword of keywords) {
    if (urlObj.hostname.toLowerCase().includes(keyword)) {
      return keyword
    }
  }

  // Fallback: use first path part
  if (pathParts.length > 0) {
    return sanitizeFeatureName(pathParts[0])
  }

  return 'page'
}

/**
 * Generate class name from URL
 * @param url Page URL
 * @returns PascalCase class name with 'Page' suffix
 */
export function generateClassName(url: string): string {
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '')
  const pathname = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '')

  let className = hostname.charAt(0).toUpperCase() + hostname.slice(1)
  if (pathname && pathname !== '/') {
    className += pathname.charAt(0).toUpperCase() + pathname.slice(1)
  }

  return `${className}Page`
}
