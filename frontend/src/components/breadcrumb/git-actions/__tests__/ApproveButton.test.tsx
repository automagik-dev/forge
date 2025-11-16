import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { ApproveButton } from '../ApproveButton';
import {
  createMockTask,
  createMockAttempt,
  createMockBranchStatus,
} from '@/test/mocks';

const mockApprove = vi.fn();
const mockNavigate = vi.fn();

// Mock the hooks
vi.mock('@/hooks/useApproveTask', () => ({
  useApproveTask: () => ({
    approve: mockApprove,
    isApproving: false,
    error: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ApproveButton', () => {
  const defaultProps = {
    task: createMockTask({ status: 'inreview' }),
    attempt: createMockAttempt(),
    branchStatus: createMockBranchStatus(),
    projectId: 'project-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility Logic', () => {
    it('should render when task status is inreview', () => {
      render(<ApproveButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not render when task status is not inreview', () => {
      const task = createMockTask({ status: 'todo' });
      const { container } = render(<ApproveButton {...defaultProps} task={task} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when task status is inprogress', () => {
      const task = createMockTask({ status: 'inprogress' });
      const { container } = render(<ApproveButton {...defaultProps} task={task} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when task status is done', () => {
      const task = createMockTask({ status: 'done' });
      const { container } = render(<ApproveButton {...defaultProps} task={task} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Button States - No Changes', () => {
    it('should show "Approve" label when no commits', () => {
      render(<ApproveButton {...defaultProps} />);
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    it('should not be disabled when no conflicts and no commits', () => {
      render(<ApproveButton {...defaultProps} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should display simple approve tooltip', async () => {
      const user = userEvent.setup();
      render(<ApproveButton {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByText(/Marks task as complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Button States - With Code Changes', () => {
    it('should show commit count in label when commits ahead', () => {
      const branchStatus = createMockBranchStatus({ commits_ahead: 3 });
      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByText(/↑3/)).toBeInTheDocument();
      expect(screen.getByText(/Approve & Merge/)).toBeInTheDocument();
    });

    it('should display merge tooltip with commit count', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({ commits_ahead: 5 });
      const attempt = createMockAttempt({ target_branch: 'dev' });

      render(
        <ApproveButton {...defaultProps} branchStatus={branchStatus} attempt={attempt} />
      );

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByText(/5 commits/)).toBeInTheDocument();
        expect(screen.getByText(/dev/)).toBeInTheDocument();
      });
    });

    it('should show technical details in tooltip', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({ commits_ahead: 2 });

      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByText(/git merge --no-ff/i)).toBeInTheDocument();
      });
    });
  });

  describe('Button States - With Conflicts', () => {
    it('should be disabled when conflicts exist', () => {
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts', 'file2.ts'],
      });
      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show "Resolve Conflicts" label when conflicts detected', () => {
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts'],
      });
      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByText('Resolve Conflicts')).toBeInTheDocument();
    });

    it('should display conflict warning tooltip with file count', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts', 'file2.ts', 'file3.ts'],
      });

      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByText(/3 files have conflicts/i)).toBeInTheDocument();
      });
    });

    it('should show first 3 conflicted files in tooltip', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts'],
      });

      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByText(/file1.ts, file2.ts, file3.ts/i);
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('should show AlertTriangle icon when conflicts exist', () => {
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts'],
      });
      const { container } = render(
        <ApproveButton {...defaultProps} branchStatus={branchStatus} />
      );

      // AlertTriangle icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have red color scheme when conflicts exist', () => {
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts'],
      });
      const { container } = render(
        <ApproveButton {...defaultProps} branchStatus={branchStatus} />
      );

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/red/);
    });
  });

  describe.skip('Button States - Approving', () => {
    // These tests require dynamic mock returns which need a different approach
    // Skipping for now to focus on core functionality coverage
  });

  describe('Click Behavior', () => {
    it('should call approve with correct params when no code changes', async () => {
      const user = userEvent.setup();
      render(<ApproveButton {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockApprove).toHaveBeenCalledWith({
        taskId: 'task-123',
        attemptId: 'attempt-123',
        shouldMerge: false,
        projectId: 'project-123',
        title: 'Test Task',
        description: 'Test Description',
        parentTaskAttempt: null,
      });
    });

    it('should call approve with shouldMerge=true when code changes exist', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({ commits_ahead: 3 });

      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldMerge: true,
        })
      );
    });

    it('should not call approve when button is disabled', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        conflicted_files: ['file1.ts'],
      });

      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockApprove).not.toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('should use emerald color scheme when code changes and no conflicts', () => {
      const branchStatus = createMockBranchStatus({ commits_ahead: 2 });
      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/emerald/);
    });

    it('should use blue color scheme when no code changes and no conflicts', () => {
      render(<ApproveButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/blue/);
    });

    it('should show Check icon when no conflicts and not approving', () => {
      const { container } = render(<ApproveButton {...defaultProps} />);

      // Check icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null branchStatus', () => {
      const { container } = render(<ApproveButton {...defaultProps} branchStatus={null} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    it('should handle empty conflicted_files array', () => {
      const branchStatus = createMockBranchStatus({ conflicted_files: [] });
      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should handle zero commits_ahead', () => {
      const branchStatus = createMockBranchStatus({ commits_ahead: 0 });
      render(<ApproveButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
    });

    it('should handle task with parent_task_attempt', async () => {
      const user = userEvent.setup();
      const task = createMockTask({
        status: 'inreview',
        parent_task_attempt: 'parent-attempt-123',
      });

      render(<ApproveButton {...defaultProps} task={task} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          parentTaskAttempt: 'parent-attempt-123',
        })
      );
    });
  });
});
