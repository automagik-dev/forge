import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TasksListView } from '../TasksListView';
import type { TaskWithAttemptStatus } from 'shared/types';

// Mock dependencies
vi.mock('@/components/icons/Lamp', () => ({
  Lamp: () => <span data-testid="lamp-icon">Lamp</span>,
}));

const createMockTask = (overrides: Partial<TaskWithAttemptStatus> = {}): TaskWithAttemptStatus => ({
  id: 'task-1',
  title: 'Test Task',
  status: 'todo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  project_id: 'project-1',
  has_in_progress_attempt: false,
  has_merged_attempt: false,
  last_attempt_failed: false,
  ...overrides,
});

describe('TasksListView', () => {
  const mockOnTaskClick = vi.fn();
  const mockOnProjectClick = vi.fn();
  const mockOnViewDiff = vi.fn();
  const mockOnViewPreview = vi.fn();
  const mockOnArchive = vi.fn();
  const mockOnNewAttempt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no tasks', () => {
    render(
      <TasksListView
        tasks={[]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('No tasks yet. Tap the + button to create one.')).toBeInTheDocument();
  });

  it('groups tasks by phase', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'todo', title: 'Wish Task' }),
      createMockTask({ id: '2', status: 'inprogress', title: 'Forge Task' }),
      createMockTask({ id: '3', status: 'inreview', title: 'Review Task' }),
      createMockTask({ id: '4', status: 'done', title: 'Done Task' }),
    ];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('Wish')).toBeInTheDocument();
    expect(screen.getByText('Forge')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('displays task count for each phase', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'todo' }),
      createMockTask({ id: '2', status: 'todo' }),
      createMockTask({ id: '3', status: 'inprogress' }),
    ];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('(2)')).toBeInTheDocument(); // Wish phase
    expect(screen.getByText('(1)')).toBeInTheDocument(); // Forge phase
  });

  it('toggles phase expansion when phase header is clicked', () => {
    const tasks = [createMockTask({ id: '1', status: 'todo', title: 'Task 1' })];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // Initially expanded
    expect(screen.getByText('Task 1')).toBeInTheDocument();

    // Click to collapse
    const wishHeader = screen.getByText('Wish').closest('button');
    if (wishHeader) fireEvent.click(wishHeader);

    // Task should be hidden
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  });

  it('displays archived phase as collapsed by default', () => {
    const tasks = [createMockTask({ id: '1', status: 'cancelled', title: 'Archived Task' })];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // Archived phase exists but task is not visible initially
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.queryByText('Archived Task')).not.toBeInTheDocument();
  });

  it('calls onTaskClick when task is clicked', () => {
    const task = createMockTask({ id: '1', title: 'Clickable Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    const taskElement = screen.getByText('Clickable Task');
    fireEvent.click(taskElement);

    expect(mockOnTaskClick).toHaveBeenCalledWith(task);
  });

  it('highlights selected task', () => {
    const task = createMockTask({ id: '1', title: 'Selected Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        selectedTaskId="1"
      />
    );

    const taskContainer = screen.getByText('Selected Task').closest('div');
    expect(taskContainer).toHaveClass('bg-white/10');
  });

  it('displays project header when projectName is provided', () => {
    render(
      <TasksListView
        tasks={[]}
        onTaskClick={mockOnTaskClick}
        projectName="Test Project"
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('calls onProjectClick when project header is clicked', () => {
    render(
      <TasksListView
        tasks={[]}
        onTaskClick={mockOnTaskClick}
        projectName="Test Project"
        onProjectClick={mockOnProjectClick}
      />
    );

    const projectHeader = screen.getByText('Test Project');
    fireEvent.click(projectHeader);

    expect(mockOnProjectClick).toHaveBeenCalled();
  });

  it('displays task count in project header', () => {
    const tasks = [
      createMockTask({ id: '1' }),
      createMockTask({ id: '2' }),
    ];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
        projectName="Project"
      />
    );

    expect(screen.getByText('2 tasks')).toBeInTheDocument();
  });

  it('displays singular "task" for single task', () => {
    const tasks = [createMockTask({ id: '1' })];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
        projectName="Project"
      />
    );

    expect(screen.getByText('1 task')).toBeInTheDocument();
  });

  it('formats time ago correctly for recent tasks', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const task = createMockTask({ id: '1', updated_at: fiveMinutesAgo });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText(/5 min/)).toBeInTheDocument();
  });

  it('displays running indicator for tasks in progress', () => {
    const task = createMockTask({ id: '1', has_in_progress_attempt: true });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('displays approved indicator for merged tasks', () => {
    const task = createMockTask({ id: '1', has_merged_attempt: true });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('approved')).toBeInTheDocument();
  });

  it('displays failed indicator for failed tasks', () => {
    const task = createMockTask({ id: '1', last_attempt_failed: true });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('renders action buttons for each task', () => {
    const task = createMockTask({ id: '1', title: 'Task with Actions' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        onViewDiff={mockOnViewDiff}
        onViewPreview={mockOnViewPreview}
        onArchive={mockOnArchive}
        onNewAttempt={mockOnNewAttempt}
      />
    );

    expect(screen.getByText('Diff')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Attempt')).toBeInTheDocument();
  });

  it('calls onViewDiff when Diff button is clicked', () => {
    const task = createMockTask({ id: '1', title: 'Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        onViewDiff={mockOnViewDiff}
      />
    );

    const diffButton = screen.getByText('Diff');
    fireEvent.click(diffButton);

    expect(mockOnViewDiff).toHaveBeenCalledWith(task);
    expect(mockOnTaskClick).not.toHaveBeenCalled(); // Should not propagate
  });

  it('calls onViewPreview when View button is clicked', () => {
    const task = createMockTask({ id: '1', title: 'Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        onViewPreview={mockOnViewPreview}
      />
    );

    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    expect(mockOnViewPreview).toHaveBeenCalledWith(task);
    expect(mockOnTaskClick).not.toHaveBeenCalled();
  });

  it('calls onArchive when archive button is clicked', () => {
    const task = createMockTask({ id: '1', title: 'Task', status: 'todo' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        onArchive={mockOnArchive}
      />
    );

    const archiveButtons = screen.getAllByTitle('Archive task');
    fireEvent.click(archiveButtons[0]);

    expect(mockOnArchive).toHaveBeenCalledWith(task);
  });

  it('calls onNewAttempt when Attempt button is clicked', () => {
    const task = createMockTask({ id: '1', title: 'Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        onNewAttempt={mockOnNewAttempt}
      />
    );

    const attemptButton = screen.getByText('Attempt');
    fireEvent.click(attemptButton);

    expect(mockOnNewAttempt).toHaveBeenCalledWith(task);
  });

  it('does not show archive button for archived tasks', () => {
    const task = createMockTask({ id: '1', status: 'cancelled' });

    const { container } = render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
        onArchive={mockOnArchive}
      />
    );

    // Expand archived phase first
    const archivedHeader = screen.getByText('Archived').closest('button');
    if (archivedHeader) fireEvent.click(archivedHeader);

    // Archive button should not exist for archived tasks
    const archiveButton = container.querySelector('[title="Archive task"]');
    expect(archiveButton).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TasksListView
        tasks={[]}
        onTaskClick={mockOnTaskClick}
        className="custom-class"
      />
    );

    const listView = container.firstChild as HTMLElement;
    expect(listView).toHaveClass('custom-class');
  });

  it('displays phase icons correctly', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'todo' }),
    ];

    render(
      <TasksListView
        tasks={tasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByTestId('lamp-icon')).toBeInTheDocument();
  });

  it('shows pulse animation for running tasks', () => {
    const task = createMockTask({ id: '1', has_in_progress_attempt: true });

    const { container } = render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    const pulseElement = container.querySelector('.animate-pulse');
    expect(pulseElement).toBeInTheDocument();
  });

  it('maps status "agent" to forge phase', () => {
    const task = createMockTask({ id: '1', status: 'agent', title: 'Agent Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('Forge')).toBeInTheDocument();
    expect(screen.getByText('Agent Task')).toBeInTheDocument();
  });

  it('maps status "cancelled" to archived phase', () => {
    const task = createMockTask({ id: '1', status: 'cancelled', title: 'Cancelled Task' });

    render(
      <TasksListView
        tasks={[task]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
