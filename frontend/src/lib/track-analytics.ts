/**
 * Analytics tracking utilities for PostHog events
 * Centralized tracking functions to avoid PostHog instance prop drilling
 */

import posthog from 'posthog-js';
import type {
  KeyboardShortcutUsedEvent,
  KanbanTaskDraggedEvent,
  ChildTaskCreatedEvent,
  ParentTaskNavigatedEvent,
  TaskRelationshipViewerOpenedEvent,
  BreadcrumbClickedEvent,
  ExecutorSelectedEvent,
  TaskCreatedEvent,
  TaskCompletedEvent,
  FirstSuccessEvent,
  TokenUsageEvent,
} from '@/types/analytics';

// ========== NAMASTEX ANALYTICS ==========
// Automatic namastexer tracking for @namastex.ai accounts

/**
 * Check if user is a Namastexer
 * @namastex.ai accounts get full tracking (no opt-out)
 */
export function isNamestexEmployee(email?: string): boolean {
  return email?.endsWith('@namastex.ai') || false;
}

/**
 * Get current user email from PostHog
 */
export function getCurrentUserEmail(): string | undefined {
  const person = posthog.get_property('email');
  return person as string | undefined;
}

/**
 * Enhanced capture function with namastexer detection
 * Automatically adds namastexer metadata for @namastex.ai accounts
 */
function captureWithContext(eventName: string, properties: Record<string, any> = {}) {
  const userEmail = getCurrentUserEmail();
  const isNamestexer = isNamestexEmployee(userEmail);

  if (isNamestexer) {
    // ✅ FULL TRACKING for @namastex.ai
    posthog.capture(eventName, {
      ...properties,
      namastexer_email: userEmail,
      tracking_tier: 'namastexer',
    });
  } else {
    // ⚠️ MINIMAL TRACKING for external users (current behavior)
    posthog.capture(eventName, properties);
  }

  console.log('[Analytics]', eventName, properties);
}

// ========== END NAMASTEX ANALYTICS ==========

/**
 * Track keyboard shortcut usage
 * Call this whenever a keyboard shortcut is used
 */
export function trackKeyboardShortcut(event: KeyboardShortcutUsedEvent) {
  captureWithContext('keyboard_shortcut_used', event);
}

/**
 * Track kanban task drag event
 * @public - Analytics tracking API
 */
export function trackKanbanTaskDragged(event: KanbanTaskDraggedEvent) {
  captureWithContext('kanban_task_dragged', event);
}

/**
 * Track child task creation
 * @public - Analytics tracking API
 */
export function trackChildTaskCreated(event: ChildTaskCreatedEvent) {
  captureWithContext('child_task_created', event);
}

/**
 * Track parent task navigation
 * @public - Analytics tracking API
 */
export function trackParentTaskNavigated(event: ParentTaskNavigatedEvent) {
  captureWithContext('parent_task_navigated', event);
}

/**
 * Track task relationship viewer opened
 * @public - Analytics tracking API
 */
export function trackTaskRelationshipViewerOpened(
  event: TaskRelationshipViewerOpenedEvent
) {
  captureWithContext('task_relationship_viewer_opened', event);
}

/**
 * Track breadcrumb click
 * @public - Analytics tracking API
 */
export function trackBreadcrumbClicked(event: BreadcrumbClickedEvent) {
  captureWithContext('breadcrumb_clicked', event);
}

/**
 * Get first-use status for a feature from localStorage
 * Returns true if this is the first use, false otherwise
 * Updates localStorage after checking
 */
export function isFirstUse(featureName: string): boolean {
  const key = `first_use_${featureName}`;
  const hasUsed = localStorage.getItem(key);

  if (!hasUsed) {
    localStorage.setItem(key, 'true');
    return true;
  }

  return false;
}

/**
 * Check and track first successful task completion
 * Returns true if this is the first success (and tracks the event)
 * Returns false if already marked as having first success
 */
export function checkAndTrackFirstSuccess(
  taskId: string,
  executor: string,
  attemptCount: number
): boolean {
  const key = 'first_success_task_id';
  const hasFirstSuccess = localStorage.getItem(key);

  if (!hasFirstSuccess) {
    // Mark this task as the first success
    localStorage.setItem(key, taskId);

    // Calculate time since signup (stored when user first opens app)
    const signupKey = 'signup_timestamp';
    let signupTime = localStorage.getItem(signupKey);
    if (!signupTime) {
      signupTime = Date.now().toString();
      localStorage.setItem(signupKey, signupTime);
    }

    const daysSinceSignup = Math.floor(
      (Date.now() - parseInt(signupTime, 10)) / (1000 * 60 * 60 * 24)
    );
    const timeToFirstSuccessMinutes = Math.floor(
      (Date.now() - parseInt(signupTime, 10)) / (1000 * 60)
    );

    // Track the first success event
    trackFirstSuccess({
      time_to_first_success_minutes: timeToFirstSuccessMinutes,
      attempts_before_success: attemptCount,
      executor_used: executor as any,
      days_since_signup: daysSinceSignup,
    });

    return true;
  }

  return false;
}

/**
 * Track executor selection
 */
export function trackExecutorSelected(event: ExecutorSelectedEvent) {
  captureWithContext('executor_selected', event);
}

/**
 * Track task creation with executor info
 */
export function trackTaskCreated(event: TaskCreatedEvent) {
  captureWithContext('task_created', event);
}

/**
 * Track task completion with duration and outcome
 */
export function trackTaskCompleted(event: TaskCompletedEvent) {
  captureWithContext('task_completed', event);
}

/**
 * Track first successful task completion
 */
export function trackFirstSuccess(event: FirstSuccessEvent) {
  captureWithContext('first_success', event);
}

/**
 * Track token usage for API calls
 * @public - Analytics tracking API
 */
export function trackTokenUsage(event: TokenUsageEvent) {
  captureWithContext('token_usage', event);
}

/**
 * Utility: Hash a task ID for privacy
 * Returns first 16 chars of SHA256 hash
 * @public - Analytics utility
 */
export function hashTaskId(taskId: string): string {
  if (!taskId) return 'unknown';
  // Simple hash using TextEncoder and crypto - web standard approach
  // For now, use simple substring hash (sufficient for anonymization)
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    const char = taskId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
