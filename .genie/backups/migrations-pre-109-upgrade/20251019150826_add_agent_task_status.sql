-- Add 'agent' to task status CHECK constraint
-- This allows tasks to be marked as agent runs (not shown in kanban)

-- SQLite doesn't support ALTER TABLE with CHECK constraint modification
-- We need to recreate the table with the new constraint

-- Step 0: Drop triggers that reference tasks table (will recreate after)
DROP TRIGGER IF EXISTS omni_execution_completed;

-- Step 1: Create new table with updated constraint (includes branch column from 20251019000000 migration)
CREATE TABLE tasks_new (
    id          BLOB PRIMARY KEY,
    project_id  BLOB NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo'
                   CHECK (status IN ('todo','inprogress','done','cancelled','inreview','agent')),
    parent_task_attempt BLOB,
    branch      TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_task_attempt) REFERENCES task_attempts(id) ON DELETE SET NULL
);

-- Step 2: Copy data from old table
INSERT INTO tasks_new (id, project_id, title, description, status, parent_task_attempt, branch, created_at, updated_at)
SELECT id, project_id, title, description, status, parent_task_attempt, branch, created_at, updated_at
FROM tasks;

-- Step 3: Drop old table
DROP TABLE tasks;

-- Step 4: Rename new table to original name
ALTER TABLE tasks_new RENAME TO tasks;

-- Step 5: Recreate the omni_execution_completed trigger
CREATE TRIGGER omni_execution_completed
        AFTER UPDATE OF status ON execution_processes
        WHEN NEW.status IN ('completed', 'failed', 'killed')
          AND OLD.status NOT IN ('completed', 'failed', 'killed')
        BEGIN
            INSERT INTO forge_omni_notifications (
                id,
                task_id,
                notification_type,
                recipient,
                message,
                status,
                metadata,
                created_at
            )
            SELECT
                lower(hex(randomblob(16))),
                NULL,
                'execution_completed',
                '',
                '',
                'pending',
                json_object(
                    'task_attempt_id', lower(hex(NEW.task_attempt_id)),
                    'status', NEW.status,
                    'executor', COALESCE(ta.executor, ''),
                    'branch', COALESCE(ta.branch, ''),
                    'project_id', lower(hex(t.project_id)),
                    'exit_code', COALESCE(NEW.exit_code, 0)
                ),
                datetime('now')
            FROM task_attempts ta
            JOIN tasks t ON t.id = ta.task_id
            WHERE ta.id = NEW.task_attempt_id
              AND NOT EXISTS (
                  -- Prevent duplicate notifications for the same execution
                  SELECT 1 FROM forge_omni_notifications
                  WHERE metadata LIKE '%' || NEW.id || '%'
              );
        END;
