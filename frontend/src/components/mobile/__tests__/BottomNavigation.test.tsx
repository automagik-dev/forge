import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { BottomNavigation, useBottomNavigation } from '../BottomNavigation';
import { Home, Settings } from 'lucide-react';

// Mock dependencies
vi.mock('@capacitor/haptics');
vi.mock('@/lib/platform', () => ({
  Platform: {
    isNative: vi.fn(() => false),
  },
}));

describe('BottomNavigation', () => {
  const mockOnTabChange = vi.fn();

  const defaultTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      path: '/home',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      path: '/settings',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, initialPath = '/') => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    return {
      history,
      ...render(
        <Router location={history.location} navigator={history}>
          <Routes>
            <Route path="*" element={ui} />
          </Routes>
        </Router>
      ),
    };
  };

  it('renders all tabs', () => {
    renderWithRouter(<BottomNavigation tabs={defaultTabs} />);

    expect(screen.getByTestId('bottom-nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav-settings')).toBeInTheDocument();
  });

  it('displays tab labels', () => {
    renderWithRouter(<BottomNavigation tabs={defaultTabs} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays tab icons', () => {
    renderWithRouter(<BottomNavigation tabs={defaultTabs} />);

    const homeTab = screen.getByTestId('bottom-nav-home');
    const settingsTab = screen.getByTestId('bottom-nav-settings');

    expect(homeTab.querySelector('svg')).not.toBeNull();
    expect(settingsTab.querySelector('svg')).not.toBeNull();
  });

  it('navigates to tab path when clicked', () => {
    const { history } = renderWithRouter(<BottomNavigation tabs={defaultTabs} />);

    const homeTab = screen.getByTestId('bottom-nav-home');
    fireEvent.click(homeTab);

    expect(history.location.pathname).toBe('/home');
  });

  it('calls onTabChange when tab is clicked', () => {
    renderWithRouter(
      <BottomNavigation tabs={defaultTabs} onTabChange={mockOnTabChange} />
    );

    const homeTab = screen.getByTestId('bottom-nav-home');
    fireEvent.click(homeTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('home');
  });

  it('calls onClick callback if provided instead of navigating', () => {
    const mockOnClick = vi.fn();
    const tabsWithCallback = [
      {
        id: 'custom',
        label: 'Custom',
        icon: <Home size={20} />,
        onClick: mockOnClick,
      },
    ];

    renderWithRouter(<BottomNavigation tabs={tabsWithCallback} />);

    const customTab = screen.getByTestId('bottom-nav-custom');
    fireEvent.click(customTab);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('marks active tab with aria-current', () => {
    renderWithRouter(<BottomNavigation tabs={defaultTabs} />, '/home');

    const homeTab = screen.getByTestId('bottom-nav-home');
    expect(homeTab).toHaveAttribute('aria-current', 'page');
  });

  it('applies active class to active tab', () => {
    renderWithRouter(<BottomNavigation tabs={defaultTabs} />, '/home');

    const homeTab = screen.getByTestId('bottom-nav-home');
    expect(homeTab).toHaveClass('active');
  });

  it('displays badge when provided', () => {
    const tabsWithBadge = [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Home size={20} />,
        path: '/notifications',
        badge: 5,
      },
    ];

    renderWithRouter(<BottomNavigation tabs={tabsWithBadge} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays "99+" for badges over 99', () => {
    const tabsWithBadge = [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Home size={20} />,
        path: '/notifications',
        badge: 150,
      },
    ];

    renderWithRouter(<BottomNavigation tabs={tabsWithBadge} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('displays string badge as-is', () => {
    const tabsWithBadge = [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Home size={20} />,
        path: '/notifications',
        badge: 'NEW',
      },
    ];

    renderWithRouter(<BottomNavigation tabs={tabsWithBadge} />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('disables tab when disabled prop is true', () => {
    const tabsWithDisabled = [
      {
        id: 'disabled',
        label: 'Disabled',
        icon: <Home size={20} />,
        path: '/disabled',
        disabled: true,
      },
    ];

    renderWithRouter(<BottomNavigation tabs={tabsWithDisabled} />);

    const disabledTab = screen.getByTestId('bottom-nav-disabled');
    expect(disabledTab).toBeDisabled();
  });

  it('does not navigate when disabled tab is clicked', () => {
    const tabsWithDisabled = [
      {
        id: 'disabled',
        label: 'Disabled',
        icon: <Home size={20} />,
        path: '/disabled',
        disabled: true,
      },
    ];

    const { history } = renderWithRouter(<BottomNavigation tabs={tabsWithDisabled} />, '/');

    const disabledTab = screen.getByTestId('bottom-nav-disabled');
    fireEvent.click(disabledTab);

    expect(history.location.pathname).toBe('/');
  });

  it('handles query parameters in tab paths', () => {
    const tabsWithQuery = [
      {
        id: 'list',
        label: 'List',
        icon: <Home size={20} />,
        path: '/items?view=list',
      },
    ];

    const { history } = renderWithRouter(<BottomNavigation tabs={tabsWithQuery} />);

    const listTab = screen.getByTestId('bottom-nav-list');
    fireEvent.click(listTab);

    expect(history.location.pathname).toBe('/items');
    expect(history.location.search).toBe('?view=list');
  });

  it('displays activeIcon when tab is active', () => {
    const HomeActive = () => <span data-testid="home-active-icon">HomeActive</span>;
    const tabsWithActiveIcon = [
      {
        id: 'home',
        label: 'Home',
        icon: <Home size={20} />,
        activeIcon: <HomeActive />,
        path: '/home',
      },
    ];

    renderWithRouter(<BottomNavigation tabs={tabsWithActiveIcon} />, '/home');

    expect(screen.getByTestId('home-active-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(
      <BottomNavigation tabs={defaultTabs} className="custom-class" />
    );

    const nav = screen.getByTestId('bottom-navigation');
    expect(nav).toHaveClass('custom-class');
  });

  it('handles root path and /projects path as same active state', () => {
    const projectTabs = [
      {
        id: 'projects',
        label: 'Projects',
        icon: <Home size={20} />,
        path: '/projects',
      },
    ];

    renderWithRouter(<BottomNavigation tabs={projectTabs} />, '/');

    const projectTab = screen.getByTestId('bottom-nav-projects');
    expect(projectTab).toHaveClass('active');
  });

  it('applies aria-label to each tab', () => {
    renderWithRouter(<BottomNavigation tabs={defaultTabs} />);

    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });
});

describe('useBottomNavigation', () => {
  it('returns current tab based on pathname', () => {
    const TestComponent = () => {
      const { currentTab } = useBottomNavigation();
      return <div data-testid="current-tab">{currentTab}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <TestComponent />
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-tab')).toHaveTextContent('tasks');
  });

  it('returns "tasks" as default for unknown paths', () => {
    const TestComponent = () => {
      const { currentTab } = useBottomNavigation();
      return <div data-testid="current-tab">{currentTab}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <TestComponent />
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-tab')).toHaveTextContent('tasks');
  });
});
