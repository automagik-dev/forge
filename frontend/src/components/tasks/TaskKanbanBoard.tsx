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
// import { useParams } from 'react-router-dom';

import { statusBoardColors } from '@/utils/status-labels';
import { COLUMN_DISPLAY_NAMES, COLUMN_ICONS } from '@/utils/taskStatusMapping';

type Task = TaskWithAttemptStatus;

interface TaskKanbanBoardProps {
  groupedTasks: Record<TaskStatus, Task[]>;
  onDragEnd: (event: DragEndEvent) => void;
  onViewTaskDetails: (task: Task) => void;
  selectedTask?: Task;
  onCreateTask?: () => void;
}

function TaskKanbanBoard({
  groupedTasks,
  onDragEnd,
  onViewTaskDetails,
  selectedTask,
  onCreateTask,
}: TaskKanbanBoardProps) {
  console.log(
    '[TaskKanbanBoard] selectedTask:',
    selectedTask?.id,
    selectedTask?.title
  );

  return (
    <KanbanProvider onDragEnd={onDragEnd}>
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        <KanbanBoard key={status} id={status as TaskStatus}>
          <KanbanHeader
            name={COLUMN_DISPLAY_NAMES[status as TaskStatus]}
            color={statusBoardColors[status as TaskStatus]}
            icon={COLUMN_ICONS[status as TaskStatus]}
            onAddTask={onCreateTask}
          />
          <KanbanCards>
            {statusTasks.map((task, index) => {
              const isOpen = selectedTask?.id === task.id;
              if (isOpen) {
                console.log(
                  '[TaskKanbanBoard] Highlighting task:',
                  task.id,
                  task.title
                );
              }
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  status={status}
                  onViewDetails={onViewTaskDetails}
                  isOpen={isOpen}
                />
              );
            })}
          </KanbanCards>
        </KanbanBoard>
      ))}
    </KanbanProvider>
  );
}

export default memo(TaskKanbanBoard);
