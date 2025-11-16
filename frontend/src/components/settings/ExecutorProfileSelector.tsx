import { useState, useMemo, useRef, useCallback, useEffect, memo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Settings2, ArrowDown, Search, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ProviderIcon } from '@/components/providers/ProviderIcon';
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
      <div className="flex items-center gap-2">
        <ProviderIcon executor={executorKey as BaseCodingAgent} className="h-4 w-4" />
        <span>{executorKey}</span>
      </div>
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
}: Props) {
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

  return (
    <div className="flex gap-3 flex-col sm:flex-row">
      {/* Executor Profile Selector */}
      <div className="flex-1">
        {showLabel && (
          <Label htmlFor="executor-profile" className="text-sm font-medium">
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
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between text-xs mt-1.5"
              disabled={disabled || isLoading}
            >
              <div className="flex items-center gap-1.5">
                {selectedProfile?.executor ? (
                  <ProviderIcon executor={selectedProfile.executor} className="h-3 w-3" />
                ) : (
                  <Settings2 className="h-3 w-3" />
                )}
                <span className="truncate">
                  {isLoading
                    ? 'Loading providers...'
                    : selectedProfile?.executor || 'Select provider'}
                </span>
              </div>
              <ArrowDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
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
          <div className="flex-1">
            <Label htmlFor="executor-variant" className="text-sm font-medium">
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
                  className="w-full justify-between text-xs mt-1.5"
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
          <div className="flex-1">
            <Label htmlFor="executor-variant" className="text-sm font-medium">
              Agent
            </Label>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-full text-xs justify-start mt-1.5"
            >
              Default
            </Button>
          </div>
        )}

      {/* Show placeholder for variant when no profile selected */}
      {showVariantSelector && !selectedProfile && (
        <div className="flex-1">
          <Label htmlFor="executor-variant" className="text-sm font-medium">
            Agent
          </Label>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full text-xs justify-start mt-1.5"
          >
            Select provider first
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExecutorProfileSelector;

// Compact icon-only selector for chat input toolbar
type CompactProps = {
  profiles: Record<string, ExecutorConfig> | null;
  selectedProfile: ExecutorProfileId | null;
  onProfileSelect: (profile: ExecutorProfileId) => void;
  disabled?: boolean;
};

export function CompactExecutorSelector({
  profiles,
  selectedProfile,
  onProfileSelect,
  disabled = false,
}: CompactProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);

  const currentProfile = selectedProfile && profiles
    ? profiles[selectedProfile.executor]
    : null;
  const hasVariants = currentProfile && Object.keys(currentProfile).length > 0;

  const handleExecutorChange = useCallback((executor: string) => {
    onProfileSelect({
      executor: executor as BaseCodingAgent,
      variant: null,
    });
    setProfileOpen(false);
  }, [onProfileSelect]);

  const handleVariantChange = useCallback((variant: string) => {
    if (selectedProfile) {
      onProfileSelect({
        ...selectedProfile,
        variant: variant === 'GENIE' ? null : variant,
      });
    }
    setVariantOpen(false);
  }, [selectedProfile, onProfileSelect]);

  const profileKeys = useMemo(() => {
    if (!profiles) return [];
    return Object.keys(profiles).sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const variantKeys = useMemo(() => {
    if (!currentProfile) return [];
    return Object.keys(currentProfile).sort((a, b) => a.localeCompare(b));
  }, [currentProfile]);

  const isLoading = !profiles;

  return (
    <>
      {/* Provider Icon Button */}
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu
            open={isLoading ? false : profileOpen}
            onOpenChange={setProfileOpen}
          >
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || isLoading}
                >
                  {selectedProfile?.executor ? (
                    <ProviderIcon executor={selectedProfile.executor} className="h-4 w-4" />
                  ) : (
                    <Settings2 className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {profileKeys.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No providers found
                </div>
              ) : (
                profileKeys.map((executorKey) => (
                  <DropdownMenuItem
                    key={executorKey}
                    onSelect={() => handleExecutorChange(executorKey)}
                    className={
                      selectedProfile?.executor === executorKey
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }
                  >
                    <div className="flex items-center gap-2">
                      <ProviderIcon executor={executorKey as BaseCodingAgent} className="h-4 w-4" />
                      <span>{executorKey}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>
            <p className="text-xs">
              Provider: {selectedProfile?.executor || 'None selected'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Agent Icon Button (only show if variants exist) */}
      {selectedProfile && hasVariants && (
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu
              open={isLoading ? false : variantOpen}
              onOpenChange={setVariantOpen}
            >
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || isLoading}
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {variantKeys.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No agents found
                  </div>
                ) : (
                  variantKeys.map((variantKey) => (
                    <DropdownMenuItem
                      key={variantKey}
                      onSelect={() => handleVariantChange(variantKey)}
                      className={
                        selectedProfile.variant === variantKey
                          ? 'bg-accent text-accent-foreground'
                          : ''
                      }
                    >
                      {variantKey}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>
              <p className="text-xs">
                Agent: {selectedProfile.variant || 'GENIE'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}
