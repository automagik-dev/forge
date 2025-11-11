import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

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
      navigate(tab.path);
    } else if (tab.onClick) {
      tab.onClick();
    }
    
    onTabChange?.(tab.id);
  };
  
  const isTabActive = (tab: BottomNavTab): boolean => {
    if (!tab.path) return false;
    return location.pathname.startsWith(tab.path);
  };
  
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[var(--z-mobile-bottom-nav)]',
        'bg-background border-t border-border',
        'pb-safe',
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              disabled={tab.disabled}
              className={cn(
                'flex flex-col items-center justify-center',
                'flex-1 h-full',
                'touch-target-comfortable',
                'transition-colors duration-200',
                'no-select-mobile',
                isActive && 'text-primary',
                !isActive && 'text-muted-foreground',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
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
                'text-xs font-medium mt-1',
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
