import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/components/mobile/MobileLayout';

export interface ProgressiveDisclosureProps {
  title?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsedHeight?: number;
  showMoreText?: string;
  showLessText?: string;
  className?: string;
  contentClassName?: string;
  onToggle?: (expanded: boolean) => void;
}

/**
 * Progressive Disclosure component for mobile interfaces
 * - Collapses content by default on mobile
 * - Expands on tap to show full content
 * - Smooth height transitions
 * - Always expanded on desktop
 * 
 * Use cases:
 * - Task cards: Collapsed by default, expand for details
 * - Conversation entries: Code blocks collapsed
 * - File tree: Show 3 levels, expand on demand
 * - Logs: Show recent, load more on scroll
 * - Diffs: Show changed files, expand for hunks
 */
export function ProgressiveDisclosure({
  title,
  children,
  defaultExpanded = false,
  collapsedHeight = 120,
  showMoreText = 'Show More',
  showLessText = 'Show Less',
  className,
  contentClassName,
  onToggle,
}: ProgressiveDisclosureProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  if (!isMobile) {
    return (
      <div className={cn('w-full', className)}>
        {title && (
          <h3 className="font-primary text-lg font-semibold mb-2 text-foreground">
            {title}
          </h3>
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    );
  }

  const shouldShowToggle = contentHeight && contentHeight > collapsedHeight;

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="font-primary text-lg font-semibold mb-2 text-foreground">
          {title}
        </h3>
      )}
      
      <div
        ref={contentRef}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          contentClassName
        )}
        style={{
          maxHeight: isExpanded
            ? contentHeight || 'none'
            : shouldShowToggle
            ? `${collapsedHeight}px`
            : 'none',
        }}
      >
        {children}
      </div>

      {shouldShowToggle && (
        <button
          onClick={handleToggle}
          className={cn(
            'mt-2 flex items-center gap-1 text-sm font-secondary',
            'text-brand-cyan hover:text-brand-cyan/80',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:ring-offset-2 rounded'
          )}
        >
          <span>{isExpanded ? showLessText : showMoreText}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Collapsible section with header and content
 */
export interface CollapsibleSectionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (expanded: boolean) => void;
}

export function CollapsibleSection({
  header,
  children,
  defaultExpanded = false,
  className,
  headerClassName,
  contentClassName,
  onToggle,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className={cn('w-full', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between',
          'py-3 px-4 rounded-lg',
          'glass-light hover:glass-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:ring-offset-2',
          headerClassName
        )}
      >
        <div className="flex-1 text-left">{header}</div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isExpanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn('p-4', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
