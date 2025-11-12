import React from 'react';
import { cn } from '@/lib/utils';
import { usePlatform } from '@/lib/platform';

export interface MobileChatLayoutProps {
  children: React.ReactNode;
  inputBar?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Chat-first layout for mobile routes
 * - Full-screen chat interface
 * - No sidebars or secondary navigation
 * - Persistent input bar at bottom
 * - Optimized for conversation flow
 */
export function MobileChatLayout({
  children,
  inputBar,
  className,
  contentClassName,
}: MobileChatLayoutProps) {
  const { isNative } = usePlatform();

  return (
    <div
      className={cn(
        'h-screen flex flex-col bg-[#1A1625]',
        isNative && 'pt-safe',
        className
      )}
    >
      {/* Main chat content area */}
      <main
        className={cn(
          'flex-1 overflow-auto mobile-scroll',
          inputBar && 'pb-20 pb-safe', // Extra padding for input bar
          contentClassName
        )}
      >
        {children}
      </main>

      {/* Persistent input bar (if provided) */}
      {inputBar && (
        <div className="fixed bottom-0 left-0 right-0 z-[var(--z-mobile-input-bar)]">
          {inputBar}
        </div>
      )}
    </div>
  );
}
