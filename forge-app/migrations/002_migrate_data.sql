-- Migrate branch_template data to auxiliary table
-- This script is idempotent and can be run multiple times

-- Insert branch_template data into the auxiliary table if not already present
INSERT INTO forge_task_extensions (task_id, branch_template, created_at, updated_at)
SELECT t.id, t.branch_template, t.created_at, t.updated_at 
FROM tasks t
WHERE t.branch_template IS NOT NULL
ON CONFLICT (task_id) DO UPDATE SET 
    branch_template = EXCLUDED.branch_template,
    updated_at = CURRENT_TIMESTAMP;

-- Null the original column in the upstream tasks table (idempotent)
UPDATE tasks 
SET branch_template = NULL 
WHERE branch_template IS NOT NULL;

-- Rollback notes: 
-- To rollback, run:
-- UPDATE tasks SET branch_template = fte.branch_template FROM forge_task_extensions fte WHERE tasks.id = fte.task_id AND fte.branch_template IS NOT NULL;
-- DELETE FROM forge_task_extensions WHERE branch_template IS NOT NULL;