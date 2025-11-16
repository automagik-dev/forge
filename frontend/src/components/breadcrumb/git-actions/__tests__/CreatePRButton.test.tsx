import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { CreatePRButton } from '../CreatePRButton';
import {
  createMockTask,
  createMockAttempt,
  createMockBranchStatus,
} from '@/test/mocks';

const mockNiceModalShow = vi.fn();

// Mock NiceModal
vi.mock('@ebay/nice-modal-react', () => ({
  default: {
    show: mockNiceModalShow,
  },
}));

describe('CreatePRButton', () => {
  const defaultProps = {
    task: createMockTask(),
    attempt: createMockAttempt(),
    branchStatus: createMockBranchStatus({ commits_ahead: 3 }),
    projectId: 'project-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility Logic', () => {
    it('should render when commits exist', () => {
      render(<CreatePRButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not render when no commits', () => {
      const branchStatus = createMockBranchStatus({ commits_ahead: 0 });
      const { container } = render(
        <CreatePRButton {...defaultProps} branchStatus={branchStatus} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when branchStatus is null', () => {
      const { container } = render(<CreatePRButton {...defaultProps} branchStatus={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with 1 commit', () => {
      const branchStatus = createMockBranchStatus({ commits_ahead: 1 });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Button Label', () => {
    it('should show "Create PR" label', () => {
      render(<CreatePRButton {...defaultProps} />);
      expect(screen.getByText('Create PR')).toBeInTheDocument();
    });

    it('should show GitPullRequest icon', () => {
      const { container } = render(<CreatePRButton {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Button States - No Conflicts', () => {
    it('should not be disabled when no conflicts', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: [],
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should display simple tooltip when no conflicts', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: [],
      });

      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByText(/Create pull request/i)).toBeInTheDocument();
      });
    });

    it('should show description in tooltip when no conflicts', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: [],
      });

      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(
          screen.getByText(/push your changes to the remote repository/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Button States - With Conflicts', () => {
    it('should be disabled when conflicts exist', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['file1.ts', 'file2.ts'],
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should display conflict warning tooltip', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['file1.ts'],
      });

      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(
          screen.getByText(/Your changes conflict with the target branch/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show description when conflicts exist', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['file1.ts'],
      });

      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(
          screen.queryByText(/push your changes to the remote repository/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should have opacity-50 class when disabled', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['file1.ts'],
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/opacity-50/);
    });

    it('should have cursor-not-allowed class when disabled', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['file1.ts'],
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/cursor-not-allowed/);
    });
  });

  describe('Click Behavior', () => {
    it('should show NiceModal with correct params when clicked', async () => {
      const user = userEvent.setup();
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockNiceModalShow).toHaveBeenCalledWith('create-pr', {
        attempt: defaultProps.attempt,
        task: defaultProps.task,
        projectId: 'project-123',
      });
    });

    it('should not trigger modal when button is disabled', async () => {
      const user = userEvent.setup();
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['file1.ts'],
      });

      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockNiceModalShow).not.toHaveBeenCalled();
    });

    it('should pass correct attempt data to modal', async () => {
      const user = userEvent.setup();
      const customAttempt = createMockAttempt({
        id: 'custom-attempt-id',
        target_branch: 'develop',
      });

      render(<CreatePRButton {...defaultProps} attempt={customAttempt} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockNiceModal.show).toHaveBeenCalledWith(
        'create-pr',
        expect.objectContaining({
          attempt: customAttempt,
        })
      );
    });

    it('should pass correct task data to modal', async () => {
      const user = userEvent.setup();
      const customTask = createMockTask({
        id: 'custom-task-id',
        title: 'Custom Task',
      });

      render(<CreatePRButton {...defaultProps} task={customTask} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockNiceModal.show).toHaveBeenCalledWith(
        'create-pr',
        expect.objectContaining({
          task: customTask,
        })
      );
    });
  });

  describe('Visual Styling', () => {
    it('should use blue color scheme', () => {
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/blue/);
    });

    it('should have correct height', () => {
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/h-6/);
    });

    it('should have correct padding', () => {
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/px-2/);
    });

    it('should have rounded corners', () => {
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/rounded-md/);
    });

    it('should have border', () => {
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/border/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single conflict file', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: ['single-file.ts'],
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should handle many commits', () => {
      const branchStatus = createMockBranchStatus({ commits_ahead: 100 });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should handle empty conflicted_files array', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: [],
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should handle undefined conflicted_files', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        conflicted_files: undefined as any,
      });
      render(<CreatePRButton {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Tooltip Content', () => {
    it('should show max-w-xs class on tooltip', async () => {
      const user = userEvent.setup();
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.className).toMatch(/max-w-xs/);
      });
    });

    it('should show text-xs class on tooltip', async () => {
      const user = userEvent.setup();
      render(<CreatePRButton {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.className).toMatch(/text-xs/);
      });
    });
  });
});
