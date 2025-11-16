import { vi } from 'vitest';
import type { TaskWithAttemptStatus, TaskAttempt, BranchStatus } from 'shared/types';

// Mock hooks
export const mockUseApproveTask = vi.fn(() => ({
  approve: vi.fn(),
  isApproving: false,
  error: null,
}));

export const mockUsePush = vi.fn(() => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
}));

// Mock NiceModal
export const mockNiceModal = {
  show: vi.fn(),
  hide: vi.fn(),
  remove: vi.fn(),
};

// Mock data factories
export function createMockTask(overrides?: Partial<TaskWithAttemptStatus>): TaskWithAttemptStatus {
  return {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'inreview',
    project_id: 'project-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    parent_task_attempt: null,
    running_attempt_id: null,
    latest_attempt_id: 'attempt-123',
    latest_attempt_status: 'completed',
    ...overrides,
  };
}

export function createMockAttempt(overrides?: Partial<TaskAttempt>): TaskAttempt {
  return {
    id: 'attempt-123',
    task_id: 'task-123',
    target_branch: 'main',
    task_branch: 'task/test-branch',
    base_commit: 'abc123',
    executor: 'CLAUDE_CODE',
    variant: 'default',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'completed',
    ...overrides,
  };
}

export function createMockBranchStatus(overrides?: Partial<BranchStatus>): BranchStatus {
  return {
    commits_ahead: 0,
    commits_behind: 0,
    remote_commits_ahead: 0,
    conflicted_files: [],
    merges: [],
    ...overrides,
  };
}

// Setup mock modules
export function setupMocks() {
  vi.mock('@/hooks/useApproveTask', () => ({
    useApproveTask: mockUseApproveTask,
  }));

  vi.mock('@/hooks/usePush', () => ({
    usePush: mockUsePush,
  }));

  vi.mock('@ebay/nice-modal-react', () => ({
    default: mockNiceModal,
  }));
}
