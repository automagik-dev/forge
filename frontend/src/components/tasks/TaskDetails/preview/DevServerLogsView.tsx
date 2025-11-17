import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ProcessLogsViewer, {
  ProcessLogsViewerContent,
} from '../ProcessLogsViewer';
import { ExecutionProcess } from 'shared/types';

interface DevServerLogsViewProps {
  latestDevServerProcess: ExecutionProcess | undefined;
  showLogs: boolean;
  onToggle: () => void;
  height?: string;
  showToggleText?: boolean;
  logs?: Array<{ type: 'STDOUT' | 'STDERR'; content: string }>;
  error?: string | null;
}

export function DevServerLogsView({
  latestDevServerProcess,
  showLogs,
  onToggle,
  height = 'h-60',
  logs,
  error,
}: DevServerLogsViewProps) {
  const { t } = useTranslation('tasks');
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = async () => {
    if (!logs || logs.length === 0) {
      console.warn('No logs to copy');
      return;
    }

    try {
      const logsText = logs
        .map((log) => `[${log.type}] ${log.content}`)
        .join('\n');

      await navigator.clipboard.writeText(logsText);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  if (!latestDevServerProcess) {
    return null;
  }

  return (
    <div className="border-t bg-background">
      {/* Clickable logs header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 border-b bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        aria-label={showLogs ? t('preview.logs.hide') : t('preview.logs.show')}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {t('preview.logs.title')}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${showLogs ? '' : 'rotate-180'}`}
        />
      </button>

      {/* Logs viewer with copy button */}
      {showLogs && (
        <div className={`${height} flex flex-col relative bg-background`}>
          {/* Copy button overlay on logs panel with smooth background */}
          <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="icon"
                    size="sm"
                    onClick={handleCopyLogs}
                    disabled={!logs || logs.length === 0}
                    aria-label={copied ? t('preview.logs.copied') : t('preview.logs.copy')}
                    className="hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {copied ? t('preview.logs.copied') : t('preview.logs.copy')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Actual logs content - full height */}
          <div className="flex-1 overflow-hidden">
            {logs ? (
              <ProcessLogsViewerContent logs={logs} error={error ?? null} />
            ) : (
              <ProcessLogsViewer processId={latestDevServerProcess.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
