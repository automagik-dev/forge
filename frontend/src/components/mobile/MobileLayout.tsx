import React, { useState } from 'react';
import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { BottomNavigation, BottomNavTab } from './BottomNavigation';
import { usePlatform } from '@/lib/platform';
import { useProject } from '@/contexts/project-context';
import { Kanban, GitCompareArrows, FileText, Settings, Heart, ListTodo, Plus } from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';
import { DiffActionSheet } from './DiffActionSheet';
import { openTaskForm } from '@/lib/openTaskForm';
// TODO: Import and wire up TasksDrawer and TasksListView with proper data
// import { TasksDrawer } from './TasksDrawer';
// import { TasksListView } from './TasksListView';

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
  // const [showTasksDrawer, setShowTasksDrawer] = useState(false); // TODO: Re-enable when TasksDrawer is wired up

  const tabs: BottomNavTab[] = React.useMemo(() => {
    const basePath = projectId ? `/projects/${projectId}/tasks` : '/projects';

    // When inside a task (any view), show: Task/Diff/View + Diff Action Badges
    if (taskId && projectId) {
      const attemptId = location.pathname.match(/\/attempts\/([^/?]+)/)?.[1];
      const taskPath = attemptId 
        ? `${basePath}/${taskId}/attempts/${attemptId}`
        : `${basePath}/${taskId}/attempts/latest`;
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
      // baseTabs.push({
      //   id: 'diff-actions',
      //   label: t('mobile.navigation.actions'),
      //   icon: (
      //     <div className="relative flex items-center gap-1">
      //       <div className="w-3 h-3 rounded-full bg-green-500" />
      //       <div className="w-3 h-3 rounded-full bg-orange-500" />
      //     </div>
      //   ),
      //   onClick: () => setShowDiffActions(true),
      // });

      return baseTabs;
    }

    // When inside a project (not in a specific task), show: Kanban/New/Genie/Config
    if (projectId) {
      return [
        {
          id: 'kanban',
          label: t('mobile.navigation.kanban'),
          icon: <Kanban size={20} />,
          // Kanban board shows traditional board view with ?view=kanban
          // Default (no view param) shows mobile-optimized list view
          path: `${basePath}?view=kanban`,
        },
        {
          id: 'new',
          label: t('mobile.navigation.new'),
          icon: <Plus size={20} />,
          onClick: () => openTaskForm({ projectId }),
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

    // Default fallback (no project) - show tasks, chat, new, me
    return [
      {
        id: 'tasks',
        label: t('mobile.navigation.tasks'),
        icon: <ListTodo size={20} />,
        path: '/projects',
      },
      {
        id: 'chat',
        label: t('mobile.navigation.genie'),
        icon: <Lamp size={26} />,
        path: '/chat',
      },
      {
        id: 'new',
        label: t('mobile.navigation.new'),
        icon: <Plus size={20} />,
        onClick: () => openTaskForm({}),
      },
      {
        id: 'me',
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
      <main className={cn(
        'flex-1 overflow-auto mobile-scroll',
        showBottomNav && 'pb-16 pb-safe',
        contentClassName
      )}>
        {children}
      </main>

      {showBottomNav && <BottomNavigation tabs={tabs} />}

      {/* Tasks Drawer - slides from left */}
      {/* TODO: Wire up TasksListView with proper tasks data and click handler */}
      {/* For now, drawer is implemented but content needs to be connected to task data */}

      {/* Diff Action Sheet - shows sync/approve options */}
      <DiffActionSheet
        open={showDiffActions}
        onClose={() => setShowDiffActions(false)}
        onSync={() => {
          // TODO: Implement sync (rebase) action
          console.log('Sync clicked - TODO: implement rebase');
        }}
        onApprove={() => {
          // TODO: Implement approve (merge) action
          console.log('Approve clicked - TODO: implement merge');
        }}
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
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
