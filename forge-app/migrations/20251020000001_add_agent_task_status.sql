-- This allows tasks to be marked as agent runs, which are excluded from kanban views

-- SQLite doesn't support ALTER COLUMN with CHECK constraint modifications
-- We need to:
-- 1. Create a new table with the updated constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- Drop Omni trigger to avoid referencing tasks during rebuild
DROP TRIGGER IF EXISTS omni_execution_completed;

-- Create temporary table with new constraint
CREATE TABLE tasks_new (
    id          BLOB PRIMARY KEY,
    project_id  BLOB NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo'
                   CHECK (status IN ('todo','inprogress','done','cancelled','inreview','agent')),
    parent_task_attempt BLOB,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_task_attempt) REFERENCES task_attempts(id) ON DELETE SET NULL
);

-- Copy all existing data
INSERT INTO tasks_new (id, project_id, title, description, status, parent_task_attempt, created_at, updated_at)
SELECT id, project_id, title, description, status, parent_task_attempt, created_at, updated_at FROM tasks;

-- Drop old table
DROP TABLE tasks;

-- Rename new table to tasks
ALTER TABLE tasks_new RENAME TO tasks;

-- Recreate indexes if any existed
-- (None in the original schema, but adding this comment for future reference)

-- Trigger will be recreated by forge services after migrations apply
