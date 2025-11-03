import { ReactNode, useState, useRef } from 'react';
import { PanelGroup, Panel, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type LayoutMode = 'chat' | 'preview' | 'diffs' | 'kanban' | null;

interface TasksLayoutProps {
  kanban: ReactNode;
  attempt: ReactNode;
  aux: ReactNode;
  isPanelOpen: boolean;
  mode: LayoutMode;
  isMobile?: boolean;
  rightHeader?: ReactNode;
}

type SplitSizes = [number, number];

const MIN_PANEL_SIZE = 20;
const DEFAULT_KANBAN_ATTEMPT: SplitSizes = [66, 34];
const DEFAULT_ATTEMPT_AUX: SplitSizes = [34, 66];

const STORAGE_KEYS = {
  KANBAN_ATTEMPT: 'tasksLayout.desktop.v2.kanbanAttempt',
  ATTEMPT_AUX: 'tasksLayout.desktop.v2.attemptAux',
} as const;

function loadSizes(key: string, fallback: SplitSizes): SplitSizes {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length === 2)
      return parsed as SplitSizes;
    return fallback;
  } catch {
    return fallback;
  }
}

function saveSizes(key: string, sizes: SplitSizes): void {
  try {
    localStorage.setItem(key, JSON.stringify(sizes));
  } catch {
    // Ignore errors
  }
}

/**
 * AuxRouter - Handles nested AnimatePresence for preview/diffs transitions.
 */
