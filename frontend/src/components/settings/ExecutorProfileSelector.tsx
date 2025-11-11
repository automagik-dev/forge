import { useState, useMemo, useRef, useCallback, useEffect, memo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Settings2, ArrowDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type {
  BaseCodingAgent,
  ExecutorConfig,
  ExecutorProfileId,
} from 'shared/types';

type Props = {
  profiles: Record<string, ExecutorConfig> | null;
  selectedProfile: ExecutorProfileId | null;
  onProfileSelect: (profile: ExecutorProfileId) => void;
  disabled?: boolean;
  showLabel?: boolean;
  showVariantSelector?: boolean;
  disableProviderChange?: boolean;
  layout?: 'inline' | 'stacked';
};

type ProfileRowProps = {
  executorKey: string;
  isSelected: boolean;
  isHighlighted: boolean;
  onHover: () => void;
  onSelect: () => void;
};

const ProfileRow = memo(function ProfileRow({
  executorKey,
  isSelected,
  isHighlighted,
  onHover,
  onSelect,
}: ProfileRowProps) {
  const classes =
    (isSelected ? 'bg-accent text-accent-foreground ' : '') +
    (!isSelected && isHighlighted ? 'bg-accent/70 ring-2 ring-accent ' : '') +
    'transition-none';

  return (
    <DropdownMenuItem
      onMouseEnter={onHover}
      onSelect={onSelect}
      className={classes.trim()}
    >
      {executorKey}
    </DropdownMenuItem>
  );
});

type VariantRowProps = {
  variantKey: string;
  isSelected: boolean;
  isHighlighted: boolean;
  onHover: () => void;
  onSelect: () => void;
};

const VariantRow = memo(function VariantRow({
  variantKey,
  isSelected,
  isHighlighted,
  onHover,
  onSelect,
}: VariantRowProps) {
  const classes =
    (isSelected ? 'bg-accent text-accent-foreground ' : '') +
    (!isSelected && isHighlighted ? 'bg-accent/70 ring-2 ring-accent ' : '') +
    'transition-none';

  return (
    <DropdownMenuItem
      onMouseEnter={onHover}
      onSelect={onSelect}
      className={classes.trim()}
    >
      {variantKey}
    </DropdownMenuItem>
  );
});

function ExecutorProfileSelector({
  profiles,
  selectedProfile,
  onProfileSelect,
  disabled = false,
  showLabel = true,
  showVariantSelector = true,
  disableProviderChange = false,
  layout = 'inline',
}: Props) {
  const { t } = useTranslation('tasks');
  const [profileSearchTerm, setProfileSearchTerm] = useState('');
  const [variantSearchTerm, setVariantSearchTerm] = useState('');
  const [profileHighlightedIndex, setProfileHighlightedIndex] = useState<number | null>(null);
  const [variantHighlightedIndex, setVariantHighlightedIndex] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const profileSearchInputRef = useRef<HTMLInputElement>(null);
  const variantSearchInputRef = useRef<HTMLInputElement>(null);
  const profileVirtuosoRef = useRef<VirtuosoHandle>(null);
  const variantVirtuosoRef = useRef<VirtuosoHandle>(null);

  const handleExecutorChange = useCallback((executor: string) => {
    onProfileSelect({
      executor: executor as BaseCodingAgent,
      variant: null,
    });
    setProfileSearchTerm('');
    setProfileHighlightedIndex(null);
    setProfileOpen(false);
  }, [onProfileSelect]);

  const handleVariantChange = useCallback((variant: string) => {
    if (selectedProfile) {
      onProfileSelect({
        ...selectedProfile,
        variant: variant === 'GENIE' ? null : variant,
      });
    }
    setVariantSearchTerm('');
    setVariantHighlightedIndex(null);
    setVariantOpen(false);
  }, [selectedProfile, onProfileSelect]);

  const currentProfile = selectedProfile && profiles
    ? profiles[selectedProfile.executor]
    : null;
  const hasVariants = currentProfile && Object.keys(currentProfile).length > 0;

  // Filtered and sorted profiles
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    let profileKeys = Object.keys(profiles).sort((a, b) => a.localeCompare(b));

    if (profileSearchTerm.trim()) {
      const q = profileSearchTerm.toLowerCase();
      profileKeys = profileKeys.filter((key) => key.toLowerCase().includes(q));
    }
    return profileKeys;
  }, [profiles, profileSearchTerm]);

  // Filtered and sorted variants
  const filteredVariants = useMemo(() => {
    if (!currentProfile) return [];
    let variantKeys = Object.keys(currentProfile).sort((a, b) => a.localeCompare(b));

    if (variantSearchTerm.trim()) {
      const q = variantSearchTerm.toLowerCase();
      variantKeys = variantKeys.filter((key) => key.toLowerCase().includes(q));
    }
    return variantKeys;
  }, [currentProfile, variantSearchTerm]);

  // Profile keyboard navigation
  const moveProfileHighlight = useCallback(
    (delta: 1 | -1) => {
      if (filteredProfiles.length === 0) return;

      const start = profileHighlightedIndex ?? -1;
      const next = (start + delta + filteredProfiles.length) % filteredProfiles.length;
      setProfileHighlightedIndex(next);
      profileVirtuosoRef.current?.scrollIntoView({
        index: next,
        behavior: 'auto',
      });
    },
    [filteredProfiles.length, profileHighlightedIndex]
  );

  const attemptProfileSelect = useCallback(() => {
    if (profileHighlightedIndex == null) return;
    const executorKey = filteredProfiles[profileHighlightedIndex];
    if (!executorKey) return;
    handleExecutorChange(executorKey);
  }, [profileHighlightedIndex, filteredProfiles, handleExecutorChange]);

  // Variant keyboard navigation
  const moveVariantHighlight = useCallback(
    (delta: 1 | -1) => {
      if (filteredVariants.length === 0) return;

      const start = variantHighlightedIndex ?? -1;
      const next = (start + delta + filteredVariants.length) % filteredVariants.length;
      setVariantHighlightedIndex(next);
      variantVirtuosoRef.current?.scrollIntoView({
        index: next,
        behavior: 'auto',
      });
    },
    [filteredVariants.length, variantHighlightedIndex]
  );

  const attemptVariantSelect = useCallback(() => {
    if (variantHighlightedIndex == null) return;
    const variantKey = filteredVariants[variantHighlightedIndex];
    if (!variantKey) return;
    handleVariantChange(variantKey);
  }, [variantHighlightedIndex, filteredVariants, handleVariantChange]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (profileOpen && profileSearchInputRef.current) {
      // Small delay to ensure dropdown is mounted
      setTimeout(() => {
        profileSearchInputRef.current?.focus();
      }, 10);
    }
  }, [profileOpen]);

  useEffect(() => {
    if (variantOpen && variantSearchInputRef.current) {
      setTimeout(() => {
        variantSearchInputRef.current?.focus();
      }, 10);
    }
  }, [variantOpen]);

  // Reset highlights when search changes
  useEffect(() => {
    setProfileHighlightedIndex(null);
  }, [profileSearchTerm]);

  useEffect(() => {
    setVariantHighlightedIndex(null);
  }, [variantSearchTerm]);

  // Show loading state instead of returning null
  const isLoading = !profiles;

  // Determine container classes based on layout
  const containerClasses = layout === 'inline'
    ? "flex gap-3 items-center"
    : "space-y-3";

  const selectorContainerClasses = layout === 'inline'
    ? "flex items-center gap-2 flex-1"
    : "space-y-1.5";

  const labelClasses = layout === 'inline'
    ? "text-sm font-medium whitespace-nowrap"
    : "text-sm font-medium";

  return (
    <div className={containerClasses}>
      {/* Executor Profile Selector */}
      <div className={selectorContainerClasses}>
        {showLabel && (
          <Label htmlFor="executor-profile" className={labelClasses}>
            Provider
          </Label>
        )}
        <DropdownMenu
          open={isLoading ? false : profileOpen}
          onOpenChange={(next) => {
            setProfileOpen(next);
            if (!next) {
              setProfileSearchTerm('');
              setProfileHighlightedIndex(null);
            }
          }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block w-full">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-between text-xs",
                        disableProviderChange && "pointer-events-none"
                      )}
                      disabled={disabled || isLoading || disableProviderChange}
                    >
                      <div className="flex items-center gap-1.5">
                        <Settings2 className="h-3 w-3" />
                        <span className="truncate">
                          {isLoading
                            ? 'Loading providers...'
                            : selectedProfile?.executor || 'Select provider'}
                        </span>
                      </div>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </span>
              </TooltipTrigger>
              {disableProviderChange && (
                <TooltipContent>
                  {t('executorProfileSelector.disabledProviderTooltip')}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent className="w-80">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={profileSearchInputRef}
                  placeholder="Search providers..."
                  value={profileSearchTerm}
                  onChange={(e) => setProfileSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    switch (e.key) {
                      case 'ArrowDown':
                        e.preventDefault();
                        e.stopPropagation();
                        moveProfileHighlight(1);
                        return;
                      case 'ArrowUp':
                        e.preventDefault();
                        e.stopPropagation();
                        moveProfileHighlight(-1);
                        return;
                      case 'Enter':
                        e.preventDefault();
                        e.stopPropagation();
                        attemptProfileSelect();
                        return;
                      case 'Escape':
                        e.preventDefault();
                        e.stopPropagation();
                        setProfileOpen(false);
                        return;
                      case 'Tab':
                        return;
                      default:
                        e.stopPropagation();
                    }
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            {filteredProfiles.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No agents found
              </div>
            ) : (
              <Virtuoso
                ref={profileVirtuosoRef}
                style={{ height: '16rem' }}
                totalCount={filteredProfiles.length}
                computeItemKey={(idx) => filteredProfiles[idx] ?? idx}
                itemContent={(idx) => {
                  const executorKey = filteredProfiles[idx];
                  const isHighlighted = idx === profileHighlightedIndex;
                  const isSelected = selectedProfile?.executor === executorKey;

                  return (
                    <ProfileRow
                      executorKey={executorKey}
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      onHover={() => setProfileHighlightedIndex(idx)}
                      onSelect={() => handleExecutorChange(executorKey)}
                    />
                  );
                }}
              />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Variant Selector (conditional) */}
      {showVariantSelector &&
        selectedProfile &&
        hasVariants &&
        currentProfile && (
          <div className={selectorContainerClasses}>
            <Label htmlFor="executor-variant" className={labelClasses}>
              Agent
            </Label>
            <DropdownMenu
              open={isLoading ? false : variantOpen}
              onOpenChange={(next) => {
                setVariantOpen(next);
                if (!next) {
                  setVariantSearchTerm('');
                  setVariantHighlightedIndex(null);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs"
                  disabled={disabled || isLoading}
                >
                  <span className="truncate">
                    {isLoading
                      ? 'Loading agents...'
                      : selectedProfile.variant || 'GENIE'}
                  </span>
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={variantSearchInputRef}
                      placeholder="Search agents..."
                      value={variantSearchTerm}
                      onChange={(e) => setVariantSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        switch (e.key) {
                          case 'ArrowDown':
                            e.preventDefault();
                            e.stopPropagation();
                            moveVariantHighlight(1);
                            return;
                          case 'ArrowUp':
                            e.preventDefault();
                            e.stopPropagation();
                            moveVariantHighlight(-1);
                            return;
                          case 'Enter':
                            e.preventDefault();
                            e.stopPropagation();
                            attemptVariantSelect();
                            return;
                          case 'Escape':
                            e.preventDefault();
                            e.stopPropagation();
                            setVariantOpen(false);
                            return;
                          case 'Tab':
                            return;
                          default:
                            e.stopPropagation();
                        }
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                {filteredVariants.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No agents found
                  </div>
                ) : (
                  <Virtuoso
                    ref={variantVirtuosoRef}
                    style={{ height: '16rem' }}
                    totalCount={filteredVariants.length}
                    computeItemKey={(idx) => filteredVariants[idx] ?? idx}
                    itemContent={(idx) => {
                      const variantKey = filteredVariants[idx];
                      const isHighlighted = idx === variantHighlightedIndex;
                      const isSelected = selectedProfile.variant === variantKey;

                      return (
                        <VariantRow
                          variantKey={variantKey}
                          isSelected={isSelected}
                          isHighlighted={isHighlighted}
                          onHover={() => setVariantHighlightedIndex(idx)}
                          onSelect={() => handleVariantChange(variantKey)}
                        />
                      );
                    }}
                  />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

      {/* Show disabled variant selector for profiles without variants */}
      {showVariantSelector &&
        selectedProfile &&
        !hasVariants &&
        currentProfile && (
          <div className={selectorContainerClasses}>
            <Label htmlFor="executor-variant" className={labelClasses}>
              Agent
            </Label>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-full text-xs justify-start"
            >
              Default
            </Button>
          </div>
        )}

      {/* Show placeholder for variant when no profile selected */}
      {showVariantSelector && !selectedProfile && (
        <div className={selectorContainerClasses}>
          <Label htmlFor="executor-variant" className={labelClasses}>
            Agent
          </Label>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full text-xs justify-start"
          >
            Select provider first
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExecutorProfileSelector;
