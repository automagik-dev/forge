-- migrate forge-specific data out of upstream tables
INSERT INTO forge_task_extensions (task_id, branch_template)
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL
ON CONFLICT(task_id) DO UPDATE SET branch_template = excluded.branch_template;

UPDATE forge_task_extensions
SET created_at = tasks.created_at
FROM tasks
WHERE forge_task_extensions.task_id = tasks.id;

CREATE TEMP TABLE forge_branch_template_source AS
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL;

UPDATE tasks
SET branch_template = NULL
WHERE id IN (SELECT id FROM forge_branch_template_source);

DROP TABLE forge_branch_template_source;

CREATE VIEW IF NOT EXISTS forge_tasks_with_branch_template AS
SELECT t.*, fx.branch_template
FROM tasks t
LEFT JOIN forge_task_extensions fx ON fx.task_id = t.id;
