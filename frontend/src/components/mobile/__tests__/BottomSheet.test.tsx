import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomSheet, useBottomSheet } from '../BottomSheet';

// Mock dependencies
vi.mock('@capacitor/haptics');
vi.mock('@/lib/platform', () => ({
  Platform: {
    isNative: vi.fn(() => false),
  },
}));

vi.mock('react-spring', () => ({
  useSpring: vi.fn(() => [
    { y: { get: () => 0, to: (fn: any) => fn } },
    { start: vi.fn() },
  ]),
  animated: {
    div: 'div',
  },
}));

vi.mock('@use-gesture/react', () => ({
  useDrag: vi.fn(() => () => ({})),
}));

describe('BottomSheet', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Mock window.innerHeight for snap point calculations
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('renders when open', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Sheet Content</div>
      </BottomSheet>
    );

    expect(screen.getByText('Sheet Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BottomSheet open={false} onClose={mockOnClose}>
        <div>Sheet Content</div>
      </BottomSheet>
    );

    expect(screen.queryByText('Sheet Content')).not.toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} title="Sheet Title">
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.getByText('Sheet Title')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} description="Sheet description">
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.getByText('Sheet description')).toBeInTheDocument();
  });

  it('shows handle by default', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    const handle = container.querySelector('.w-8.h-1');
    expect(handle).toBeInTheDocument();
  });

  it('hides handle when showHandle is false', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose} showHandle={false}>
        <div>Content</div>
      </BottomSheet>
    );

    const handle = container.querySelector('.w-8.h-1');
    expect(handle).not.toBeInTheDocument();
  });

  it('displays close button when dismissible', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} title="Title" dismissible={true}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('hides close button when not dismissible', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} title="Title" dismissible={false}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} title="Title">
        <div>Content</div>
      </BottomSheet>
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked and dismissible', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} dismissible={true}>
        <div>Content</div>
      </BottomSheet>
    );

    const backdrop = document.querySelector('.bg-black\\/40');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when backdrop is clicked and not dismissible', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} dismissible={false}>
        <div>Content</div>
      </BottomSheet>
    );

    const backdrop = document.querySelector('.bg-black\\/40');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });

  it('renders children correctly', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </BottomSheet>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('applies custom className to sheet', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose} className="custom-sheet">
        <div>Content</div>
      </BottomSheet>
    );

    const sheet = container.querySelector('.custom-sheet');
    expect(sheet).toBeInTheDocument();
  });

  it('applies custom contentClassName to content area', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose} contentClassName="custom-content">
        <div>Content</div>
      </BottomSheet>
    );

    const content = container.querySelector('.custom-content');
    expect(content).toBeInTheDocument();
  });

  it('creates portal in document.body', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div data-testid="portal-content">Portal Content</div>
      </BottomSheet>
    );

    const portalContent = screen.getByTestId('portal-content');
    expect(portalContent).toBeInTheDocument();
    expect(document.body.contains(portalContent)).toBe(true);
  });

  it('sets overflow hidden on body when open', () => {
    const { rerender } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <BottomSheet open={false} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('restores body overflow on unmount', () => {
    const { unmount } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('accepts snapPoints prop', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} snapPoints={[40, 90]}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts initialSnap prop', () => {
    render(
      <BottomSheet open={true} onClose={mockOnClose} snapPoints={[40, 90]} initialSnap={1}>
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('has rounded top corners', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    const sheet = container.querySelector('.rounded-t-2xl');
    expect(sheet).toBeInTheDocument();
  });

  it('has glass-heavy styling', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    const sheet = container.querySelector('.glass-heavy');
    expect(sheet).toBeInTheDocument();
  });

  it('has proper z-index', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('has max height constraint', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomSheet>
    );

    const sheet = container.querySelector('.max-h-\\[95vh\\]');
    expect(sheet).toBeInTheDocument();
  });

  it('renders title and description together', () => {
    render(
      <BottomSheet
        open={true}
        onClose={mockOnClose}
        title="Title"
        description="Description"
      >
        <div>Content</div>
      </BottomSheet>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});

describe('useBottomSheet', () => {
  it('provides isOpen state and control functions', () => {
    let sheetState: any;

    const TestComponent = () => {
      sheetState = useBottomSheet();
      return null;
    };

    render(<TestComponent />);

    expect(sheetState.isOpen).toBe(false);
    expect(typeof sheetState.open).toBe('function');
    expect(typeof sheetState.close).toBe('function');
    expect(typeof sheetState.toggle).toBe('function');
  });

  it('opens sheet when open is called', () => {
    let sheetState: any;

    const TestComponent = () => {
      sheetState = useBottomSheet();
      return (
        <button onClick={sheetState.open}>Open</button>
      );
    };

    render(<TestComponent />);

    expect(sheetState.isOpen).toBe(false);

    const button = screen.getByText('Open');
    fireEvent.click(button);

    expect(sheetState.isOpen).toBe(true);
  });

  it('closes sheet when close is called', () => {
    let sheetState: any;

    const TestComponent = () => {
      sheetState = useBottomSheet();
      return (
        <>
          <button onClick={sheetState.open}>Open</button>
          <button onClick={sheetState.close}>Close</button>
        </>
      );
    };

    render(<TestComponent />);

    const openButton = screen.getByText('Open');
    fireEvent.click(openButton);
    expect(sheetState.isOpen).toBe(true);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(sheetState.isOpen).toBe(false);
  });

  it('toggles sheet state when toggle is called', () => {
    let sheetState: any;

    const TestComponent = () => {
      sheetState = useBottomSheet();
      return (
        <button onClick={sheetState.toggle}>Toggle</button>
      );
    };

    render(<TestComponent />);

    const toggleButton = screen.getByText('Toggle');

    expect(sheetState.isOpen).toBe(false);

    fireEvent.click(toggleButton);
    expect(sheetState.isOpen).toBe(true);

    fireEvent.click(toggleButton);
    expect(sheetState.isOpen).toBe(false);
  });
});
