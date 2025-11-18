import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevserverPreview } from '@/hooks/useDevserverPreview';
import { useDevServer } from '@/hooks/useDevServer';
import { useLogStream } from '@/hooks/useLogStream';
import { useDevserverUrlFromLogs } from '@/hooks/useDevserverUrl';
import { useDevserverBuildState } from '@/hooks/useDevserverBuildState';
import { useManualPreviewUrl } from '@/hooks/useManualPreviewUrl';
import { ClickToComponentListener } from '@/utils/previewBridge';
import { useClickedElements } from '@/contexts/ClickedElementsProvider';
import { Alert } from '@/components/ui/alert';
import { useProject } from '@/contexts/project-context';
import { DevServerLogsView } from '@/components/tasks/TaskDetails/preview/DevServerLogsView';
import { PreviewToolbar } from '@/components/tasks/TaskDetails/preview/PreviewToolbar';
import { NoServerContent } from '@/components/tasks/TaskDetails/preview/NoServerContent';
import { ReadyContent } from '@/components/tasks/TaskDetails/preview/ReadyContent';

export function PreviewPanel() {
  const [iframeError, setIframeError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const listenerRef = useRef<ClickToComponentListener | null>(null);

  const { t } = useTranslation('tasks');
  const { project, projectId } = useProject();
  const { attemptId: rawAttemptId } = useParams<{ attemptId?: string }>();

  const attemptId =
    rawAttemptId && rawAttemptId !== 'latest' ? rawAttemptId : undefined;
  const projectHasDevScript = Boolean(project?.dev_script);

  const {
    start: startDevServer,
    stop: stopDevServer,
    isStarting: isStartingDevServer,
    isStopping: isStoppingDevServer,
    runningDevServer,
    latestDevServerProcess,
  } = useDevServer(attemptId);

  const logStream = useLogStream(latestDevServerProcess?.id ?? '');
  const autoDetectedUrl = useDevserverUrlFromLogs(logStream.logs);
  const buildState = useDevserverBuildState(logStream.logs, Boolean(autoDetectedUrl));
  
  const { manualUrl, setManualUrl, isManual } = useManualPreviewUrl(projectId!);

  const lastKnownUrl = useMemo(() => {
    if (manualUrl) {
      return {
        url: manualUrl,
        scheme: manualUrl.startsWith('https') ? 'https' as const : 'http' as const
      };
    }
    return autoDetectedUrl;
  }, [manualUrl, autoDetectedUrl]);

  const previewState = useDevserverPreview(attemptId, {
    projectHasDevScript,
    projectId: projectId!,
    lastKnownUrl,
  });

  const handleRefresh = () => {
    setIframeError(false);
    setRefreshKey((prev) => prev + 1);
  };
  const handleIframeError = () => {
    setIframeError(true);
  };

  const { addElement } = useClickedElements();

  const handleCopyUrl = async () => {
    if (previewState.url) {
      await navigator.clipboard.writeText(previewState.url);
    }
  };

  useEffect(() => {
    if (previewState.status !== 'ready' || !previewState.url || !addElement) {
      return;
    }

    const listener = new ClickToComponentListener({
      onOpenInEditor: (payload) => {
        addElement(payload);
      },
      onReady: () => {
        setIsReady(true);
        setShowLogs(false);
      },
    });

    listener.start();
    listenerRef.current = listener;

    return () => {
      listener.stop();
      listenerRef.current = null;
    };
  }, [previewState.status, previewState.url, addElement]);

  // Auto-show logs when dev server is running but not ready
  useEffect(() => {
    if (runningDevServer && !isReady && latestDevServerProcess) {
      // Only show logs if actively building or in error state
      if (buildState === 'building' || buildState === 'error' || buildState === 'idle') {
        setShowLogs(true);
      }
    }
  }, [buildState, isReady, latestDevServerProcess, runningDevServer]);

  const isPreviewReady =
    previewState.status === 'ready' &&
    Boolean(previewState.url) &&
    !iframeError;
  const mode = iframeError
    ? 'error'
    : isPreviewReady
      ? 'ready'
      : runningDevServer
        ? 'searching'
        : 'noServer';
  const toggleLogs = () => {
    setShowLogs((v) => !v);
  };

  const handleStartDevServer = () => {
    startDevServer();
    setIsReady(false);
  };

  const handleStopAndEdit = () => {
    stopDevServer();
  };

  if (!attemptId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">{t('preview.title')}</p>
          <p className="text-sm mt-2">{t('preview.selectAttempt')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`flex-1 flex flex-col min-h-0`}>
        {mode === 'ready' ? (
          <>
            <PreviewToolbar
              mode={mode}
              url={previewState.url}
              onRefresh={handleRefresh}
              onCopyUrl={handleCopyUrl}
              onStop={stopDevServer}
              isStopping={isStoppingDevServer}
              isManualUrl={isManual}
              onSetManualUrl={setManualUrl}
            />
            <ReadyContent
              url={previewState.url}
              iframeKey={`${previewState.url}-${refreshKey}`}
              onIframeError={handleIframeError}
            />
          </>
        ) : (
          <NoServerContent
            projectHasDevScript={projectHasDevScript}
            runningDevServer={runningDevServer}
            isStartingDevServer={isStartingDevServer}
            startDevServer={handleStartDevServer}
            stopDevServer={stopDevServer}
            project={project}
            onSetManualUrl={setManualUrl}
          />
        )}

        {/* Building state - show friendly info message */}
        {buildState === 'building' && runningDevServer && !isReady && (
          <Alert className="mx-2 sm:mx-4 my-2 space-y-2 border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Loader2 className="h-4 w-4 animate-spin mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1 space-y-1 min-w-0">
                <p className="font-bold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                  {t('preview.buildingAlert.title')}
                </p>
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                  {t('preview.buildingAlert.description')}
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Idle/Error state - show troubleshooting message */}
        {(buildState === 'idle' || buildState === 'error') && runningDevServer && !isReady && (
          <Alert variant="destructive" className="mx-2 sm:mx-4 my-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2 min-w-0">
                <p className="font-bold text-sm sm:text-base">{t('preview.troubleAlert.title')}</p>
                <p className="text-xs sm:text-sm">{t('preview.troubleAlert.description')}</p>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm overflow-x-auto">
                  <li className="break-words">{t('preview.troubleAlert.item1')}</li>
                  <li className="break-words">
                    {t('preview.troubleAlert.item2')}{' '}
                    <code className="text-xs break-all">http://localhost:3000</code>{' '}
                    {t('preview.troubleAlert.item2Suffix')}
                  </li>
                  <li className="break-words">
                    {t('preview.troubleAlert.item3')}{' '}
                    <a
                      href="https://github.com/namastexlabs/forge-inspector"
                      target="_blank"
                      className="underline font-bold break-all"
                    >
                      {t('preview.troubleAlert.item3Link')}
                    </a>
                  </li>
                </ol>
                <Button
                  variant="destructive"
                  onClick={handleStopAndEdit}
                  disabled={isStoppingDevServer}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isStoppingDevServer && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('preview.noServer.stopAndEditButton')}
                </Button>
              </div>
            </div>
          </Alert>
        )}
        <DevServerLogsView
          latestDevServerProcess={latestDevServerProcess}
          showLogs={showLogs}
          onToggle={toggleLogs}
          showToggleText
          logs={logStream.logs}
          error={logStream.error}
        />
      </div>
    </div>
  );
}
