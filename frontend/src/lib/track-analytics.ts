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
} from '@/types/analytics';

/**
 * Track keyboard shortcut usage
 * Call this whenever a keyboard shortcut is used
 */
export function trackKeyboardShortcut(event: KeyboardShortcutUsedEvent) {
  posthog.capture('keyboard_shortcut_used', event);
  console.log('[Analytics] keyboard_shortcut_used', event);
}

/**
 * Track kanban task drag event
 */
export function trackKanbanTaskDragged(event: KanbanTaskDraggedEvent) {
  posthog.capture('kanban_task_dragged', event);
  console.log('[Analytics] kanban_task_dragged', event);
}

/**
 * Track child task creation
 */
export function trackChildTaskCreated(event: ChildTaskCreatedEvent) {
  posthog.capture('child_task_created', event);
  console.log('[Analytics] child_task_created', event);
}

/**
 * Track parent task navigation
 */
export function trackParentTaskNavigated(event: ParentTaskNavigatedEvent) {
  posthog.capture('parent_task_navigated', event);
  console.log('[Analytics] parent_task_navigated', event);
}

/**
 * Track task relationship viewer opened
 */
export function trackTaskRelationshipViewerOpened(
  event: TaskRelationshipViewerOpenedEvent
) {
  posthog.capture('task_relationship_viewer_opened', event);
  console.log('[Analytics] task_relationship_viewer_opened', event);
}

/**
 * Track breadcrumb click
 */
export function trackBreadcrumbClicked(event: BreadcrumbClickedEvent) {
  posthog.capture('breadcrumb_clicked', event);
  console.log('[Analytics] breadcrumb_clicked', event);
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
