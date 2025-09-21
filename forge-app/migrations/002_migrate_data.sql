-- Migrate branch template data from legacy tasks table into forge_task_extensions.
INSERT INTO forge_task_extensions (task_id, branch_template)
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL
ON CONFLICT(task_id) DO UPDATE SET branch_template = excluded.branch_template;
