import type { TaskAttempt, TaskWithAttemptStatus } from 'shared/types';
import VirtualizedList from '@/components/logs/VirtualizedList';
import { TaskFollowUpSection } from '@/components/tasks/TaskFollowUpSection';
import { EntriesProvider } from '@/contexts/EntriesContext';
import { RetryUiProvider } from '@/contexts/RetryUiContext';
import type { ReactNode } from 'react';

interface TaskAttemptPanelProps {
  attempt: TaskAttempt | undefined;
  task: TaskWithAttemptStatus | null;
  tasksById?: Record<string, TaskWithAttemptStatus>;
  onNavigateToTask?: (taskId: string) => void;
  isInChatView?: boolean;
  taskIdFromUrl?: string;
  projectId?: string; // Project ID from URL (for Master Genie when task is still loading)
  onInputFocusChange?: (isFocused: boolean) => void; // Callback to notify parent about input focus
  children: (sections: { logs: ReactNode; followUp: ReactNode }) => ReactNode;
}

const TaskAttemptPanel = ({
  attempt,
  task,
  isInChatView,
  taskIdFromUrl,
  projectId,
  onInputFocusChange,
  children,
}: TaskAttemptPanelProps) => {
  // Allow rendering without attempt for agent tasks (Master Genie)
  // Agent tasks (status='agent') don't have task attempts - they connect directly to MCP
  // Also allow if we're in chat view (even if task hasn't loaded yet)
  const isAgentTask = task?.status === 'agent' || isInChatView;

  if (!attempt && !isAgentTask) {
    return <div className="p-6 text-muted-foreground">Loading attempt...</div>;
  }

  // Allow rendering without task for agent tasks (Master Genie)
  // VirtualizedList and TaskFollowUpSection can handle null task
  // For agent tasks, use task.id as key since there's no attempt
  const key = attempt?.id ?? task?.id ?? 'agent-task';
  const attemptId = attempt?.id ?? undefined;

  // For agent tasks without an attempt yet, show a welcome message
  // The first message will create the attempt
  // Still render children to provide chat input
  // ExecutionProcessesProvider is provided by parent (project-tasks.tsx)
  // Show welcome even if task is null (still loading) - chat input will work once task loads
  if (isAgentTask && !attempt) {
    return (
      <EntriesProvider key={key}>
        <RetryUiProvider attemptId={undefined}>
          {children({
            logs: (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full space-y-6">
                  <div className="space-y-3 text-center">
                    <h3 className="text-2xl font-semibold">
                      🧞 Hey there, I'm Genie
                    </h3>
                    <p className="text-lg font-medium">
                      Your personal AI companion. Lives on your machine. Evolves
                      with you.
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground text-center px-4">
                    I'm experimental technology—still learning, still growing.
                    Your feedback directly shapes how I improve.
                  </p>

                  <div className="grid gap-6 md:grid-cols-2 pt-2">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">
                        Understanding your world
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Show you around your project</li>
                        <li>
                          • Explain how I work (agents, spells, workflows)
                        </li>
                        <li>• Answer questions about what's where and why</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">
                        Getting things done
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Help you explore problems and plan solutions</li>
                        <li>• Route work to specialized agents</li>
                        <li>• Coordinate parallel workstreams</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3 text-center pt-6 border-t">
                    <p className="text-sm font-medium">🪄 How I work</p>
                    <p className="text-sm text-muted-foreground px-4">
                      I'm <strong>market-agnostic</strong> (work with any AI),{' '}
                      <strong>orchestrate in natural language</strong> (you stay
                      in control), and <strong>built from markdown</strong>{' '}
                      (fully transparent, no black boxes).
                    </p>
                  </div>

                  <div className="text-center pt-6 space-y-3 border-t">
                    <p className="text-sm text-muted-foreground px-4">
                      ⚠️ Experimental tech with some rough edges. But I'll be
                      honest about what's working and what's not.
                    </p>
                    <p className="text-base font-medium">
                      Ready when you are. Your first message will wake me up. 🪔
                    </p>
                  </div>
                </div>
              </div>
            ),
            followUp: (
              <TaskFollowUpSection
                task={task}
                selectedAttemptId={undefined} // No attempt yet for agent tasks
                jumpToLogsTab={() => {}}
                isInChatView={isInChatView}
                taskIdFromUrl={taskIdFromUrl}
                projectId={projectId}
                onInputFocusChange={onInputFocusChange}
              />
            ),
          })}
        </RetryUiProvider>
      </EntriesProvider>
    );
  }

  // Should not reach here without attempt, but guard anyway
  if (!attempt) {
    return (
      <div className="p-6 text-muted-foreground">No attempt data available</div>
    );
  }

  return (
    <EntriesProvider key={key}>
      <RetryUiProvider attemptId={attemptId}>
        {children({
          logs: (
            <VirtualizedList
              key={key}
              attempt={attempt}
              task={task ?? undefined}
            />
          ),
          followUp: (
            <TaskFollowUpSection
              task={task}
              selectedAttemptId={attemptId}
              jumpToLogsTab={() => {}}
              isInChatView={isInChatView}
              taskIdFromUrl={taskIdFromUrl}
              projectId={projectId}
              onInputFocusChange={onInputFocusChange}
            />
          ),
        })}
      </RetryUiProvider>
    </EntriesProvider>
  );
};

export default TaskAttemptPanel;
