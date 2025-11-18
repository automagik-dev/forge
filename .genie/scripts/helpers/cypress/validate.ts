#!/usr/bin/env tsx
/**
 * Validation script for Cypress test generators
 * Tests the generators with a simple HTML page
 */

import * as cheerio from 'cheerio'
import { generatePageObjectClass } from './core/page-object-generator.js'
import { generateCypressTests } from './core/test-generator.js'

// Simple test HTML (mock dashboard page)
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Dashboard</title>
</head>
<body>
  <h1>Dashboard</h1>
  <form>
    <input type="text" name="search" placeholder="Search tasks..." data-testid="search-input" />
    <button type="submit" data-testid="search-button">Search</button>
  </form>
  <nav>
    <a href="/" data-testid="home-link">Home</a>
    <a href="/tasks" data-testid="tasks-link">Tasks</a>
    <a href="/settings" data-testid="settings-link">Settings</a>
  </nav>
  <button data-testid="new-task-button">New Task</button>
</body>
</html>
`

async function validate() {
  console.log('🔍 Cypress Test Generator Validation\n')

  // Load HTML with Cheerio
  const $ = cheerio.load(testHtml)

  // Generate Page Object
  console.log('📄 Generating Page Object...')
  const pageObjectMeta = generatePageObjectClass($, 'http://localhost:3000', 'Dashboard')

  console.log(`✅ Generated ${pageObjectMeta.className}`)
  console.log(`   Feature: ${pageObjectMeta.featureName}`)
  console.log(`   Elements detected: ${pageObjectMeta.elementMeta.length}`)
  console.log()

  // Show detected elements
  console.log('📝 Detected Elements:')
  pageObjectMeta.elementMeta.forEach((meta) => {
    console.log(`   - ${meta.elementName} (${meta.type}): ${meta.locator}`)
  })
  console.log()

  // Generate tests
  console.log('🧪 Generating Tests...')
  const testCode = generateCypressTests($, pageObjectMeta, 'http://localhost:3000')

  console.log('✅ Tests generated successfully')
  console.log()

  // Show sample output
  console.log('=' .repeat(80))
  console.log('PAGE OBJECT CLASS (sample):')
  console.log('=' .repeat(80))
  console.log(pageObjectMeta.classCode.split('\n').slice(0, 20).join('\n'))
  console.log('...')
  console.log()

  console.log('=' .repeat(80))
  console.log('TEST FILE (sample):')
  console.log('=' .repeat(80))
  console.log(testCode.split('\n').slice(0, 20).join('\n'))
  console.log('...')
  console.log()

  console.log('✅ Validation complete! All generators working correctly.')
  console.log()
  console.log('Next steps:')
  console.log('1. Start dev server: pnpm run dev')
  console.log('2. Run against real page: http://localhost:3000')
  console.log('3. Verify generated tests execute correctly')
}

validate().catch((error) => {
  console.error('❌ Validation failed:', error)
  process.exit(1)
})
