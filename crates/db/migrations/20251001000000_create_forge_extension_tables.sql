-- Create auxiliary tables for forge-specific data while preserving upstream schema
CREATE TABLE IF NOT EXISTS forge_task_extensions (
    task_id          BLOB PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template  TEXT,
    omni_settings    TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE TABLE IF NOT EXISTS forge_project_settings (
    project_id    BLOB PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    custom_executors TEXT,
    forge_config    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE TABLE IF NOT EXISTS forge_omni_notifications (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id          BLOB REFERENCES tasks(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    settings         TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Backfill existing task branch templates into the auxiliary table
INSERT INTO forge_task_extensions (task_id, branch_template)
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL
ON CONFLICT(task_id) DO UPDATE SET branch_template = excluded.branch_template;

-- Clear legacy branch_template column now that data lives in the extension table
