import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';
import { getMobileSpacing } from '@/styles/mobile-theme';

export interface BottomNavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  badge?: number | string;
  disabled?: boolean;
}

export interface BottomNavigationProps {
  tabs: BottomNavTab[];
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function BottomNavigation({ 
  tabs, 
  className,
  onTabChange 
}: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleTabClick = async (tab: BottomNavTab) => {
    if (tab.disabled) return;
    
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    
    if (tab.path) {
      const [tabPathname, tabQuery] = tab.path.split('?');
      const params = new URLSearchParams(location.search);
      const expectedView = new URLSearchParams(tabQuery || '').get('view');
      
      if (expectedView === null) {
        params.delete('view');
      } else {
        params.set('view', expectedView);
      }
      
      const search = params.toString();
      navigate({
        pathname: tabPathname,
        search: search ? `?${search}` : '',
      });
    } else if (tab.onClick) {
      tab.onClick();
    }
    
    onTabChange?.(tab.id);
  };
  
  const isTabActive = (tab: BottomNavTab): boolean => {
    // Handle tabs with onClick (like Tasks drawer) - check by tab ID
    if (!tab.path && tab.onClick) {
      // Tasks tab is "active" when we're viewing the tasks list
      // This is a special case - we'll never truly show it as active since it opens a drawer
      return false;
    }

    if (!tab.path) return false;

    const [tabPathname, tabQuery] = tab.path.split('?');
    const expectedView = new URLSearchParams(tabQuery || '').get('view');
    const currentView = new URLSearchParams(location.search).get('view');

    // Special case: both "/" and "/projects" show the projects list
    if (tabPathname === '/projects' && location.pathname === '/') {
      return true;
    }

    const pathMatches = location.pathname.startsWith(tabPathname);
    if (!pathMatches) return false;

    if (expectedView === null) {
      return currentView === null || currentView === 'kanban';
    }

    return currentView === expectedView;
  };
  
  return (
    <nav
      data-testid="bottom-navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[var(--z-mobile-bottom-nav)]',
        'glass-medium border-t border-white/15',
        'pb-safe',
        className
      )}
    >
      <div
        className="flex items-center justify-around"
        style={{ height: getMobileSpacing('bottomNav') }}
      >
        {tabs.map((tab) => {
          const isActive = isTabActive(tab);
          
          return (
            <button
              key={tab.id}
              data-testid={`bottom-nav-${tab.id}`}
              onClick={() => handleTabClick(tab)}
              disabled={tab.disabled}
              className={cn(
                'flex flex-col items-center justify-center',
                'flex-1 h-full relative',
                'touch-target-comfortable',
                'transition-all duration-200',
                'no-select-mobile',
                'font-secondary',
                isActive && 'text-brand-magenta',
                !isActive && 'text-secondary-foreground hover:text-foreground',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                isActive && 'active'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute inset-0 magical-gradient opacity-20 rounded-lg mx-2" />
              )}
              
              <div className="relative z-10">
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center',
                  'transition-transform duration-200',
                  isActive && 'scale-110'
                )}>
                  {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                </div>
                
                {tab.badge !== undefined && (
                  <div className={cn(
                    'absolute -top-1 -right-1',
                    'min-w-[16px] h-4 px-1',
                    'flex items-center justify-center',
                    'bg-destructive text-destructive-foreground',
                    'text-[10px] font-semibold',
                    'rounded-full'
                  )}>
                    {typeof tab.badge === 'number' && tab.badge > 99 
                      ? '99+' 
                      : tab.badge
                    }
                  </div>
                )}
              </div>
              
              <span className={cn(
                'text-xs font-medium mt-1 relative z-10',
                'transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Hook to manage bottom navigation state
 */
export function useBottomNavigation() {
  const location = useLocation();
  
  const getCurrentTab = (): string => {
    const path = location.pathname;
    
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/settings') || path.includes('/profile')) return 'me';
    
    return 'tasks';
  };
  
  return {
    currentTab: getCurrentTab()
  };
}
