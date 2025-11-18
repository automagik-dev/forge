import { ExternalLink, RefreshCw, Copy, Loader2, Pause, Edit3, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NewCardHeader } from '@/components/ui/new-card';
import { validateAndNormalizeUrl } from '@/hooks/useManualPreviewUrl';
import { useIsMobile } from '@/components/mobile';

interface PreviewToolbarProps {
  mode: 'noServer' | 'error' | 'ready';
  url?: string;
  onRefresh: () => void;
  onCopyUrl: () => void;
  onStop: () => void;
  isStopping?: boolean;
  isManualUrl?: boolean;
  onSetManualUrl?: (url: string | null) => void;
}

export function PreviewToolbar({
  mode,
  url,
  onRefresh,
  onCopyUrl,
  onStop,
  isStopping,
  isManualUrl = false,
  onSetManualUrl,
}: PreviewToolbarProps) {
  const { t } = useTranslation('tasks');
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditClick = () => {
    setEditValue(url || '');
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const result = validateAndNormalizeUrl(editValue);
    if (!result.valid) {
      setEditError(result.error || 'Invalid URL');
      return;
    }
    
    if (onSetManualUrl && result.url) {
      onSetManualUrl(result.url);
    }
    setIsEditing(false);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
    setEditError(null);
  };

  const handleResetToAuto = () => {
    if (onSetManualUrl) {
      onSetManualUrl(null);
    }
  };

  const actions =
    mode !== 'noServer' ? (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.refresh')}
                onClick={onRefresh}
                className={isMobile ? 'h-8 w-8' : ''}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.refresh')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="icon"
                  aria-label={t('preview.toolbar.copyUrl')}
                  onClick={onCopyUrl}
                  disabled={!url}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('preview.toolbar.copyUrl')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.openInTab')}
                asChild
                disabled={!url}
                className={isMobile ? 'h-8 w-8' : ''}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.openInTab')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-4 w-px bg-border" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                aria-label={t('preview.toolbar.stopDevServer')}
                onClick={onStop}
                disabled={isStopping}
                className={isMobile ? 'h-8 w-8' : ''}
              >
                {isStopping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('preview.toolbar.stopDevServer')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ) : undefined;

  return (
    <NewCardHeader className="shrink-0" actions={actions}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="http://localhost:3000 or just 3000"
              className="h-7 text-sm font-mono flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
            />
            <Button
              variant="icon"
              size="sm"
              onClick={handleSaveEdit}
              className="h-7 w-7"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="icon"
              size="sm"
              onClick={handleCancelEdit}
              className="h-7 w-7"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            {editError && (
              <span className="text-xs text-destructive">{editError}</span>
            )}
          </>
        ) : (
          <>
            {isManualUrl && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-medium shrink-0">
                Manual
              </span>
            )}
            <span
              className={`text-muted-foreground font-mono truncate ${isMobile ? 'text-xs' : 'text-sm'}`}
              aria-live="polite"
            >
              {url || <Loader2 className="h-4 w-4 animate-spin" />}
            </span>
            {mode === 'ready' && onSetManualUrl && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={handleEditClick}
                        className={isMobile ? 'h-7 w-7 shrink-0' : 'h-6 w-6 shrink-0'}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Edit URL
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isManualUrl && !isMobile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetToAuto}
                          className="h-6 text-xs shrink-0"
                        >
                          Reset to auto
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Clear manual URL and use auto-detection
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </>
        )}
      </div>
    </NewCardHeader>
  );
}
