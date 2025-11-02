import type { TaskAttempt, TaskWithAttemptStatus } from 'shared/types';
import VirtualizedList from '@/components/logs/VirtualizedList';
import { TaskFollowUpSection } from '@/components/tasks/TaskFollowUpSection';
import { TaskRelationshipBreadcrumb } from '@/components/tasks/TaskRelationshipBreadcrumb';
import { EntriesProvider } from '@/contexts/EntriesContext';
import { RetryUiProvider } from '@/contexts/RetryUiContext';
import type { ReactNode } from 'react';

interface TaskAttemptPanelProps {
  attempt: TaskAttempt | undefined;
  task: TaskWithAttemptStatus | null;
  tasksById?: Record<string, TaskWithAttemptStatus>;
  onNavigateToTask?: (taskId: string) => void;
  children: (sections: { logs: ReactNode; followUp: ReactNode; breadcrumb: ReactNode }) => ReactNode;
}

const TaskAttemptPanel = ({
  attempt,
  task,
  onNavigateToTask,
  children,
}: TaskAttemptPanelProps) => {
  if (!attempt) {
    return <div className="p-6 text-muted-foreground">Loading attempt...</div>;
  }

  if (!task) {
    return <div className="p-6 text-muted-foreground">Loading task...</div>;
  }

  return (
    <EntriesProvider key={attempt.id}>
      <RetryUiProvider attemptId={attempt.id}>
        {children({
          breadcrumb: (
            <TaskRelationshipBreadcrumb
              selectedAttempt={attempt}
              currentTask={task}
              onNavigateToTask={onNavigateToTask}
            />
          ),
          logs: (
            <VirtualizedList key={attempt.id} attempt={attempt} task={task} />
          ),
          followUp: (
            <TaskFollowUpSection
              task={task}
              selectedAttemptId={attempt.id}
              jumpToLogsTab={() => {}}
            />
          ),
        })}
      </RetryUiProvider>
    </EntriesProvider>
  );
};

export default TaskAttemptPanel;
