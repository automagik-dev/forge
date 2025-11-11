import { Outlet, useSearchParams } from 'react-router-dom';
import { DevBanner } from '@/components/DevBanner';
import { Navbar } from '@/components/layout/navbar';
import { BottomNavigation, BottomNavTab } from '@/components/mobile/BottomNavigation';
import { BottomNavIcons } from '@/components/mobile/BottomNavigationIcons';
import { useIsMobile } from '@/components/mobile/MobileLayout';

export function NormalLayout() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const shouldHideNavbar = view === 'preview' || view === 'diffs' || view === 'kanban';
  const isMobile = useIsMobile();

  const mobileNavTabs: BottomNavTab[] = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: BottomNavIcons.Tasks.default,
      activeIcon: BottomNavIcons.Tasks.active,
      path: '/projects'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: BottomNavIcons.Chat.default,
      activeIcon: BottomNavIcons.Chat.active,
      path: '/chat'
    },
    {
      id: 'new',
      label: 'New',
      icon: BottomNavIcons.New.default,
      activeIcon: BottomNavIcons.New.active,
      onClick: () => {
      }
    },
    {
      id: 'me',
      label: 'Me',
      icon: BottomNavIcons.Me.default,
      activeIcon: BottomNavIcons.Me.active,
      path: '/settings'
    }
  ];

  return (
    <>
      <DevBanner />
      {!shouldHideNavbar && <Navbar />}
      <div className={`flex-1 min-h-0 overflow-hidden ${isMobile ? 'pb-16 pb-safe' : ''}`}>
        <Outlet />
      </div>
      {isMobile && <BottomNavigation tabs={mobileNavTabs} />}
    </>
  );
}
