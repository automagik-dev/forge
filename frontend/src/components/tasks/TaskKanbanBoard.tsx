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

// Kanban column component (extracted to satisfy Rules of Hooks)
function KanbanColumn({
  taskStatus,
  statusTasks,
  selectedTask,
  onViewTaskDetails,
  onCreateTask,
  projectId,
}: {
  taskStatus: TaskStatus;
  statusTasks: Task[];
  selectedTask?: Task;
  onViewTaskDetails: (task: Task) => void;
  onCreateTask?: () => void;
  projectId?: string;
}) {
  // Check if this column has a widget
  const genieId = COLUMN_STATUS_TO_GENIE[taskStatus];
  const config = genieId ? GENIE_CONFIGS[genieId] : null;

  // Widget state (always call hook, conditionally use it)
  const widgetHook = useSubGenieWidget(
    config?.id || 'wish', // Provide default
    projectId || '', // Provide default
    config?.columnStatus || 'todo' // Provide default
  );

  // Only use widget functionality if we actually have a config and projectId
  const shouldShowWidget = config && projectId;

  const {
    isOpen = false,
    chatHistory = [],
    skillsState = {},
    isLoading = false,
    activeNeuron = null,
    subtasks = [],
    refreshNeuronData = async () => {},
    toggleWidget = () => {},
    closeWidget = () => {},
    onSendMessage = () => Promise.resolve(),
    onWorkflowClick = () => Promise.resolve(),
    onSkillToggle = () => {},
  } = shouldShowWidget ? widgetHook : {};

  return (
    <KanbanBoard id={taskStatus}>
      {/* Conditional header: widget-enabled or standard */}
      {shouldShowWidget ? (
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
      {shouldShowWidget && isOpen && (
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
            activeNeuron={activeNeuron}
            subtasks={subtasks}
            onRefresh={refreshNeuronData}
            onTaskClick={(task) => onViewTaskDetails(task as TaskWithAttemptStatus)}
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
            status={taskStatus}
            onViewDetails={onViewTaskDetails}
            isOpen={selectedTask?.id === task.id}
          />
        ))}
      </KanbanCards>
    </KanbanBoard>
  );
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
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        <KanbanColumn
          key={status}
          taskStatus={status as TaskStatus}
          statusTasks={statusTasks}
          selectedTask={selectedTask}
          onViewTaskDetails={onViewTaskDetails}
          onCreateTask={onCreateTask}
          projectId={projectId}
        />
      ))}
    </KanbanProvider>
  );
}

export default memo(TaskKanbanBoard);
