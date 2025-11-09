import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  showToggleText = true,
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
      {/* Logs toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {t('preview.logs.title')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyLogs}
            disabled={!logs || logs.length === 0}
          >
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? t('preview.logs.copied') : t('preview.logs.copy')}
          </Button>
          <Button size="sm" variant="ghost" onClick={onToggle}>
            <ChevronDown
              className={`h-4 w-4 mr-1 ${showToggleText ? 'transition-transform' : ''} ${showLogs ? '' : 'rotate-180'}`}
            />
            {showToggleText
              ? showLogs
                ? t('preview.logs.hide')
                : t('preview.logs.show')
              : t('preview.logs.hide')}
          </Button>
        </div>
      </div>

      {/* Logs viewer */}
      {showLogs && (
        <div className={height}>
          {logs ? (
            <ProcessLogsViewerContent logs={logs} error={error ?? null} />
          ) : (
            <ProcessLogsViewer processId={latestDevServerProcess.id} />
          )}
        </div>
      )}
    </div>
  );
}
