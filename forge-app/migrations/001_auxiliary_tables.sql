-- Forge auxiliary tables for task metadata, project settings, and omni notifications.
-- Idempotent by design: guarded with IF NOT EXISTS and ON CONFLICT clauses where relevant.

CREATE TABLE IF NOT EXISTS forge_task_extensions (
    task_id         BLOB PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template TEXT,
    omni_settings   TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forge_project_settings (
    project_id  BLOB PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    settings    TEXT,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forge_omni_notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     BLOB NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    recipient   TEXT,
    status      TEXT,
    payload     TEXT,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS forge_task_extensions_touch
AFTER UPDATE ON forge_task_extensions
FOR EACH ROW
BEGIN
    UPDATE forge_task_extensions
    SET updated_at = CURRENT_TIMESTAMP
    WHERE task_id = OLD.task_id;
END;

CREATE TRIGGER IF NOT EXISTS forge_project_settings_touch
AFTER UPDATE ON forge_project_settings
FOR EACH ROW
BEGIN
    UPDATE forge_project_settings
    SET updated_at = CURRENT_TIMESTAMP
    WHERE project_id = OLD.project_id;
END;
