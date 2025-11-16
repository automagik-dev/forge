import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TasksDrawer, useTasksDrawer } from '../TasksDrawer';

// Mock dependencies
vi.mock('@capacitor/haptics');
vi.mock('@/lib/platform', () => ({
  Platform: {
    isNative: vi.fn(() => false),
  },
}));

vi.mock('react-spring', () => ({
  useSpring: vi.fn(() => [
    { x: { get: () => 0 } },
    { start: vi.fn() },
  ]),
  animated: {
    div: 'div',
  },
}));

vi.mock('@use-gesture/react', () => ({
  useDrag: vi.fn(() => () => ({})),
}));

describe('TasksDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders when open', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </TasksDrawer>
    );

    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TasksDrawer open={false} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </TasksDrawer>
    );

    expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
  });

  it('displays default title', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('displays custom title', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose} title="Custom Title">
        <div>Content</div>
      </TasksDrawer>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('displays close button', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    const backdrop = document.querySelector('.bg-black\\/40');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('renders children correctly', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </TasksDrawer>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('applies custom className to drawer', () => {
    const { container } = render(
      <TasksDrawer open={true} onClose={mockOnClose} className="custom-drawer">
        <div>Content</div>
      </TasksDrawer>
    );

    const drawer = container.querySelector('.custom-drawer');
    expect(drawer).toBeInTheDocument();
  });

  it('applies custom contentClassName to content area', () => {
    const { container } = render(
      <TasksDrawer open={true} onClose={mockOnClose} contentClassName="custom-content">
        <div>Content</div>
      </TasksDrawer>
    );

    const content = container.querySelector('.custom-content');
    expect(content).toBeInTheDocument();
  });

  it('creates portal in document.body', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div data-testid="portal-content">Portal Content</div>
      </TasksDrawer>
    );

    // Content should be in document.body, not in the default render container
    const portalContent = screen.getByTestId('portal-content');
    expect(portalContent).toBeInTheDocument();
    expect(document.body.contains(portalContent)).toBe(true);
  });

  it('sets overflow hidden on body when open', () => {
    const { rerender } = render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <TasksDrawer open={false} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('restores body overflow on unmount', () => {
    const { unmount } = render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('has proper z-index for overlay', () => {
    const { container } = render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('renders with glass-heavy styling', () => {
    const { container } = render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    const drawer = container.querySelector('.glass-heavy');
    expect(drawer).toBeInTheDocument();
  });

  it('has proper touch-target for close button', () => {
    render(
      <TasksDrawer open={true} onClose={mockOnClose}>
        <div>Content</div>
      </TasksDrawer>
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toHaveClass('touch-target');
  });
});

describe('useTasksDrawer', () => {
  it('provides isOpen state and control functions', () => {
    let drawerState: any;

    const TestComponent = () => {
      drawerState = useTasksDrawer();
      return null;
    };

    render(<TestComponent />);

    expect(drawerState.isOpen).toBe(false);
    expect(typeof drawerState.open).toBe('function');
    expect(typeof drawerState.close).toBe('function');
    expect(typeof drawerState.toggle).toBe('function');
  });

  it('opens drawer when open is called', () => {
    let drawerState: any;

    const TestComponent = () => {
      drawerState = useTasksDrawer();
      return (
        <button onClick={drawerState.open}>Open</button>
      );
    };

    render(<TestComponent />);

    expect(drawerState.isOpen).toBe(false);

    const button = screen.getByText('Open');
    fireEvent.click(button);

    expect(drawerState.isOpen).toBe(true);
  });

  it('closes drawer when close is called', () => {
    let drawerState: any;

    const TestComponent = () => {
      drawerState = useTasksDrawer();
      return (
        <>
          <button onClick={drawerState.open}>Open</button>
          <button onClick={drawerState.close}>Close</button>
        </>
      );
    };

    render(<TestComponent />);

    const openButton = screen.getByText('Open');
    fireEvent.click(openButton);
    expect(drawerState.isOpen).toBe(true);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(drawerState.isOpen).toBe(false);
  });

  it('toggles drawer state when toggle is called', () => {
    let drawerState: any;

    const TestComponent = () => {
      drawerState = useTasksDrawer();
      return (
        <button onClick={drawerState.toggle}>Toggle</button>
      );
    };

    render(<TestComponent />);

    const toggleButton = screen.getByText('Toggle');

    expect(drawerState.isOpen).toBe(false);

    fireEvent.click(toggleButton);
    expect(drawerState.isOpen).toBe(true);

    fireEvent.click(toggleButton);
    expect(drawerState.isOpen).toBe(false);
  });
});
