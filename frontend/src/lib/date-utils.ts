/**
 * Utility functions for date formatting and calculations
 */

import { TaskWithAttemptStatus } from 'shared/types';

/**
 * Format a date to relative time string
 * @param date - Date object or ISO string
 * @returns Relative time string (e.g., "5 minutes ago", "2 weeks ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Handle future dates (shouldn't happen, but be safe)
  if (diffInMs < 0) {
    return formatAbsoluteDate(targetDate);
  }

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return 'just now';
  }

  // Less than 60 minutes
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than 24 hours
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Less than 7 days
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  // Less than 30 days
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // 30 days or more - show absolute date
  return formatAbsoluteDate(targetDate);
}

/**
 * Format a date to absolute date string (e.g., "Nov 11, 2025")
 * @param date - Date object
 * @returns Formatted date string
 */
function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the last activity date from a list of tasks
 * @param tasks - Array of tasks with attempt status
 * @returns Most recent activity date, or null if no tasks
 */
export function getLastActivityDate(tasks: TaskWithAttemptStatus[]): Date | null {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  // Find the most recent updated_at across all tasks
  const mostRecentTask = tasks.reduce((latest, task) => {
    const taskDate = new Date(task.updated_at);
    const latestDate = latest ? new Date(latest.updated_at) : new Date(0);
    return taskDate > latestDate ? task : latest;
  }, tasks[0]);

  return new Date(mostRecentTask.updated_at);
}
