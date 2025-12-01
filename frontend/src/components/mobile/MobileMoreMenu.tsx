import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  BookOpen,
  MessageCircleQuestion,
  MessageCircle,
  FolderOpen,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from './BottomSheet';
import { useProject } from '@/contexts/project-context';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';
import { openTaskForm } from '@/lib/openTaskForm';
import { useTheme } from '@/components/theme-provider';
import { getActualTheme } from '@/utils/theme';
import { ThemeMode } from 'shared/types';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

export interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  external?: boolean;
  type?: 'action' | 'theme-toggle' | 'separator';
}

/**
 * Mobile More Menu Component
 *
 * Bottom sheet providing access to all header controls:
 * - Theme toggle (inline switch)
 * - Open in IDE
 * - Settings
 * - New Task
 * - External links (Docs, Support, Discord)
 *
 * Design principles:
 * - Bottom sheet pattern (one-handed operation)
 * - Haptic feedback on all taps
 * - Clear visual hierarchy
 * - External links open in new tab
 */
export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const navigate = useNavigate();
  const { projectId, project } = useProject();
  const handleOpenInEditor = useOpenProjectInEditor(project || null);
  const { theme, setTheme } = useTheme();
  const actualTheme = getActualTheme(theme);

  const handleItemClick = async (item: MenuItem) => {
    if (item.disabled) return;

    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

    // Execute the item's onClick
    await item.onClick();

    // Close menu after action (except for theme toggle)
    if (item.type !== 'theme-toggle') {
      onClose();
    }
  };

  const handleThemeToggle = () => {
    setTheme(actualTheme === 'light' ? ThemeMode.DARK : ThemeMode.LIGHT);
  };

  const handleCreateTask = () => {
    if (projectId) {
      openTaskForm({ projectId });
    }
  };

  const handleOpenInIDE = () => {
    handleOpenInEditor();
  };

  const handleSettings = () => {
    navigate(
      projectId ? `/settings/projects?projectId=${projectId}` : '/settings'
    );
  };

  const handleExternalLink = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const menuItems: MenuItem[] = [
    // Theme toggle (special inline item)
    {
      id: 'theme',
      label: actualTheme === 'light' ? 'Dark Mode' : 'Light Mode',
      icon: actualTheme === 'light' ? Moon : Sun,
      onClick: handleThemeToggle,
      type: 'theme-toggle',
    },
    // Project actions (only show when inside a project)
    ...(projectId
      ? [
          {
            id: 'open-ide',
            label: 'Open in IDE',
            icon: FolderOpen,
            onClick: handleOpenInIDE,
          },
          {
            id: 'new-task',
            label: 'New Task',
            icon: Plus,
            onClick: handleCreateTask,
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: handleSettings,
    },
    // Separator (visual only)
    {
      id: 'separator',
      label: '',
      icon: () => null,
      onClick: () => {},
      type: 'separator',
    },
    // External links
    {
      id: 'docs',
      label: 'Documentation',
      icon: BookOpen,
      onClick: () => handleExternalLink('https://forge.automag.ik/'),
      external: true,
    },
    {
      id: 'support',
      label: 'Support',
      icon: MessageCircleQuestion,
      onClick: () =>
        handleExternalLink(
          'https://github.com/namastexlabs/automagik-forge/issues'
        ),
      external: true,
    },
    {
      id: 'discord',
      label: 'Discord',
      icon: MessageCircle,
      onClick: () => handleExternalLink('https://discord.gg/CEbzP5Hteh'),
      external: true,
    },
  ];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="More Options"
      snapPoints={[60]}
      dismissible={true}
    >
      <div className="flex flex-col gap-1 px-4 py-2">
        {menuItems.map((item) => {
          if (item.type === 'separator') {
            return <div key={item.id} className="h-px bg-border my-2" />;
          }

          const Icon = item.icon;
          const isThemeToggle = item.type === 'theme-toggle';

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                'rounded-lg',
                'text-left',
                'transition-all duration-200',
                'touch-target-comfortable',
                'no-select-mobile',
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted active:bg-muted/80',
                isThemeToggle && actualTheme === 'dark' && 'text-foreground',
                isThemeToggle && actualTheme === 'light' && 'text-orange-500'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isThemeToggle && actualTheme === 'light' && 'text-orange-500'
                )}
              />
              <span className="flex-1 font-medium text-sm">{item.label}</span>
              {item.external && (
                <span className="text-xs text-muted-foreground">↗</span>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
