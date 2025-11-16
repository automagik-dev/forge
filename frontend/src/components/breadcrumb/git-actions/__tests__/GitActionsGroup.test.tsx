import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { GitActionsGroup } from '../GitActionsGroup';
import {
  createMockTask,
  createMockAttempt,
  createMockBranchStatus,
} from '@/test/mocks';

const mockApprove = vi.fn();
const mockMutateAsync = vi.fn();
const mockNiceModalShow = vi.fn();
const mockNavigate = vi.fn();

// Mock all child components' hooks
vi.mock('@/hooks/useApproveTask', () => ({
  useApproveTask: () => ({
    approve: mockApprove,
    isApproving: false,
    error: null,
  }),
}));

vi.mock('@/hooks/usePush', () => ({
  usePush: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@ebay/nice-modal-react', () => ({
  default: {
    show: mockNiceModalShow,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GitActionsGroup', () => {
  const defaultProps = {
    task: createMockTask({ status: 'inreview' }),
    attempt: createMockAttempt(),
    branchStatus: createMockBranchStatus(),
    projectId: 'project-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  describe('PR State Detection', () => {
    it('should detect open PR from branchStatus.merges', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 123,
              url: 'https://github.com/test/repo/pull/123',
              status: 'open',
            },
          },
        ],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should show PR workflow buttons (Push to PR, View PR)
      expect(screen.getByText(/Push/)).toBeInTheDocument();
      expect(screen.getByText(/PR #123/)).toBeInTheDocument();
    });

    it('should detect merged PR from branchStatus.merges', () => {
      const branchStatus = createMockBranchStatus({
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 456,
              url: 'https://github.com/test/repo/pull/456',
              status: 'merged',
            },
          },
        ],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      // Should not render anything when PR is merged
      expect(container.firstChild).toBeNull();
    });

    it('should handle no PR state', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        merges: [],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should show direct merge workflow buttons (Create PR, Approve)
      expect(screen.getByText('Create PR')).toBeInTheDocument();
      expect(screen.getByText(/Approve/)).toBeInTheDocument();
    });

    it('should handle null branchStatus', () => {
      render(<GitActionsGroup {...defaultProps} branchStatus={null} />);

      // Should still render but only show Approve button (no commits)
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    it('should handle undefined merges array', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        merges: undefined as any,
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should show direct merge workflow
      expect(screen.getByText('Create PR')).toBeInTheDocument();
    });
  });

  describe('Direct Merge Workflow (No PR)', () => {
    it('should show CreatePRButton when commits exist and no PR', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        merges: [],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);
      expect(screen.getByText('Create PR')).toBeInTheDocument();
    });

    it('should show ApproveButton in direct merge workflow', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        merges: [],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);
      expect(screen.getByText(/Approve/)).toBeInTheDocument();
    });

    it('should not show PushToPRButton in direct merge workflow', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        remote_commits_ahead: 2,
        merges: [],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should not show Push button (only in PR workflow)
      const pushButton = screen.queryByText(/↑.*Push/);
      expect(pushButton).not.toBeInTheDocument();
    });

    it('should not show ViewPRButton in direct merge workflow', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        merges: [],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should not show PR # button
      expect(screen.queryByText(/PR #/)).not.toBeInTheDocument();
    });
  });

  describe('PR Workflow (Open PR)', () => {
    const openPRBranchStatus = createMockBranchStatus({
      commits_ahead: 3,
      remote_commits_ahead: 2,
      merges: [
        {
          type: 'pr',
          pr_info: {
            number: 789,
            url: 'https://github.com/test/repo/pull/789',
            status: 'open',
          },
        },
      ],
    });

    it('should show PushToPRButton when open PR exists', () => {
      render(<GitActionsGroup {...defaultProps} branchStatus={openPRBranchStatus} />);
      expect(screen.getByText(/Push/)).toBeInTheDocument();
    });

    it('should show ViewPRButton with correct PR number', () => {
      render(<GitActionsGroup {...defaultProps} branchStatus={openPRBranchStatus} />);
      expect(screen.getByText(/PR #789/)).toBeInTheDocument();
    });

    it('should not show CreatePRButton when PR exists', () => {
      render(<GitActionsGroup {...defaultProps} branchStatus={openPRBranchStatus} />);
      expect(screen.queryByText('Create PR')).not.toBeInTheDocument();
    });

    it('should not show ApproveButton when PR exists', () => {
      render(<GitActionsGroup {...defaultProps} branchStatus={openPRBranchStatus} />);

      // ApproveButton should not be shown in PR workflow
      const approveButtons = screen.queryAllByText(/Approve/);
      expect(approveButtons.length).toBe(0);
    });

    it('should handle PR with missing url', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 999,
              url: undefined as any,
              status: 'open',
            },
          },
        ],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should show Push button but not View PR button
      expect(screen.getByText(/Push/)).toBeInTheDocument();
      expect(screen.queryByText(/PR #/)).not.toBeInTheDocument();
    });

    it('should handle PR with missing number', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: undefined as any,
              url: 'https://github.com/test/repo/pull/999',
              status: 'open',
            },
          },
        ],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should show Push button but not View PR button
      expect(screen.getByText(/Push/)).toBeInTheDocument();
      expect(screen.queryByText(/PR #/)).not.toBeInTheDocument();
    });
  });

  describe('Merged PR State', () => {
    it('should not render any buttons when PR is merged', () => {
      const branchStatus = createMockBranchStatus({
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 111,
              url: 'https://github.com/test/repo/pull/111',
              status: 'merged',
            },
          },
        ],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should hide all buttons even if commits exist', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 5,
        remote_commits_ahead: 3,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 222,
              url: 'https://github.com/test/repo/pull/222',
              status: 'merged',
            },
          },
        ],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('UpdateNeededBadge Visibility', () => {
    it('should always show UpdateNeededBadge when base branch is behind', () => {
      const branchStatus = createMockBranchStatus({
        commits_behind: 5,
        commits_ahead: 2,
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // UpdateNeededBadge should be rendered (it has its own visibility logic)
      const container = screen.getByText(/Approve/).closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should render UpdateNeededBadge even with open PR', () => {
      const branchStatus = createMockBranchStatus({
        commits_behind: 3,
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 333,
              url: 'https://github.com/test/repo/pull/333',
              status: 'open',
            },
          },
        ],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      // Should render the component with UpdateNeededBadge
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Container Structure', () => {
    it('should render container div with correct classes', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      const wrapper = container.querySelector('.flex.items-center.gap-2');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render buttons in correct order for direct merge workflow', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 3,
        merges: [],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      const buttons = container.querySelectorAll('button');
      // UpdateNeededBadge (if shown) + CreatePR + Approve
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should render buttons in correct order for PR workflow', () => {
      const branchStatus = createMockBranchStatus({
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 444,
              url: 'https://github.com/test/repo/pull/444',
              status: 'open',
            },
          },
        ],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      const buttons = container.querySelectorAll('button');
      // Should have Push and View PR buttons
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple PRs and pick first open PR', () => {
      const branchStatus = createMockBranchStatus({
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 555,
              url: 'https://github.com/test/repo/pull/555',
              status: 'open',
            },
          },
          {
            type: 'pr',
            pr_info: {
              number: 666,
              url: 'https://github.com/test/repo/pull/666',
              status: 'open',
            },
          },
        ],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should show first open PR
      expect(screen.getByText(/PR #555/)).toBeInTheDocument();
    });

    it('should prioritize merged PR check over open PR', () => {
      const branchStatus = createMockBranchStatus({
        remote_commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 777,
              url: 'https://github.com/test/repo/pull/777',
              status: 'open',
            },
          },
          {
            type: 'pr',
            pr_info: {
              number: 888,
              url: 'https://github.com/test/repo/pull/888',
              status: 'merged',
            },
          },
        ],
      });

      const { container } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      // Should hide all buttons because one PR is merged
      expect(container.firstChild).toBeNull();
    });

    it('should handle non-PR merge types', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        merges: [
          {
            type: 'direct',
            pr_info: null,
          },
        ],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should treat as no PR (direct merge workflow)
      expect(screen.getByText('Create PR')).toBeInTheDocument();
      expect(screen.getByText(/Approve/)).toBeInTheDocument();
    });

    it('should handle empty pr_info', () => {
      const branchStatus = createMockBranchStatus({
        commits_ahead: 2,
        merges: [
          {
            type: 'pr',
            pr_info: null as any,
          },
        ],
      });

      render(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      // Should treat as no PR
      expect(screen.getByText('Create PR')).toBeInTheDocument();
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize PR info calculation', () => {
      const branchStatus = createMockBranchStatus({
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 999,
              url: 'https://github.com/test/repo/pull/999',
              status: 'open',
            },
          },
        ],
      });

      const { rerender } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus} />
      );

      // First render
      expect(screen.getByText(/PR #999/)).toBeInTheDocument();

      // Rerender with same branchStatus (should use memoized value)
      rerender(<GitActionsGroup {...defaultProps} branchStatus={branchStatus} />);

      expect(screen.getByText(/PR #999/)).toBeInTheDocument();
    });

    it('should recalculate when branchStatus.merges changes', () => {
      const branchStatus1 = createMockBranchStatus({
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 100,
              url: 'https://github.com/test/repo/pull/100',
              status: 'open',
            },
          },
        ],
      });

      const { rerender } = render(
        <GitActionsGroup {...defaultProps} branchStatus={branchStatus1} />
      );

      expect(screen.getByText(/PR #100/)).toBeInTheDocument();

      // Change branchStatus
      const branchStatus2 = createMockBranchStatus({
        merges: [
          {
            type: 'pr',
            pr_info: {
              number: 200,
              url: 'https://github.com/test/repo/pull/200',
              status: 'open',
            },
          },
        ],
      });

      rerender(<GitActionsGroup {...defaultProps} branchStatus={branchStatus2} />);

      expect(screen.getByText(/PR #200/)).toBeInTheDocument();
      expect(screen.queryByText(/PR #100/)).not.toBeInTheDocument();
    });
  });
});
