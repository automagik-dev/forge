import React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BottomNavigation, BottomNavTab } from './BottomNavigation';
import { BottomNavIcons } from './BottomNavigationIcons';
import { usePlatform } from '@/lib/platform';
import { useProject } from '@/contexts/project-context';

export interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
  contentClassName?: string;
}

export function MobileLayout({
  children,
  showBottomNav = true,
  className,
  contentClassName
}: MobileLayoutProps) {
  const { isNative } = usePlatform();
  const { projectId } = useProject();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const tabs: BottomNavTab[] = React.useMemo(() => {
    if (projectId && location.pathname.includes('/tasks')) {
      const currentView = searchParams.get('view');
      const basePath = `/projects/${projectId}/tasks`;
      
      return [
        {
          id: 'tasks',
          label: 'Tasks',
          icon: BottomNavIcons.Tasks.default,
          activeIcon: BottomNavIcons.Tasks.active,
          path: basePath, // Default view (list on mobile)
        },
        {
          id: 'chat',
          label: 'Chat',
          icon: BottomNavIcons.Chat.default,
          activeIcon: BottomNavIcons.Chat.active,
          path: `${basePath}?view=chat`,
        },
        {
          id: 'review',
          label: 'Review',
          icon: BottomNavIcons.Review.default,
          activeIcon: BottomNavIcons.Review.active,
          path: `${basePath}?view=preview`,
        },
        {
          id: 'changes',
          label: 'Changes',
          icon: BottomNavIcons.Changes.default,
          activeIcon: BottomNavIcons.Changes.active,
          path: `${basePath}?view=diffs`,
        },
      ];
    }
    
    return [
      {
        id: 'projects',
        label: 'Projects',
        icon: BottomNavIcons.Tasks.default,
        activeIcon: BottomNavIcons.Tasks.active,
        path: '/projects',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: BottomNavIcons.Me.default,
        activeIcon: BottomNavIcons.Me.active,
        path: '/settings',
      },
    ];
  }, [projectId, location.pathname, searchParams]);
  
  return (
    <div className={cn(
      'h-screen flex flex-col bg-[#1A1625]',
      isNative && 'pt-safe',
      className
    )}>
      <main className={cn(
        'flex-1 overflow-auto mobile-scroll',
        showBottomNav && 'pb-16 pb-safe',
        contentClassName
      )}>
        {children}
      </main>
      
      {showBottomNav && <BottomNavigation tabs={tabs} />}
    </div>
  );
}

/**
 * Hook to detect if we're on mobile viewport
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
