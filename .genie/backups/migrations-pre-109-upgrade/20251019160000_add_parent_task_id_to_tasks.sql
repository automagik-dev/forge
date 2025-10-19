-- Add parent_task_id field to tasks table for parent-child task relationships
-- This enables hierarchical task structures (wish → sub-tasks, wish → learn tasks)
-- Different from parent_task_attempt which links tasks to the attempt that created them

ALTER TABLE tasks ADD COLUMN parent_task_id BLOB REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for efficient querying of subtasks
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
