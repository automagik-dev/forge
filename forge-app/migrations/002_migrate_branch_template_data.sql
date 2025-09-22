-- Migrate existing branch_template values from the upstream tasks table into forge_task_extensions.
-- Safe to run multiple times due to INSERT OR REPLACE semantics.

INSERT INTO forge_task_extensions (task_id, branch_template, created_at, updated_at)
SELECT
    id,
    branch_template,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tasks
WHERE branch_template IS NOT NULL
ON CONFLICT(task_id) DO UPDATE SET
    branch_template = excluded.branch_template,
    updated_at = CURRENT_TIMESTAMP;

UPDATE tasks
SET branch_template = NULL
WHERE branch_template IS NOT NULL;
