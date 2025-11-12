import React from 'react';
import { Task, TaskStatus } from 'shared/types';
import { GENIE_CONFIGS } from '@/config/genie-configs';
import { COLUMN_DISPLAY_NAMES, COLUMN_STATUS_TO_GENIE, COLUMN_ICONS } from '@/utils/taskStatusMapping';
import { ColumnWithWidget } from '@/components/genie-widgets';
import { useFilteredTasks } from '@/hooks/useFilteredTasks';

interface KanbanBoardWithWidgetsProps {
  tasks: Task[];
  projectId: string; // Required for widget backend integration
  onTaskUpdate?: (task: Task) => void;
  className?: string;
}

/**
 * Reference implementation of Kanban board with integrated Genie Chat Widgets
 *
 * Integration steps:
 * 1. Pass filtered tasks from your data source
 * 2. Pass projectId for backend API calls
 * 3. Parent component MUST be wrapped with SubGenieProvider
 * 4. Customize task rendering as needed
 * 5. Hook up task update handlers
 */
export const KanbanBoardWithWidgets: React.FC<KanbanBoardWithWidgetsProps> = ({
  tasks,
  projectId,
  className = 'grid grid-cols-5 gap-4 p-4 bg-gray-100 h-screen overflow-hidden',
}) => {
  const columnStatuses: TaskStatus[] = ['todo', 'inprogress', 'inreview', 'done', 'cancelled', 'agent'];

  // Hook must be called at the top level, not inside map
  const todoTasks = useFilteredTasks(tasks, 'todo');
  const inprogressTasks = useFilteredTasks(tasks, 'inprogress');
  const inreviewTasks = useFilteredTasks(tasks, 'inreview');
  const doneTasks = useFilteredTasks(tasks, 'done');
  const cancelledTasks = useFilteredTasks(tasks, 'cancelled');
  const agentTasks = useFilteredTasks(tasks, 'agent');

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: todoTasks,
    inprogress: inprogressTasks,
    inreview: inreviewTasks,
    done: doneTasks,
    cancelled: cancelledTasks,
    agent: agentTasks,
  };

  return (
    <div className={className}>
      {columnStatuses.map((status) => {
        const genieId = COLUMN_STATUS_TO_GENIE[status];
        const filteredTasks = tasksByStatus[status];
        const config = genieId ? GENIE_CONFIGS[genieId] : null;

        // Column with Genie widget
        if (config) {
          return (
            <ColumnWithWidget
              key={status}
              config={config}
              projectId={projectId}
              taskCount={filteredTasks.length}
            >
              {/* TODO: Replace with your actual task component */}
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-white rounded border border-gray-200 mb-2 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    // Handle task click
                  }}
                >
                  <h4 className="font-semibold text-sm text-gray-900">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </ColumnWithWidget>
          );
        }

        // Column without Genie widget (Done, Cancelled)
        const IconComponent = COLUMN_ICONS[status];
        return (
          <div key={status} className="flex flex-col bg-white rounded-lg shadow">
            {/* Header without widget */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <IconComponent size={20} className="text-gray-600" />
                <span className="font-semibold text-gray-900">{COLUMN_DISPLAY_NAMES[status]}</span>
                <span className="text-sm text-gray-500">({filteredTasks.length})</span>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-white rounded border border-gray-200 mb-2 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    // Handle task click
                  }}
                >
                  <h4 className="font-semibold text-sm text-gray-900">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * INTEGRATION GUIDE
 *
 * To use this component:
 *
 * 1. In your main app component:
 *    ```tsx
 *    import { KanbanBoardWithWidgets } from '@/components/KanbanBoardWithWidgets';
 *
 *    function YourApp() {
 *      const { data: tasks } = useQuery(...);
 *      const projectId = "your-project-uuid";
 *
 *      return (
 *        <SubGenieProvider>
 *          <KanbanBoardWithWidgets
 *            tasks={tasks}
 *            projectId={projectId}
 *            onTaskUpdate={handleTaskUpdate}
 *          />
 *        </SubGenieProvider>
 *      );
 *    }
 *    ```
 *
 * 2. Replace the task rendering (div with "TODO: Replace with your actual task component")
 *    with your actual Task component
 *
 * 3. The widget icons are automatically mapped:
 *    - todo -> Sparkles (Wish)
 *    - inprogress -> Hammer (Forge)
 *    - inreview -> Target (Review)
 *    - done -> CheckCircle2
 *    - cancelled -> XCircle
 *
 * 4. Column names are automatically mapped:
 *    - todo -> "Wish"
 *    - inprogress -> "Forge"
 *    - inreview -> "Review"
 *    - done -> "Done"
 *    - cancelled -> "Cancelled"
 *
 * 5. Agent tasks (tracked in forge_agents table) are automatically filtered out
 *    via useFilteredTasks hook
 *
 * 6. Genie widgets (ColumnWithWidget) automatically appear for Wish/Forge/Review
 *    Regular columns (Done/Cancelled) show static headers
 *
 * 7. To customize styling, pass className prop:
 *    <KanbanBoardWithWidgets
 *      tasks={tasks}
 *      className="grid grid-cols-5 gap-6 p-6"
 *    />
 */
