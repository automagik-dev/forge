import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffActionSheet, useDiffActionSheet } from '../DiffActionSheet';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../BottomSheet', () => ({
  BottomSheet: ({ open, onClose, title, description, children }: any) => (
    open ? (
      <div data-testid="bottom-sheet">
        <div>{title}</div>
        <div>{description}</div>
        {children}
      </div>
    ) : null
  ),
  useBottomSheet: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  }),
}));

describe('DiffActionSheet', () => {
  const mockOnClose = vi.fn();
  const mockOnSync = vi.fn();
  const mockOnApprove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
      />
    );

    expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
    expect(screen.getByText('mobile.diffActions.sync')).toBeInTheDocument();
    expect(screen.getByText('mobile.diffActions.approve')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DiffActionSheet
        open={false}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
      />
    );

    expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument();
  });

  it('calls onSync and onClose when sync button is clicked', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
      />
    );

    const syncButton = screen.getByText('mobile.diffActions.sync');
    fireEvent.click(syncButton);

    expect(mockOnSync).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onApprove and onClose when approve button is clicked', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
      />
    );

    const approveButton = screen.getByText('mobile.diffActions.approve');
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables sync button when canSync is false', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        canSync={false}
      />
    );

    const syncButton = screen.getByText('mobile.diffActions.sync');
    expect(syncButton).toBeDisabled();
  });

  it('disables approve button when canApprove is false', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        canApprove={false}
      />
    );

    const approveButton = screen.getByText('mobile.diffActions.approve');
    expect(approveButton).toBeDisabled();
  });

  it('shows syncing text when isSyncing is true', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        isSyncing={true}
      />
    );

    expect(screen.getByText('mobile.diffActions.syncing')).toBeInTheDocument();
  });

  it('shows approving text when isApproving is true', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        isApproving={true}
      />
    );

    expect(screen.getByText('mobile.diffActions.approving')).toBeInTheDocument();
  });

  it('displays sync disabled reason when provided', () => {
    const reason = 'No changes to sync';
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        canSync={false}
        syncDisabledReason={reason}
      />
    );

    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('displays approve disabled reason when provided', () => {
    const reason = 'No changes to approve';
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        canApprove={false}
        approveDisabledReason={reason}
      />
    );

    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('disables sync button while syncing', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        isSyncing={true}
      />
    );

    const syncButton = screen.getByText('mobile.diffActions.syncing');
    expect(syncButton).toBeDisabled();
  });

  it('disables approve button while approving', () => {
    render(
      <DiffActionSheet
        open={true}
        onClose={mockOnClose}
        onSync={mockOnSync}
        onApprove={mockOnApprove}
        isApproving={true}
      />
    );

    const approveButton = screen.getByText('mobile.diffActions.approving');
    expect(approveButton).toBeDisabled();
  });
});

describe('useDiffActionSheet', () => {
  it('exports the hook', () => {
    expect(useDiffActionSheet).toBeDefined();
    expect(typeof useDiffActionSheet).toBe('function');
  });
});
