import React, { useState } from 'react';
import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { BottomNavigation, BottomNavTab } from './BottomNavigation';
import { usePlatform } from '@/lib/platform';
import { useProject } from '@/contexts/project-context';
import { Kanban, GitCompareArrows, FileText, Settings, Heart, ListTodo } from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';
import { DiffActionSheet } from './DiffActionSheet';
import { useMobileTaskActions } from '@/hooks/useMobileTaskActions';
import { mobileTheme, getMobileSpacing } from '@/styles/mobile-theme';

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
  const { t } = useTranslation('common');
  const { isNative } = usePlatform();
  const { projectId } = useProject();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { taskId } = useParams<{ taskId?: string }>();
  const [showDiffActions, setShowDiffActions] = useState(false);

  // Mobile task actions (sync/approve)
  const {
    handleSync,
    handleApprove,
    isSyncing,
    isApproving,
    canSync,
    canApprove,
    syncDisabledReason,
    approveDisabledReason,
  } = useMobileTaskActions();

  const tabs: BottomNavTab[] = React.useMemo(() => {
    const basePath = projectId ? `/projects/${projectId}/tasks` : '/projects';

    // When inside a task (any view), show: Task/Diff/View + Diff Action Badges
    if (taskId && projectId) {
      const taskPath = `${basePath}/${taskId}`;
      const baseTabs: BottomNavTab[] = [
        {
          id: 'task',
          label: t('mobile.navigation.task'),
          icon: <FileText size={20} />,
          path: `${taskPath}?view=chat`,
        },
        {
          id: 'diffs',
          label: t('mobile.navigation.diff'),
          icon: <GitCompareArrows size={20} />,
          path: `${taskPath}?view=diffs`,
        },
        {
          id: 'view',
          label: t('mobile.navigation.view'),
          icon: <Heart size={20} />,
          path: `${taskPath}?view=preview`,
        },
      ];

      // Add diff action badges (green for approve, orange for sync)
      // These appear in all task views, always visible
      baseTabs.push({
        id: 'diff-actions',
        label: t('mobile.navigation.actions'),
        icon: (
          <div className="relative flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="w-3 h-3 rounded-full bg-orange-500" />
          </div>
        ),
        onClick: () => setShowDiffActions(true),
      });

      return baseTabs;
    }

    // When inside a project (not in a specific task), show: Tasks/Kanban/Genie/Config
    if (projectId) {
      return [
        {
          id: 'tasks',
          label: t('mobile.navigation.tasks'),
          icon: <ListTodo size={20} />,
          // Tasks shows list view with ?view=list parameter
          path: `${basePath}?view=list`,
        },
        {
          id: 'kanban',
          label: t('mobile.navigation.kanban'),
          icon: <Kanban size={20} />,
          // Kanban board shows all tasks in the project
          path: basePath,
        },
        {
          id: 'genie',
          label: t('mobile.navigation.genie'),
          icon: <Lamp size={26} />, // 30% bigger (20 * 1.3 = 26)
          path: `${basePath}?view=chat`,
        },
        {
          id: 'config',
          label: t('mobile.navigation.config'),
          icon: <Settings size={20} />,
          path: '/settings',
        },
      ];
    }

    // Default fallback (no project) - just show projects and config
    return [
      {
        id: 'projects',
        label: t('mobile.navigation.projects'),
        icon: <Kanban size={20} />,
        path: '/projects',
      },
      {
        id: 'config',
        label: t('mobile.navigation.config'),
        icon: <Settings size={20} />,
        path: '/settings',
      },
    ];
  }, [projectId, taskId, location.pathname, searchParams, t]);
  
  return (
    <div className={cn(
      'h-screen flex flex-col bg-[#1A1625]',
      isNative && 'pt-safe',
      className
    )}>
      <main
        className={cn(
          'flex-1 overflow-auto mobile-scroll',
          contentClassName
        )}
        style={
          showBottomNav
            ? {
                paddingBottom: `calc(${getMobileSpacing('bottomNav')} + env(safe-area-inset-bottom, 0px))`,
              }
            : undefined
        }
      >
        {children}
      </main>

      {showBottomNav && <BottomNavigation tabs={tabs} />}

      {/* Diff Action Sheet - shows sync/approve options */}
      <DiffActionSheet
        open={showDiffActions}
        onClose={() => setShowDiffActions(false)}
        onSync={handleSync}
        onApprove={handleApprove}
        isSyncing={isSyncing}
        isApproving={isApproving}
        canSync={canSync}
        canApprove={canApprove}
        syncDisabledReason={syncDisabledReason}
        approveDisabledReason={approveDisabledReason}
      />
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
      setIsMobile(window.innerWidth < mobileTheme.breakpoints.mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
