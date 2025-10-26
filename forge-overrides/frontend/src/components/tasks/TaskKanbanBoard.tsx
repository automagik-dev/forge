import { memo } from 'react';
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { TaskCard } from './TaskCard';
import type { TaskStatus, TaskWithAttemptStatus } from 'shared/types';

import { statusBoardColors, statusLabels } from '@/utils/status-labels';

// Widget imports
import { KanbanHeaderWithWidget } from './KanbanHeaderWithWidget';
import { SubGenieWidget } from '@/components/genie-widgets';
import { useSubGenieWidget } from '@/hooks/useSubGenieWidget';
import { GENIE_CONFIGS } from '@/config/genie-configs';
import { COLUMN_STATUS_TO_GENIE } from '@/utils/taskStatusMapping';

type Task = TaskWithAttemptStatus;

interface TaskKanbanBoardProps {
  groupedTasks: Record<TaskStatus, Task[]>;
  onDragEnd: (event: DragEndEvent) => void;
  onViewTaskDetails: (task: Task) => void;
  selectedTask?: Task;
  onCreateTask?: () => void;
  projectId?: string; // Required for widget functionality
}

function TaskKanbanBoard({
  groupedTasks,
  onDragEnd,
  onViewTaskDetails,
  selectedTask,
  onCreateTask,
  projectId,
}: TaskKanbanBoardProps) {
  return (
    <KanbanProvider onDragEnd={onDragEnd}>
      {Object.entries(groupedTasks).map(([status, statusTasks]) => {
        const taskStatus = status as TaskStatus;

        // Check if this column has a widget
        const genieId = COLUMN_STATUS_TO_GENIE[taskStatus];
        const config = genieId ? GENIE_CONFIGS[genieId] : null;

        // Widget state (only for columns with widgets)
        const widgetHook = config && projectId
          ? useSubGenieWidget(config.id, projectId, config.columnStatus)
          : null;

        const {
          isOpen = false,
          chatHistory = [],
          skillsState = {},
          isLoading = false,
          toggleWidget = () => {},
          closeWidget = () => {},
          onSendMessage = () => Promise.resolve(),
          onWorkflowClick = () => Promise.resolve(),
          onSkillToggle = () => {},
        } = widgetHook || {};

        return (
          <KanbanBoard key={status} id={taskStatus}>
            {/* Conditional header: widget-enabled or standard */}
            {config && projectId ? (
              <KanbanHeaderWithWidget
                name={statusLabels[taskStatus]}
                color={`--${config.color}`}
                taskCount={statusTasks.length}
                widgetIcon={config.icon}
                isWidgetOpen={isOpen}
                onWidgetToggle={toggleWidget}
                onAddTask={onCreateTask}
              />
            ) : (
              <KanbanHeader
                name={statusLabels[taskStatus]}
                color={statusBoardColors[taskStatus]}
                onAddTask={onCreateTask}
              />
            )}

            {/* Widget panel (only for widget-enabled columns when open) */}
            {config && projectId && isOpen && (
              <div className="p-4 border-b">
                <SubGenieWidget
                  config={config}
                  isOpen={isOpen}
                  onClose={closeWidget}
                  onSendMessage={onSendMessage}
                  onWorkflowClick={onWorkflowClick}
                  onSkillToggle={onSkillToggle}
                  chatHistory={chatHistory}
                  skillsState={skillsState}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Task cards (unchanged) */}
            <KanbanCards>
              {statusTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  status={status}
                  onViewDetails={onViewTaskDetails}
                  isOpen={selectedTask?.id === task.id}
                />
              ))}
            </KanbanCards>
          </KanbanBoard>
        );
      })}
    </KanbanProvider>
  );
}

export default memo(TaskKanbanBoard);
