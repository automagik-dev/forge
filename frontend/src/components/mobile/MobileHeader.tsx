import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/project-context';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

export interface MobileHeaderProps {
  onSearchClick: () => void;
  onMoreClick: () => void;
  className?: string;
}

/**
 * Mobile Header Component
 *
 * Compact 32px header for mobile devices providing:
 * - Project breadcrumb (truncated, clickable)
 * - Search button (opens full-screen overlay)
 * - More menu button (opens bottom sheet)
 *
 * Design principles:
 * - Minimal height (32px) to preserve content space
 * - Always visible (no collapse behavior)
 * - Safe area aware (notch/Dynamic Island)
 * - Thumb-accessible controls
 */
export function MobileHeader({
  onSearchClick,
  onMoreClick,
  className
}: MobileHeaderProps) {
  const { project } = useProject();
  const navigate = useNavigate();

  const handleBreadcrumbClick = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    navigate('/projects');
  };

  const handleSearchClick = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    onSearchClick();
  };

  const handleMoreClick = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    onMoreClick();
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0',
        'h-8', // 32px height
        'flex items-center justify-between',
        'px-4 pt-safe',
        'glass-medium border-b border-white/15',
        'z-[var(--z-mobile-header)]',
        className
      )}
    >
      {/* Left: Breadcrumb */}
      <button
        onClick={handleBreadcrumbClick}
        className={cn(
          'flex-1 min-w-0',
          'text-sm font-medium text-foreground',
          'text-left truncate',
          'no-select-mobile',
          'transition-opacity duration-200',
          'active:opacity-70'
        )}
      >
        {project?.name || 'Forge'}
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          className="h-6 w-6 p-0"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* More menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMoreClick}
          className="h-6 w-6 p-0"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
