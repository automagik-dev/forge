-- Move legacy branch_template data out of the upstream tasks table
-- (should be run after 20251001000000_create_forge_extension_tables.sql).

INSERT INTO forge_task_extensions (task_id, branch_template)
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL
ON CONFLICT(task_id) DO UPDATE SET branch_template = excluded.branch_template;

UPDATE tasks
SET branch_template = NULL
WHERE branch_template IS NOT NULL;
