/**
 * Workflow Detection Logic
 * Extracts from cypress-mcp and adds Forge-specific patterns
 *
 * Detects common workflows:
 * - Login forms
 * - Search forms
 * - Registration forms
 * - Task creation (Forge-specific)
 * - PR creation (Forge-specific)
 * - Chat workflows (Forge-specific)
 */

import type { CheerioAPI } from 'cheerio'
import type { ElementMeta, WorkflowMeta } from '../types'

/**
 * Detects login workflow
 * Criteria: password input + submit button (username/email optional)
 */
export function detectLoginWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  const passwordInput = elements.find(
    el => el.type === 'input' && el.attributes.type === 'password'
  )

  const submitButton = elements.find(
    el => el.type === 'button' &&
    (el.attributes.type === 'submit' ||
     el.attributes.text?.toLowerCase().includes('login') ||
     el.attributes.text?.toLowerCase().includes('sign in'))
  )

  const usernameInput = elements.find(
    el => el.type === 'input' &&
    (el.attributes.name?.toLowerCase().includes('username') ||
     el.attributes.name?.toLowerCase().includes('email') ||
     el.attributes.type === 'email')
  )

  if (passwordInput && submitButton) {
    return {
      type: 'login',
      elements: [usernameInput, passwordInput, submitButton].filter(Boolean) as ElementMeta[],
      methodName: 'login',
      parameters: ['username', 'password'],
    }
  }

  return null
}

/**
 * Detects search workflow
 * Criteria: search input + submit button/icon
 */
export function detectSearchWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  const searchInput = elements.find(
    el => el.type === 'input' &&
    (el.attributes.name?.toLowerCase().includes('search') ||
     el.attributes.placeholder?.toLowerCase().includes('search') ||
     el.attributes.type === 'search')
  )

  const submitButton = elements.find(
    el => el.type === 'button' &&
    (el.attributes.type === 'submit' ||
     el.attributes.text?.toLowerCase().includes('search'))
  )

  if (searchInput) {
    return {
      type: 'search',
      elements: [searchInput, submitButton].filter(Boolean) as ElementMeta[],
      methodName: 'search',
      parameters: ['query'],
    }
  }

  return null
}

/**
 * Detects registration workflow
 * Criteria: multiple inputs (email, password, confirm password) + submit
 */
export function detectRegisterWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  const emailInput = elements.find(
    el => el.type === 'input' && el.attributes.type === 'email'
  )

  const passwordInputs = elements.filter(
    el => el.type === 'input' && el.attributes.type === 'password'
  )

  const submitButton = elements.find(
    el => el.type === 'button' &&
    (el.attributes.text?.toLowerCase().includes('register') ||
     el.attributes.text?.toLowerCase().includes('sign up') ||
     el.attributes.text?.toLowerCase().includes('create account'))
  )

  if (emailInput && passwordInputs.length >= 2 && submitButton) {
    return {
      type: 'register',
      elements: [emailInput, ...passwordInputs, submitButton],
      methodName: 'register',
      parameters: ['email', 'password', 'confirmPassword'],
    }
  }

  return null
}

/**
 * Detects task creation workflow (Forge-specific)
 * Criteria: title input + description textarea + create button
 */
export function detectTaskCreationWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  const titleInput = elements.find(
    el => el.type === 'input' &&
    (el.attributes.dataTestId?.includes('task-title') ||
     el.attributes.dataTestId?.includes('title') ||
     el.attributes.name?.includes('title'))
  )

  const descriptionTextarea = elements.find(
    el => el.type === 'textarea' &&
    (el.attributes.dataTestId?.includes('task-description') ||
     el.attributes.dataTestId?.includes('description') ||
     el.attributes.name?.includes('description'))
  )

  const createButton = elements.find(
    el => el.type === 'button' &&
    (el.attributes.dataTestId?.includes('create') ||
     el.attributes.text?.toLowerCase().includes('create'))
  )

  if (titleInput && createButton) {
    return {
      type: 'task-creation',
      elements: [titleInput, descriptionTextarea, createButton].filter(Boolean) as ElementMeta[],
      methodName: 'createTask',
      parameters: ['title', 'description'],
    }
  }

  return null
}

/**
 * Detects PR creation workflow (Forge-specific)
 * Criteria: branch selectors + PR title + submit
 */
export function detectPRCreationWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  const prButton = elements.find(
    el => el.type === 'button' &&
    (el.attributes.dataTestId?.includes('create-pr') ||
     el.attributes.dataTestId?.includes('pr') ||
     el.attributes.text?.toLowerCase().includes('create pr'))
  )

  const baseBranchSelect = elements.find(
    el => el.type === 'select' &&
    (el.attributes.dataTestId?.includes('base-branch') ||
     el.attributes.name?.includes('base'))
  )

  if (prButton || baseBranchSelect) {
    return {
      type: 'pr-creation',
      elements: [baseBranchSelect, prButton].filter(Boolean) as ElementMeta[],
      methodName: 'createPR',
      parameters: ['baseBranch'],
    }
  }

  return null
}

/**
 * Detects chat workflow (Forge-specific)
 * Criteria: message input + send button
 */
export function detectChatWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  const messageInput = elements.find(
    el => (el.type === 'input' || el.type === 'textarea') &&
    (el.attributes.dataTestId?.includes('message') ||
     el.attributes.dataTestId?.includes('chat') ||
     el.attributes.placeholder?.toLowerCase().includes('message'))
  )

  const sendButton = elements.find(
    el => el.type === 'button' &&
    (el.attributes.dataTestId?.includes('send') ||
     el.attributes.text?.toLowerCase().includes('send'))
  )

  if (messageInput && sendButton) {
    return {
      type: 'chat',
      elements: [messageInput, sendButton],
      methodName: 'sendMessage',
      parameters: ['message'],
    }
  }

  return null
}

/**
 * Detects all workflows on the page
 */
export function detectAllWorkflows(elements: ElementMeta[]): WorkflowMeta[] {
  const workflows: WorkflowMeta[] = []

  // Standard workflows
  const login = detectLoginWorkflow(elements)
  if (login) workflows.push(login)

  const search = detectSearchWorkflow(elements)
  if (search) workflows.push(search)

  const register = detectRegisterWorkflow(elements)
  if (register) workflows.push(register)

  // Forge-specific workflows
  const taskCreation = detectTaskCreationWorkflow(elements)
  if (taskCreation) workflows.push(taskCreation)

  const prCreation = detectPRCreationWorkflow(elements)
  if (prCreation) workflows.push(prCreation)

  const chat = detectChatWorkflow(elements)
  if (chat) workflows.push(chat)

  return workflows
}

/**
 * Generates workflow method code
 */
export function generateWorkflowMethod(workflow: WorkflowMeta, elements: ElementMeta[]): string {
  const params = workflow.parameters.join(', ')
  const elementLookup = new Map(elements.map(el => [el.elementName, el]))

  let methodBody = ''

  workflow.elements.forEach((element, index) => {
    const param = workflow.parameters[index]
    if (param && element.type !== 'button') {
      const capitalizedName = element.elementName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')

      if (element.type === 'input' || element.type === 'textarea') {
        methodBody += `    this.type${capitalizedName}(${param})\n`
      } else if (element.type === 'select') {
        methodBody += `    this.select${capitalizedName}(${param})\n`
      }
    } else if (element.type === 'button') {
      const capitalizedName = element.elementName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
      methodBody += `    this.click${capitalizedName}()\n`
    }
  })

  return `
  /**
   * ${workflow.type} workflow
   */
  ${workflow.methodName}(${params}: string) {
${methodBody}    return this
  }`
}
