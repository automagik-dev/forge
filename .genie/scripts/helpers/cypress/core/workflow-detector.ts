/**
 * Workflow detection for common UI patterns
 * Extracted from cypress-mcp (lines 363-443)
 *
 * Detects:
 * - Login forms (password input + submit)
 * - Search forms (search input + submit)
 * - Registration forms (multiple inputs + submit)
 * - Navigation patterns
 */

import type { CheerioAPI } from 'cheerio'
import type { DetectedWorkflow } from './types.js'

/**
 * Detect login workflow
 */
export function detectLoginWorkflow($: CheerioAPI): DetectedWorkflow | null {
  const hasLoginForm =
    $('form').length > 0 &&
    ($('input[type="password"]').length > 0 || $('input[name*="password"]').length > 0)

  if (!hasLoginForm) return null

  return {
    type: 'login',
    method: `
    // Login workflow
    login(username: string, password: string): this {
        const usernameInput = this.getInputUsername ? this.getInputUsername() : this.getInputEmail()
        const passwordInput = this.getInputPassword()
        const submitButton = this.getButtonSubmit ? this.getButtonSubmit() : this.getButtonLogin()

        if (usernameInput) usernameInput.type(username)
        if (passwordInput) passwordInput.type(password)
        if (submitButton) submitButton.click()

        return this
    }`,
    elements: ['inputUsername', 'inputPassword', 'buttonSubmit']
  }
}

/**
 * Detect search workflow
 */
export function detectSearchWorkflow($: CheerioAPI): DetectedWorkflow | null {
  const hasSearchForm =
    $('input[type="search"]').length > 0 || $('input[placeholder*="search"]').length > 0

  if (!hasSearchForm) return null

  return {
    type: 'search',
    method: `
    // Search workflow
    search(query: string): this {
        const searchInput = this.getInputSearch ? this.getInputSearch() : this.getInputQuery()
        const searchButton = this.getButtonSearch ? this.getButtonSearch() : this.getButtonSubmit()

        if (searchInput) searchInput.type(query)
        if (searchButton) searchButton.click()

        return this
    }`,
    elements: ['inputSearch', 'buttonSearch']
  }
}

/**
 * Detect registration workflow
 */
export function detectRegisterWorkflow($: CheerioAPI): DetectedWorkflow | null {
  const hasRegistrationForm = $('form')
    .filter((_, f) => {
      const txt = $(f).text().toLowerCase()
      return (
        txt.includes('register') ||
        txt.includes('signup') ||
        txt.includes('create account') ||
        txt.includes('sign up')
      )
    })
    .length > 0

  if (!hasRegistrationForm) return null

  return {
    type: 'register',
    method: `
    // Registration workflow
    register(user: string, email: string, password: string): this {
        const userInput = this.getInputUsername ? this.getInputUsername() : (this.getInputUser ? this.getInputUser() : (this.getInputName ? this.getInputName() : this.getInputEmail ? this.getInputEmail() : null))
        const emailInput = this.getInputEmail ? this.getInputEmail() : null
        const passwordInput = this.getInputPassword ? this.getInputPassword() : (this.getInputPass ? this.getInputPass() : null)
        const submitButton = this.getButtonRegister ? this.getButtonRegister() : (this.getButtonSignup ? this.getButtonSignup() : (this.getButtonSubmit ? this.getButtonSubmit() : null))

        if (userInput) userInput.type(user)
        if (emailInput && email) emailInput.type(email)
        if (passwordInput) passwordInput.type(password)
        if (submitButton) submitButton.click()

        return this
    }`,
    elements: ['inputUsername', 'inputEmail', 'inputPassword', 'buttonRegister']
  }
}

/**
 * Generate common workflow methods (navigation, form submission, etc.)
 */
export function generateCommonWorkflows(url: string): string {
  const hostname = new URL(url).hostname

  return `
    // Navigation workflow
    navigateToHome(): this {
        const homeLink = this.getLinkHome ? this.getLinkHome() : this.getLinkLogo()
        if (homeLink) homeLink.click()
        return this
    }

    // Form submission workflow
    submitForm(): this {
        const submitButton = this.getButtonSubmit ? this.getButtonSubmit() : this.getButtonLogin()
        if (submitButton) submitButton.click()
        return this
    }

    // Wait for page load
    waitForPageLoad(): this {
        cy.wait(1000) // Adjust as needed
        return this
    }

    // Verify page loaded
    verifyPageLoaded(): this {
        cy.url().should('include', '${hostname}')
        return this
    }`
}

/**
 * Detect all workflows on the page
 */
export function detectAllWorkflows($: CheerioAPI, url: string): string[] {
  const workflows: string[] = []

  // Detect specific workflows
  const login = detectLoginWorkflow($)
  if (login) workflows.push(login.method)

  const search = detectSearchWorkflow($)
  if (search) workflows.push(search.method)

  const register = detectRegisterWorkflow($)
  if (register) workflows.push(register.method)

  // Add common workflows
  workflows.push(generateCommonWorkflows(url))

  return workflows
}