function AuxRouter({ mode, aux }: { mode: LayoutMode; aux: ReactNode }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {mode && (
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="h-full min-h-0"
        >
          {aux}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * RightWorkArea - Contains header and Attempt/Aux content.
 * Shows just Attempt when mode is 'chat' or null, or Attempt | Aux split when mode is preview/diffs.
 */
function RightWorkArea({
  attempt,
  aux,
  mode,
  rightHeader,
  kanban,
}: {
  attempt: ReactNode;
  aux: ReactNode;
  mode: LayoutMode;
  rightHeader?: ReactNode;
  kanban: ReactNode;
}) {
  const attemptPanelRef = useRef<ImperativePanelHandle>(null);
  const [isAttemptCollapsed, setIsAttemptCollapsed] = useState(false);

  const [innerSizes] = useState<SplitSizes>(() =>
    loadSizes(STORAGE_KEYS.ATTEMPT_AUX, DEFAULT_ATTEMPT_AUX)
  );

  const toggleAttempt = () => {
    if (attemptPanelRef.current) {
      if (isAttemptCollapsed) {
        attemptPanelRef.current.expand();
      } else {
        attemptPanelRef.current.collapse();
      }
      setIsAttemptCollapsed(!isAttemptCollapsed);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {rightHeader && (
        <div className="shrink-0 sticky top-0 z-20 bg-background border-b">
          {rightHeader}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {mode === null || mode === 'chat' ? (
          attempt
        ) : mode === 'kanban' ? (
          kanban
        ) : (
          <PanelGroup
            direction="horizontal"
            className="h-full min-h-0"
            onLayout={(layout) => {
              if (layout.length === 2) {
                saveSizes(STORAGE_KEYS.ATTEMPT_AUX, [layout[0], layout[1]]);
              }
            }}
          >
            <Panel
              ref={attemptPanelRef}
              id="attempt"
              order={1}
              defaultSize={innerSizes[0]}
              minSize={MIN_PANEL_SIZE}
              collapsible
              collapsedSize={0}
              className="min-w-0 min-h-0 overflow-hidden"
              role="region"
              aria-label="Details"
              onCollapse={() => setIsAttemptCollapsed(true)}
              onExpand={() => setIsAttemptCollapsed(false)}
            >
              {attempt}
            </Panel>

            <PanelResizeHandle
              id="handle-aa"
              className="relative z-30 w-1 bg-border cursor-col-resize group touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              aria-label="Resize panels"
              role="separator"
              aria-orientation="vertical"
            >
              <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border" />
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-muted/90 border border-border rounded-full px-1.5 py-3 opacity-70 group-hover:opacity-100 group-focus:opacity-100 transition-opacity shadow-sm">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              </div>
              {/* Chat toggle button with lamp-style animation */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="pointer-events-auto absolute top-4 left-0 -translate-x-3/4 group-hover:translate-x-[-50%] h-7 w-7 bg-background/95 border border-border hover:bg-accent shadow-sm z-10 transition-transform duration-300 ease-out opacity-40 group-hover:opacity-100"
                      onClick={toggleAttempt}
                      aria-label={isAttemptCollapsed ? 'Show chat' : 'Hide chat'}
                    >
                      <PanelLeft className={`h-4 w-4 transition-transform duration-200 ${isAttemptCollapsed ? 'rotate-180' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isAttemptCollapsed ? 'Show chat' : 'Hide chat'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </PanelResizeHandle>

            <Panel
              id="aux"
              order={2}
              defaultSize={innerSizes[1]}
              minSize={MIN_PANEL_SIZE}
              collapsible={false}
              className="min-w-0 min-h-0 overflow-hidden"
              role="region"
              aria-label={mode === 'preview' ? 'Preview' : 'Diffs'}
            >
              <AuxRouter mode={mode} aux={aux} />
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
}

/**
 * DesktopSimple - Conditionally renders layout based on mode.
 * When mode is null or 'chat': Shows Attempt | Kanban (two-panel layout)
 * When mode is 'preview', 'diffs', or 'kanban': Fullscreen with RightWorkArea handling right panel
 */
function DesktopSimple({
  kanban,
  attempt,
  aux,
  mode,
  rightHeader,
}: {
  kanban: ReactNode;
  attempt: ReactNode;
  aux: ReactNode;
  mode: LayoutMode;
  rightHeader?: ReactNode;
}) {
  const kanbanPanelRef = useRef<ImperativePanelHandle>(null);
  const [isKanbanCollapsed, setIsKanbanCollapsed] = useState(false);

  const [outerSizes] = useState<SplitSizes>(() =>
    loadSizes(STORAGE_KEYS.KANBAN_ATTEMPT, DEFAULT_KANBAN_ATTEMPT)
  );

  const toggleKanban = () => {
    if (kanbanPanelRef.current) {
      if (isKanbanCollapsed) {
        kanbanPanelRef.current.expand();
      } else {
        kanbanPanelRef.current.collapse();
      }
      setIsKanbanCollapsed(!isKanbanCollapsed);
    }
  };

  // When preview/diffs/kanban view is active, hide left Kanban panel and show fullscreen RightWorkArea
  if (mode !== null && mode !== 'chat') {
    return (
      <RightWorkArea
        attempt={attempt}
        aux={aux}
        mode={mode}
        rightHeader={rightHeader}
        kanban={kanban}
      />
    );
  }

  // Default two-panel layout: Attempt | Kanban (inverted so attempt slides from LEFT)
  return (
    <PanelGroup
      direction="horizontal"
      className="h-full min-h-0"
      onLayout={(layout) => {
        if (layout.length === 2) {
          // Inverted order: [attempt, kanban] so store as [layout[1], layout[0]]
          saveSizes(STORAGE_KEYS.KANBAN_ATTEMPT, [layout[1], layout[0]]);
        }
      }}
    >
      <Panel
        id="left"
        order={1}
        defaultSize={outerSizes[1]}
        minSize={MIN_PANEL_SIZE}
        collapsible={false}
        className="min-w-0 min-h-0 overflow-hidden"
      >
        <RightWorkArea
          attempt={attempt}
          aux={aux}
          mode={mode}
          rightHeader={rightHeader}
          kanban={kanban}
        />
      </Panel>

      <PanelResizeHandle
        id="handle-kr"
        className="relative z-30 w-1 bg-border cursor-col-resize group touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        aria-label="Resize panels"
        role="separator"
        aria-orientation="vertical"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-muted/90 border border-border rounded-full px-1.5 py-3 opacity-70 group-hover:opacity-100 group-focus:opacity-100 transition-opacity shadow-sm">
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
        </div>
        {/* Sidebar toggle button with lamp-style animation */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto absolute top-4 left-0 -translate-x-3/4 group-hover:translate-x-[-50%] h-7 w-7 bg-background/95 border border-border hover:bg-accent shadow-sm z-10 transition-transform duration-300 ease-out opacity-40 group-hover:opacity-100"
                onClick={toggleKanban}
                aria-label={isKanbanCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <PanelLeft className={`h-4 w-4 transition-transform duration-200 ${isKanbanCollapsed ? 'rotate-180' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isKanbanCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </PanelResizeHandle>

      <Panel
        ref={kanbanPanelRef}
        id="kanban"
        order={2}
        defaultSize={outerSizes[0]}
        minSize={MIN_PANEL_SIZE}
        collapsible
        collapsedSize={0}
        className="min-w-0 min-h-0 overflow-hidden"
        role="region"
        aria-label="Kanban board"
        onCollapse={() => setIsKanbanCollapsed(true)}
        onExpand={() => setIsKanbanCollapsed(false)}
      >
        {kanban}
      </Panel>
    </PanelGroup>
  );
}

export function TasksLayout({
  kanban,
  attempt,
  aux,
  isPanelOpen,
  mode,
  isMobile = false,
  rightHeader,
}: TasksLayoutProps) {
  const desktopKey = isPanelOpen ? 'desktop-with-panel' : 'kanban-only';

  if (isMobile) {
    const columns = isPanelOpen ? ['0fr', '1fr', '0fr'] : ['1fr', '0fr', '0fr'];
    const gridTemplateColumns = `minmax(0, ${columns[0]}) minmax(0, ${columns[1]}) minmax(0, ${columns[2]})`;
    const isKanbanVisible = columns[0] !== '0fr';
    const isAttemptVisible = columns[1] !== '0fr';
    const isAuxVisible = columns[2] !== '0fr';

    return (
      <div
        className="h-full min-h-0 grid"
        style={{
          gridTemplateColumns,
          transition: 'grid-template-columns 250ms cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        <div
          className="min-w-0 min-h-0 overflow-hidden"
          aria-hidden={!isKanbanVisible}
          aria-label="Kanban board"
          role="region"
          style={{ pointerEvents: isKanbanVisible ? 'auto' : 'none' }}
        >
          {kanban}
        </div>

        <div
          className="min-w-0 min-h-0 overflow-hidden border-l flex flex-col"
          aria-hidden={!isAttemptVisible}
          aria-label="Details"
          role="region"
          style={{ pointerEvents: isAttemptVisible ? 'auto' : 'none' }}
        >
          {rightHeader && (
            <div className="shrink-0 sticky top-0 z-20 bg-background border-b">
              {rightHeader}
            </div>
          )}
          <div className="flex-1 min-h-0">{attempt}</div>
        </div>

        <div
          className="min-w-0 min-h-0 overflow-hidden border-l"
          aria-hidden={!isAuxVisible}
          aria-label={mode === 'preview' ? 'Preview' : 'Diffs'}
          role="region"
          style={{ pointerEvents: isAuxVisible ? 'auto' : 'none' }}
        >
          {aux}
        </div>
      </div>
    );
  }

  let desktopNode: ReactNode;

  if (!isPanelOpen) {
    desktopNode = (
      <div
        className="h-full min-h-0 min-w-0 overflow-hidden"
        role="region"
        aria-label="Kanban board"
      >
        {kanban}
      </div>
    );
  } else {
    desktopNode = (
      <DesktopSimple
        kanban={kanban}
        attempt={attempt}
        aux={aux}
        mode={mode}
        rightHeader={rightHeader}
      />
    );
  }

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
        key={desktopKey}
        className="h-full min-h-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      >
        {desktopNode}
      </motion.div>
    </AnimatePresence>
  );
}
