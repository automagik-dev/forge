import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search-bar';
import { useProject } from '@/contexts/project-context';
import { useSearch } from '@/contexts/search-context';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

export interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile Search Overlay Component
 *
 * Full-screen search overlay for mobile devices providing:
 * - Auto-focused search input
 * - Recent searches (future)
 * - Search results inline
 * - Close button (top-left)
 *
 * Design principles:
 * - Full-screen takeover (maximum focus)
 * - Auto-focus keyboard on open
 * - Swipe down to close (future)
 * - Haptic feedback on interactions
 */
export function MobileSearchOverlay({
  open,
  onClose
}: MobileSearchOverlayProps) {
  const { project } = useProject();
  const { query, setQuery, active, clear } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when overlay opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleClose = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    clear(); // Clear search on close
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0',
        'bg-background',
        'z-[var(--z-mobile-modal)]',
        'flex flex-col',
        'pt-safe pb-safe'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8 shrink-0"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Search input */}
        <div className="flex-1">
          <SearchBar
            ref={searchInputRef}
            value={query}
            onChange={setQuery}
            disabled={!active}
            onClear={clear}
            project={project || null}
            className="w-full"
          />
        </div>
      </div>

      {/* Search results or empty state */}
      <div className="flex-1 overflow-auto px-4 py-6">
        {!query ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">Start typing to search...</p>
            {/* Future: Recent searches */}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">Searching for "{query}"...</p>
            {/* Future: Actual search results */}
          </div>
        )}
      </div>
    </div>
  );
}
